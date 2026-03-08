/**
 * Request Detail Screen
 * Shows request info and matching travelers, allows unlocking contact/chat.
 * Revamped to use design system tokens from mobile/lib/theme.ts
 */
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Match } from '@/stores/requestsStore';
import { useCreditStore } from '@/stores/creditStore';
import { colors, spacing, radius, statusColors } from '@/lib/theme';

// ─── Status label map ─────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  active: 'Open',
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─── Match status label map ───────────────────────────────────────────────────
const MATCH_STATUS_LABEL: Record<string, string> = {
  initiated: 'Initiated',
  negotiating: 'Negotiating',
  agreed: 'Agreed',
  handover_scheduled: 'Handover Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

// Map match statuses to statusColors keys
const matchStatusKey = (
  status: string
): keyof typeof statusColors => {
  const map: Record<string, keyof typeof statusColors> = {
    initiated: 'initiated',
    negotiating: 'active',
    agreed: 'matched',
    handover_scheduled: 'matched',
    in_transit: 'active',
    delivered: 'completed',
    cancelled: 'cancelled',
    disputed: 'cancelled',
  };
  return map[status] ?? 'initiated';
};

// ─── Match Card component ─────────────────────────────────────────────────────
function MatchCard({
  match,
  onUnlock,
  onChat,
}: {
  match: Match;
  onUnlock: (match: Match) => void;
  onChat: (match: Match) => void;
}) {
  const initials = match.traveler.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const chipKey = matchStatusKey(match.status);
  const chipColors = statusColors[chipKey];

  const departureDateStr = match.trip.departure_date
    ? new Date(match.trip.departure_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <Card style={styles.matchCard} elevation={1}>
      <Card.Content>
        {/* Traveler row */}
        <View style={styles.travelerRow}>
          {match.traveler.avatar_url ? (
            <Avatar.Image
              size={48}
              source={{ uri: match.traveler.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={48}
              label={initials}
              style={styles.avatar}
              color={colors.surface}
            />
          )}

          <View style={styles.travelerInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.travelerName}>
                {match.traveler.full_name}
              </Text>
              {match.traveler.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={16}
                  color={colors.primary}
                />
              )}
            </View>

            <View style={styles.ratingRow}>
              <MaterialCommunityIcons
                name="star"
                size={13}
                color={colors.star}
              />
              <Text variant="bodySmall" style={styles.ratingText}>
                {match.traveler.trust_score} trust score
              </Text>
            </View>
          </View>

          {/* Status chip */}
          <View
            style={[
              styles.statusChip,
              { backgroundColor: chipColors.bg },
            ]}
          >
            <Text style={[styles.statusChipText, { color: chipColors.text }]}>
              {MATCH_STATUS_LABEL[match.status] ?? match.status}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Flight details */}
        <View style={styles.flightRow}>
          <MaterialCommunityIcons
            name="airplane"
            size={15}
            color={colors.textSecondary}
          />
          <Text variant="bodySmall" style={styles.flightText}>
            {[match.trip.airline, match.trip.flight_number]
              .filter(Boolean)
              .join(' ')}
            {departureDateStr ? ` · ${departureDateStr}` : ''}
          </Text>
        </View>

        {/* Route summary */}
        <View style={styles.routeSummaryRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text variant="bodySmall" style={styles.routeSummaryText}>
            {match.trip.origin_city} → {match.trip.destination_city}
          </Text>
        </View>

        {/* Weight */}
        <View style={styles.weightRow}>
          <MaterialCommunityIcons
            name="weight-kilogram"
            size={13}
            color={colors.textSecondary}
          />
          <Text variant="bodySmall" style={styles.weightText}>
            {match.agreed_weight_kg} kg agreed
          </Text>
        </View>
      </Card.Content>

      {/* Actions */}
      <Card.Actions style={styles.cardActions}>
        {match.contact_unlocked ? (
          <Button
            mode="contained"
            onPress={() => onChat(match)}
            icon="chat-outline"
            compact
            style={styles.chatButton}
            labelStyle={styles.buttonLabel}
          >
            Chat
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => onUnlock(match)}
            icon="lock-open-variant-outline"
            compact
            style={styles.unlockButton}
            labelStyle={styles.buttonLabel}
          >
            Unlock Contact
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RequestDetailScreen() {
  const router = useRouter();
  const {
    selectedRequest,
    setSelectedMatch,
    unlockContact,
    fetchMatchesForRequest,
    matches,
    matchesLoading,
  } = useRequestsStore();
  const { balance } = useCreditStore();

  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!selectedRequest) {
      router.back();
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (selectedRequest) {
      fetchMatchesForRequest(selectedRequest.id);
    }
  }, [selectedRequest?.id]);

  if (!selectedRequest) {
    return null;
  }

  const request = selectedRequest;

  const requestStatusKey =
    (request.status as keyof typeof statusColors) in statusColors
      ? (request.status as keyof typeof statusColors)
      : 'active';
  const requestChipColors = statusColors[requestStatusKey];

  const neededByStr = request.needed_by_date
    ? new Date(request.needed_by_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleUnlock = (match: Match) => {
    setPendingMatch(match);
    setUnlockModalVisible(true);
  };

  const handleChat = (match: Match) => {
    setSelectedMatch(match);
    router.push('/chat');
  };

  const handleConfirmUnlock = async () => {
    if (!pendingMatch) return;
    setUnlocking(true);

    try {
      await unlockContact(pendingMatch.id);
      setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'agreed' });
      setUnlockModalVisible(false);
      setUnlocking(false);
      router.push('/chat');
    } catch (err: any) {
      setUnlocking(false);
      Alert.alert('Error', err?.message ?? 'Failed to unlock contact. Please try again.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderMatchItem = ({ item }: { item: Match }) => (
    <MatchCard match={item} onUnlock={handleUnlock} onChat={handleChat} />
  );

  const renderEmptyMatches = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-search-outline"
        size={56}
        color={colors.border}
      />
      <Text variant="titleSmall" style={styles.emptyTitle}>
        No matches yet
      </Text>
      <Text variant="bodySmall" style={styles.emptySubtitle}>
        We'll notify you when a traveler matches your route.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <Text variant="titleMedium" style={styles.headerTitle}>
          Package Request
        </Text>

        {/* Request status chip */}
        <View
          style={[
            styles.headerStatusChip,
            { backgroundColor: requestChipColors.bg },
          ]}
        >
          <Text
            style={[styles.headerStatusText, { color: requestChipColors.text }]}
          >
            {STATUS_LABEL[request.status] ?? request.status}
          </Text>
        </View>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListEmptyComponent={matchesLoading ? null : renderEmptyMatches()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* ── Request details card ───────────────────────────────── */}
            <View style={styles.detailsCard}>
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.cityBlock}>
                  <Text variant="headlineMedium" style={styles.cityText}>
                    {request.origin_city}
                  </Text>
                  <Text variant="bodySmall" style={styles.countryText}>
                    {request.origin_country}
                  </Text>
                </View>

                <View style={styles.arrowContainer}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <View style={[styles.cityBlock, styles.cityBlockRight]}>
                  <Text variant="headlineMedium" style={styles.cityText}>
                    {request.destination_city}
                  </Text>
                  <Text variant="bodySmall" style={styles.countryText}>
                    {request.destination_country}
                  </Text>
                </View>
              </View>

              <Divider style={styles.detailsDivider} />

              {/* Meta chips */}
              <View style={styles.metaRow}>
                <Chip
                  icon="weight-kilogram"
                  compact
                  style={styles.metaChip}
                  textStyle={styles.metaChipText}
                >
                  {request.package_weight_kg} kg
                </Chip>
                {neededByStr ? (
                  <Chip
                    icon="calendar-outline"
                    compact
                    style={styles.metaChip}
                    textStyle={styles.metaChipText}
                  >
                    By {neededByStr}
                  </Chip>
                ) : null}
              </View>

              {/* Description */}
              {request.package_description ? (
                <View style={styles.descriptionSection}>
                  <Text variant="labelMedium" style={styles.sectionLabel}>
                    Package Description
                  </Text>
                  <Text variant="bodyMedium" style={styles.descriptionText}>
                    {request.package_description}
                  </Text>
                </View>
              ) : null}

              {/* Notes */}
              {request.notes ? (
                <View style={styles.notesSection}>
                  <Text variant="labelMedium" style={styles.sectionLabel}>
                    Notes
                  </Text>
                  <Text variant="bodyMedium" style={styles.descriptionText}>
                    {request.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ── Matches section heading ────────────────────────────── */}
            <View style={styles.matchesHeading}>
              <Text variant="titleMedium" style={styles.matchesTitle}>
                Traveler Matches
              </Text>
              {!matchesLoading && (
                <View style={styles.matchCountBadge}>
                  <Text style={styles.matchCountText}>{matches.length}</Text>
                </View>
              )}
              {matchesLoading && (
                <Text variant="bodySmall" style={styles.loadingText}>
                  Loading...
                </Text>
              )}
            </View>
          </>
        }
        ListFooterComponent={<View style={styles.listFooter} />}
      />

      {/* ── Unlock Contact Modal ──────────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={unlockModalVisible}
          onDismiss={() => setUnlockModalVisible(false)}
          contentContainerStyle={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal handle */}
            <View style={styles.modalHandle} />

            {/* Icon */}
            <View style={styles.modalIconWrapper}>
              <MaterialCommunityIcons
                name="lock-open-variant"
                size={32}
                color={colors.primary}
              />
            </View>

            {/* Title */}
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Unlock Contact Details
            </Text>

            {/* Traveler name */}
            {pendingMatch && (
              <Text variant="bodyMedium" style={styles.modalTravelerName}>
                {pendingMatch.traveler.full_name}
              </Text>
            )}

            {/* Cost info */}
            <View style={styles.costBox}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={18}
                color={colors.primary}
              />
              <Text variant="bodyMedium" style={styles.costText}>
                Use{' '}
                <Text style={styles.costHighlight}>1 credit (₹99)</Text> to
                unlock contact details
              </Text>
            </View>

            {/* Balance */}
            <View style={styles.balanceRow}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text variant="bodySmall" style={styles.balanceText}>
                Current Balance:{' '}
                <Text style={styles.balanceBold}>{balance} Credits</Text>
              </Text>
            </View>

            {/* Trust note */}
            <Text variant="bodySmall" style={styles.trustNote}>
              Secure transaction via Payment Gateway
            </Text>

            {/* Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setUnlockModalVisible(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelLabel}
                disabled={unlocking}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmUnlock}
                loading={unlocking}
                disabled={unlocking}
                style={styles.confirmButton}
                labelStyle={styles.confirmLabel}
              >
                Unlock (1 credit)
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Screen ──────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header bar ───────────────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerStatusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── FlatList ─────────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: spacing.xl,
  },
  listFooter: {
    height: spacing.xl,
  },

  // ── Request details card ──────────────────────────────────────────────────────
  detailsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countryText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowContainer: {
    paddingHorizontal: spacing.sm,
  },
  detailsDivider: {
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  metaChip: {
    backgroundColor: colors.primarySubtle,
  },
  metaChipText: {
    color: colors.primary,
    fontSize: 12,
  },
  descriptionSection: {
    marginBottom: spacing.sm,
  },
  notesSection: {
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionText: {
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // ── Matches heading ───────────────────────────────────────────────────────────
  matchesHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  matchesTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  matchCountBadge: {
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCountText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.textSecondary,
  },

  // ── Match card ────────────────────────────────────────────────────────────────
  matchCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primarySubtle,
  },
  travelerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  travelerName: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    color: colors.textSecondary,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  flightText: {
    color: colors.textSecondary,
    flex: 1,
  },
  routeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  routeSummaryText: {
    color: colors.textSecondary,
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weightText: {
    color: colors.textSecondary,
  },
  cardActions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 0,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  chatButton: {
    backgroundColor: colors.success,
    flex: 1,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Unlock Contact Modal ──────────────────────────────────────────────────────
  modalOverlay: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalTravelerName: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  costText: {
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  costHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  balanceText: {
    color: colors.textSecondary,
  },
  balanceBold: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  trustNote: {
    color: colors.textDisabled,
    textAlign: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  cancelLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  confirmLabel: {
    color: colors.surface,
    fontWeight: '700',
  },
});
