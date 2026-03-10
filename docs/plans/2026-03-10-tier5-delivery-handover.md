# Tier 5: Delivery Handover (QR + Photos) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable package handover between sender and traveler via QR code verification and photo inspection evidence.

**Architecture:** Traveler confirms handover details → backend generates a unique QR code (stored as image in Supabase Storage + text in `matches.qr_code`) → sender views QR image in app → traveler photographs package with QR visible (uploaded to Supabase Storage `inspections` bucket) → sender/traveler scans QR at destination to mark `delivered`. No schema changes needed — all columns and tables exist.

**Tech Stack:** FastAPI + `qrcode[pil]==7.4.2` (already installed), `expo-image-picker` (check installed), `expo-barcode-scanner` or `expo-camera` for scanning, Supabase Storage for images.

**Match status flow:** `agreed` → `handover_scheduled` → `in_transit` → `delivered`

---

## Existing Baseline (do NOT re-implement)

- `matches` table: has `qr_code TEXT UNIQUE`, `qr_code_url TEXT`, `delivered_at`, `handover_location`, `handover_time`, `inspection_completed`, `status` (includes `handover_scheduled`, `in_transit`, `delivered`)
- `inspections` table: `match_id`, `traveler_id`, `sender_id`, `media_type`, `media_urls TEXT[]`, `inspected_at`, `approved`, `notes`
- Supabase Storage: `inspections` bucket (private, RLS)
- `qrcode[pil]==7.4.2` + `pillow` already in `requirements.txt`
- `backend/app/api/v1/matches.py` has `api.matches.generateQR` and `api.matches.scanQR` declared in `mobile/services/api.ts`

---

## Task 1: Backend — QR Service

**Files:**
- Create: `backend/app/services/qr_service.py`

**Step 1: Write the file**

```python
# backend/app/services/qr_service.py
import qrcode
import io
import secrets
from PIL import Image


def generate_qr_png(data: str) -> bytes:
    """Generate a QR code PNG image for the given data string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img: Image.Image = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_match_qr_payload(match_id: str, secret: str) -> str:
    """Return the string encoded in the QR: 'travorier:match_id:secret'"""
    return f"travorier:{match_id}:{secret}"


def generate_secret() -> str:
    """Generate a cryptographically secure 32-char hex secret."""
    return secrets.token_hex(16)
```

**Step 2: Verify**

```bash
ls /Users/deepak.panwar/personal/travorier/backend/app/services/qr_service.py
```

**Step 3: Commit**

```bash
cd /Users/deepak.panwar/personal/travorier
git add backend/app/services/qr_service.py
git commit -m "feat(handover): add QR code generation service"
```

---

## Task 2: Backend — Handover Schemas

**Files:**
- Create: `backend/app/schemas/handover.py`

**Step 1: Write the file**

```python
# backend/app/schemas/handover.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduleHandoverRequest(BaseModel):
    handover_location: str
    handover_time: datetime


class ScheduleHandoverResponse(BaseModel):
    match_id: str
    status: str
    handover_location: str
    handover_time: datetime


class GenerateQRResponse(BaseModel):
    match_id: str
    qr_code_url: str  # Public URL of QR image in Supabase Storage


class ScanQRRequest(BaseModel):
    qr_payload: str  # The decoded string from camera: "travorier:match_id:secret"


class ScanQRResponse(BaseModel):
    success: bool
    match_id: str
    delivered_at: Optional[datetime] = None
    message: str


class InspectionCreateRequest(BaseModel):
    match_id: str
    media_urls: list[str]
    media_type: str = "photo"
    notes: Optional[str] = None


class InspectionResponse(BaseModel):
    id: str
    match_id: str
    traveler_id: str
    sender_id: str
    media_urls: list[str]
    media_type: str
    inspected_at: datetime
    approved: bool
    notes: Optional[str] = None
```

**Step 2: Commit**

