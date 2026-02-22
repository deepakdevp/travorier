/**
 * My Package Requests Screen
 *
 * Revamped to match Stitch design:
 * projects/7580322135798196968/screens/c04f407f6bb448c88173500db4ff4528
 *
 * All colors sourced from @/lib/theme — no hardcoded hex values.
 */
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Request } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status config helpers
// ---------------------------------------------------------------------------
const STATUS_COLOR: Record<string, string> = {
  open: colors.success,
  matched: colors.primary,
  completed: colors.textSecondary,
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  matched: 'Matched',
  completed: 'Completed',
};

const STATUS_BG: Record<string, string> = {
  open: colors.successLight,
  matched: colors.primaryLight,
  completed: colors.divider,
};

const STATUS_BORDER: Record<string, string> = {
  open: colors.success,
  matched: colors.primary,
  completed: colors.border,
};

// ---------------------------------------------------------------------------
// RequestCard
// ---------------------------------------------------------------------------
function RequestCard({ request, onPress }: { request: Request; onPress: (r: Request) => void }) {
  const statusColor = {
    open: colors.success,
    matched: colors.primary,
    completed: colors.textSecondary,
  }[request.status];

  const statusLabel = {
    open: 'Open',
    matched: 'Matched',
    completed: 'Completed',
  }[request.status];

  const formattedDate = new Date(request.needed_by_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: STATUS_BORDER[request.status] ?? colors.border }]}
      onPress={() => onPress(request)}
      activeOpacity={0.85}
    >
      {/* Card Header: Status badge */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_BG[request.status] ?? colors.divider },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Route Row */}
      <View style={styles.routeRow}>
        <View style={styles.cityBlock}>
          <Text style={styles.cityText}>{request.origin_city}</Text>
          <Text style={styles.cityLabel}>Origin</Text>
        </View>

        <View style={styles.routeArrow}>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textSecondary} />
        </View>

        <View style={[styles.cityBlock, styles.cityBlockRight]}>
          <Text style={[styles.cityText, styles.cityTextRight]}>{request.destination_city}</Text>
          <Text style={[styles.cityLabel, styles.cityLabelRight]}>Destination</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details Row */}
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="weight-kilogram" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{request.package_weight_kg} kg</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>Needed by {formattedDate}</Text>
        </View>
      </View>

      {/* Description */}
      {!!request.package_description && (
        <Text style={styles.description} numberOfLines={2}>
          {request.package_description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// RequestsScreen
// ---------------------------------------------------------------------------
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
      {/* Results summary */}
      {requests.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {requests.length} {requests.length === 1 ? 'request' : 'requests'}
          </Text>
        </View>
      )}

      {/* Request list */}
      <FlatList
        data={requests}
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
                  name="package-variant"
                  size={48}
                  color={colors.textDisabled}
                />
              </View>
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>
                Post your first package request to find a traveler
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        label="Post Request"
        style={styles.fab}
        onPress={handlePostRequest}
        color={colors.primaryContent}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ---- Summary bar ----
  summaryBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ---- List ----
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 100,
  },

  // ---- Card ----
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ---- Card header (status badge row) ----
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ---- Route row ----
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cityBlock: {
    flex: 1,
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  cityText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityTextRight: {
    textAlign: 'right',
  },
  cityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '400',
  },
  cityLabelRight: {
    textAlign: 'right',
  },
  routeArrow: {
    paddingHorizontal: spacing.sm,
  },

  // ---- Divider ----
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },

  // ---- Details row ----
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailSeparator: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // ---- Description ----
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: spacing.xs,
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

  // ---- FAB ----
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
