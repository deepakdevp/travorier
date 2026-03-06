/**
 * Trips Screen - Browse trips or manage your own
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB, SegmentedButtons, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore, Trip } from '@/stores/tripsStore';
import TripCard from '@/components/TripCard';
import { colors, spacing, radius, statusColors } from '@/lib/theme';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function MyTripCard({ trip, onPress }: { trip: Trip; onPress: (t: Trip) => void }) {
  const sc = statusColors[trip.status as keyof typeof statusColors] ?? { bg: '#f1f5f9', text: '#9ca3af' };

  return (
    <Card style={styles.myTripCard} onPress={() => onPress(trip)}>
      <Card.Content>
        <View style={styles.routeRow}>
          <Text variant="titleMedium" style={styles.cityText}>{trip.origin_city}</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textSecondary} />
          <Text variant="titleMedium" style={styles.cityText}>{trip.destination_city}</Text>
          <View style={styles.spacer} />
          <Chip compact style={{ backgroundColor: sc.bg }} textStyle={{ color: sc.text, fontSize: 11 }}>
            {STATUS_LABEL[trip.status] ?? trip.status}
          </Chip>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
          <Text variant="bodySmall" style={styles.metaText}>
            {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="weight-kilogram" size={14} color={colors.textSecondary} />
          <Text variant="bodySmall" style={styles.metaText}>{trip.available_weight_kg} kg</Text>
          <Text style={styles.dot}>·</Text>
          <Text variant="bodySmall" style={styles.metaText}>₹{trip.price_per_kg}/kg</Text>
        </View>
        {trip.flight_number && (
          <View style={styles.flightRow}>
            <MaterialCommunityIcons name="airplane" size={14} color={colors.primary} />
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
    if (segment === 'browse') fetchTrips();
    else fetchMyTrips();
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
                <MaterialCommunityIcons name="airplane-off" size={64} color={colors.border} />
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
                <MaterialCommunityIcons name="airplane-takeoff" size={64} color={colors.border} />
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
            color={colors.surface}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segmented: { margin: spacing.md, marginBottom: spacing.sm },
  searchBar: { marginHorizontal: spacing.md, marginBottom: spacing.sm, elevation: 1, backgroundColor: colors.surface },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  chip: { backgroundColor: colors.surface },
  clearChip: { backgroundColor: '#fee2e2' },
  clearChipText: { color: colors.error },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  resultsText: { color: colors.textSecondary },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { marginTop: spacing.md, marginBottom: spacing.sm, color: colors.textSecondary },
  emptyText: { color: colors.textDisabled, textAlign: 'center', paddingHorizontal: 32 },
  myTripCard: { backgroundColor: colors.surface, marginBottom: 12, borderRadius: radius.lg },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cityText: { fontWeight: 'bold', color: colors.textPrimary },
  spacer: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { color: colors.textSecondary },
  dot: { color: colors.border, marginHorizontal: 2 },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  flightText: { color: colors.primary },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.md, backgroundColor: colors.primary },
});
