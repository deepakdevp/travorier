# Tier 1: Supabase Integration Design

**Date**: 2026-03-03
**Status**: Approved
**Scope**: Replace all mock data in Zustand stores with real Supabase queries

---

## Context

Milestones 1–4 are complete but the app runs entirely on hardcoded mock data (`MOCK_TRIPS`, `MOCK_REQUESTS`, `MOCK_MATCHES`). Tier 1 wires the four Zustand stores to Supabase, making the app functional with real data.

---

## Architecture Decision

**Supabase Direct (with RLS + RPC for atomic operations)**

Per the project architecture in `CLAUDE.md`: Supabase handles all CRUD via PostgREST; FastAPI handles only Stripe, FCM, and QR. All store actions call the Supabase client directly. Security is enforced at the database level via Row Level Security (RLS), which is already enabled on all tables in the initial migration.

User ID is obtained inside each async action via `supabase.auth.getSession()` — no cross-store imports, no prop drilling.

---

## Section 1: New Migration — `unlock_contact` RPC

**File**: `supabase/migrations/20260302000001_unlock_contact_rpc.sql`

A `SECURITY DEFINER` Postgres function runs as superuser server-side, making it impossible for a client to bypass credit validation.

**Function**: `public.unlock_contact(match_id UUID) RETURNS BOOLEAN`

Steps (all in one transaction, rolls back on any failure):
1. Fetch match row; raise if not found
2. Assert `auth.uid() = match.sender_id` (only the sender can unlock)
3. Assert `match.contact_unlocked = FALSE` (idempotent — return TRUE if already unlocked)
4. Assert `profiles.credit_balance >= 1`; raise `'Insufficient credits'` if not
5. Insert row into `transactions` (`transaction_type = 'contact_unlock'`, `credits_used = 1`, `payment_status = 'succeeded'`)
6. Decrement `profiles.credit_balance` by 1
7. Update `matches` set `contact_unlocked = TRUE`, `unlocked_at = NOW()`, `unlock_transaction_id = <new transaction id>`
8. Return `TRUE`

---

## Section 2: TypeScript Type Fixes

Two type mismatches between mock interfaces and actual schema must be corrected:

| Interface field | Current (mock) | Schema (correct) |
|----------------|---------------|-----------------|
| `Request.status` | `'open' \| 'matched' \| 'completed'` | `'active' \| 'matched' \| 'completed' \| 'cancelled'` |
| `Match.status` | `'initiated' \| 'accepted' \| 'rejected'` | `'initiated' \| 'negotiating' \| 'agreed' \| 'handover_scheduled' \| 'in_transit' \| 'delivered' \| 'cancelled' \| 'disputed'` |
| `Trip.traveler.verified` | `verified: boolean` | aliased from `id_verified` in select query |

Screens that compare against `status === 'open'` must be updated to `'active'`. Screens comparing `status === 'accepted'` must be updated to `'agreed'`.

---

## Section 3: Store Changes

### `authStore.ts`

Add `profile` field and `loadProfile()` action.

```typescript
profile: Profile | null  // full profiles row

loadProfile: async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  set({ profile: data })
}
```

`loadProfile()` is called:
- After `initialize()` resolves with a session
- Inside `onAuthStateChange` when a `SIGNED_IN` event fires

---

### `tripsStore.ts`

Replace `MOCK_TRIPS` constant and mock `fetchTrips()` with:

```typescript
fetchTrips: async () => {
  set({ loading: true, error: null })
  const { data, error } = await supabase
    .from('trips')
    .select(`
      id, traveler_id, origin_city, origin_country,
      destination_city, destination_country,
      departure_date, departure_time, arrival_date,
      flight_number, airline, available_weight_kg,
      price_per_kg, status, is_boosted, pnr_verified, created_at,
      traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified)
    `)
    .eq('status', 'active')
    .order('is_boosted', { ascending: false })
    .order('departure_date', { ascending: true })

  if (error) { set({ error: error.message, loading: false }); return }
  const trips = data.map(row => ({ ...row, traveler: { ...row.traveler, verified: row.traveler.id_verified } }))
  set({ trips, filteredTrips: trips, loading: false })
  get().applyFilters()
}
```

---

### `requestsStore.ts`

Five actions updated:

**`fetchRequests()`** — scoped to current user:
```typescript
const { data: { session } } = await supabase.auth.getSession()
const { data, error } = await supabase
  .from('requests')
  .select('*')
  .eq('sender_id', session.user.id)
  .order('created_at', { ascending: false })
```

**`addRequest(requestData)`** — insert to Supabase, use server-generated UUID:
```typescript
const { data: { session } } = await supabase.auth.getSession()
const { data, error } = await supabase
  .from('requests')
  .insert({ ...requestData, sender_id: session.user.id, status: 'active' })
  .select()
  .single()
// Add data to store state
```

**`fetchMatchesForRequest(requestId)`** — new async action (replaces sync `getMatchesForRequest`):
```typescript
const { data, error } = await supabase
  .from('matches')
  .select(`
    id, request_id, trip_id, status, contact_unlocked,
    agreed_weight_kg,
    traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified),
    trip:trips!trip_id(origin_city, destination_city, departure_date, airline, flight_number)
  `)
  .eq('request_id', requestId)
```

**`acceptMatch(matchId)`** — update Supabase:
```typescript
await supabase.from('matches').update({ status: 'agreed' }).eq('id', matchId)
// Then update local state
```

**`unlockContact(matchId)`** — call RPC:
```typescript
const { data, error } = await supabase.rpc('unlock_contact', { match_id: matchId })
if (error) throw new Error(error.message) // surfaces 'Insufficient credits'
// Update local state: contact_unlocked = true
```

---

## Section 4: Files Changed

| File | Type | Description |
|------|------|-------------|
| `supabase/migrations/20260302000001_unlock_contact_rpc.sql` | New | Atomic credit-unlock RPC function |
| `mobile/stores/authStore.ts` | Modified | Add `profile` field + `loadProfile()` |
| `mobile/stores/tripsStore.ts` | Modified | Wire `fetchTrips()` to Supabase, fix types |
| `mobile/stores/requestsStore.ts` | Modified | Wire all 5 actions, fix types |

**No screen files change** — store public API (function names, return shapes) stays the same.

---

## Error Handling

All async actions follow the same pattern:
- Network/Supabase errors → set `error` state in store, surface via existing error UI
- `unlock_contact` RPC errors → propagate the Postgres error message (e.g. `'Insufficient credits'`) to the calling screen for display in an Alert

---

## Status Mapping Notes

Screens that currently check `status === 'open'` (from mock) must check `status === 'active'` (schema). Screens checking `status === 'accepted'` must check `status === 'agreed'`. These will be fixed as part of the implementation.
