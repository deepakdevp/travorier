# Tier 2: Traveler Screens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Post Trip, My Trips (with inline traveler match inbox), and Edit Profile screens so the traveler side of the platform is fully functional.

**Architecture:** Trips tab gains a Browse/My Trips toggle. Three new screens (`post-trip.tsx`, `my-trip-detail.tsx`, `edit-profile.tsx`) are added. `tripsStore.ts` is extended with traveler-side state and Supabase actions. Profile tab Edit Profile button wired up and stats updated to use real data.

**Tech Stack:** React Native (Expo), React Native Paper (SegmentedButtons, FAB, TextInput, Card, Avatar, Button), Zustand, Supabase JS, expo-image-picker

**Stitch designs (reference during implementation):**
- Post Trip Form: screen `2be3b1dad2e54358b39ad68e5b1b6b36` in project `421188681423965385`
- My Trip Detail + Match Inbox: screen `32ff47c17eac4bf392e01d01e1f246b0`
- Edit Profile: screen `5abc085d462345e6a25d5cd784c6d1a2`

---

## Task 1: Extend tripsStore.ts — Traveler-Side State & Actions

**Files:**
- Modify: `mobile/stores/tripsStore.ts`

**Step 1: Add new interfaces after the existing `TripFilters` interface**

```typescript
export interface TravelerMatch {
  id: string;
  trip_id: string;
  request_id: string | null;
  sender: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    id_verified: boolean;
  };
  agreed_weight_kg: number;
  agreed_price: number | null;
  package_description: string | null;
  package_weight_kg: number | null;
  needed_by_date: string | null;
  status: string;
  contact_unlocked: boolean;
}

export interface NewTripData {
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  departure_date: string;
  departure_time?: string;
  flight_number?: string;
  airline?: string;
  available_weight_kg: number;
  price_per_kg: number;
  notes?: string;
}
```

**Step 2: Add new fields to the `TripsStore` interface (after existing fields)**

```typescript
// Traveler-side state
myTrips: Trip[];
myTripsLoading: boolean;
selectedMyTrip: Trip | null;
tripMatches: TravelerMatch[];
tripMatchesLoading: boolean;

// Traveler-side actions
fetchMyTrips: () => Promise<void>;
createTrip: (data: NewTripData) => Promise<void>;
setSelectedMyTrip: (trip: Trip | null) => void;
fetchTripMatches: (tripId: string) => Promise<void>;
respondToMatch: (matchId: string, response: 'agreed' | 'cancelled') => Promise<void>;
```

**Step 3: Add initial state values (inside the `create` call, after existing initial state)**

```typescript
myTrips: [],
myTripsLoading: false,
selectedMyTrip: null,
tripMatches: [],
tripMatchesLoading: false,
```

**Step 4: Add action implementations (inside the `create` call, after existing actions)**

