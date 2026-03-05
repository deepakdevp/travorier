# Tier 2: Traveler Screens Design

**Date**: 2026-03-05
**Status**: Approved
**Scope**: Post Trip, My Trips (with inline match inbox), Edit Profile

---

## Context

Tier 1 wired all stores to Supabase. Tier 2 adds the traveler-side functionality that was completely missing: posting trips, viewing own trips, responding to incoming match requests, and editing their profile.

---

## Navigation Structure

**Trips tab** (`mobile/app/(tabs)/trips.tsx`) gets a segmented control at the top:
- **Browse** segment — existing behavior (all active trips, search/filter)
- **My Trips** segment — traveler's own trips with FAB to post new trip

No new tabs. Tab bar stays at 4 items (Home, Trips, Requests, Profile).

---

## New Screens

| File | Route | Purpose |
|------|-------|---------|
| `mobile/app/post-trip.tsx` | `/post-trip` | Form to post a new trip |
| `mobile/app/my-trip-detail.tsx` | `/my-trip-detail` | My trip info + incoming match requests inline |
| `mobile/app/edit-profile.tsx` | `/edit-profile` | Edit name, phone, avatar |

---

## Screen Designs (via Stitch)

Each screen is designed in Stitch first, then adapted to React Native Paper. Stitch generates the visual layout and component hierarchy; implementation uses React Native Paper components matching the same visual language.

---

## Section 1: Post Trip Screen

**Purpose:** Traveler fills in their trip details so senders can find and match with them.

**Form fields** (matching `trips` schema):
- Origin city (required) + origin country (required)
- Destination city (required) + destination country (required)
- Departure date `YYYY-MM-DD` (required)
- Departure time `HH:MM` (optional)
- Flight number (optional)
- Airline (optional)
- Available weight kg — numeric, > 0 (required)
- Price per kg ₹ — numeric, >= 0 (required)
- Notes (optional, multiline)

**On submit:** `supabase.from('trips').insert({ traveler_id: user.id, status: 'active', ...formData })`

**On success:** Navigate to Trips tab, My Trips segment.

**Validation:** origin city, origin country, destination city, destination country, departure date required; weight > 0; price >= 0.

---

## Section 2: My Trips Screen (Trips Tab Toggle)

**Purpose:** Traveler sees all trips they've posted, with a count of pending match requests on each.

**Trip card shows:**
- Route: origin city → destination city
- Departure date
- Weight available / Price per kg
- Status badge (active / matched / completed / cancelled)
- Pending requests badge: "N requests" (count of matches with `status = 'initiated'`)

**FAB** at bottom right: navigates to `/post-trip`

**On tap:** navigate to `/my-trip-detail`, pass trip via `tripsStore.setSelectedMyTrip(trip)`

---

## Section 3: My Trip Detail + Traveler Match Inbox

**Purpose:** Traveler sees their trip details and can accept or decline incoming sender requests.

**Layout:**
- Trip summary at top (route, date, flight info, weight/price) — read-only
- "Incoming Requests" section below
  - Fetched from `matches` where `trip_id = trip.id` and `status = 'initiated'`
  - Each match card shows: sender name, trust score, package description, weight, date needed
  - **Accept** button → `supabase.from('matches').update({ status: 'agreed' }).eq('id', matchId)` → navigate to `/chat`
  - **Decline** button → `supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId)` → remove from list

**Empty state:** "No requests yet. Share your trip to get matched!"

---

## Section 4: Edit Profile Screen

**Purpose:** User updates their display name, phone number, and avatar.

**Editable fields:**
- Full name (text input)
- Phone number (text input, numeric)
- Avatar (image picker → upload to Supabase Storage `avatars` bucket → save public URL to profile)

**Avatar upload flow:**
1. `expo-image-picker` to select from library
2. `supabase.storage.from('avatars').upload(`${userId}.jpg`, file, { upsert: true })`
3. `supabase.storage.from('avatars').getPublicUrl(`${userId}.jpg`)` → get URL
4. Include `avatar_url` in profile update

**On save:** `supabase.from('profiles').update({ full_name, phone, avatar_url }).eq('id', user.id)` → call `loadProfile()` to refresh auth store.

**Profile tab:** Gains an "Edit Profile" button that navigates to `/edit-profile`.

---

## Store Changes

**`tripsStore.ts`** additions:

```typescript
// New state
myTrips: Trip[];
myTripsLoading: boolean;
selectedMyTrip: Trip | null;
tripMatches: TravelerMatch[];   // matches on selected trip
tripMatchesLoading: boolean;

// New actions
fetchMyTrips: () => Promise<void>;
createTrip: (data: NewTripData) => Promise<void>;
setSelectedMyTrip: (trip: Trip | null) => void;
fetchTripMatches: (tripId: string) => Promise<void>;
respondToMatch: (matchId: string, response: 'agreed' | 'cancelled') => Promise<void>;
```

**New type `TravelerMatch`** (sender-perspective match on a trip):
```typescript
interface TravelerMatch {
  id: string;
  trip_id: string;
  sender: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    id_verified: boolean;
  };
  package_description: string;   // from requests table via join
  package_weight_kg: number;
  needed_by_date: string;
  agreed_weight_kg: number;
  status: string;
  contact_unlocked: boolean;
}
```

---

## Files Changed

| File | Action |
|------|--------|
| `mobile/app/(tabs)/trips.tsx` | Add Browse/My Trips toggle, My Trips list, FAB |
| `mobile/app/post-trip.tsx` | **New** — post trip form |
| `mobile/app/my-trip-detail.tsx` | **New** — trip detail + match inbox |
| `mobile/app/edit-profile.tsx` | **New** — edit profile form |
| `mobile/app/(tabs)/profile.tsx` | Add Edit Profile button |
| `mobile/stores/tripsStore.ts` | Add traveler-side state and actions |

---

## UI Generation

Stitch is used to generate visual mockups for each new screen before React Native implementation. The Stitch designs establish layout, component hierarchy, and visual polish. React Native Paper components (Card, TextInput, Button, FAB, SegmentedButtons, Avatar) are used to match the Stitch output.
