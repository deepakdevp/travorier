/**
 * Trips Screen - Browse and Manage Trips
 * Search and filter available trips
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import TripCard from '@/components/TripCard';

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
      <Searchbar
        placeholder="Search by city or country..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
        clearIcon="close"
      />

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          icon={filters.verifiedOnly ? 'check-circle' : 'circle-outline'}
          selected={filters.verifiedOnly}
          onPress={toggleVerifiedFilter}
          style={styles.chip}
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

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text variant="bodyMedium" style={styles.resultsText}>
          {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
        </Text>
        {filteredTrips.some((trip) => trip.is_boosted) && (
          <View style={styles.featuredNote}>
            <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
            <Text variant="bodySmall" style={styles.featuredText}>
              Featured trips shown first
            </Text>
          </View>
        )}
      </View>

      {/* Trip List */}
      <FlatList
        data={filteredTrips}
        renderItem={({ item }) => <TripCard trip={item} onPress={handleTripPress} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="airplane-off" size={64} color="#cccccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No trips found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
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
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
  },
  clearChip: {
    backgroundColor: '#FFEBEE',
  },
  clearChipText: {
    color: '#d32f2f',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    color: '#666666',
  },
  featuredNote: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    marginLeft: 4,
    color: '#FFB800',
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666666',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
});