```bash
git add backend/app/schemas/handover.py
git commit -m "feat(handover): add handover Pydantic schemas"
```

---

## Task 3: Backend — Handover Endpoints

**Files:**
- Create: `backend/app/api/v1/handover.py`
- Modify: `backend/app/main.py` (add handover router)

**Step 1: First read `backend/app/api/v1/matches.py` and `backend/app/main.py`** to understand the existing structure and `get_current_user` pattern.

**Step 2: Create the endpoints file**

```python
# backend/app/api/v1/handover.py
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.schemas.handover import (
    ScheduleHandoverRequest, ScheduleHandoverResponse,
    GenerateQRResponse, ScanQRRequest, ScanQRResponse,
    InspectionCreateRequest, InspectionResponse,
)
from app.services.qr_service import generate_qr_png, generate_match_qr_payload, generate_secret
from app.services.supabase import get_supabase_admin_client

router = APIRouter(prefix="/handover", tags=["Handover"])


@router.patch("/matches/{match_id}/schedule")
async def schedule_handover(
    match_id: str,
    body: ScheduleHandoverRequest,
    current_user=Depends(get_current_user),
) -> ScheduleHandoverResponse:
    """Confirm handover location and time. Transitions match to handover_scheduled."""
    supabase = get_supabase_admin_client()

    # Verify match exists and caller is a participant
    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if m["status"] != "agreed":
        raise HTTPException(status_code=400, detail=f"Cannot schedule handover from status: {m['status']}")

    result = supabase.table("matches").update({
        "handover_location": body.handover_location,
        "handover_time": body.handover_time.isoformat(),
        "status": "handover_scheduled",
    }).eq("id", match_id).execute()

    updated = result.data[0]
    return ScheduleHandoverResponse(
        match_id=match_id,
        status=updated["status"],
        handover_location=updated["handover_location"],
        handover_time=updated["handover_time"],
    )


@router.post("/matches/{match_id}/qr")
async def generate_qr(
    match_id: str,
    current_user=Depends(get_current_user),
) -> GenerateQRResponse:
    """Generate and store QR code for match handover. Traveler only."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the traveler can generate QR")

    if m["status"] not in ("agreed", "handover_scheduled"):
        raise HTTPException(status_code=400, detail=f"Cannot generate QR from status: {m['status']}")

    # Idempotent: return existing if already generated
    if m.get("qr_code") and m.get("qr_code_url"):
        return GenerateQRResponse(match_id=match_id, qr_code_url=m["qr_code_url"])

    # Generate new secret + payload + PNG
    secret = generate_secret()
    payload = generate_match_qr_payload(match_id, secret)
    png_bytes = generate_qr_png(payload)

    # Upload PNG to Supabase Storage
    storage_path = f"qr/{match_id}.png"
    supabase.storage.from_("inspections").upload(
        path=storage_path,
        file=png_bytes,
        file_options={"content-type": "image/png", "upsert": "true"},
    )

    # Get public URL (signed, valid 7 days)
    signed = supabase.storage.from_("inspections").create_signed_url(storage_path, 604800)
    qr_url = signed["signedURL"]

    # Save to match
    supabase.table("matches").update({
        "qr_code": secret,
        "qr_code_url": qr_url,
        "status": "handover_scheduled",
    }).eq("id", match_id).execute()

    return GenerateQRResponse(match_id=match_id, qr_code_url=qr_url)


@router.get("/matches/{match_id}/qr")
async def get_qr(
    match_id: str,
    current_user=Depends(get_current_user),
) -> GenerateQRResponse:
    """Fetch the QR code URL for an existing match."""
    supabase = get_supabase_admin_client()
    match = supabase.table("matches").select("qr_code, qr_code_url, traveler_id, sender_id").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if not m.get("qr_code_url"):
        raise HTTPException(status_code=404, detail="QR not yet generated")

    return GenerateQRResponse(match_id=match_id, qr_code_url=m["qr_code_url"])


@router.post("/matches/{match_id}/scan-qr")
async def scan_qr(
    match_id: str,
    body: ScanQRRequest,
    current_user=Depends(get_current_user),
) -> ScanQRResponse:
    """Verify scanned QR payload and mark match as delivered."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("*").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    if m["status"] == "delivered":
        return ScanQRResponse(success=True, match_id=match_id, message="Already delivered")

    if m["status"] != "in_transit":
        raise HTTPException(status_code=400, detail=f"Cannot scan QR from status: {m['status']}")

    # Verify payload format: "travorier:match_id:secret"
    parts = body.qr_payload.split(":")
    if len(parts) != 3 or parts[0] != "travorier" or parts[1] != match_id:
        raise HTTPException(status_code=400, detail="Invalid QR payload format")

    scanned_secret = parts[2]
    if scanned_secret != m["qr_code"]:
        raise HTTPException(status_code=400, detail="QR code verification failed")

    delivered_at = datetime.now(timezone.utc)
    supabase.table("matches").update({
        "status": "delivered",
        "delivered_at": delivered_at.isoformat(),
    }).eq("id", match_id).execute()

    return ScanQRResponse(
        success=True,
        match_id=match_id,
        delivered_at=delivered_at,
        message="Package delivered successfully!",
    )


@router.post("/inspections")
async def create_inspection(
    body: InspectionCreateRequest,
    current_user=Depends(get_current_user),
) -> InspectionResponse:
    """Record inspection photos for a match handover. Traveler only."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("traveler_id, sender_id, status").eq("id", body.match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the traveler can submit inspection")

    if m["status"] not in ("handover_scheduled", "agreed"):
        raise HTTPException(status_code=400, detail="Match not in handover state")

    result = supabase.table("inspections").insert({
        "match_id": body.match_id,
        "traveler_id": user_id,
        "sender_id": m["sender_id"],
        "media_type": body.media_type,
        "media_urls": body.media_urls,
        "notes": body.notes,
        "approved": True,
    }).execute()

    # Transition match to in_transit after inspection
    supabase.table("matches").update({
        "status": "in_transit",
        "inspection_completed": True,
    }).eq("id", body.match_id).execute()

    row = result.data[0]
    return InspectionResponse(**row)


@router.get("/inspections/{match_id}")
async def get_inspections(
    match_id: str,
    current_user=Depends(get_current_user),
) -> list[InspectionResponse]:
    """Fetch inspection records for a match."""
    supabase = get_supabase_admin_client()

    match = supabase.table("matches").select("traveler_id, sender_id").eq("id", match_id).single().execute()
    if not match.data:
        raise HTTPException(status_code=404, detail="Match not found")

    m = match.data
    user_id = str(current_user.id)
    if m["traveler_id"] != user_id and m["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not a match participant")

    result = supabase.table("inspections").select("*").eq("match_id", match_id).order("inspected_at").execute()
    return result.data or []
```

