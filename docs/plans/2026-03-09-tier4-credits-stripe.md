# Tier 4: Credits & Stripe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users buy credit packs via Stripe and spend credits to unlock traveler contacts.

**Architecture:** Mobile calls FastAPI backend to create a Stripe PaymentIntent → mobile presents Stripe PaymentSheet → on success, mobile calls backend to confirm, backend verifies with Stripe API and atomically adds credits to `profiles.credit_balance`. A Stripe webhook provides a reliable backup. The existing `unlock_contact` RPC (already working) deducts credits from the same column.

**Tech Stack:** FastAPI + `stripe` Python SDK (v8.2), `@stripe/stripe-react-native` (already installed), Supabase service-role key for server-side DB writes, Zustand `creditStore`.

---

## Existing Baseline (do NOT re-implement)

- `supabase/migrations/`: `transactions` + `credits` + `profiles.credit_balance` tables exist and have RLS.
- `unlock_contact()` RPC: already deducts 1 credit atomically — do not touch.
- `backend/app/core/config.py`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` already loaded.
- `mobile/services/api.ts`: `payments.createIntent`, `payments.getCredits`, `payments.buyCredits`, `payments.getTransactions` already declared.
- `mobile/stores/creditStore.ts`: exists as stub — we'll replace its body.

---

## Task 1: Backend — Stripe Service

**Files:**
- Create: `backend/app/services/stripe_service.py`

**Step 1: Write the file**

```python
# backend/app/services/stripe_service.py
import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

CREDIT_PACKS = [
    {"id": "pack_5",  "credits": 5,  "amount_paise": 24900,  "label": "5 Credits"},
    {"id": "pack_10", "credits": 10, "amount_paise": 44900,  "label": "10 Credits"},
    {"id": "pack_20", "credits": 20, "amount_paise": 79900,  "label": "20 Credits"},
]

def get_pack(pack_id: str) -> dict | None:
    return next((p for p in CREDIT_PACKS if p["id"] == pack_id), None)

def create_payment_intent(pack_id: str, user_id: str) -> stripe.PaymentIntent:
    pack = get_pack(pack_id)
    if pack is None:
        raise ValueError(f"Unknown pack_id: {pack_id}")
    return stripe.PaymentIntent.create(
        amount=pack["amount_paise"],
        currency="inr",
        metadata={"user_id": user_id, "pack_id": pack_id, "credits": pack["credits"]},
    )

def retrieve_payment_intent(payment_intent_id: str) -> stripe.PaymentIntent:
    return stripe.PaymentIntent.retrieve(payment_intent_id)

def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
```

**Step 2: Verify file exists**

```bash
ls backend/app/services/stripe_service.py
```
Expected: file listed.

---

## Task 2: Backend — Payment Schemas

**Files:**
- Create: `backend/app/schemas/payments.py`

**Step 1: Write the file**

```python
# backend/app/schemas/payments.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreditPackSchema(BaseModel):
    id: str
    credits: int
    amount_paise: int
    label: str


class CreateIntentRequest(BaseModel):
    pack_id: str  # "pack_5" | "pack_10" | "pack_20"


class CreateIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    pack: CreditPackSchema


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str


class ConfirmPaymentResponse(BaseModel):
    success: bool
    credits_added: int
    new_balance: int


class CreditsResponse(BaseModel):
    balance: int
    total_purchased: int


class TransactionItem(BaseModel):
    id: str
    transaction_type: str
    amount: float
    credits_purchased: Optional[int]
    credits_used: Optional[int]
    payment_status: str
    created_at: datetime
```

**Step 2: Verify**

```bash
ls backend/app/schemas/payments.py
```

---

## Task 3: Backend — Payment Endpoints

**Files:**
- Modify: `backend/app/api/v1/payments.py` (currently all TODOs — replace entirely)

**Step 1: Write the endpoints**

```python
# backend/app/api/v1/payments.py
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Optional

