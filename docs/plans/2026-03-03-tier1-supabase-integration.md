# Tier 1: Supabase Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mock data in Zustand stores with real Supabase queries, making the full app functional end-to-end.

**Architecture:** All store actions call the Supabase JS client directly (no FastAPI intermediary for CRUD). RLS policies on all tables enforce that users can only read/write their own data. An atomic Postgres RPC function handles the credit-unlock operation server-side.

**Tech Stack:** Supabase JS client (`@supabase/supabase-js`), Zustand, TypeScript, React Native (Expo)

---

## Task 1: Create `unlock_contact` RPC Migration

**Files:**
- Create: `supabase/migrations/20260303000001_unlock_contact_rpc.sql`

**Step 1: Create the SQL file**

```sql
-- Migration: unlock_contact RPC
-- Atomic function that validates credits, deducts 1 credit, and unlocks match contact.
-- SECURITY DEFINER runs as superuser — client cannot bypass credit check.

CREATE OR REPLACE FUNCTION public.unlock_contact(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match        matches%ROWTYPE;
  v_credit_bal   INTEGER;
  v_txn_id       UUID;
BEGIN
  -- Lock match row to prevent double-unlock race condition
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Only the sender can unlock
  IF v_match.sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the sender can unlock contact';
  END IF;

  -- Idempotent: already unlocked, return success
  IF v_match.contact_unlocked THEN
    RETURN TRUE;
  END IF;

  -- Check credit balance (lock row to prevent concurrent deductions)
  SELECT credit_balance INTO v_credit_bal FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_credit_bal < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Record transaction
  INSERT INTO transactions (user_id, transaction_type, amount, credits_used, match_id, payment_status)
  VALUES (auth.uid(), 'contact_unlock', 0, 1, p_match_id, 'succeeded')
  RETURNING id INTO v_txn_id;

  -- Deduct credit atomically
  UPDATE profiles SET credit_balance = credit_balance - 1 WHERE id = auth.uid();

  -- Unlock contact
  UPDATE matches
  SET contact_unlocked = TRUE,
      unlocked_at = NOW(),
      unlock_transaction_id = v_txn_id
  WHERE id = p_match_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.unlock_contact(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_contact(UUID) TO authenticated;
```

**Step 2: Apply the migration**

Go to [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm/sql/new) and run the contents of the file. Alternatively:
```bash
# If Supabase CLI is available:
supabase db push
```

**Step 3: Verify**

In Supabase Dashboard → Database → Functions, confirm `unlock_contact` appears with security definer = true.

**Step 4: Commit**

```bash
git add supabase/migrations/20260303000001_unlock_contact_rpc.sql
git commit -m "feat(db): add unlock_contact RPC with atomic credit deduction"
```

---

## Task 2: Fix TypeScript Types

**Files:**
- Modify: `mobile/stores/requestsStore.ts` (type definitions only)

**Step 1: Update status enums and field names to match DB schema**

In `mobile/stores/requestsStore.ts`, replace the `Request` and `Match` interfaces:

```typescript
export interface Request {
  id: string;
  sender_id: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  needed_by_date: string;
  package_weight_kg: number;
  package_description: string;
  package_value?: number;
  notes?: string;                          // was: special_instructions (schema uses "notes")
  status: 'active' | 'matched' | 'completed' | 'cancelled';  // was: 'open' | 'matched' | 'completed'
  created_at: string;
}

export interface Match {
  id: string;
  request_id: string | null;              // nullable in schema (direct trip match has no request)
  trip_id: string;
  traveler: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    verified: boolean;                     // aliased from id_verified in query
  };
  trip: {
    origin_city: string;
    destination_city: string;
    departure_date: string;
    airline?: string;
    flight_number?: string;
  };
  agreed_weight_kg: number;
  status: 'initiated' | 'negotiating' | 'agreed' | 'handover_scheduled' | 'in_transit' | 'delivered' | 'cancelled' | 'disputed';
  contact_unlocked: boolean;
}
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: errors about `special_instructions` usage (in `addRequest` call signature) — these are resolved in Task 6.

**Step 3: Commit**

```bash
git add mobile/stores/requestsStore.ts
git commit -m "fix(types): align Request/Match types with Supabase schema"
```

---

## Task 3: Wire `authStore` — Add Profile Loading

**Files:**
- Modify: `mobile/stores/authStore.ts`

**Step 1: Add `Profile` interface and `profile` state field**

Replace the content of `mobile/stores/authStore.ts` with:

```typescript
/**
 * Authentication state management with Zustand
 */
