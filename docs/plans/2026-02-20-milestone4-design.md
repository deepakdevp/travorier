# Milestone 4: Sender Journey Design

**Date**: 2026-02-20
**Status**: Approved
**Approach**: A — Mock data for all screens except chat (real Supabase Realtime)

---

## Goal

Complete the sender user flow: post a package request → view my requests → accept a traveler match → chat with the traveler in real time.

---

## Screens & Navigation

### New screens
- `mobile/app/post-request.tsx` — Form to post a package request
- `mobile/app/request-detail.tsx` — View a specific request + its traveler matches
- `mobile/app/chat.tsx` — Real-time chat with matched traveler

### Updated screens
- `mobile/app/(tabs)/requests.tsx` — Replace placeholder with real requests list + "Post Request" FAB

### New stores
- `mobile/stores/requestsStore.ts` — Requests + matches state (mock data, Zustand pattern)

### User flows
```
Requests Tab → FAB "Post Request" → post-request.tsx → submit → back to Requests Tab
Requests Tab → tap request → request-detail.tsx → "Accept & Chat" → unlock modal → chat.tsx
```

---

## Data Models

### Request
```ts
interface Request {
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
  special_instructions?: string;
  status: 'open' | 'matched' | 'completed';
  created_at: string;
}
```

### Match
```ts
interface Match {
  id: string;
  request_id: string;
  trip_id: string;
  traveler: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    verified: boolean;
  };
  trip: {
    origin_city: string;
    destination_city: string;
    departure_date: string;
    airline?: string;
    flight_number?: string;
  };
  agreed_weight_kg: number;
  status: 'initiated' | 'accepted' | 'rejected';
  contact_unlocked: boolean;
}
```

### Message (real Supabase table)
```ts
interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
```

---

## Chat Architecture (Supabase Realtime)

1. **Load history** on mount:
   ```ts
   supabase.from('messages').select('*').eq('match_id', matchId).order('created_at')
   ```

2. **Subscribe to new messages**:
   ```ts
   supabase.channel(`match:${matchId}`)
     .on('postgres_changes', {
       event: 'INSERT', schema: 'public', table: 'messages',
       filter: `match_id=eq.${matchId}`
     }, (payload) => append message to state)
     .subscribe()
   ```

3. **Send message**: insert to `messages` table with `match_id`, `sender_id` (from authStore), `content`

4. **Cleanup**: unsubscribe channel on unmount

5. **Chat lock banner**: display notice based on match trip's departure date + 24h (per ADR-008)

6. **Mock unlock flow**: before entering chat, show "Unlock Contact (1 credit / ₹99)" modal — confirm sets `contact_unlocked: true` in store (Stripe not wired yet)

---

## Post Request Form

Fields (mirrors `request-to-carry.tsx` style):
- Origin city (required)
- Destination city (required)
- Needed by date (required)
- Package weight in kg (required, numeric)
- Package description (required, min 10 chars)
- Package value in ₹ (optional)
- Special instructions (optional)

On submit: adds to `requestsStore` mock array → navigate back to Requests tab.

---

## Requests Tab

- `FlatList` of user's requests
- FAB for "Post Request"
- Each item: route, status chip (Open / Matched), package weight
- Tap → `request-detail.tsx`

## Request Detail

- Request info at top
- List of mock `Match` objects (traveler name, trust score, flight details)
- "Accept & Chat" button → unlock modal → `chat.tsx`

---

## Files Summary

| Action | File |
|--------|------|
| Create | `mobile/stores/requestsStore.ts` |
| Create | `mobile/app/post-request.tsx` |
| Create | `mobile/app/request-detail.tsx` |
| Create | `mobile/app/chat.tsx` |
| Update | `mobile/app/(tabs)/requests.tsx` |
