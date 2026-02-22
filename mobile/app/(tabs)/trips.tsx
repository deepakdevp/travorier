/**
 * Browse All Trips Screen
 *
 * Revamped to match Stitch design:
 * projects/7580322135798196968/screens/6e00a44a1d8a4092b8ebc4f7f3d1289f
 *
 * All colors sourced from @/lib/theme — no hardcoded hex values.
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import TripCard from '@/components/TripCard';
import { colors, spacing, radius } from '@/lib/theme';

export default function TripsScreen() {
  const router = useRouter();
  const {
    filteredTrips,
    filters,
    loading,
    fetchTrips,
    updateFilters,
    resetFilters,
    setSelectedTrip,
  } = useTripsStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters({ searchQuery: query });
  };

  const handleRefresh = async () => {
    await fetchTrips();
  };

  const handleTripPress = (trip: any) => {
    setSelectedTrip(trip);
    router.push('/trip-detail');
  };

  const toggleVerifiedFilter = () => {
    updateFilters({ verifiedOnly: !filters.verifiedOnly });
  };

  const clearFilters = () => {
    setSearchQuery('');
    resetFilters();
  };

  const hasActiveFilters = filters.verifiedOnly || searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Searchbar
          placeholder="Search by city or country..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          clearIcon="close"
          elevation={0}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          icon={filters.verifiedOnly ? 'shield-check' : 'shield-outline'}
          selected={filters.verifiedOnly}
          onPress={toggleVerifiedFilter}
          style={[styles.chip, filters.verifiedOnly && styles.chipSelected]}
          textStyle={[styles.chipText, filters.verifiedOnly && styles.chipTextSelected]}
          showSelectedCheck={false}
        >
          Verified Only
        </Chip>

        {hasActiveFilters && (
          <Chip
            icon="close-circle"
            onPress={clearFilters}
            style={styles.clearChip}
            textStyle={styles.clearChipText}
          >
            Clear Filters
          </Chip>
        )}
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
        </Text>
        {filteredTrips.some((trip) => trip.is_boosted) && (
          <View style={styles.featuredNote}>
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <Text style={styles.featuredText}>Featured trips shown first</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.headerDivider} />

      {/* Trip List */}
      <FlatList
        data={filteredTrips}
        renderItem={({ item }) => <TripCard trip={item} onPress={handleTripPress} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <MaterialCommunityIcons name="airplane-off" size={48} color={colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No trips found</Text>
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Check back later for new trips'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ---- Search bar ----
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  // ---- Filter chips ----
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
  },
  clearChip: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.full,
  },
  clearChipText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },

  // ---- Results header ----
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultsText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  featuredNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },

  // ---- Trip list ----
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 80,
  },

  // ---- Empty state ----
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 20,
  },
});