import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  id_verification_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  trust_score: number;
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
  credit_balance: number;
  user_types: string[];
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  setSession: (session: Session | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    }),

  signInWithGoogle: async () => {
    try {
      set({ loading: true });

      const getRedirectTo = () => {
        if (Platform.OS === 'web') {
          return window.location.origin;
        }
        return __DEV__ ? 'exp://localhost:19000' : 'travorier://';
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectTo(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        set({ loading: false });
        throw error;
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  loadProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });

      // Load profile if session exists
      if (session?.user) {
        get().loadProfile();
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
        // Reload profile on sign-in
        if (session?.user) {
          get().loadProfile();
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
}));
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors from this file.

**Step 3: Commit**

```bash
git add mobile/stores/authStore.ts
git commit -m "feat(auth): add profile loading from Supabase profiles table"
```

---

## Task 4: Wire `tripsStore.fetchTrips()` to Supabase

**Files:**
- Modify: `mobile/stores/tripsStore.ts`

**Step 1: Replace mock data and `fetchTrips()` implementation**

Remove the entire `MOCK_TRIPS` constant (lines 62–181) and replace the `fetchTrips` implementation:

```typescript
fetchTrips: async () => {
  set({ loading: true, error: null });
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id, traveler_id,
        origin_city, origin_country,
        destination_city, destination_country,
        departure_date, departure_time, arrival_date,
        flight_number, airline,
        available_weight_kg, price_per_kg,
        status, is_boosted, pnr_verified, created_at,
        traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified)
      `)
      .eq('status', 'active')
      .order('is_boosted', { ascending: false })
      .order('departure_date', { ascending: true });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    // Map id_verified → verified to match the Trip interface
    const trips: Trip[] = (data ?? []).map((row: any) => ({
      ...row,
      traveler: {
        full_name: row.traveler?.full_name ?? 'Unknown',
        avatar_url: row.traveler?.avatar_url,
        trust_score: row.traveler?.trust_score ?? 0,
        verified: row.traveler?.id_verified ?? false,
      },
    }));

    set({ trips, filteredTrips: trips, loading: false });
    get().applyFilters();
  } catch (err) {
    set({ error: 'Failed to fetch trips', loading: false });
  }
},
```

Also add the import at the top of the file (after existing imports):

```typescript
import { supabase } from '@/services/supabase';
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/stores/tripsStore.ts
git commit -m "feat(trips): connect fetchTrips to Supabase, remove mock data"
```

---

## Task 5: Wire `requestsStore.fetchRequests()` to Supabase

**Files:**
- Modify: `mobile/stores/requestsStore.ts`

**Step 1: Add supabase import and replace `fetchRequests()`**

Add import at top:
```typescript
import { supabase } from '@/services/supabase';
```

Remove the `MOCK_REQUESTS` constant (lines 108–137) and replace `fetchRequests` implementation:

```typescript
fetchRequests: async () => {
  set({ loading: true, error: null });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('sender_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ requests: (data ?? []) as Request[], loading: false });
  } catch (err) {
    set({ error: 'Failed to fetch requests', loading: false });
  }
},
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/stores/requestsStore.ts
git commit -m "feat(requests): connect fetchRequests to Supabase, remove mock data"
```

---

## Task 6: Wire `requestsStore.addRequest()` to Supabase + Fix `post-request.tsx`

**Files:**
- Modify: `mobile/stores/requestsStore.ts`
- Modify: `mobile/app/post-request.tsx`

**Step 1: Make `addRequest` async and insert to Supabase**

In `requestsStore.ts`, update the `addRequest` signature in both the interface and implementation:

Interface change:
```typescript
addRequest: (request: Omit<Request, 'id' | 'sender_id' | 'status' | 'created_at'>) => Promise<void>;
```

Implementation — replace `addRequest`:
```typescript
addRequest: async (requestData) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('requests')
    .insert({
      sender_id: session.user.id,
      origin_city: requestData.origin_city,
      origin_country: requestData.origin_country,
      destination_city: requestData.destination_city,
      destination_country: requestData.destination_country,
      needed_by_date: requestData.needed_by_date,
      package_weight_kg: requestData.package_weight_kg,
      package_description: requestData.package_description,
      package_value: requestData.package_value ?? null,
      notes: requestData.notes ?? null,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (data) {
    set((state) => ({ requests: [data as Request, ...state.requests] }));
  }
},
```

**Step 2: Fix `post-request.tsx` to await `addRequest` and use `notes` instead of `special_instructions`**

In `mobile/app/post-request.tsx`, find the `handleSubmit` onPress callback and update the `addRequest` call:

Old code (lines 71–81):
```typescript
addRequest({
  origin_city: originCity.trim(),
  origin_country: originCountry.trim(),
  destination_city: destinationCity.trim(),
  destination_country: destinationCountry.trim(),
  needed_by_date: neededByDate.trim(),
  package_weight_kg: weight,
  package_description: packageDescription.trim(),
  package_value: packageValue ? parseFloat(packageValue) : undefined,
  special_instructions: specialInstructions.trim() || undefined,
});
```

New code:
```typescript
await addRequest({
  origin_city: originCity.trim(),
  origin_country: originCountry.trim(),
  destination_city: destinationCity.trim(),
  destination_country: destinationCountry.trim(),
  needed_by_date: neededByDate.trim(),
  package_weight_kg: weight,
  package_description: packageDescription.trim(),
  package_value: packageValue ? parseFloat(packageValue) : undefined,
  notes: specialInstructions.trim() || undefined,
});
```

Also remove the fake `await new Promise((resolve) => setTimeout(resolve, 800));` line above it — the real Supabase call provides its own latency.

**Step 3: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add mobile/stores/requestsStore.ts mobile/app/post-request.tsx
git commit -m "feat(requests): connect addRequest to Supabase insert"
```

---

## Task 7: Add Async `fetchMatchesForRequest()` to Store + Fix `request-detail.tsx`

**Files:**
- Modify: `mobile/stores/requestsStore.ts`
- Modify: `mobile/app/request-detail.tsx`

**Step 1: Add `matches` state and replace sync getter with async action**

In `requestsStore.ts`, update the interface:

Add to state section:
```typescript
matches: Match[];
matchesLoading: boolean;
```

Replace `getMatchesForRequest` with:
```typescript
fetchMatchesForRequest: (requestId: string) => Promise<void>;
```

Add to initial state:
```typescript
matches: [],
matchesLoading: false,
```

Remove `MOCK_MATCHES` constant (lines 64–106).

Replace `getMatchesForRequest` implementation with:
```typescript
fetchMatchesForRequest: async (requestId) => {
  set({ matchesLoading: true });
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, request_id, trip_id, status, contact_unlocked, agreed_weight_kg,
        traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified),
        trip:trips!trip_id(origin_city, destination_city, departure_date, airline, flight_number)
      `)
      .eq('request_id', requestId)
      .not('status', 'in', '("cancelled","disputed")');

    if (error) {
      set({ matchesLoading: false });
      return;
    }

    const matches: Match[] = (data ?? []).map((row: any) => ({
      id: row.id,
      request_id: row.request_id,
      trip_id: row.trip_id,
      status: row.status,
      contact_unlocked: row.contact_unlocked,
      agreed_weight_kg: row.agreed_weight_kg ?? 0,
      traveler: {
        full_name: row.traveler?.full_name ?? 'Unknown',
        avatar_url: row.traveler?.avatar_url,
        trust_score: row.traveler?.trust_score ?? 0,
        verified: row.traveler?.id_verified ?? false,
      },
      trip: {
        origin_city: row.trip?.origin_city ?? '',
        destination_city: row.trip?.destination_city ?? '',
        departure_date: row.trip?.departure_date ?? '',
        airline: row.trip?.airline,
        flight_number: row.trip?.flight_number,
      },
    }));

    set({ matches, matchesLoading: false });
  } catch (err) {
    set({ matchesLoading: false });
  }
},
```

**Step 2: Update `request-detail.tsx` to call async fetch and read from store**

In `mobile/app/request-detail.tsx`:

1. Update the store destructuring (line ~112):
```typescript
const { selectedRequest, setSelectedMatch, unlockContact, fetchMatchesForRequest, matches, matchesLoading } =
  useRequestsStore();
