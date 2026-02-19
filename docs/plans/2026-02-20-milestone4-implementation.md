# Milestone 4: Sender Journey Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete sender journey — post a package request, view requests, accept a traveler match, and chat in real time via Supabase Realtime.

**Architecture:** Mock data for requests/matches (same pattern as Milestone 3 tripsStore), real Supabase Realtime for chat. Five files to create/update, all in `mobile/`. New screens are auto-registered by Expo Router (file-based routing — just drop files in `app/`).

**Tech Stack:** React Native (Expo), TypeScript, React Native Paper, Zustand, Expo Router, Supabase JS (`@/services/supabase`)

---

## Important Conventions

- Supabase client: `import { supabase } from '@/services/supabase'`
- Current user ID: `useAuthStore((state) => state.user)?.id`
- Zustand pattern: `create<StoreType>((set, get) => ({ ... }))`
- Navigation: `const router = useRouter()` then `router.push('/screen-name')` or `router.back()`
- All new stack screens (outside tabs) go in `mobile/app/` root — Expo Router auto-picks them up
- Verification: `cd mobile && npm run typecheck` and `npm run lint` after each task
- Colors: green `#00A86B`, blue `#0066cc`, background `#f5f5f5`, white `#ffffff`

---

## Task 1: Create requestsStore.ts

**Files:**
- Create: `mobile/stores/requestsStore.ts`

**Step 1: Write the store with types, mock data, and Zustand actions**

```typescript
/**
 * Requests Store - Manage package requests and matches
 * Uses Zustand for state management
 */
import { create } from 'zustand';

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
  special_instructions?: string;
  status: 'open' | 'matched' | 'completed';
  created_at: string;
}

export interface Match {
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

interface RequestsStore {
  // State
  requests: Request[];
  selectedRequest: Request | null;
  selectedMatch: Match | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedRequest: (request: Request | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  addRequest: (request: Omit<Request, 'id' | 'sender_id' | 'status' | 'created_at'>) => void;
  acceptMatch: (matchId: string) => void;
  unlockContact: (matchId: string) => void;
  fetchRequests: () => Promise<void>;
  getMatchesForRequest: (requestId: string) => Match[];
}

// Mock matches per request
const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    request_id: 'r1',
    trip_id: '1',
    traveler: {
      full_name: 'Rajesh Kumar',
      trust_score: 85,
      verified: true,
    },
    trip: {
      origin_city: 'Mumbai',
      destination_city: 'New York',
      departure_date: '2026-03-15',
      airline: 'Air India',
      flight_number: 'AI191',
    },
    agreed_weight_kg: 3,
    status: 'initiated',
    contact_unlocked: false,
  },
  {
    id: 'm2',
    request_id: 'r1',
    trip_id: '4',
    traveler: {
      full_name: 'Sarah Johnson',
      avatar_url: 'https://i.pravatar.cc/150?img=9',
      trust_score: 95,
      verified: true,
    },
    trip: {
      origin_city: 'Mumbai',
      destination_city: 'New York',
      departure_date: '2026-03-18',
      airline: 'Emirates',
      flight_number: 'EK500',
    },
    agreed_weight_kg: 3,
    status: 'initiated',
    contact_unlocked: false,
  },
];

// Mock requests
const MOCK_REQUESTS: Request[] = [
  {
    id: 'r1',
    sender_id: 'current-user',
    origin_city: 'Mumbai',
    origin_country: 'India',
    destination_city: 'New York',
    destination_country: 'USA',
    needed_by_date: '2026-03-20',
    package_weight_kg: 3,
    package_description: 'Books and documents for university admission',
    package_value: 2000,
    status: 'open',
    created_at: '2026-02-19T10:00:00Z',
  },
  {
    id: 'r2',
    sender_id: 'current-user',
    origin_city: 'Delhi',
    origin_country: 'India',
    destination_city: 'London',
    destination_country: 'UK',
    needed_by_date: '2026-04-01',
    package_weight_kg: 5,
    package_description: 'Traditional Indian sweets and spices for family',
    status: 'matched',
    created_at: '2026-02-18T08:30:00Z',
  },
];

export const useRequestsStore = create<RequestsStore>((set, get) => ({
  // Initial state
  requests: [],
  selectedRequest: null,
  selectedMatch: null,
  loading: false,
  error: null,

  setSelectedRequest: (request) => set({ selectedRequest: request }),

  setSelectedMatch: (match) => set({ selectedMatch: match }),

  addRequest: (requestData) => {
    const newRequest: Request = {
      ...requestData,
      id: `r${Date.now()}`,
      sender_id: 'current-user',
      status: 'open',
      created_at: new Date().toISOString(),
    };
    set((state) => ({ requests: [newRequest, ...state.requests] }));
  },

  acceptMatch: (matchId) => {
    // In production: update match status in Supabase
    // For now, update local state
    set((state) => ({
      selectedMatch: state.selectedMatch?.id === matchId
        ? { ...state.selectedMatch, status: 'accepted' }
        : state.selectedMatch,
    }));
  },

  unlockContact: (matchId) => {
    // In production: deduct 1 credit via Stripe + update match in Supabase
    // For now, update local state
    set((state) => ({
      selectedMatch: state.selectedMatch?.id === matchId
        ? { ...state.selectedMatch, contact_unlocked: true }
        : state.selectedMatch,
    }));
  },

  getMatchesForRequest: (requestId) => {
    return MOCK_MATCHES.filter((m) => m.request_id === requestId);
  },

  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production:
      // const { data, error } = await supabase
      //   .from('requests')
      //   .select('*')
      //   .eq('sender_id', currentUserId)
      //   .order('created_at', { ascending: false });

      set({ requests: MOCK_REQUESTS, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch requests', loading: false });
    }
  },
}));
```

