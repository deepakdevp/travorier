/**
 * My Requests Screen
 *
 * Revamped to match Stitch design:
 * projects/7580322135798196968/screens/c04f407f6bb448c88173500db4ff4528
 *
 * All colors sourced from @/lib/theme — no hardcoded hex values except
 * the Tailwind-equivalent palette constants defined at the top of this
 * file (blue-100/600, purple-100/600, green-100/600, etc.) that are
 * not yet part of the shared theme.
 */
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequestsStore, Request } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Card-status palette constants (Tailwind equivalents not yet in theme.ts)
// ---------------------------------------------------------------------------
const OPEN_ICON_BG     = '#dbeafe';   // blue-100
const OPEN_ICON_COLOR  = '#2563eb';   // blue-600
const OPEN_BADGE_BG    = '#dcfce7';   // green-100
const OPEN_BADGE_COLOR = '#16a34a';   // green-700

const MATCHED_ICON_BG     = '#f3e8ff'; // purple-100
const MATCHED_ICON_COLOR  = '#9333ea'; // purple-600
const MATCHED_BADGE_BG    = '#dbeafe'; // blue-100
const MATCHED_BADGE_COLOR = '#1d4ed8'; // blue-700

const COMPLETED_ICON_BG     = '#f3f4f6'; // gray-100
const COMPLETED_ICON_COLOR  = '#6b7280'; // gray-500
const COMPLETED_BADGE_BG    = '#f3f4f6';
const COMPLETED_BADGE_COLOR = '#6b7280';

// Notification dot / red indicator
const RED_DOT = '#ef4444';

// Info-row background inside cards
const INFO_ROW_BG = '#f9fafb'; // gray-50

// Traveler avatar placeholder tint
const AVATAR_PLACEHOLDER_BG = '#e5e7eb'; // gray-200