```

2. Add a `useEffect` to load matches when screen mounts (add after the existing `useEffect`):
```typescript
useEffect(() => {
  if (selectedRequest) {
    fetchMatchesForRequest(selectedRequest.id);
  }
}, [selectedRequest?.id]);
```

3. Remove the synchronous call on line ~130:
```typescript
// REMOVE THIS LINE:
const matches = getMatchesForRequest(request.id);
```

4. Update the matches count line to show a loading state:
```typescript
<Text variant="titleMedium" style={styles.matchesTitle}>
  {matchesLoading
    ? 'Loading matches...'
    : `${matches.length} Matching Traveler${matches.length !== 1 ? 's' : ''}`}
</Text>
```

**Step 3: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add mobile/stores/requestsStore.ts mobile/app/request-detail.tsx
git commit -m "feat(matches): add async fetchMatchesForRequest with Supabase query"
```

---

## Task 8: Wire `acceptMatch()` to Supabase

**Files:**
- Modify: `mobile/stores/requestsStore.ts`
- Modify: `mobile/app/request-detail.tsx`

**Step 1: Make `acceptMatch` async and update Supabase**

In `requestsStore.ts`, update interface:
```typescript
acceptMatch: (matchId: string) => Promise<void>;
```

Replace implementation:
```typescript
acceptMatch: async (matchId) => {
  const { error } = await supabase
    .from('matches')
    .update({ status: 'agreed' })
    .eq('id', matchId);

  if (error) throw new Error(error.message);

  // Update local state
  set((state) => ({
    matches: state.matches.map((m) =>
      m.id === matchId ? { ...m, status: 'agreed' } : m
    ),
    selectedMatch: state.selectedMatch?.id === matchId
      ? { ...state.selectedMatch, status: 'agreed' }
      : state.selectedMatch,
  }));
},
```