```typescript
setSelectedMyTrip: (trip) => set({ selectedMyTrip: trip }),

fetchMyTrips: async () => {
  set({ myTripsLoading: true });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { set({ myTripsLoading: false }); return; }

    const { data, error } = await supabase
      .from('trips')
      .select(`
        id, traveler_id, origin_city, origin_country,
        destination_city, destination_country,
        departure_date, departure_time, arrival_date,
        flight_number, airline, available_weight_kg,
        price_per_kg, status, is_boosted, pnr_verified, created_at
      `)
      .eq('traveler_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) { set({ myTripsLoading: false }); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, trust_score, id_verified')
      .eq('id', session.user.id)
      .single();

    const myTrips: Trip[] = (data ?? []).map((row: any) => ({
      ...row,
      traveler: {
        full_name: profile?.full_name ?? 'You',
        avatar_url: profile?.avatar_url,
        trust_score: profile?.trust_score ?? 0,
        verified: profile?.id_verified ?? false,
      },
    }));

    set({ myTrips, myTripsLoading: false });
  } catch {
    set({ myTripsLoading: false });
  }
},

createTrip: async (tripData) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.from('trips').insert({
    traveler_id: session.user.id,
    status: 'active',
    origin_city: tripData.origin_city,
    origin_country: tripData.origin_country,
    destination_city: tripData.destination_city,
    destination_country: tripData.destination_country,
    departure_date: tripData.departure_date,
    departure_time: tripData.departure_time || null,
    flight_number: tripData.flight_number || null,
    airline: tripData.airline || null,
    available_weight_kg: tripData.available_weight_kg,
    price_per_kg: tripData.price_per_kg,
    notes: tripData.notes || null,
  });

  if (error) throw new Error(error.message);
  await get().fetchMyTrips();
},

fetchTripMatches: async (tripId) => {
  set({ tripMatchesLoading: true });
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, trip_id, request_id, status, contact_unlocked,
        agreed_weight_kg, agreed_price,
        sender:profiles!sender_id(full_name, avatar_url, trust_score, id_verified),
        request:requests!request_id(package_description, package_weight_kg, needed_by_date)
      `)
      .eq('trip_id', tripId)
      .eq('status', 'initiated');

    if (error) { set({ tripMatchesLoading: false }); return; }

    const tripMatches: TravelerMatch[] = (data ?? []).map((row: any) => ({
      id: row.id,
      trip_id: row.trip_id,
      request_id: row.request_id,
      sender: {
        full_name: row.sender?.full_name ?? 'Unknown',
        avatar_url: row.sender?.avatar_url,
        trust_score: row.sender?.trust_score ?? 0,
        id_verified: row.sender?.id_verified ?? false,
      },
      agreed_weight_kg: row.agreed_weight_kg ?? 0,
      agreed_price: row.agreed_price ?? null,
      package_description: row.request?.package_description ?? null,
      package_weight_kg: row.request?.package_weight_kg ?? null,
      needed_by_date: row.request?.needed_by_date ?? null,
      status: row.status,
      contact_unlocked: row.contact_unlocked,
    }));

    set({ tripMatches, tripMatchesLoading: false });
  } catch {
    set({ tripMatchesLoading: false });
  }
},