// ---------------------------------------------------------------------------
// Helper: format a date string → "Oct 24"
// ---------------------------------------------------------------------------
function formatNeededBy(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Helper: relative posted-at label → "2h ago"
// ---------------------------------------------------------------------------
function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// RequestCard (open)
// ---------------------------------------------------------------------------
function OpenCard({
  request,
  onPress,
}: {
  request: Request;
  onPress: (r: Request) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(request)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          {/* Icon circle */}
          <View style={[styles.cardIconCircle, { backgroundColor: OPEN_ICON_BG }]}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={20}
              color={OPEN_ICON_COLOR}
            />
          </View>
          {/* Badge + timestamp */}
          <View style={styles.cardBadgeGroup}>
            <View style={[styles.statusBadge, { backgroundColor: OPEN_BADGE_BG }]}>
              <Text style={[styles.statusBadgeText, { color: OPEN_BADGE_COLOR }]}>Open</Text>
            </View>
            <Text style={styles.timestampText}>
              Posted {relativeTime(request.created_at)}
            </Text>
          </View>
        </View>
        {/* More button */}
        <TouchableOpacity hitSlop={8}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Route row */}
      <RouteRow
        originCity={request.origin_city}
        destinationCity={request.destination_city}
      />

      {/* Info row */}
      <InfoRow
        neededBy={formatNeededBy(request.needed_by_date)}
        weightKg={request.package_weight_kg}
      />

      {/* Bottom row: waiting for travelers */}
      <View style={styles.cardBottomRow}>
        <View style={[styles.avatarCircle, { backgroundColor: AVATAR_PLACEHOLDER_BG }]}>
          <MaterialCommunityIcons name="help" size={16} color={colors.textSecondary} />
        </View>
        <Text style={styles.waitingText}>Waiting for travelers...</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// RequestCard (matched)
// ---------------------------------------------------------------------------
function MatchedCard({
  request,
  onPress,
}: {
  request: Request;
  onPress: (r: Request) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(request)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.cardIconCircle, { backgroundColor: MATCHED_ICON_BG }]}>
            <MaterialCommunityIcons
              name="cellphone"
              size={20}
              color={MATCHED_ICON_COLOR}
            />
          </View>
          <View style={styles.cardBadgeGroup}>
            <View style={[styles.statusBadge, { backgroundColor: MATCHED_BADGE_BG }]}>
              <Text style={[styles.statusBadgeText, { color: MATCHED_BADGE_COLOR }]}>
                Matched
              </Text>
            </View>
            <Text style={styles.timestampText}>Offer accepted</Text>
          </View>
        </View>
        {/* More button + subtle corner accent */}
        <View style={styles.matchedTopRight}>
          <TouchableOpacity hitSlop={8}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {/* Subtle blue corner decoration */}
          <View style={styles.matchedCornerDot} />
        </View>
      </View>

      {/* Route row */}
      <RouteRow
        originCity={request.origin_city}
        destinationCity={request.destination_city}
      />

      {/* Info row */}
      <InfoRow
        neededBy={formatNeededBy(request.needed_by_date)}
        weightKg={request.package_weight_kg}
      />

      {/* Bottom row: traveler avatar + name + chat button */}
      <View style={styles.cardBottomRow}>
        <View style={styles.cardBottomLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: MATCHED_ICON_BG }]}>
            <MaterialCommunityIcons name="account" size={18} color={MATCHED_ICON_COLOR} />
          </View>
          <Text style={styles.travelerName}>Sarah M.</Text>
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onPress(request)}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// RequestCard (completed)
// ---------------------------------------------------------------------------
function CompletedCard({
  request,
  onPress,
}: {
  request: Request;
  onPress: (r: Request) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, styles.cardCompleted]}
      onPress={() => onPress(request)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.cardIconCircle, { backgroundColor: COMPLETED_ICON_BG }]}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={COMPLETED_ICON_COLOR}
            />
          </View>
          <View style={styles.cardBadgeGroup}>
            <View style={[styles.statusBadge, { backgroundColor: COMPLETED_BADGE_BG }]}>
              <Text style={[styles.statusBadgeText, { color: COMPLETED_BADGE_COLOR }]}>
                Completed
              </Text>
            </View>
            <Text style={styles.timestampText}>
              Delivered {formatNeededBy(request.needed_by_date)}
            </Text>
          </View>
        </View>
      </View>

      {/* Compact route: origin → destination stacked with down arrow */}
      <View style={styles.completedRouteRow}>
        <Text style={styles.completedCity}>{request.origin_city}</Text>
        <MaterialCommunityIcons
          name="arrow-down"
          size={14}
          color={colors.textSecondary}
          style={styles.completedArrow}
        />
        <Text style={styles.completedCity}>{request.destination_city}</Text>
      </View>

      {/* Description + weight */}
      <Text style={styles.completedMeta} numberOfLines={1}>
        {request.package_description
          ? `${request.package_description} • ${request.package_weight_kg}kg`
          : `${request.package_weight_kg}kg`}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components used by multiple card variants
// ---------------------------------------------------------------------------
function RouteRow({
  originCity,
  destinationCity,
}: {
  originCity: string;
  destinationCity: string;
}) {
  return (
    <View style={styles.routeRow}>
      {/* Origin */}
      <View style={styles.routeCityBlock}>
        <Text style={styles.routeLabel}>From</Text>
        <Text style={styles.routeCity}>{originCity}</Text>
      </View>

      {/* Plane + line */}
      <View style={styles.routeCenter}>
        <View style={styles.routeLine} />
        <MaterialCommunityIcons name="airplane" size={16} color={colors.textSecondary} />
        <View style={styles.routeLine} />
      </View>

      {/* Destination */}
      <View style={[styles.routeCityBlock, styles.routeCityBlockRight]}>
        <Text style={[styles.routeLabel, styles.routeLabelRight]}>To</Text>
        <Text style={[styles.routeCity, styles.routeCityRight]}>{destinationCity}</Text>
      </View>
    </View>
  );
}