**Step 2: Fix `request-detail.tsx` — update `handleConfirmUnlock` to use `'agreed'` status**

In `mobile/app/request-detail.tsx`, find `handleConfirmUnlock` and fix the `setSelectedMatch` call:

```typescript
const handleConfirmUnlock = async () => {
  if (!pendingMatch) return;
  setUnlocking(true);

  try {
    await unlockContact(pendingMatch.id);
    setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'agreed' });

    setUnlockModalVisible(false);
    setUnlocking(false);
    router.push('/chat');
  } catch (err: any) {
    setUnlocking(false);
    Alert.alert('Error', err?.message ?? 'Failed to unlock contact. Please try again.');
  }
};
```

Note the removal of the fake `setTimeout` — `unlockContact` will be async (Task 9).

**Step 3: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add mobile/stores/requestsStore.ts mobile/app/request-detail.tsx
git commit -m "feat(matches): connect acceptMatch to Supabase update"
```

---

## Task 9: Wire `unlockContact()` to Supabase RPC

**Files:**
- Modify: `mobile/stores/requestsStore.ts`

**Step 1: Make `unlockContact` async and call RPC**

In `requestsStore.ts`, update interface:
```typescript
unlockContact: (matchId: string) => Promise<void>;
```

Replace implementation:
```typescript
unlockContact: async (matchId) => {
  const { data, error } = await supabase.rpc('unlock_contact', { p_match_id: matchId });

  if (error) {
    // Propagate readable error messages: 'Insufficient credits', 'Match not found', etc.
    throw new Error(error.message);
  }

  if (data === true) {
    // Update local credit balance and match state
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, contact_unlocked: true } : m
      ),
    }));
  }
},
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/stores/requestsStore.ts
git commit -m "feat(matches): connect unlockContact to Supabase RPC"
```

---

## Task 10: Wire `request-to-carry.tsx` Match Insert to Supabase

**Files:**
- Modify: `mobile/app/request-to-carry.tsx`

**Step 1: Replace fake timeout with real Supabase match insert**

Add imports at the top:
```typescript
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
```

Add inside the component (after existing hooks):
```typescript
const { user } = useAuthStore();
```

Replace the submit handler's `onPress` (lines ~62–80):

Old:
```typescript
onPress: async () => {
  setLoading(true);
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // (commented out production code)
    setLoading(false);
    router.replace('/match-confirmation');
  } catch (error) {
    setLoading(false);
    Alert.alert('Error', 'Failed to submit request. Please try again.');
  }
},
```

New:
```typescript
onPress: async () => {
  if (!user) {
    Alert.alert('Error', 'You must be logged in to submit a request.');
    return;
  }
  setLoading(true);
  try {
    const { error } = await supabase.from('matches').insert({
      trip_id: trip.id,
      traveler_id: trip.traveler_id,
      sender_id: user.id,
      agreed_weight_kg: weight,
      agreed_price: estimatedCost,
      status: 'initiated',
    });

    if (error) throw new Error(error.message);

    setLoading(false);
    router.replace('/match-confirmation');
  } catch (err: any) {
    setLoading(false);
    Alert.alert('Error', err?.message ?? 'Failed to submit request. Please try again.');
  }
},
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/app/request-to-carry.tsx
git commit -m "feat(matches): connect request-to-carry match insert to Supabase"
```

---

## Task 11: Fix Status Display Maps in Screens

**Files:**
- Modify: `mobile/app/(tabs)/requests.tsx`
- Modify: `mobile/app/request-detail.tsx`

**Step 1: Fix `requests.tsx` tab — update status color/label maps**

In `mobile/app/(tabs)/requests.tsx`, the `RequestCard` component uses status-keyed maps. Replace them:

```typescript
const statusColor = {
  active: '#00A86B',      // was: 'open'
  matched: '#0066cc',
  completed: '#666666',
  cancelled: '#999999',
}[request.status] ?? '#999999';