respondToMatch: async (matchId, response) => {
  const { error } = await supabase
    .from('matches')
    .update({ status: response })
    .eq('id', matchId);

  if (error) throw new Error(error.message);

  set((state) => ({
    tripMatches: response === 'cancelled'
      ? state.tripMatches.filter((m) => m.id !== matchId)
      : state.tripMatches.map((m) =>
          m.id === matchId ? { ...m, status: response } : m
        ),
  }));
},
```

**Step 5: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 6: Commit**

```bash
git add mobile/stores/tripsStore.ts
git commit -m "feat(trips): add traveler-side state and actions to tripsStore"
```

---

## Task 2: Add Browse / My Trips Toggle to trips.tsx

**Files:**
- Modify: `mobile/app/(tabs)/trips.tsx`

**Step 1: Replace the entire file content**

```tsx
/**
 * Trips Screen - Browse trips or manage your own
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB, SegmentedButtons, Card, Avatar, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore, Trip } from '@/stores/tripsStore';
import TripCard from '@/components/TripCard';

function MyTripCard({ trip, onPress }: { trip: Trip; onPress: (t: Trip) => void }) {
  const statusColor: Record<string, string> = {
    active: '#00A86B',
    matched: '#0066cc',
    completed: '#666666',
    cancelled: '#999999',
  };
  const statusLabel: Record<string, string> = {
    active: 'Active',
    matched: 'Matched',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  const initials = trip.traveler.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card style={styles.myTripCard} onPress={() => onPress(trip)}>
      <Card.Content>
        <View style={styles.routeRow}>
          <Text variant="titleMedium" style={styles.cityText}>{trip.origin_city}</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#666666" />
          <Text variant="titleMedium" style={styles.cityText}>{trip.destination_city}</Text>
          <View style={styles.spacer} />
          <Chip
            compact
            style={{ backgroundColor: (statusColor[trip.status] ?? '#999999') + '20' }}
            textStyle={{ color: statusColor[trip.status] ?? '#999999', fontSize: 11 }}
          >
            {statusLabel[trip.status] ?? trip.status}
          </Chip>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar" size={14} color="#666666" />
          <Text variant="bodySmall" style={styles.metaText}>
            {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="weight-kilogram" size={14} color="#666666" />
          <Text variant="bodySmall" style={styles.metaText}>{trip.available_weight_kg} kg</Text>
          <Text style={styles.dot}>·</Text>
          <Text variant="bodySmall" style={styles.metaText}>₹{trip.price_per_kg}/kg</Text>
        </View>
        {trip.flight_number && (
          <View style={styles.flightRow}>
            <MaterialCommunityIcons name="airplane" size={14} color="#0066cc" />
            <Text variant="bodySmall" style={styles.flightText}>
              {trip.airline ? `${trip.airline} · ` : ''}{trip.flight_number}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function TripsScreen() {
  const router = useRouter();
  const {
    filteredTrips, filters, loading, fetchTrips, updateFilters, resetFilters, setSelectedTrip,
    myTrips, myTripsLoading, fetchMyTrips, setSelectedMyTrip,
  } = useTripsStore();

  const [segment, setSegment] = useState<'browse' | 'mine'>('browse');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (segment === 'browse') {
      fetchTrips();
    } else {
      fetchMyTrips();
    }
  }, [segment]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters({ searchQuery: query });
  };

  const handleTripPress = (trip: Trip) => {
    setSelectedTrip(trip);
    router.push('/trip-detail');
  };

  const handleMyTripPress = (trip: Trip) => {
    setSelectedMyTrip(trip);
    router.push('/my-trip-detail');
  };

  const hasActiveFilters = filters.verifiedOnly || searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* Segment Toggle */}
      <SegmentedButtons
        value={segment}
        onValueChange={(v) => setSegment(v as 'browse' | 'mine')}
        buttons={[
          { value: 'browse', label: 'Browse Trips', icon: 'magnify' },
          { value: 'mine', label: 'My Trips', icon: 'airplane' },
        ]}
        style={styles.segmented}
      />

      {segment === 'browse' ? (
        <>
          <Searchbar
            placeholder="Search by city or country..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          <View style={styles.filterContainer}>
            <Chip
              icon={filters.verifiedOnly ? 'check-circle' : 'circle-outline'}
              selected={filters.verifiedOnly}
              onPress={() => updateFilters({ verifiedOnly: !filters.verifiedOnly })}
              style={styles.chip}
            >
              Verified Only
            </Chip>
            {hasActiveFilters && (
              <Chip
                icon="close-circle"
                onPress={() => { setSearchQuery(''); resetFilters(); }}
                style={styles.clearChip}
                textStyle={styles.clearChipText}
              >
                Clear Filters
              </Chip>
            )}
          </View>
          <View style={styles.resultsHeader}>
            <Text variant="bodyMedium" style={styles.resultsText}>
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
            </Text>
          </View>
          <FlatList
            data={filteredTrips}
            renderItem={({ item }) => <TripCard trip={item} onPress={handleTripPress} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTrips} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="airplane-off" size={64} color="#cccccc" />
                <Text variant="titleMedium" style={styles.emptyTitle}>No trips found</Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Check back later for new trips'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <FlatList
            data={myTrips}
            renderItem={({ item }) => <MyTripCard trip={item} onPress={handleMyTripPress} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={myTripsLoading} onRefresh={fetchMyTrips} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="airplane-takeoff" size={64} color="#cccccc" />
                <Text variant="titleMedium" style={styles.emptyTitle}>No trips posted yet</Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Tap + to post your first trip and start earning
                </Text>
              </View>
            }
          />
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => router.push('/post-trip')}
            color="#ffffff"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  segmented: { margin: 16, marginBottom: 8 },
  searchBar: { marginHorizontal: 16, marginBottom: 8, elevation: 2 },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: { backgroundColor: '#ffffff' },
  clearChip: { backgroundColor: '#FFEBEE' },
  clearChipText: { color: '#d32f2f' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  resultsText: { color: '#666666' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { marginTop: 16, marginBottom: 8, color: '#666666' },
  emptyText: { color: '#999999', textAlign: 'center', paddingHorizontal: 32 },
  myTripCard: { backgroundColor: '#ffffff', marginBottom: 12, borderRadius: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cityText: { fontWeight: 'bold', color: '#333333' },
  spacer: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { color: '#666666' },
  dot: { color: '#cccccc', marginHorizontal: 2 },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  flightText: { color: '#0066cc' },
  fab: { position: 'absolute', bottom: 24, right: 16, backgroundColor: '#00A86B' },
});
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add "mobile/app/(tabs)/trips.tsx"
git commit -m "feat(trips): add Browse/My Trips toggle with FAB to trips tab"
```

---

## Task 3: Create post-trip.tsx

**Files:**
- Create: `mobile/app/post-trip.tsx`

**Step 1: Create the file**

```tsx
/**
 * Post Trip Screen
 * Form for travelers to post a new trip
 * Design reference: Stitch screen 2be3b1dad2e54358b39ad68e5b1b6b36
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';

export default function PostTripScreen() {
  const router = useRouter();
  const { createTrip } = useTripsStore();

  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = parseFloat(weightKg) || 0;
  const price = parseFloat(pricePerKg) || 0;

  const isValid = () =>
    originCity.trim().length > 0 &&
    originCountry.trim().length > 0 &&
    destinationCity.trim().length > 0 &&
    destinationCountry.trim().length > 0 &&
    departureDate.trim().length > 0 &&
    weight > 0 &&
    price >= 0;

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Post Trip',
      `Post trip from ${originCity} to ${destinationCity} on ${departureDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            setLoading(true);
            try {
              await createTrip({
                origin_city: originCity.trim(),
                origin_country: originCountry.trim(),
                destination_city: destinationCity.trim(),
                destination_country: destinationCountry.trim(),
                departure_date: departureDate.trim(),
                departure_time: departureTime.trim() || undefined,
                flight_number: flightNumber.trim() || undefined,
                airline: airline.trim() || undefined,
                available_weight_kg: weight,
                price_per_kg: price,
                notes: notes.trim() || undefined,
              });
              Alert.alert('Posted!', 'Your trip has been posted.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/trips') },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to post trip. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Route */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Route</Text>
            <View style={styles.row}>
              <TextInput
                label="Origin City *"
                value={originCity}
                onChangeText={setOriginCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
              />
              <TextInput
                label="Country *"
                value={originCountry}
                onChangeText={setOriginCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
              />
            </View>
            <View style={styles.arrowRow}>
              <MaterialCommunityIcons name="arrow-down" size={24} color="#00A86B" />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Destination City *"
                value={destinationCity}
                onChangeText={setDestinationCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
              />
              <TextInput
                label="Country *"
                value={destinationCountry}
                onChangeText={setDestinationCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Flight Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Flight Details</Text>
            <View style={styles.row}>
              <TextInput
                label="Departure Date * (YYYY-MM-DD)"
                value={departureDate}
                onChangeText={setDepartureDate}
                mode="outlined"
                style={[styles.input, styles.flex2]}
                left={<TextInput.Icon icon="calendar" />}
                placeholder="2026-04-15"
              />
              <TextInput
                label="Time (HH:MM)"
                value={departureTime}
                onChangeText={setDepartureTime}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="14:30"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Flight Number"
                value={flightNumber}
                onChangeText={setFlightNumber}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="AI191"
              />
              <TextInput
                label="Airline"
                value={airline}
                onChangeText={setAirline}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="Air India"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Capacity & Pricing */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Capacity & Pricing</Text>
            <View style={styles.row}>
              <TextInput
                label="Available Weight * (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                mode="outlined"
                style={[styles.input, styles.flex1]}
                left={<TextInput.Icon icon="weight-kilogram" />}
              />
              <TextInput
                label="Price per kg * (₹)"
                value={pricePerKg}
                onChangeText={setPricePerKg}
                keyboardType="decimal-pad"
                mode="outlined"
                style={[styles.input, styles.flex1]}
                left={<TextInput.Icon icon="currency-inr" />}
              />
            </View>
            <HelperText type="info" visible={weight > 0 && price >= 0}>
              Estimated earnings: ₹{(weight * price).toFixed(0)} if fully booked
            </HelperText>
          </Card.Content>
        </Card>

        {/* Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Any special instructions or preferences"
            />
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid() || loading}
          icon="airplane-takeoff"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
        >
          Post Trip
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  card: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#ffffff' },
  sectionTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: { backgroundColor: '#ffffff', marginBottom: 4 },
  arrowRow: { alignItems: 'center', marginVertical: 4 },
  bottomSpacing: { height: 100 },
  bottomBar: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  submitButton: { borderRadius: 8, backgroundColor: '#00A86B' },
  buttonContent: { paddingVertical: 8 },
});
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/app/post-trip.tsx
git commit -m "feat(trips): add post-trip screen with Supabase insert"
```

---

## Task 4: Create my-trip-detail.tsx

**Files:**
- Create: `mobile/app/my-trip-detail.tsx`

**Step 1: Create the file**

```tsx
/**
 * My Trip Detail Screen
 * Shows trip info and incoming match requests (traveler match inbox)
 * Design reference: Stitch screen 32ff47c17eac4bf392e01d01e1f246b0
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore, TravelerMatch } from '@/stores/tripsStore';
import { useRequestsStore } from '@/stores/requestsStore';

function MatchRequestCard({
  match,
  onAccept,
  onDecline,
}: {
  match: TravelerMatch;
  onAccept: (m: TravelerMatch) => void;
  onDecline: (m: TravelerMatch) => void;
}) {
  const initials = match.sender.full_name
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card style={styles.matchCard}>
      <Card.Content>
        {/* Sender row */}
        <View style={styles.senderRow}>
          {match.sender.avatar_url ? (
            <Avatar.Image size={44} source={{ uri: match.sender.avatar_url }} />
          ) : (
            <Avatar.Text size={44} label={initials} />
          )}
          <View style={styles.senderInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.senderName}>{match.sender.full_name}</Text>
              {match.sender.id_verified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#0066cc" />
              )}
            </View>
            <View style={styles.trustRow}>
              <MaterialCommunityIcons name="star" size={13} color="#FFB800" />
              <Text variant="bodySmall" style={styles.trustText}>Trust: {match.sender.trust_score}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Package info */}
        {match.package_description && (
          <Text variant="bodySmall" style={styles.packageDesc} numberOfLines={2}>
            {match.package_description}
          </Text>
        )}
        <View style={styles.chipsRow}>
          <Chip compact icon="weight-kilogram" style={styles.chip}>
            {match.agreed_weight_kg} kg
          </Chip>
          {match.needed_by_date && (
            <Chip compact icon="calendar" style={styles.chip}>
              By {new Date(match.needed_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Chip>
          )}
          {match.agreed_price && (
            <Chip compact icon="currency-inr" style={[styles.chip, styles.priceChip]}>
              ₹{match.agreed_price}
            </Chip>
          )}
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="outlined"
          onPress={() => onDecline(match)}
          textColor="#d32f2f"
          style={styles.declineButton}
          compact
        >
          Decline
        </Button>
        <Button
          mode="contained"
          onPress={() => onAccept(match)}
          style={styles.acceptButton}
          compact
        >
          Accept & Chat
        </Button>
      </Card.Actions>
    </Card>
  );
}

export default function MyTripDetailScreen() {
  const router = useRouter();
  const { selectedMyTrip, tripMatches, tripMatchesLoading, fetchTripMatches, respondToMatch } = useTripsStore();
  const { setSelectedMatch } = useRequestsStore();

  useEffect(() => {
    if (!selectedMyTrip) {
      router.back();
      return;
    }
    fetchTripMatches(selectedMyTrip.id);
  }, [selectedMyTrip?.id]);

  if (!selectedMyTrip) return null;

  const trip = selectedMyTrip;

  const handleAccept = async (match: TravelerMatch) => {
    Alert.alert(
      'Accept Request',
      `Accept ${match.sender.full_name}'s request to carry ${match.agreed_weight_kg}kg?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Chat',
          onPress: async () => {
            try {
              await respondToMatch(match.id, 'agreed');
              // Set up selectedMatch in requestsStore so chat screen works
              setSelectedMatch({
                id: match.id,
                request_id: match.request_id,
                trip_id: match.trip_id,
                traveler: {
                  full_name: trip.traveler.full_name,
                  avatar_url: trip.traveler.avatar_url,
                  trust_score: trip.traveler.trust_score,
                  verified: trip.traveler.verified,
                },
                trip: {
                  origin_city: trip.origin_city,
                  destination_city: trip.destination_city,
                  departure_date: trip.departure_date,
                  airline: trip.airline,
                  flight_number: trip.flight_number,
                },
                agreed_weight_kg: match.agreed_weight_kg,
                status: 'agreed',
                contact_unlocked: true,
              });
              router.push('/chat');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to accept. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (match: TravelerMatch) => {
    Alert.alert(
      'Decline Request',
      `Decline ${match.sender.full_name}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await respondToMatch(match.id, 'cancelled');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to decline. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Trip Summary */}
      <Surface style={styles.tripSummary} elevation={2}>
        <View style={styles.routeRow}>
          <View style={styles.cityBlock}>
            <Text variant="headlineSmall" style={styles.cityText}>{trip.origin_city}</Text>
            <Text variant="bodySmall" style={styles.countryText}>{trip.origin_country}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={28} color="#00A86B" />
          <View style={[styles.cityBlock, styles.alignEnd]}>
            <Text variant="headlineSmall" style={styles.cityText}>{trip.destination_city}</Text>
            <Text variant="bodySmall" style={styles.countryText}>{trip.destination_country}</Text>
          </View>
        </View>
        <View style={styles.chipsRow}>
          <Chip compact icon="calendar" style={styles.chip}>
            {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Chip>
          <Chip compact icon="weight-kilogram" style={styles.chip}>
            {trip.available_weight_kg} kg
          </Chip>
          <Chip compact style={[styles.chip, styles.priceChip]}>
            ₹{trip.price_per_kg}/kg
          </Chip>
        </View>
        {trip.flight_number && (
          <View style={styles.flightRow}>
            <MaterialCommunityIcons name="airplane" size={14} color="#0066cc" />
            <Text variant="bodySmall" style={styles.flightText}>
              {trip.airline ? `${trip.airline} · ` : ''}{trip.flight_number}
            </Text>
          </View>
        )}
      </Surface>

      {/* Incoming Requests */}
      <View style={styles.requestsSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {tripMatchesLoading
            ? 'Loading requests...'
            : `Incoming Requests (${tripMatches.length})`}
        </Text>

        {!tripMatchesLoading && tripMatches.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="account-search" size={48} color="#cccccc" />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No requests yet. Share your trip to get matched!
              </Text>
            </Card.Content>
          </Card>
        )}

        {tripMatches.map((match) => (
          <MatchRequestCard
            key={match.id}
            match={match}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tripSummary: { padding: 20, backgroundColor: '#ffffff', marginBottom: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cityBlock: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  cityText: { fontWeight: 'bold', color: '#333333' },
  countryText: { color: '#666666', marginTop: 2 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  chip: { backgroundColor: '#f5f5f5' },
  priceChip: { backgroundColor: '#E8F5E9' },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flightText: { color: '#0066cc' },
  requestsSection: { padding: 16 },
  sectionTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 12 },
  matchCard: { backgroundColor: '#ffffff', marginBottom: 12 },
  senderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  senderInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  senderName: { fontWeight: 'bold', color: '#333333' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: '#666666' },
  divider: { marginBottom: 10 },
  packageDesc: { color: '#555555', marginBottom: 8 },
  cardActions: { justifyContent: 'flex-end', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  declineButton: { borderColor: '#d32f2f', flex: 1 },
  acceptButton: { backgroundColor: '#00A86B', flex: 1 },
  emptyCard: { backgroundColor: '#ffffff' },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 12 },
  bottomSpacing: { height: 40 },
});
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/app/my-trip-detail.tsx
git commit -m "feat(trips): add my-trip-detail screen with traveler match inbox"
```

---

## Task 5: Create edit-profile.tsx

**Files:**
- Create: `mobile/app/edit-profile.tsx`

**Step 1: Create the file**

```tsx
/**
 * Edit Profile Screen
 * Update name, phone number, and avatar
 * Design reference: Stitch screen 5abc085d462345e6a25d5cd784c6d1a2
 */
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, loadProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = fullName.trim()
    ? fullName.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `${user!.id}.${fileExt}`;

      // Read file as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUri(data.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message ?? 'Could not upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUri,
        })
        .eq('id', user!.id);

      if (error) throw error;

      await loadProfile();
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Avatar Section */}
        <Surface style={styles.avatarSection} elevation={2}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} disabled={uploadingAvatar}>
            {avatarUri ? (
              <Avatar.Image size={88} source={{ uri: avatarUri }} />
            ) : (
              <Avatar.Text size={88} label={initials} />
            )}
            <View style={styles.cameraOverlay}>
              <MaterialCommunityIcons
                name={uploadingAvatar ? 'loading' : 'camera'}
                size={16}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>
          <Text variant="bodySmall" style={styles.avatarHint}>
            {uploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
          </Text>
        </Surface>

        {/* Form */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              placeholder="+91 98765 43210"
            />
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || uploadingAvatar}
          icon="content-save"
          contentStyle={styles.buttonContent}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', padding: 32, backgroundColor: '#ffffff', marginBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#00A86B', borderRadius: 12,
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { color: '#999999' },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#ffffff' },
  input: { backgroundColor: '#ffffff', marginBottom: 8 },
  bottomSpacing: { height: 100 },
  bottomBar: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  saveButton: { borderRadius: 8, backgroundColor: '#00A86B' },
  buttonContent: { paddingVertical: 8 },
});
```

**Step 2: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add mobile/app/edit-profile.tsx
git commit -m "feat(profile): add edit-profile screen with avatar upload"
```

---

## Task 6: Fix profile.tsx — Wire Edit Profile + Real Stats

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`

**Step 1: Update the import to include `profile` from authStore**

Replace line 7:
```typescript
import { useAuthStore } from '@/stores/authStore';
```
(no change needed, just add `profile` to destructuring below)

**Step 2: Update the component destructuring (line 12)**

Replace:
```typescript
const { user, signOut } = useAuthStore();
```
With:
```typescript
const { user, profile, signOut } = useAuthStore();
```

**Step 3: Update name/avatar/verification to use profile data where available**

Replace lines 15–18:
```typescript
const userName = user?.user_metadata?.full_name || 'User';
const userEmail = user?.email || '';
const avatarUrl = user?.user_metadata?.avatar_url;
const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
```
With:
```typescript
const userName = profile?.full_name ?? user?.user_metadata?.full_name ?? 'User';
const userEmail = profile?.email ?? user?.email ?? '';
const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
```

**Step 4: Update stats values to use real profile data**

Replace the 4 `<Text>` stat values (currently hardcoded `0` and `0.0`):

```tsx
{/* Trust Score */}
<Text variant="headlineSmall" style={styles.statValue}>
  {profile?.trust_score ?? 0}
</Text>

{/* Trips Posted — count myTrips if available, fallback to 0 */}
<Text variant="headlineSmall" style={styles.statValue}>
  {profile?.total_deliveries ?? 0}
</Text>

{/* Deliveries */}
<Text variant="headlineSmall" style={styles.statValue}>
  {profile?.successful_deliveries ?? 0}
</Text>

{/* Rating */}
<Text variant="headlineSmall" style={styles.statValue}>
  {profile?.average_rating?.toFixed(1) ?? '0.0'}
</Text>
```

**Step 5: Update verification badge to use real data**

Replace the verification chip content:
```tsx
<MaterialCommunityIcons
  name={profile?.id_verified ? 'shield-check' : 'shield-check-outline'}
  size={20}
  color={profile?.id_verified ? '#00A86B' : '#666666'}
/>
<Text variant="bodySmall" style={styles.verificationText}>
  {profile?.id_verified ? 'ID Verified' : 'Not Verified'}
</Text>
```

**Step 6: Wire Edit Profile navigation (line ~116)**

Replace the `onPress` on "Edit Profile" List.Item:
```typescript
onPress={() => {
  Alert.alert('Coming Soon', 'Profile editing will be available in Milestone 5');
}}
```
With:
```typescript
onPress={() => router.push('/edit-profile')}
```

**Step 7: Run typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: no errors.

**Step 8: Commit**

```bash
git add "mobile/app/(tabs)/profile.tsx"
git commit -m "feat(profile): wire Edit Profile navigation and display real stats"
```

---

## Final Verification

**Step 1: Full typecheck**

```bash
cd mobile && npm run typecheck
```

Expected: same 4 pre-existing errors (unrelated to Tier 2), zero new errors.

**Step 2: Start dev server and manual test checklist**

```bash
cd mobile && npm start
```

- [ ] Trips tab: SegmentedButtons toggle visible at top
- [ ] Browse segment: existing trip list works unchanged
- [ ] My Trips segment: shows empty state with + FAB for new users
- [ ] Tapping + FAB navigates to Post Trip form
- [ ] Post Trip form: all fields work, submit inserts row into Supabase `trips` table
- [ ] After posting, My Trips shows the new trip
- [ ] Tapping a trip navigates to My Trip Detail
- [ ] My Trip Detail: trip summary + "Incoming Requests (0)" for new trips
- [ ] Profile tab: name/avatar load from real `profiles` row
- [ ] Profile tab: "Edit Profile" navigates to Edit Profile screen (no more "Coming Soon" alert)
- [ ] Edit Profile: name and phone save to Supabase `profiles`
- [ ] Edit Profile: avatar pick + upload stores image in Supabase Storage `avatars` bucket
