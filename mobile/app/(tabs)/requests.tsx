/**
 * Requests Screen - View and manage package requests
 */
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, FAB, Surface, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Request } from '@/stores/requestsStore';
import { colors, spacing, radius, statusColors } from '@/lib/theme';

type FilterTab = 'all' | 'active' | 'matched' | 'completed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Open' },
  { key: 'matched', label: 'Matched' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_LABELS: Record<string, string> = {
  active: 'Open',
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
  initiated: 'Initiated',
};

function getStatusChipStyle(status: string) {
  const key = status as keyof typeof statusColors;
  const chip = statusColors[key] ?? statusColors.cancelled;
  return { bg: chip.bg, text: chip.text };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function RequestCard({ request, onPress }: { request: Request; onPress: (r: Request) => void }) {
  const chip = getStatusChipStyle(request.status);
  const label = STATUS_LABELS[request.status] ?? request.status;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(request)}>
      <Surface style={styles.card} elevation={1}>
        {/* Header row: route + status chip */}
        <View style={styles.cardHeader}>
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
            <Text variant="titleSmall" style={styles.cityText} numberOfLines={1}>
              {request.origin_city}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textSecondary} />
            <MaterialCommunityIcons name="map-marker-check" size={14} color={colors.success} />
            <Text variant="titleSmall" style={styles.cityText} numberOfLines={1}>
              {request.destination_city}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusBadgeText, { color: chip.text }]}>{label}</Text>
          </View>
        </View>

        {/* Package description */}
        <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
          {request.package_description}
        </Text>

        {/* Meta row: weight + deadline */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="weight-kilogram" size={14} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.metaText}>
              {request.package_weight_kg} kg
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.metaText}>
              By {formatDate(request.needed_by_date)}
            </Text>
          </View>
        </View>

        {/* Footer action */}
        <View style={styles.cardFooter}>
          <Text variant="labelSmall" style={styles.viewOffersLink}>
            View Offers
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests, setSelectedRequest } = useRequestsStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

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

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return r.status === 'active';
    if (activeFilter === 'matched') return r.status === 'matched';
    if (activeFilter === 'completed') return r.status === 'completed';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          My Package Requests
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          Track and manage your deliveries
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                variant="labelMedium"
                style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Request List */}
      <FlatList
        data={filteredRequests}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={handleRequestPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchRequests}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={48}
                  color={colors.textDisabled}
                />
              </View>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No requests yet
              </Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                Post your first package request to find a traveler who can carry it.
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        label="New Request"
        style={styles.fab}
        onPress={handlePostRequest}
        color={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Filter tabs
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.primarySubtle,
  },
  filterTabText: {
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },

  // Request card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cityText: {
    color: colors.textPrimary,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Description
  description: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  metaText: {
    color: colors.textSecondary,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  viewOffersLink: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