const statusLabel = {
  active: 'Open',         // was: 'open'
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
}[request.status] ?? request.status;
```

**Step 2: Fix `request-detail.tsx` — update status badge maps**

In `mobile/app/request-detail.tsx`, replace the top-level status maps:

```typescript
const STATUS_BG: Record<string, string> = {
  active: '#E8F5E9',      // was: 'open'
  matched: '#E3F2FD',
  completed: '#F5F5F5',
  cancelled: '#FAFAFA',
};
const STATUS_FG: Record<string, string> = {
  active: '#2E7D32',      // was: 'open'
  matched: '#1976D2',
  completed: '#666666',
  cancelled: '#999999',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Open',         // was: 'open'
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
```

**Step 3: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add "mobile/app/(tabs)/requests.tsx" mobile/app/request-detail.tsx
git commit -m "fix(ui): update status display maps from 'open' to 'active'"
```

---

## Final Verification

**Step 1: Run full typecheck one more time**
```bash
cd mobile && npm run typecheck
```
Expected: 0 errors.

**Step 2: Start the dev server and test manually**
```bash
cd mobile && npm start
```

**Manual test checklist:**
- [ ] App loads → redirects to login (no auth) or home (authenticated)
- [ ] Trips tab: shows real trips from Supabase (empty if none posted yet, not the 5 mock trips)
- [ ] Requests tab: shows real requests for logged-in user (empty if none posted)
- [ ] Post Request form: submits → row appears in Supabase `requests` table
- [ ] Request Detail: matches load from Supabase (empty for new requests)
- [ ] Profile tab: shows `trust_score`, `credit_balance` from real `profiles` row
- [ ] `request-to-carry` flow: submits → row appears in Supabase `matches` table

**Step 3: Commit final verification note to plan**

```bash
git add docs/plans/2026-03-03-tier1-supabase-integration.md
git commit -m "docs(plan): mark Tier 1 implementation plan as complete"
```