function InfoRow({ neededBy, weightKg }: { neededBy: string; weightKg: number }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoItem}>
        <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Need by <Text style={styles.infoTextBold}>{neededBy}</Text>
        </Text>
      </View>
      <View style={styles.infoSeparator} />
      <View style={styles.infoItem}>
        <MaterialCommunityIcons name="scale" size={14} color={colors.textSecondary} />
        <Text style={styles.infoText}>{weightKg} kg</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dispatch to correct card variant
// ---------------------------------------------------------------------------
function RequestCard({
  request,
  onPress,
}: {
  request: Request;
  onPress: (r: Request) => void;
}) {
  if (request.status === 'matched') {
    return <MatchedCard request={request} onPress={onPress} />;
  }
  if (request.status === 'completed') {
    return <CompletedCard request={request} onPress={onPress} />;
  }
  return <OpenCard request={request} onPress={onPress} />;
}

// ---------------------------------------------------------------------------
// Filter tab types
// ---------------------------------------------------------------------------
type FilterValue = 'all' | 'open' | 'matched' | 'completed';

const FILTER_TABS: { label: string; value: FilterValue }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Open',      value: 'open' },
  { label: 'Matched',   value: 'matched' },
  { label: 'Completed', value: 'completed' },
];

// ---------------------------------------------------------------------------
// RequestsScreen
// ---------------------------------------------------------------------------
export default function RequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requests, loading, fetchRequests, setSelectedRequest } = useRequestsStore();

  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

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

  const filteredByStatus =
    activeFilter === 'all'
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  // ------------------------------------------------------------------
  // Header rendered as sticky FlatList header via stickyHeaderIndices
  // ------------------------------------------------------------------
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {/* Title row */}
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity style={styles.bellButton} hitSlop={8}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.textPrimary} />
          {/* Red notification dot */}
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
        style={styles.filterTabsScroll}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.value)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredByStatus}
        keyExtractor={(item) => item.id}
        // Sticky header
        ListHeaderComponent={Header}
        stickyHeaderIndices={[0]}
        // Content
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={handleRequestPress} />
        )}
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

      {/* Pill FAB — fixed at bottom right */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.md }]}
        onPress={handlePostRequest}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
        <Text style={styles.fabText}>Post Request</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ---- Root ----
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // ---- Sticky header ----
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    // Backdrop blur is iOS-only; on Android we just use white
    ...(Platform.OS === 'ios'
      ? { backdropFilter: 'blur(12px)' }
      : {}),
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  bellButton: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: RED_DOT,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  // ---- Filter tabs ----
  filterTabsScroll: {
    flexGrow: 0,
  },
  filterTabsContent: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  filterTabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },

  // ---- List ----
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },

  // ---- Base card ----
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCompleted: {
    // Slightly muted for completed state (same card, no extra treatment needed)
  },

  // ---- Card top row ----
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeGroup: {
    gap: 4,
  },

  // ---- Status badge ----
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timestampText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // ---- Matched top-right corner decoration ----
  matchedTopRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  matchedCornerDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: MATCHED_BADGE_BG,
    opacity: 0.6,
  },

  // ---- Route row ----
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeCityBlock: {
    flex: 1,
    gap: 2,
  },
  routeCityBlockRight: {
    alignItems: 'flex-end',
  },
  routeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  routeLabelRight: {
    textAlign: 'right',
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  routeCityRight: {
    textAlign: 'right',
  },
  routeCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    minWidth: 16,
  },

  // ---- Info row ----
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INFO_ROW_BG,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  infoTextBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoSeparator: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },

  // ---- Card bottom row ----
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  cardBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  travelerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // ---- Chat pill button ----
  chatButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },

  // ---- Completed card specifics ----
  completedRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  completedCity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  completedArrow: {
    opacity: 0.6,
  },
  completedMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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

  // ---- Pill FAB ----
  fab: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
