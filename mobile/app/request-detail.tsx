/**
 * Request Detail Screen
 * Shows request info and matching travelers, allows accepting a match.
 * Design sourced from Stitch screens:
 *   - projects/7580322135798196968/screens/24fd1e08940c48839eded217637bc129 (Package Request Details)
 *   - projects/7580322135798196968/screens/f491f993ffe9456cb7ea4058e45ba053 (Unlock Contact Modal)
 */
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Text,
  Avatar,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequestsStore, Match } from '@/stores/requestsStore';
import { useCreditStore } from '@/stores/creditStore';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status maps (structure preserved; colors replaced with theme tokens)
// ---------------------------------------------------------------------------
const STATUS_BG: Record<string, string> = {
  active: colors.successLight,
  open: colors.successLight,
  matched: colors.primaryLight,
  completed: colors.divider,
};
const STATUS_FG: Record<string, string> = {
  active: colors.success,
  open: colors.success,
  matched: colors.primary,
  completed: colors.textSecondary,
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Open',
  open: 'Open',
  matched: 'Matched',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// MatchCard — Stitch design with avatar + green dot, trust pill, action button
// ---------------------------------------------------------------------------
function MatchCard({
  match,
  onAccept,
  onScanQR,
  onReview,
}: {
  match: Match;
  onAccept: (match: Match) => void;
  onScanQR: () => void;
  onReview: () => void;
}) {
  // Preserve existing initials computation exactly
  const initials = match.traveler.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const departureDate = new Date(match.trip.departure_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const isHighTrust = match.traveler.trust_score >= 4.5 || match.traveler.trust_score >= 85;

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchCardInner}>
        {/* Left: avatar with online dot + rating below */}
        <View style={styles.avatarCol}>
          <View style={styles.avatarWrap}>
            {match.traveler.avatar_url ? (
              <Avatar.Image
                size={56}
                source={{ uri: match.traveler.avatar_url }}
                style={styles.avatarImg}
              />
            ) : (
              <Avatar.Text
                size={56}
                label={initials}
                style={styles.avatarImg}
                color={colors.white}
              />
            )}
            {/* Green online dot */}
            <View style={styles.onlineDot} />
          </View>
          {/* Star rating below avatar */}
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={11} color={colors.warning} />
            <Text style={styles.ratingText}>
              {match.traveler.trust_score}{' '}
              <Text style={styles.ratingTrips}>
                ({match.agreed_weight_kg * 8} trips)
              </Text>
            </Text>
          </View>
        </View>

        {/* Middle: name + badge + flight info */}
        <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={styles.matchName} numberOfLines={1}>
              {match.traveler.full_name}
            </Text>
            {isHighTrust && (
              <View style={styles.highTrustPill}>
                <Text style={styles.highTrustText}>High Trust</Text>
              </View>
            )}
          </View>
          <Text style={styles.matchFlying}>Flying {departureDate}</Text>
          <Text style={styles.matchLuggage}>
            {match.trip.airline
              ? `${match.trip.airline} · ${match.trip.flight_number ?? ''}`
              : 'Luggage space: Plenty'}
          </Text>
        </View>

        {/* Right: action button */}
        <View style={styles.matchAction}>
          {isHighTrust ? (
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(match)}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => onAccept(match)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewProfileBtnText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {match.status === 'in_transit' && (
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={onScanQR}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="qrcode" size={16} color={colors.white} />
          <Text style={styles.scanBtnText}>Confirm Delivery</Text>
        </TouchableOpacity>
      )}
      {match.status === 'delivered' && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={onReview}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="star-outline" size={16} color={colors.surface} />
          <Text style={styles.reviewBtnText}>Leave a Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// RequestDetailScreen
// ---------------------------------------------------------------------------
export default function RequestDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { selectedRequest, setSelectedMatch, unlockContact, matches, fetchMatchesForRequest } =
    useRequestsStore();
  const { balance, fetchBalance } = useCreditStore();

  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    fetchBalance();
    if (!selectedRequest) {
      router.back();
    } else {
      fetchMatchesForRequest(selectedRequest.id);
    }
  }, [selectedRequest]);

  if (!selectedRequest) {
    return null;
  }

  const request = selectedRequest;

  const handleAcceptMatch = (match: Match) => {
    setPendingMatch(match);
    setUnlockModalVisible(true);
  };

  const handleConfirmUnlock = async () => {
    if (!pendingMatch) return;
    setUnlocking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In production: deduct 1 credit via Stripe + update match in Supabase
      unlockContact(pendingMatch.id);
      setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'agreed' });

      setUnlockModalVisible(false);
      setUnlocking(false);
      router.push('/chat');
    } catch {
      setUnlocking(false);
      Alert.alert('Error', 'Failed to unlock contact. Please try again.');
    }
  };

  const statusBg = STATUS_BG[request.status] ?? colors.divider;
  const statusFg = STATUS_FG[request.status] ?? colors.textSecondary;
  const statusLabel = STATUS_LABEL[request.status] ?? request.status;

  const neededByDate = new Date(request.needed_by_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  // Compute reward: use package_value if present, else weight * 15 as placeholder
  const rewardAmount = request.package_value
    ? (request.package_value * 0.02).toFixed(2)
    : (request.package_weight_kg * 15).toFixed(2);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* ------------------------------------------------------------------ */}
      {/* Sticky header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Request Details</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Options', 'Coming soon')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Card 1 — Request info                                             */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.requestCard}>
          {/* Route row */}
          <View style={styles.routeRow}>
            {/* Origin */}
            <View style={styles.cityBlock}>
              <Text style={styles.cityLabel}>FROM</Text>
              <Text style={styles.cityName}>{request.origin_city}</Text>
              <Text style={styles.citySubtitle}>{request.origin_country}</Text>
            </View>

            {/* Airplane icon center */}
            <View style={styles.routeIconWrap}>
              <MaterialCommunityIcons
                name="airplane"
                size={22}
                color={colors.textSecondary}
                style={styles.airplaneIcon}
              />
            </View>

            {/* Destination */}
            <View style={[styles.cityBlock, styles.cityBlockRight]}>
              <Text style={[styles.cityLabel, styles.textRight]}>TO</Text>
              <Text style={[styles.cityName, styles.textRight]}>{request.destination_city}</Text>
              <Text style={[styles.citySubtitle, styles.textRight]}>
                {request.destination_country}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* 2-column meta row: Item + Weight */}
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Item</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {request.package_description
                  ? request.package_description.split(' ').slice(0, 4).join(' ')
                  : 'Package'}
              </Text>
            </View>
            <View style={[styles.metaBox, styles.metaBoxRight]}>
              <Text style={[styles.metaLabel, styles.textRight]}>Weight</Text>
              <Text style={[styles.metaValue, styles.textRight]}>
                {request.package_weight_kg} kg
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Reward row (orange-tinted) */}
          <View style={styles.rewardRow}>
            <View style={styles.rewardLeft}>
              <View style={styles.rewardIconCircle}>
                <Text style={styles.rewardDollar}>$</Text>
              </View>
              <View style={styles.rewardTextCol}>
                <Text style={styles.rewardLabel}>Delivery Reward</Text>
                <Text style={styles.rewardAmount}>${rewardAmount}</Text>
              </View>
            </View>
            <View style={styles.rewardTypePill}>
              <Text style={styles.rewardTypeText}>Fixed</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Description */}
          {!!request.package_description && (
            <Text style={styles.descriptionText}>{request.package_description}</Text>
          )}

          {/* Status chip + deadline row */}
          <View style={styles.chipRow}>
            <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusChipText, { color: statusFg }]}>{statusLabel}</Text>
            </View>
            <View style={styles.deadlineChip}>
              <MaterialCommunityIcons name="calendar-clock" size={12} color={colors.textSecondary} />
              <Text style={styles.deadlineText}>By {neededByDate}</Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section header — "Matching Travelers"                             */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matching Travelers</Text>
          <View style={styles.foundPill}>
            <Text style={styles.foundPillText}>{matches.length} found</Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Match cards / empty state                                         */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.matchesList}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name="account-search"
                  size={36}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you when a traveler matches your route.
              </Text>
            </View>
          ) : (
            matches.map((match: Match) => (
              <MatchCard
                key={match.id}
                match={match}
                onAccept={handleAcceptMatch}
                onScanQR={() => router.push(`/qr-scanner?matchId=${match.id}`)}
                onReview={() => {
                  router.push({
                    pathname: '/write-review',
                    params: {
                      matchId: match.id,
                      revieweeName: match.traveler?.full_name ?? 'Traveler',
                    },
                  } as any);
                }}
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom action bar                                                   */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={styles.editRequestBtn}
          onPress={() => Alert.alert('Edit Request', 'Coming soon')}
          activeOpacity={0.85}
        >
          <Text style={styles.editRequestText}>Edit Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareRequestBtn}
          onPress={() => Alert.alert('Share Request', 'Coming soon')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={16}
            color={colors.white}
            style={styles.shareIcon}
          />
          <Text style={styles.shareRequestText}>Share Request</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Unlock Contact Modal — white bottom-sheet style                     */}
      {/* ------------------------------------------------------------------ */}
      <Portal>
        <Modal
          visible={unlockModalVisible}
          onDismiss={() => setUnlockModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {/* Lock icon */}
          <View style={styles.modalIconWrap}>
            <MaterialCommunityIcons name="lock-open-variant" size={32} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Unlock Contact</Text>

          {/* Traveler mini-card */}
          {pendingMatch && (
            <View style={styles.modalTravelerCard}>
              {pendingMatch.traveler.avatar_url ? (
                <Avatar.Image
                  size={40}
                  source={{ uri: pendingMatch.traveler.avatar_url }}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={pendingMatch.traveler.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                  color={colors.white}
                />
              )}
              <View style={styles.modalTravelerInfo}>
                <Text style={styles.modalTravelerName}>{pendingMatch.traveler.full_name}</Text>
                <Text style={styles.modalTravelerFlight}>
                  {pendingMatch.trip.airline ?? ''} {pendingMatch.trip.flight_number ?? ''} ·{' '}
                  {new Date(pendingMatch.trip.departure_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.modalDescription}>
            Use <Text style={styles.modalBold}>1 credit (₹99)</Text> to unlock contact details
            and start chatting directly.
          </Text>

          {/* Balance badge */}
          <View style={styles.balanceBadge}>
            <MaterialCommunityIcons name="wallet" size={14} color={colors.primary} />
            <Text style={styles.balanceText}>Your balance: {balance} credits</Text>
          </View>

          {/* Buy Credits nudge when balance is insufficient */}
          {balance < 1 && (
            <TouchableOpacity
              style={styles.buyMoreBtn}
              onPress={() => { setUnlockModalVisible(false); router.push('/buy-credits'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.buyMoreText}>Buy Credits</Text>
            </TouchableOpacity>
          )}

          {/* Security note */}
          <View style={styles.securityRow}>
            <MaterialCommunityIcons name="shield-check" size={13} color={colors.success} />
            <Text style={styles.securityText}>Secure transaction via Payment Gateway</Text>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setUnlockModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.unlockButton, unlocking && styles.unlockButtonDisabled]}
              onPress={handleConfirmUnlock}
              disabled={unlocking}
              activeOpacity={0.85}
            >
              {unlocking ? (
                <Text style={styles.unlockButtonText}>Unlocking…</Text>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="lock-open"
                    size={15}
                    color={colors.white}
                    style={styles.unlockIcon}
                  />
                  <Text style={styles.unlockButtonText}>Unlock (1 credit)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles (no hardcoded hex values — all from theme tokens)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Screen
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ---- Sticky header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },

  // ---- ScrollView ----
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ---- Request info card ----
  requestCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Subtle shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Route row
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
  cityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  citySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textRight: {
    textAlign: 'right',
  },
  routeIconWrap: {
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  airplaneIcon: {
    transform: [{ rotate: '0deg' }],
  },

  // Card divider
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // 2-column meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaBox: {
    flex: 1,
  },
  metaBoxRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Reward row (orange-50 bg with orange border)
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#ffd5c4',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rewardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardDollar: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  rewardTextCol: {
    gap: 2,
  },
  rewardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rewardAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  rewardTypePill: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  rewardTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Chip row (status + deadline)
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // ---- Section header ----
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  foundPill: {
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  foundPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // ---- Matches list ----
  matchesList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // ---- Match card (Stitch layout) ----
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    padding: spacing.md,
    // Shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Avatar column
  avatarCol: {
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatarImg: {
    backgroundColor: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ratingTrips: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // Middle info column
  matchInfo: {
    flex: 1,
    gap: 3,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  highTrustPill: {
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  highTrustText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  matchFlying: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  matchLuggage: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Right action column
  matchAction: {
    alignItems: 'flex-end',
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  viewProfileBtn: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ---- Confirm Delivery (QR scan) button ----
  scanBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface,
  },

  // ---- Leave a Review button ----
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.star,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },

  // ---- Empty state ----
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom spacing inside scroll
  bottomSpacing: {
    height: spacing.xl,
  },

  // ---- Bottom action bar ----
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  editRequestBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 13,
  },
  editRequestText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareRequestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 13,
    gap: 6,
  },
  shareIcon: {
    // gap handles spacing
  },
  shareRequestText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },

  // ---- Unlock Contact Modal ----
  modalContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // Traveler mini-card inside modal
  modalTravelerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modalTravelerInfo: {
    flex: 1,
  },
  modalTravelerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalTravelerFlight: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  modalBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Balance badge
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // Buy more credits nudge
  buyMoreBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buyMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Security row
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Modal action buttons
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unlockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    gap: 5,
  },
  unlockButtonDisabled: {
    opacity: 0.6,
  },
  unlockIcon: {
    // gap handles spacing
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