**Step 3: Wire router in `main.py`**

After reading main.py, add:
```python
from app.api.v1 import handover
# ...
app.include_router(handover.router, prefix=settings.API_V1_PREFIX, tags=["Handover"])
```

**Step 4: Commit**

```bash
git add backend/app/api/v1/handover.py backend/app/main.py
git commit -m "feat(handover): add QR generation, scan, schedule, and inspection endpoints"
```

---

## Task 4: Backend — Verify Handover Endpoints

**Step 1: Start backend**

```bash
cd /Users/deepak.panwar/personal/travorier/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Step 2: Test schedule + QR + scan-qr endpoints appear in Swagger**

```bash
curl -s http://localhost:8000/docs | python3 -c "import sys; data=sys.stdin.read(); print('handover' in data)"
```
Expected: `True`

**Step 3: Test endpoints show correct paths**

```bash
curl -s http://localhost:8000/openapi.json | python3 -c "
import sys, json
spec = json.load(sys.stdin)
paths = [p for p in spec['paths'] if 'handover' in p]
print(paths)
"
```

Expected output includes: `/api/v1/handover/matches/{match_id}/schedule`, `/api/v1/handover/matches/{match_id}/qr`, `/api/v1/handover/matches/{match_id}/scan-qr`, `/api/v1/handover/inspections`

**Step 4: Commit nothing (verify only)**

---

## Task 5: Mobile — Check & Install Camera Dependencies

**Step 1: Check if `expo-image-picker` and `expo-barcode-scanner` are installed**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && cat package.json | python3 -c "import sys,json; pkg=json.load(sys.stdin); deps={**pkg.get('dependencies',{}), **pkg.get('devDependencies',{})}; print('expo-image-picker:', deps.get('expo-image-picker','NOT INSTALLED')); print('expo-barcode-scanner:', deps.get('expo-barcode-scanner','NOT INSTALLED')); print('expo-camera:', deps.get('expo-camera','NOT INSTALLED'))"
```

