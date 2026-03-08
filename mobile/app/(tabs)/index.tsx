/**
 * Home Screen - Dashboard
 * Greeting header, search bar, and live trip feed
 */
import { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { useTripsStore, type Trip } from '@/stores/tripsStore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TripCard from '@/components/TripCard';
import { colors, spacing, radius } from '@/lib/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { filteredTrips, filters, loading, fetchTrips, updateFilters, setSelectedTrip } =
    useTripsStore();
  const router = useRouter();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Traveler';

  const firstName = displayName.split(' ')[0];

  const avatarInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleTripPress = useCallback(
    (trip: Trip) => {
      setSelectedTrip(trip);
      router.push('/trip-detail');
    },
    [setSelectedTrip, router]
  );

  const handleSearch = useCallback(
    (query: string) => {
      updateFilters({ searchQuery: query });
    },
    [updateFilters]
  );

  const renderTripCard = useCallback(
    ({ item }: { item: Trip }) => <TripCard trip={item} onPress={handleTripPress} />,
    [handleTripPress]
  );

  const keyExtractor = useCallback((item: Trip) => item.id, []);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="airplane-off" size={56} color={colors.border} />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          No trips found
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {filters.searchQuery
            ? `No trips match "${filters.searchQuery}"`
            : 'Check back soon for new trips'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* ── Greeting Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="bodyMedium" style={styles.greeting}>
            {getGreeting()},
          </Text>
          <Text variant="headlineSmall" style={styles.userName}>
            {firstName}!
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} accessibilityLabel="Profile">
          {profile?.avatar_url ? (
            <Avatar.Image size={44} source={{ uri: profile.avatar_url }} />
          ) : (
            <Avatar.Text
              size={44}
              label={avatarInitials}
              style={styles.avatarText}
              labelStyle={styles.avatarLabel}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by city or country…"
          onChangeText={handleSearch}
          value={filters.searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textDisabled}
        />
      </View>

      {/* ── Section Heading ── */}
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Available Trips
        </Text>
        {!loading && (
          <Text variant="bodySmall" style={styles.tripCount}>
            {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
          </Text>
        )}
      </View>

      {/* ── Loading Indicator ── */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading trips…
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTrips}
        renderItem={renderTripCard}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: colors.textSecondary,
  },
  userName: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarText: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    color: colors.surface,
    fontWeight: '600',
  },

  // ── Search ───────────────────────────────────────────────────────────────────
  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    elevation: 0,
    height: 44,
  },
  searchInput: {
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  // ── Section Heading ──────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tripCount: {
    color: colors.textSecondary,
  },

  // ── Loading ──────────────────────────────────────────────────────────────────
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },

  // ── Empty State ──────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  separator: {
    height: spacing.sm,
  },
});