from app.core.dependencies import get_current_user
from app.schemas.payments import (
    CreateIntentRequest, CreateIntentResponse, CreditPackSchema,
    ConfirmPaymentRequest, ConfirmPaymentResponse,
    CreditsResponse, TransactionItem,
)
from app.services.stripe_service import (
    CREDIT_PACKS, get_pack,
    create_payment_intent, retrieve_payment_intent, construct_webhook_event,
)
from app.services.supabase import get_supabase_admin_client

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/packs")
async def list_packs() -> list[CreditPackSchema]:
    return [CreditPackSchema(**p) for p in CREDIT_PACKS]


@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_intent(
    body: CreateIntentRequest,
    current_user: dict = Depends(get_current_user),
):
    pack = get_pack(body.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack_id")
    try:
        intent = create_payment_intent(body.pack_id, current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return CreateIntentResponse(
        client_secret=intent.client_secret,
        payment_intent_id=intent.id,
        pack=CreditPackSchema(**pack),
    )


@router.post("/confirm-payment", response_model=ConfirmPaymentResponse)
async def confirm_payment(
    body: ConfirmPaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Called by mobile after PaymentSheet succeeds. Verifies with Stripe and credits user."""
    try:
        intent = retrieve_payment_intent(body.payment_intent_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail=f"Payment not succeeded: {intent.status}")

    # Guard: metadata must match calling user
    if intent.metadata.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="User mismatch")

    pack_id = intent.metadata.get("pack_id")
    pack = get_pack(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Unknown pack in metadata")

    credits_to_add = pack["credits"]
    supabase = get_supabase_admin_client()

    # Idempotency: check if this intent was already processed
    existing = supabase.table("transactions").select("id").eq(
        "stripe_payment_intent_id", intent.id
    ).execute()
    if existing.data:
        # Already processed — return current balance
        profile = supabase.table("profiles").select("credit_balance, total_credits_purchased").eq(
            "id", current_user["id"]
        ).single().execute()
        return ConfirmPaymentResponse(
            success=True,
            credits_added=0,
            new_balance=profile.data["credit_balance"],
        )

    # Insert transaction record
    supabase.table("transactions").insert({
        "user_id": current_user["id"],
        "transaction_type": "credit_purchase",
        "amount": pack["amount_paise"] / 100,
        "currency": "INR",
        "credits_purchased": credits_to_add,
        "credit_pack_size": credits_to_add,
        "stripe_payment_intent_id": intent.id,
        "payment_status": "succeeded",
    }).execute()

    # Update credit balance atomically via RPC
    result = supabase.rpc("add_credits", {
        "p_user_id": current_user["id"],
        "p_credits": credits_to_add,
    }).execute()

    new_balance = result.data if isinstance(result.data, int) else credits_to_add

    return ConfirmPaymentResponse(
        success=True,
        credits_added=credits_to_add,
        new_balance=new_balance,
    )


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin_client()
    profile = supabase.table("profiles").select(
        "credit_balance, total_credits_purchased"
    ).eq("id", current_user["id"]).single().execute()
    data = profile.data or {}
    return CreditsResponse(
        balance=data.get("credit_balance", 0),
        total_purchased=data.get("total_credits_purchased", 0),
    )


@router.get("/transactions", response_model=list[TransactionItem])
async def get_transactions(
    current_user: dict = Depends(get_current_user),
    limit: int = 20,
):
    supabase = get_supabase_admin_client()
    result = supabase.table("transactions").select("*").eq(
        "user_id", current_user["id"]
    ).order("created_at", desc=True).limit(limit).execute()
    return result.data or []


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
):
    payload = await request.body()
    try:
        event = construct_webhook_event(payload, stripe_signature or "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        user_id = intent["metadata"].get("user_id")
        pack_id = intent["metadata"].get("pack_id")
        pack = get_pack(pack_id)
        if not user_id or not pack:
            return {"status": "ignored"}

        supabase = get_supabase_admin_client()
        # Idempotency check
        existing = supabase.table("transactions").select("id").eq(
            "stripe_payment_intent_id", intent["id"]
        ).execute()
        if existing.data:
            return {"status": "already_processed"}

        supabase.table("transactions").insert({
            "user_id": user_id,
            "transaction_type": "credit_purchase",
            "amount": pack["amount_paise"] / 100,
            "currency": "INR",
            "credits_purchased": pack["credits"],
            "credit_pack_size": pack["credits"],
            "stripe_payment_intent_id": intent["id"],
            "payment_status": "succeeded",
        }).execute()

        supabase.rpc("add_credits", {
            "p_user_id": user_id,
            "p_credits": pack["credits"],
        }).execute()

    return {"status": "ok"}
```

**Step 2: Wire the router in `main.py`**

Find the commented-out line in `backend/app/main.py`:
```python
# app.include_router(payments.router, prefix=settings.API_V1_PREFIX, tags=["Payments"])
```

Replace with (remove the `#`):
```python
app.include_router(payments.router, prefix=settings.API_V1_PREFIX, tags=["Payments"])
```

**Step 3: Commit**

```bash
cd /Users/deepak.panwar/personal/travorier
git add backend/app/services/stripe_service.py backend/app/schemas/payments.py backend/app/api/v1/payments.py backend/app/main.py
git commit -m "feat(payments): add Stripe service, schemas, and payment endpoints"
```

---

## Task 4: Database — add_credits RPC

The `confirm_payment` and webhook both call `supabase.rpc("add_credits", ...)`. We need to create this RPC in Supabase.

**Files:**
- Create: `supabase/migrations/20260309000001_add_credits_rpc.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/20260309000001_add_credits_rpc.sql
-- RPC to atomically add credits to a user's balance (called by backend service role)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits must be positive';
  END IF;

  UPDATE profiles
  SET
    credit_balance = credit_balance + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- Only backend service role can call this directly
-- (the function is SECURITY DEFINER so it runs as owner)
REVOKE ALL ON FUNCTION public.add_credits FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_credits TO service_role;
```

**Step 2: Apply the migration**

Go to Supabase Dashboard → SQL Editor → paste and run the SQL above.

Verify: check Functions in the Database tab — `add_credits` should appear.

**Step 3: Commit the migration file**

```bash
git add supabase/migrations/20260309000001_add_credits_rpc.sql
git commit -m "feat(db): add add_credits RPC for atomic credit top-up"
```

---

## Task 5: Backend — Supabase Admin Client Helper

The payment endpoints call `get_supabase_admin_client()`. Check if it exists:

**Files:**
- Modify: `backend/app/services/supabase.py`

**Step 1: Read the current file**

Read `backend/app/services/supabase.py` — if `get_supabase_admin_client` already exists, skip this task.

**Step 2: If missing, add it**

```python
from supabase import create_client, Client
from app.core.config import settings

_admin_client: Client | None = None

def get_supabase_admin_client() -> Client:
    global _admin_client
    if _admin_client is None:
        _admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _admin_client
```

**Step 3: Commit if changed**

```bash
git add backend/app/services/supabase.py
git commit -m "feat(backend): expose get_supabase_admin_client helper"
```

---

## Task 6: Backend — Verify Endpoints Work

**Step 1: Start backend**

```bash
cd /Users/deepak.panwar/personal/travorier/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Step 2: Check Swagger**

Visit http://localhost:8000/docs — confirm `Payments` section shows:
- `GET /api/v1/payments/packs`
- `POST /api/v1/payments/create-intent`
- `POST /api/v1/payments/confirm-payment`
- `GET /api/v1/payments/credits`
- `GET /api/v1/payments/transactions`
- `POST /api/v1/payments/webhook`

**Step 3: Test packs endpoint** (no auth needed)

```bash
curl http://localhost:8000/api/v1/payments/packs
```

Expected:
```json
[
  {"id": "pack_5", "credits": 5, "amount_paise": 24900, "label": "5 Credits"},
  {"id": "pack_10", "credits": 10, "amount_paise": 44900, "label": "10 Credits"},
  {"id": "pack_20", "credits": 20, "amount_paise": 79900, "label": "20 Credits"}
]
```

---

## Task 7: Mobile — Wire StripeProvider

The `@stripe/stripe-react-native` package is already installed. We need to wrap the app with `StripeProvider`.

**Files:**
- Modify: `mobile/app/_layout.tsx`

**Step 1: Read the file first**

Read `mobile/app/_layout.tsx` to see current root layout.

**Step 2: Add StripeProvider**

Import and wrap:
```tsx
import { StripeProvider } from '@stripe/stripe-react-native';

// Inside the component JSX, wrap around existing providers:
<StripeProvider
  publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
  merchantIdentifier="merchant.com.travorier"
>
  {/* existing PaperProvider / slot */}
</StripeProvider>
```

The wrapping order should be: `StripeProvider` → `PaperProvider` → `<Slot />`.

**Step 3: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

Expected: same 3 pre-existing errors, no new errors.

**Step 4: Commit**

```bash
git add mobile/app/_layout.tsx
git commit -m "feat(mobile): wrap app with StripeProvider"
```

---

## Task 8: Mobile — Update creditStore

**Files:**
- Modify: `mobile/stores/creditStore.ts`

**Step 1: Read the current store**

Read `mobile/stores/creditStore.ts`.

**Step 2: Replace with full implementation**

```typescript
import { create } from 'zustand';
import { api } from '@/services/api';

interface CreditStore {
  balance: number;
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  purchaseCredits: (packId: string, paymentIntentId: string) => Promise<{ success: boolean; newBalance: number }>;
  deductCredit: (amount?: number) => void; // optimistic, used after unlock
}

export const useCreditStore = create<CreditStore>((set, get) => ({
  balance: 0,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.payments.getCredits();
      set({ balance: res.data.balance, loading: false });
    } catch (err: any) {
      set({ error: 'Failed to fetch balance', loading: false });
    }
  },

  purchaseCredits: async (packId: string, paymentIntentId: string) => {
    try {
      const res = await api.payments.confirmPayment({ payment_intent_id: paymentIntentId });
      const newBalance = res.data.new_balance;
      set({ balance: newBalance });
      return { success: true, newBalance };
    } catch (err: any) {
      throw new Error(err?.response?.data?.detail || 'Payment confirmation failed');
    }
  },

  deductCredit: (amount = 1) => {
    set((state) => ({ balance: Math.max(0, state.balance - amount) }));
  },
}));
```

**Step 3: Update `api.ts` to add `confirmPayment`**

Read `mobile/services/api.ts`. Find the `payments` section. The existing `buyCredits` method isn't needed (we use confirm instead). Add `confirmPayment`:

```typescript
payments = {
  createIntent: (data: { pack_id: string }) => this.client.post('/api/v1/payments/create-intent', data),
  confirmPayment: (data: { payment_intent_id: string }) => this.client.post('/api/v1/payments/confirm-payment', data),
  getCredits: () => this.client.get('/api/v1/payments/credits'),
  getPacks: () => this.client.get('/api/v1/payments/packs'),
  getTransactions: () => this.client.get('/api/v1/payments/transactions'),
};
```

**Step 4: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

Expected: 3 pre-existing errors only.

**Step 5: Commit**

```bash
git add mobile/stores/creditStore.ts mobile/services/api.ts
git commit -m "feat(mobile): implement creditStore with real API calls"
```

---

## Task 9: Mobile — Buy Credits Screen

**Files:**
- Create: `mobile/app/buy-credits.tsx`

**Step 1: Write the screen**

```tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  ScrollView, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';
import { useCreditStore } from '@/stores/creditStore';

interface CreditPack {
  id: string;
  credits: number;
  amount_paise: number;
  label: string;
}

export default function BuyCreditsScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { balance, purchaseCredits, fetchBalance } = useCreditStore();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPacks();
    fetchBalance();
  }, []);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await api.payments.getPacks();
      setPacks(res.data);
      setSelectedPack(res.data[1]); // default: middle pack
    } catch {
      Alert.alert('Error', 'Could not load credit packs');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;
    setPurchasing(true);
    try {
      // 1. Create payment intent on backend
      const intentRes = await api.payments.createIntent({ pack_id: selectedPack.id });
      const { client_secret, payment_intent_id } = intentRes.data;

      // 2. Init Stripe PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'Travorier',
        defaultBillingDetails: {},
      });
      if (initError) throw new Error(initError.message);

      // 3. Present PaymentSheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message);
        }
        return;
      }

      // 4. Confirm with backend (adds credits)
      const { newBalance } = await purchaseCredits(selectedPack.id, payment_intent_id);
      Alert.alert(
        'Credits Added!',
        `${selectedPack.credits} credits added. New balance: ${newBalance}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  const savings = (pack: CreditPack) => {
    const baseRate = packs[0] ? packs[0].amount_paise / packs[0].credits : 0;
    const packRate = pack.amount_paise / pack.credits;
    const savePct = Math.round(((baseRate - packRate) / baseRate) * 100);
    return savePct > 0 ? `Save ${savePct}%` : null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={styles.balanceBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.primary} />
          <Text style={styles.balanceText}>{balance}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Credits let you unlock traveler contact details</Text>
        <Text style={styles.costHint}>1 credit = 1 contact unlock</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.packsContainer}>
            {packs.map((pack) => {
              const isSelected = selectedPack?.id === pack.id;
              const saving = savings(pack);
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.packCard, isSelected && styles.packCardSelected]}
                  onPress={() => setSelectedPack(pack)}
                >
                  {saving && (
                    <View style={styles.savingBadge}>
                      <Text style={styles.savingText}>{saving}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={28}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.packCredits, isSelected && styles.packCreditsSelected]}>
                    {pack.credits} Credits
                  </Text>
                  <Text style={[styles.packPrice, isSelected && styles.packPriceSelected]}>
                    {formatPrice(pack.amount_paise)}
                  </Text>
                  <Text style={styles.packPerCredit}>
                    {formatPrice(pack.amount_paise / pack.credits)} / credit
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedPack && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedPack.label}</Text>
              <Text style={styles.summaryValue}>{formatPrice(selectedPack.amount_paise)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current balance</Text>
              <Text style={styles.summaryValue}>{balance} credits</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>After purchase</Text>
              <Text style={styles.summaryTotalValue}>{balance + selectedPack.credits} credits</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.buyButton, (!selectedPack || purchasing) && styles.buyButtonDisabled]}
          onPress={handlePurchase}
          disabled={!selectedPack || purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.surface} />
              <Text style={styles.buyButtonText}>
                Pay {selectedPack ? formatPrice(selectedPack.amount_paise) : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.secureNote}>Secured by Stripe</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySubtle, paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  balanceText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  content: { padding: spacing.md, gap: spacing.md },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  costHint: { fontSize: 13, color: colors.textDisabled, textAlign: 'center' },
  packsContainer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  packCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
    borderWidth: 2, borderColor: colors.border, position: 'relative',
  },
  packCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  savingBadge: {
    position: 'absolute', top: -10,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  savingText: { fontSize: 10, color: colors.surface, fontWeight: '700' },
  packCredits: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  packCreditsSelected: { color: colors.primary },
  packPrice: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  packPriceSelected: { color: colors.primary },
  packPerCredit: { fontSize: 11, color: colors.textDisabled },
  checkIcon: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.textPrimary },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  summaryTotalValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  footer: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs,
  },
  buyButton: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  buyButtonDisabled: { backgroundColor: colors.border },
  buyButtonText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  secureNote: { fontSize: 12, color: colors.textDisabled, textAlign: 'center' },
});
```

**Step 2: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

Expected: 3 pre-existing errors only.

**Step 3: Commit**

```bash
git add mobile/app/buy-credits.tsx
git commit -m "feat(mobile): add Buy Credits screen with Stripe PaymentSheet"
```

---

## Task 10: Mobile — Show Credit Balance in Profile

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`

**Step 1: Read the current file**

Read `mobile/app/(tabs)/profile.tsx`.

**Step 2: Add credit balance display**

a) Import `useCreditStore` and `router`:
```tsx
import { useCreditStore } from '@/stores/creditStore';
import { router } from 'expo-router';
```

b) Inside the component, add:
```tsx
const { balance, fetchBalance } = useCreditStore();
useEffect(() => { fetchBalance(); }, []);
```

c) Add a "Credits" row in the profile UI — place it in the stats section or as a card below the avatar. Use this JSX:

```tsx
{/* Credits Card */}
<TouchableOpacity
  style={styles.creditsCard}
  onPress={() => router.push('/buy-credits')}
>
  <View style={styles.creditsLeft}>
    <MaterialCommunityIcons name="lightning-bolt" size={22} color={colors.primary} />
    <View>
      <Text style={styles.creditsLabel}>Credits</Text>
      <Text style={styles.creditsBalance}>{balance} available</Text>
    </View>
  </View>
  <View style={styles.buyCreditsBtn}>
    <Text style={styles.buyCreditsText}>Buy More</Text>
  </View>
</TouchableOpacity>
```

d) Add styles:
```tsx
creditsCard: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  backgroundColor: colors.primarySubtle, borderRadius: radius.lg,
  padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm,
  borderWidth: 1, borderColor: colors.primary + '30',
},
creditsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
creditsLabel: { fontSize: 12, color: colors.textSecondary },
creditsBalance: { fontSize: 16, fontWeight: '700', color: colors.primary },
buyCreditsBtn: {
  backgroundColor: colors.primary, borderRadius: radius.md,
  paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
},
buyCreditsText: { fontSize: 13, fontWeight: '600', color: colors.surface },
```

**Step 3: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

**Step 4: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx
git commit -m "feat(mobile): show credit balance in profile with Buy Credits link"
```

---

## Task 11: Mobile — Show Credit Balance in Unlock Modal

When a user is about to spend 1 credit, show them their balance in the modal so they know if they have enough.

**Files:**
- Modify: `mobile/app/request-detail.tsx`

**Step 1: Read the current modal section**

Read `mobile/app/request-detail.tsx`. Find the unlock modal JSX (around line 169, the `Modal` component).

**Step 2: Import creditStore and fetchBalance on mount**

```tsx
import { useCreditStore } from '@/stores/creditStore';

// Inside component:
const { balance, fetchBalance } = useCreditStore();
useEffect(() => { fetchBalance(); }, []);
```

**Step 3: Add balance display to the unlock modal**

Inside the modal, above the "Confirm Unlock" button, add:

```tsx
<View style={styles.creditBalanceRow}>
  <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.primary} />
  <Text style={styles.creditBalanceText}>
    Your balance: <Text style={{ fontWeight: '700' }}>{balance} credits</Text>
  </Text>
</View>
{balance < 1 && (
  <TouchableOpacity
    style={styles.buyMoreBtn}
    onPress={() => { setUnlockModalVisible(false); router.push('/buy-credits'); }}
  >
    <Text style={styles.buyMoreText}>Buy Credits</Text>
  </TouchableOpacity>
)}
```

Add styles:
```tsx
creditBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
creditBalanceText: { fontSize: 14, color: colors.textSecondary },
buyMoreBtn: {
  borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md,
  paddingVertical: spacing.sm, alignItems: 'center', marginBottom: spacing.sm,
},
buyMoreText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
```

**Step 4: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

**Step 5: Commit**

```bash
git add mobile/app/request-detail.tsx
git commit -m "feat(mobile): show credit balance in unlock contact modal"
```

---

## Task 12: Push All Changes

```bash
git push origin main
```

---

## Task 13: End-to-End Manual Test

### Test Credit Balance Display
1. Log in → go to Profile tab → verify credit balance shows (e.g., "0 available")
2. Tap "Buy Credits" → confirm buy-credits screen opens with 3 packs

### Test Credit Purchase (Stripe test mode)
1. Select a pack on buy-credits screen
2. Tap "Pay ₹X" → Stripe PaymentSheet should appear
3. Enter test card: `4242 4242 4242 4242` / any future date / any CVC / any zip
4. Complete payment
5. Confirm: alert shows "Credits Added!", balance updates on profile screen

### Test Unlock Contact with Credits
1. Go to Requests tab → find a request with a match
2. Tap "View Traveler" → unlock modal appears
3. Verify credit balance shown in modal
4. Tap Confirm → if balance ≥ 1: chat opens; if 0: "Buy Credits" button appears

### Test Insufficient Credits
1. Spend all credits
2. Try to unlock → modal should show 0 balance + "Buy Credits" button

---

## Summary: What This Tier Delivers

| Feature | Status After Tier 4 |
|---------|---------------------|
| Credit balance display (profile) | ✅ |
| Buy credits UI (3 packs) | ✅ |
| Stripe PaymentSheet flow | ✅ |
| Backend payment intent creation | ✅ |
| Backend confirm + add credits | ✅ |
| Stripe webhook backup | ✅ |
| Balance shown before unlock | ✅ |
| unlock_contact (already works) | ✅ |