**Step 2: Verify types**

```bash
cd mobile && npm run typecheck
```

Expected: 0 errors (new file, no imports yet)

**Step 3: Commit**

```bash
git add mobile/stores/requestsStore.ts
git commit -m "feat(mobile): add requestsStore with Request and Match types"
```

---

## Task 2: Update Requests Tab Screen

**Files:**
- Modify: `mobile/app/(tabs)/requests.tsx`

**Step 1: Replace the entire file with a working requests list + FAB**

```typescript
/**
 * Requests Screen - View and manage package requests
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Card, Chip, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Request } from '@/stores/requestsStore';

function RequestCard({ request, onPress }: { request: Request; onPress: (r: Request) => void }) {
  const statusColor = {
    open: '#00A86B',
    matched: '#0066cc',
    completed: '#666666',
  }[request.status];

  const statusLabel = {
    open: 'Open',
    matched: 'Matched',
    completed: 'Completed',
  }[request.status];

  return (
    <Card style={styles.card} onPress={() => onPress(request)}>
      <Card.Content>
        {/* Route */}
        <View style={styles.routeRow}>
          <Text variant="titleMedium" style={styles.cityText}>
            {request.origin_city}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#666666" />
          <Text variant="titleMedium" style={styles.cityText}>
            {request.destination_city}
          </Text>
          <View style={styles.spacer} />
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
            textStyle={[styles.statusChipText, { color: statusColor }]}
          >
            {statusLabel}
          </Chip>
        </View>

        {/* Details */}
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="weight-kilogram" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.detailText}>
            {request.package_weight_kg} kg
          </Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="calendar" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.detailText}>
            Needed by{' '}
            {new Date(request.needed_by_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
          {request.package_description}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests, setSelectedRequest } = useRequestsStore();

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestPress = (request: Request) => {
    setSelectedRequest(request);
    router.push('/request-detail');
  };

  const handlePostRequest = () => {
    router.push('/post-request');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={handleRequestPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={64} color="#cccccc" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No requests yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Post your first package request to find a traveler
              </Text>
            </View>
          ) : null
        }
      />

      <FAB
        icon="plus"
        label="Post Request"
        style={styles.fab}
        onPress={handlePostRequest}
        color="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cityText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  spacer: {
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  detailText: {
    color: '#666666',
  },
  dot: {
    color: '#cccccc',
    marginHorizontal: 2,
  },
  description: {
    color: '#888888',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666666',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#00A86B',
  },
});
```

**Step 2: Verify**

```bash
cd mobile && npm run typecheck && npm run lint
```

Expected: 0 errors

**Step 3: Visual check**
- Open Expo (`npm start --web`)
- Tap "Requests" tab
- Should see 2 mock requests (Mumbai→New York, Delhi→London)
- FAB "Post Request" bottom right
- Pull to refresh works

**Step 4: Commit**

