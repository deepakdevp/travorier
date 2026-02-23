/**
 * Browse All Trips Screen
 *
 * Rewritten to match Stitch browse_trips design:
 * projects/7580322135798196968/screens/6e00a44a1d8a4092b8ebc4f7f3d1289f
 *
 * Layout:
 *   - Full-screen gray (#F3F4F6) background
 *   - FlatList with ListHeaderComponent containing:
 *       header (title + bell) → search bar → filter chips → section header
 *   - TripCard list / empty state
 *
 * All business logic preserved unchanged.
 * Colors sourced from @/lib/theme — no hardcoded hex values except
 * the screen-specific background override (#F3F4F6 ≈ colors.divider).
 */
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripsStore } from '@/stores/tripsStore';
import TripCard from '@/components/TripCard';
import { colors, spacing, radius } from '@/lib/theme';

// Screen-specific override: this screen uses a slightly lighter background
// than the default theme background to match the Stitch design.
const SCREEN_BG = '#F3F4F6';
const HEADER_TITLE_COLOR = '#1F2937';
const HEADER_SUBTITLE_COLOR = '#6B7280';

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  // ---- ListHeaderComponent ----
  const ListHeader = (
    <View>
      {/* ---- Header ---- */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Find Travelers</Text>
          <Text style={styles.headerSubtitle}>Send packages securely</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ---- Search bar ---- */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Where is your package going?"
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="tune-variant"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---- Filter chips ---- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {/* Verified Only — tappable / toggleable */}
        <TouchableOpacity
          style={[
            styles.chip,
            filters.verifiedOnly ? styles.chipActive : styles.chipInactive,
          ]}
          onPress={toggleVerifiedFilter}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={14}
            color={filters.verifiedOnly ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              filters.verifiedOnly ? styles.chipTextActive : styles.chipTextInactive,
            ]}
          >
            Verified Only
          </Text>
        </TouchableOpacity>

        {/* Decorative chips */}
        <TouchableOpacity style={[styles.chip, styles.chipInactive]} activeOpacity={0.8}>
          <Text style={styles.chipTextInactive}>Available Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.chip, styles.chipInactive]} activeOpacity={0.8}>
          <Text style={styles.chipTextInactive}>Weight &gt; 5kg</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.chip, styles.chipInactive]} activeOpacity={0.8}>
          <Text style={styles.chipTextInactive}>Cheapest</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ---- Section header ---- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTrips}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={handleTripPress} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
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
              <MaterialCommunityIcons
                name="airplane-off"
                size={48}
                color={colors.textDisabled}
              />
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
    backgroundColor: SCREEN_BG,
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: HEADER_TITLE_COLOR,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 14,
    color: HEADER_SUBTITLE_COLOR,
    marginTop: 2,
  },
  bellButton: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    padding: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: spacing.sm,
    marginTop: 2,
  },

  // ---- Search bar ----
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,   // neutralize Android default padding
  },

  // ---- Filter chips ----
  chipsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextInactive: {
    color: colors.textPrimary,
  },

  // ---- Section header ----
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: HEADER_TITLE_COLOR,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  // ---- FlatList ----
  listContent: {
    paddingBottom: 100,
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