**Step 2: Install missing packages**

If `expo-image-picker` is missing:
```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npx expo install expo-image-picker
```

If `expo-camera` is missing (prefer over expo-barcode-scanner for scanning):
```bash
npx expo install expo-camera
```

**Step 3: Typecheck after install**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck; echo "Exit: $?"
```

**Step 4: Commit if package.json changed**

```bash
cd /Users/deepak.panwar/personal/travorier
git add mobile/package.json mobile/package-lock.json
git commit -m "chore(mobile): install expo-image-picker and expo-camera for handover"
```

---

## Task 6: Mobile — Handover Screen (Schedule + QR Display)

This screen is used by the **traveler** from `my-trip-detail.tsx` to:
1. Confirm handover location + time
2. Generate QR code
3. View/show the QR image to the sender at pickup

**Files:**
- Create: `mobile/app/handover.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  TextInput, ScrollView, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';
import { useTripsStore } from '@/stores/tripsStore';

export default function HandoverScreen() {
  const { selectedMyTrip, selectedMatch } = useTripsStore();
  const matchId = selectedMatch?.id;

  const [location, setLocation] = useState('');
  const [handoverDate, setHandoverDate] = useState(new Date());
  const [scheduling, setScheduling] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'schedule' | 'qr'>('schedule');

  // Check if QR already generated
  useEffect(() => {
    if (!matchId) return;
    api.matches.getQR(matchId)
      .then((res) => { setQrUrl(res.data.qr_code_url); setStep('qr'); })
      .catch(() => {}); // not generated yet — ignore
  }, [matchId]);

  const handleSchedule = async () => {
    if (!matchId || !location.trim()) {
      Alert.alert('Required', 'Please enter a handover location');
      return;
    }
    setScheduling(true);
    try {
      await api.matches.scheduleHandover(matchId, {
        handover_location: location.trim(),
        handover_time: handoverDate.toISOString(),
      });
      setStep('qr');
      Alert.alert('Confirmed!', 'Handover scheduled. Generate the QR code next.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to schedule handover');
    } finally {
      setScheduling(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!matchId) return;
    setGenerating(true);
    try {
      const res = await api.matches.generateQR(matchId);
      setQrUrl(res.data.qr_code_url);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to generate QR');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Handover</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.steps}>
          <View style={[styles.stepDot, step === 'schedule' && styles.stepDotActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'qr' && styles.stepDotActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Schedule</Text>
          <Text style={styles.stepLabel}>QR Code</Text>
        </View>

        {step === 'schedule' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Confirm Handover Details</Text>
            <Text style={styles.fieldLabel}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Blue Tokai Coffee, Indiranagar"
              placeholderTextColor={colors.textDisabled}
              value={location}
              onChangeText={setLocation}
              multiline
            />
            <Text style={styles.fieldLabel}>Date & Time</Text>
            <DateTimePicker
              value={handoverDate}
              mode="datetime"
              display="default"
              onChange={(_, date) => date && setHandoverDate(date)}
              minimumDate={new Date()}
              style={{ alignSelf: 'flex-start' }}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, scheduling && styles.btnDisabled]}
              onPress={handleSchedule}
              disabled={scheduling}
            >
              {scheduling
                ? <ActivityIndicator color={colors.surface} />
                : <Text style={styles.primaryBtnText}>Confirm & Continue</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'qr' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Handover QR Code</Text>
            {qrUrl ? (
              <>
                <Text style={styles.qrHint}>Show this QR code to the sender at pickup</Text>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                <View style={styles.proceedRow}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/inspection')}
                  >
                    <Text style={styles.primaryBtnText}>Photograph Package →</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.qrHint}>Generate a unique QR for this handover</Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, generating && styles.btnDisabled]}
                  onPress={handleGenerateQR}
                  disabled={generating}
                >
                  {generating
                    ? <ActivityIndicator color={colors.surface} />
                    : <>
                        <MaterialCommunityIcons name="qrcode" size={18} color={colors.surface} />
                        <Text style={styles.primaryBtnText}>Generate QR Code</Text>
                      </>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
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
  content: { padding: spacing.md, gap: spacing.md },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepDot: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepNum: { fontSize: 14, fontWeight: '700', color: colors.surface },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, maxWidth: 80 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xs },
  stepLabel: { fontSize: 12, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, fontSize: 14, color: colors.textPrimary,
    minHeight: 48,
  },
  qrHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  qrImage: { width: '100%', height: 240, alignSelf: 'center' },
  proceedRow: { marginTop: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnDisabled: { backgroundColor: colors.border },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
```

**Step 2: Add API methods to `mobile/services/api.ts`**

Find the `matches` section and add:
```typescript
scheduleHandover: (id: string, data: { handover_location: string; handover_time: string }) =>
  this.client.patch(`/api/v1/handover/matches/${id}/schedule`, data),
generateQR: (id: string) => this.client.post(`/api/v1/handover/matches/${id}/qr`, {}),
getQR: (id: string) => this.client.get(`/api/v1/handover/matches/${id}/qr`),
```

Note: Keep existing `generateQR` and `scanQR` or update their paths to use `/handover/` prefix.

**Step 3: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck; echo "Exit: $?"
```

Expected: exit 0.

**Step 4: Commit**

```bash
git add mobile/app/handover.tsx mobile/services/api.ts
git commit -m "feat(mobile): add handover screen with QR display"
```

---

## Task 7: Mobile — Inspection Screen (Photo Upload)

**Files:**
- Create: `mobile/app/inspection.tsx`

This screen is for the **traveler** to photograph the package before handover.

```tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { supabase } from '@/services/supabase';
import { api } from '@/services/api';
import { useTripsStore } from '@/stores/tripsStore';

export default function InspectionScreen() {
  const { selectedMatch } = useTripsStore();
  const matchId = selectedMatch?.id;

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed to add photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        const urls = await Promise.all(result.assets.map(uploadPhoto));
        setPhotos((prev) => [...prev, ...urls]);
      } catch {
        Alert.alert('Upload failed', 'Could not upload photos. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const url = await uploadPhoto(result.assets[0]);
        setPhotos((prev) => [...prev, url]);
      } catch {
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const fileName = `inspections/${matchId}/${Date.now()}.${ext}`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const { error } = await supabase.storage
      .from('inspections')
      .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('inspections').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!matchId) return;
    if (photos.length === 0) {
      Alert.alert('Required', 'Please add at least one photo of the package');
      return;
    }
    setSubmitting(true);
    try {
      await api.handover.createInspection({
        match_id: matchId,
        media_urls: photos,
        media_type: 'photo',
      });
      Alert.alert(
        'Inspection Recorded!',
        'Package photos uploaded. The match is now in transit.',
        [{ text: 'OK', onPress: () => router.replace('/my-trip-detail') }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photograph Package</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Take clear photos of the package before accepting it. This protects both you and the sender.
        </Text>

        {/* Photo grid */}
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photoThumb} />
            ))}
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {/* Add photo buttons */}
        <View style={styles.addButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={takePhoto} disabled={uploading}>
            <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
            <Text style={styles.addBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={pickPhoto} disabled={uploading}>
            <MaterialCommunityIcons name="image-multiple" size={22} color={colors.primary} />
            <Text style={styles.addBtnText}>From Library</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>{photos.length} photo{photos.length !== 1 ? 's' : ''} added</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || photos.length === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || photos.length === 0}
        >
          {submitting
            ? <ActivityIndicator color={colors.surface} />
            : <Text style={styles.submitBtnText}>Submit & Mark In Transit</Text>}
        </TouchableOpacity>
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
  content: { padding: spacing.md, gap: spacing.md },
  instructions: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
  },
  photoThumb: { width: 100, height: 100, borderRadius: radius.md },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  uploadingText: { fontSize: 14, color: colors.textSecondary },
  addButtons: { flexDirection: 'row', gap: spacing.sm },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  hint: { fontSize: 12, color: colors.textDisabled, textAlign: 'center' },
  footer: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
```

**Step 2: Add `handover` API namespace to `mobile/services/api.ts`**

Add a new `handover` property to `ApiClient`:
```typescript
handover = {
  createInspection: (data: { match_id: string; media_urls: string[]; media_type: string; notes?: string }) =>
    this.client.post('/api/v1/handover/inspections', data),
  getInspections: (matchId: string) =>
    this.client.get(`/api/v1/handover/inspections/${matchId}`),
  scanQR: (matchId: string, qr_payload: string) =>
    this.client.post(`/api/v1/handover/matches/${matchId}/scan-qr`, { qr_payload }),
};
```

**Step 3: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck; echo "Exit: $?"
```

**Step 4: Commit**

```bash
git add mobile/app/inspection.tsx mobile/services/api.ts
git commit -m "feat(mobile): add inspection photo upload screen"
```

---

## Task 8: Mobile — QR Scanner Screen

**Files:**
- Create: `mobile/app/qr-scanner.tsx`

This screen is used by the **sender** (or traveler at destination) to scan the QR and confirm delivery.

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';
import { useRequestsStore } from '@/stores/requestsStore';

export default function QRScannerScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scanned || confirming) return;
    setScanned(true);
    setConfirming(true);

    try {
      const res = await api.handover.scanQR(matchId!, data);
      if (res.data.success) {
        Alert.alert(
          'Delivered!',
          res.data.message,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/requests') }],
        );
      } else {
        Alert.alert('Error', 'QR verification failed');
        setScanned(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Scan failed');
      setScanned(false);
    } finally {
      setConfirming(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.surface} />
        </TouchableOpacity>

        <View style={styles.scanFrame} />

        <Text style={styles.scanHint}>
          {confirming ? 'Verifying...' : 'Point camera at the handover QR code'}
        </Text>

        {scanned && !confirming && (
          <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  permissionText: { color: colors.textPrimary, textAlign: 'center', margin: spacing.xl },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md, margin: spacing.md, alignItems: 'center',
  },
  btnText: { color: colors.surface, fontWeight: '700' },
  overlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    position: 'absolute', top: spacing.xl, right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full,
    padding: spacing.sm,
  },
  scanFrame: {
    width: 240, height: 240,
    borderWidth: 2, borderColor: colors.surface,
    borderRadius: radius.md, backgroundColor: 'transparent',
  },
  scanHint: {
    color: colors.surface, marginTop: spacing.lg,
    fontSize: 14, textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  rescanBtn: {
    marginTop: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
  rescanText: { color: colors.surface, fontWeight: '600' },
});
```

**Step 2: Register the screen in `_layout.tsx`**

Add a Stack.Screen for qr-scanner (no header, full screen):
```tsx
<Stack.Screen name="qr-scanner" options={{ headerShown: false, presentation: 'modal' }} />
<Stack.Screen name="handover" options={{ headerShown: false }} />
<Stack.Screen name="inspection" options={{ headerShown: false }} />
```

**Step 3: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck; echo "Exit: $?"
```

**Step 4: Commit**

```bash
git add mobile/app/qr-scanner.tsx mobile/app/_layout.tsx
git commit -m "feat(mobile): add QR scanner screen for delivery confirmation"
```

---

## Task 9: Mobile — Wire Handover Entry Points

Connect the new screens from existing screens:

**From `my-trip-detail.tsx` (traveler view):** Add a "Handover Package" button on agreed matches that navigates to `/handover`.

**From `request-detail.tsx` (sender view):** On matched/in_transit status, add "Scan Delivery QR" button that navigates to `/qr-scanner?matchId=<id>`.

**Step 1: Read `mobile/app/my-trip-detail.tsx`** — find where match actions are shown.

**Step 2: Add to `my-trip-detail.tsx`** — in the match action area for status `agreed` or `handover_scheduled`:
```tsx
{(match.status === 'agreed' || match.status === 'handover_scheduled') && (
  <TouchableOpacity
    style={styles.handoverBtn}
    onPress={() => {
      useTripsStore.getState().setSelectedMatch(match);
      router.push('/handover');
    }}
  >
    <MaterialCommunityIcons name="qrcode" size={16} color={colors.surface} />
    <Text style={styles.handoverBtnText}>Handover Package</Text>
  </TouchableOpacity>
)}
```

**Step 3: Read `mobile/app/request-detail.tsx`** — find where match status is shown.

**Step 4: Add to `request-detail.tsx`** — for matches in `in_transit` status:
```tsx
{match.status === 'in_transit' && (
  <TouchableOpacity
    style={styles.scanBtn}
    onPress={() => router.push(`/qr-scanner?matchId=${match.id}`)}
  >
    <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.surface} />
    <Text style={styles.scanBtnText}>Confirm Delivery</Text>
  </TouchableOpacity>
)}
```

**Step 5: Typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck; echo "Exit: $?"
```

**Step 6: Commit**

```bash
git add mobile/app/my-trip-detail.tsx mobile/app/request-detail.tsx
git commit -m "feat(mobile): wire handover and QR scan entry points from trip/request detail"
```

---

## Task 10: Push and Test

**Step 1: Push all changes**

```bash
git push origin main
```

**Step 2: Manual test checklist**

### Traveler flow:
1. Go to My Trips → select a trip with an `agreed` match
2. Tap "Handover Package" → verify handover screen opens
3. Enter location + time → tap "Confirm & Continue"
4. Tap "Generate QR Code" → verify QR image appears
5. Tap "Photograph Package →" → inspection screen opens
6. Take/pick a photo → verify upload succeeds
7. Tap "Submit & Mark In Transit" → alert shows "In Transit"

### Sender flow:
1. Go to My Requests → select a request with `in_transit` match
2. Verify "Confirm Delivery" button appears
3. Tap it → QR scanner opens with camera
4. (In real test) Scan the QR image from traveler's screen → "Delivered!" alert

---

## Summary: What This Tier Delivers

| Feature | Status After Tier 5 |
|---------|---------------------|
| Backend QR generation service | ✅ |
| Schedule handover endpoint | ✅ |
| Generate QR endpoint | ✅ |
| Scan QR & mark delivered endpoint | ✅ |
| Inspection photo upload endpoint | ✅ |
| Handover screen (traveler) | ✅ |
| Inspection screen (traveler) | ✅ |
| QR scanner screen (sender) | ✅ |
| Entry points from existing screens | ✅ |
| Match status: handover_scheduled → in_transit → delivered | ✅ |