```bash
git add mobile/app/(tabs)/requests.tsx
git commit -m "feat(mobile): update requests tab with real list and post FAB"
```

---

## Task 3: Create Post Request Screen

**Files:**
- Create: `mobile/app/post-request.tsx`

**Step 1: Create the form screen**

```typescript
/**
 * Post Request Screen
 * Form for senders to post a package delivery request
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore } from '@/stores/requestsStore';

export default function PostRequestScreen() {
  const router = useRouter();
  const { addRequest } = useRequestsStore();

  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = parseFloat(packageWeight) || 0;

  const isValid = () => {
    return (
      originCity.trim().length > 0 &&
      originCountry.trim().length > 0 &&
      destinationCity.trim().length > 0 &&
      destinationCountry.trim().length > 0 &&
      neededByDate.trim().length > 0 &&
      weight > 0 &&
      packageDescription.trim().length >= 10
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Post Request',
      `Post request for ${packageWeight}kg package from ${originCity} to ${destinationCity}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            setLoading(true);
            try {
              await new Promise((resolve) => setTimeout(resolve, 800));

              // In production:
              // const { data, error } = await supabase
              //   .from('requests')
              //   .insert({ sender_id: userId, origin_city, ... });

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

              setLoading(false);
              Alert.alert('Posted!', 'Your request has been posted. Matching travelers will be notified.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/requests') },
              ]);
            } catch {
              setLoading(false);
              Alert.alert('Error', 'Failed to post request. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Route Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Route
            </Text>

            <View style={styles.rowInputs}>
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

            <View style={styles.rowInputs}>
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

        {/* Package Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Package Details
            </Text>

            <TextInput
              label="Needed by Date * (YYYY-MM-DD)"
              value={neededByDate}
              onChangeText={setNeededByDate}
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              placeholder="e.g. 2026-03-20"
            />

            <TextInput
              label="Package Weight (kg) *"
              value={packageWeight}
              onChangeText={setPackageWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="weight-kilogram" />}
              style={styles.input}
            />
            <HelperText type="info" visible={weight > 0}>
              {weight} kg requested
            </HelperText>

            <TextInput
              label="Package Description *"
              value={packageDescription}
              onChangeText={setPackageDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              left={<TextInput.Icon icon="package-variant" />}
              style={styles.input}
              placeholder="e.g. Books, clothes, electronics (no prohibited items)"
              error={packageDescription.trim().length > 0 && packageDescription.trim().length < 10}
            />
            <HelperText
              type={packageDescription.trim().length > 0 && packageDescription.trim().length < 10 ? 'error' : 'info'}
              visible={true}
            >
              {packageDescription.trim().length < 10
                ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
                : 'Be specific — traveler needs to know what they are carrying'}
            </HelperText>

            <TextInput
              label="Estimated Value (₹) (Optional)"
              value={packageValue}
              onChangeText={setPackageValue}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="currency-inr" />}
              style={styles.input}
            />
            <HelperText type="info" visible={true}>
              Helps traveler understand insurance needs
            </HelperText>

            <TextInput
              label="Special Instructions (Optional)"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="message-text" />}
              style={styles.input}
              placeholder="Handle with care, fragile, etc."
            />
          </Card.Content>
        </Card>

        {/* Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="information" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Matching travelers will be notified about your request
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="lock-open" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Unlock traveler contact for ₹99 (1 credit) after match
              </Text>
            </View>
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
          icon="send"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
        >
          Post Request
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  card: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#ffffff' },
  sectionTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: { backgroundColor: '#ffffff', marginBottom: 4 },
  arrowRow: { alignItems: 'center', marginVertical: 4 },
  infoCard: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#E3F2FD' },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoText: { flex: 1, marginLeft: 12, color: '#666666', lineHeight: 18 },
  bottomSpacing: { height: 100 },
  bottomBar: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  submitButton: { borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
});
```

**Step 2: Verify**

```bash
cd mobile && npm run typecheck && npm run lint
```

Expected: 0 errors

**Step 3: Visual check**
- Tap FAB in Requests tab → post-request screen opens
- Fill fields → "Post Request" button enables
- Submit → Alert → confirm → navigates back to Requests tab
- New request appears at top of list

**Step 4: Commit**

```bash
git add mobile/app/post-request.tsx
git commit -m "feat(mobile): add post request form screen"
```

---

## Task 4: Create Request Detail Screen

**Files:**
- Create: `mobile/app/request-detail.tsx`

**Step 1: Create the screen**

```typescript
/**
 * Request Detail Screen
 * Shows request info and matching travelers, allows accepting a match
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Surface,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Match } from '@/stores/requestsStore';

function MatchCard({
  match,
  onAccept,
}: {
  match: Match;
  onAccept: (match: Match) => void;
}) {
  const initials = match.traveler.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card style={styles.matchCard}>
      <Card.Content>
        {/* Traveler */}
        <View style={styles.travelerRow}>
          {match.traveler.avatar_url ? (
            <Avatar.Image size={48} source={{ uri: match.traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={48} label={initials} />
          )}
          <View style={styles.travelerInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.travelerName}>
                {match.traveler.full_name}
              </Text>
              {match.traveler.verified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#0066cc" />
              )}
            </View>
            <View style={styles.scoreRow}>
              <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
              <Text variant="bodySmall" style={styles.scoreText}>
                Trust Score: {match.traveler.trust_score}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Flight */}
        <View style={styles.flightRow}>
          <MaterialCommunityIcons name="airplane" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.flightText}>
            {match.trip.airline} {match.trip.flight_number} ·{' '}
            {new Date(match.trip.departure_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => onAccept(match)}
          icon="handshake"
          compact
          style={styles.acceptButton}
        >
          Accept & Chat
        </Button>
      </Card.Actions>
    </Card>
  );
}

export default function RequestDetailScreen() {
  const router = useRouter();
  const { selectedRequest, setSelectedMatch, unlockContact, getMatchesForRequest } =
    useRequestsStore();
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  if (!selectedRequest) {
    router.back();
    return null;
  }

  const request = selectedRequest;
  const matches = getMatchesForRequest(request.id);

  const handleAcceptMatch = (match: Match) => {
    setPendingMatch(match);
    setUnlockModalVisible(true);
  };

  const handleConfirmUnlock = async () => {
    if (!pendingMatch) return;
    setUnlocking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In production: deduct 1 credit via Stripe, update match in Supabase
      unlockContact(pendingMatch.id);
      setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'accepted' });

      setUnlockModalVisible(false);
      setUnlocking(false);
      router.push('/chat');
    } catch {
      setUnlocking(false);
      Alert.alert('Error', 'Failed to unlock contact. Please try again.');
    }
  };

  return (
    <Portal.Host>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Request Summary */}
          <Surface style={styles.header} elevation={2}>
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text variant="headlineSmall" style={styles.cityText}>
                  {request.origin_city}
                </Text>
                <Text variant="bodySmall" style={styles.countryText}>
                  {request.origin_country}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={28} color="#00A86B" />
              <View style={styles.cityBlock}>
                <Text variant="headlineSmall" style={styles.cityText}>
                  {request.destination_city}
                </Text>
                <Text variant="bodySmall" style={styles.countryText}>
                  {request.destination_country}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Chip icon="weight-kilogram" compact style={styles.metaChip}>
                {request.package_weight_kg} kg
              </Chip>
              <Chip icon="calendar" compact style={styles.metaChip}>
                By {new Date(request.needed_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Chip>
              <Chip
                compact
                style={[
                  styles.metaChip,
                  { backgroundColor: request.status === 'open' ? '#E8F5E9' : '#E3F2FD' },
                ]}
                textStyle={{ color: request.status === 'open' ? '#2E7D32' : '#1976D2' }}
              >
                {request.status === 'open' ? 'Open' : 'Matched'}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.descriptionText}>
              {request.package_description}
            </Text>
          </Surface>

          {/* Matching Travelers */}
          <View style={styles.matchesSection}>
            <Text variant="titleMedium" style={styles.matchesTitle}>
              {matches.length} Matching Traveler{matches.length !== 1 ? 's' : ''}
            </Text>

            {matches.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-search" size={48} color="#cccccc" />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No matches yet. We'll notify you when a traveler matches your route.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} onAccept={handleAcceptMatch} />
              ))
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Unlock Contact Modal */}
        <Portal>
          <Modal
            visible={unlockModalVisible}
            onDismiss={() => setUnlockModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <MaterialCommunityIcons name="lock-open-variant" size={48} color="#00A86B" style={styles.modalIcon} />
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Unlock Contact
            </Text>
            <Text variant="bodyMedium" style={styles.modalText}>
              Use 1 credit (₹99) to unlock{' '}
              <Text style={styles.bold}>{pendingMatch?.traveler.full_name}</Text>'s contact
              details and start chatting.
            </Text>
            <Text variant="bodySmall" style={styles.modalNote}>
              Your credits balance: 5 credits
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setUnlockModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmUnlock}
                loading={unlocking}
                disabled={unlocking}
                style={styles.modalButton}
              >
                Unlock (1 credit)
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: '#ffffff', marginBottom: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cityBlock: { flex: 1 },
  cityText: { fontWeight: 'bold', color: '#333333' },
  countryText: { color: '#666666', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metaChip: { backgroundColor: '#f5f5f5' },
  descriptionText: { color: '#555555', lineHeight: 20 },
  matchesSection: { padding: 16 },
  matchesTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 12 },
  matchCard: { backgroundColor: '#ffffff', marginBottom: 12 },
  travelerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  travelerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  travelerName: { fontWeight: 'bold', color: '#333333' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { color: '#666666' },
  divider: { marginBottom: 12 },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flightText: { color: '#666666' },
  acceptButton: { backgroundColor: '#00A86B' },
  emptyCard: { backgroundColor: '#ffffff' },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 12, paddingHorizontal: 16 },
  bottomSpacing: { height: 40 },
  modal: { backgroundColor: '#ffffff', margin: 24, borderRadius: 12, padding: 24 },
  modalIcon: { textAlign: 'center', marginBottom: 12 },
  modalTitle: { fontWeight: 'bold', color: '#333333', textAlign: 'center', marginBottom: 8 },
  modalText: { color: '#555555', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  modalNote: { color: '#00A86B', textAlign: 'center', marginBottom: 20 },
  bold: { fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1 },
});
```

**Step 2: Verify**

```bash
cd mobile && npm run typecheck && npm run lint
```

Expected: 0 errors

**Step 3: Visual check**
- Tap a request in the list → request-detail screen opens
- Shows route, weight, description at top
- Shows 2 mock matching travelers (for request r1)
- Tap "Accept & Chat" → unlock modal appears showing traveler name + credit cost
- Confirm → modal closes → navigates to chat screen (next task — will error until Task 5 done)

**Step 4: Commit**

```bash
git add mobile/app/request-detail.tsx
git commit -m "feat(mobile): add request detail screen with match list and unlock modal"
```

---

## Task 5: Create Chat Screen (Supabase Realtime)

**Files:**
- Create: `mobile/app/chat.tsx`

**Step 1: Create the real-time chat screen**

```typescript
/**
 * Chat Screen - Real-time chat with matched traveler via Supabase Realtime
 */
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, IconButton, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRequestsStore } from '@/stores/requestsStore';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedMatch } = useRequestsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  if (!selectedMatch) {
    router.back();
    return null;
  }

  const matchId = selectedMatch.id;
  const currentUserId = user?.id ?? 'current-user';
  const traveler = selectedMatch.traveler;

  // Check if chat is locked (24h after flight departure per ADR-008)
  const flightDate = new Date(selectedMatch.trip.departure_date);
  const lockTime = new Date(flightDate.getTime() + 24 * 60 * 60 * 1000);
  const isChatLocked = new Date() > lockTime;

  useEffect(() => {
    loadMessageHistory();
    const channel = subscribeToMessages();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const loadMessageHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data ?? []);
    }
    setLoadingHistory(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates if we already inserted it locally
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Scroll to bottom
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return channel;
  };

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || sending || isChatLocked) return;

    setSending(true);
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(content); // Restore on error
    }

    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageBubbleContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text variant="bodyMedium" style={isMe ? styles.myMessageText : styles.theirMessageText}>
            {item.content}
          </Text>
          <Text variant="bodySmall" style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const travelerInitials = traveler.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          {traveler.avatar_url ? (
            <Avatar.Image size={40} source={{ uri: traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={40} label={travelerInitials} />
          )}
          <View style={styles.headerInfo}>
            <Text variant="titleSmall" style={styles.travelerName}>
              {traveler.full_name}
            </Text>
            <Text variant="bodySmall" style={styles.routeText}>
              {selectedMatch.trip.origin_city} → {selectedMatch.trip.destination_city}
            </Text>
          </View>
          {traveler.verified && (
            <MaterialCommunityIcons name="check-decagram" size={20} color="#0066cc" />
          )}
        </View>
      </Surface>

      {/* Chat Lock Banner */}
      {isChatLocked ? (
        <View style={styles.lockBanner}>
          <MaterialCommunityIcons name="lock" size={16} color="#ffffff" />
          <Text variant="bodySmall" style={styles.lockText}>
            Chat locked 24 hours after flight
          </Text>
        </View>
      ) : (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={14} color="#666666" />
          <Text variant="bodySmall" style={styles.infoText}>
            Chat available until 24h after flight on{' '}
            {flightDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      )}

      {/* Messages */}
      {loadingHistory ? (
        <View style={styles.loadingContainer}>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color="#cccccc" />
              <Text variant="bodyMedium" style={styles.emptyChatText}>
                Say hi to start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <Surface style={styles.inputBar} elevation={4}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={isChatLocked ? 'Chat is locked' : 'Type a message...'}
          mode="outlined"
          style={styles.textInput}
          dense
          disabled={isChatLocked}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          right={
            <TextInput.Icon
              icon="send"
              disabled={!inputText.trim() || sending || isChatLocked}
              onPress={sendMessage}
              color={inputText.trim() && !isChatLocked ? '#0066cc' : '#cccccc'}
            />
          }
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  travelerName: { fontWeight: 'bold', color: '#333333' },
  routeText: { color: '#666666' },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#666666',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lockText: { color: '#ffffff' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: { color: '#666666', flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#999999' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubbleContainer: { marginBottom: 8 },
  myMessageContainer: { alignItems: 'flex-end' },
  theirMessageContainer: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: { backgroundColor: '#0066cc', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4 },
  myMessageText: { color: '#ffffff' },
  theirMessageText: { color: '#333333' },
  timestamp: { fontSize: 10, marginTop: 4 },
  myTimestamp: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  theirTimestamp: { color: '#999999' },
  emptyChat: { alignItems: 'center', paddingVertical: 60 },
  emptyChatText: { color: '#999999', marginTop: 12 },
  inputBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: { backgroundColor: '#ffffff', flex: 1 },
});
```

**Step 2: Verify**

```bash
cd mobile && npm run typecheck && npm run lint
```

Expected: 0 errors

**Step 3: Visual check**
- Accept a match → chat screen opens
- Header shows traveler name + route
- Info banner shows flight date
- Send a message → if Supabase `messages` table has RLS set up, message sends
- Sent message appears in bubble on right (blue), received on left (white)
- Keyboard avoid works on iOS

**Note on Supabase setup:** The `messages` table already exists in the schema (per CLAUDE.md). If RLS blocks inserts, you'll see an error — check Supabase Dashboard to confirm RLS policy allows authenticated users to insert their own messages. The policy should be: `auth.uid() = sender_id`.

**Step 4: Commit**

```bash
git add mobile/app/chat.tsx
git commit -m "feat(mobile): add real-time chat screen with Supabase Realtime"
```

---

## Task 6: Update Plan & Push

**Files:**
- Modify: `.claude/plan.md`

**Step 1: Mark Milestone 4 complete in plan.md**

Find the Milestone 4 section and update:
- Change `📋 PLANNED` to `✅ COMPLETE`
- Add completion date: `**Completed**: 2026-02-20`
- Update Progress Tracking section: Completed = 4, Remaining = 1
- Update Last Updated date

**Step 2: Commit everything**

```bash
git add .claude/plan.md
git commit -m "docs(plan): update progress - Milestone 4 complete"
```

**Step 3: Push to remote**

```bash
git push origin main
```

Expected: Branch pushed successfully, all 6 commits appear in remote.

---

## Summary

| Task | File | Type |
|------|------|------|
| 1 | `mobile/stores/requestsStore.ts` | Create |
| 2 | `mobile/app/(tabs)/requests.tsx` | Update |
| 3 | `mobile/app/post-request.tsx` | Create |
| 4 | `mobile/app/request-detail.tsx` | Create |
| 5 | `mobile/app/chat.tsx` | Create |
| 6 | `.claude/plan.md` | Update + push |

**Verification after each task:** `cd mobile && npm run typecheck && npm run lint`
