/**
 * Request Detail Screen
 * Shows request info and matching travelers, allows accepting a match.
 * Design sourced from Stitch screens:
 *   - projects/7580322135798196968/screens/24fd1e08940c48839eded217637bc129 (Package Request Details)
 *   - projects/7580322135798196968/screens/f491f993ffe9456cb7ea4058e45ba053 (Unlock Contact Modal)
 */
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Match } from '@/stores/requestsStore';
import { useCreditStore } from '@/stores/creditStore';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Status maps (structure preserved; colors replaced with theme tokens)
// ---------------------------------------------------------------------------
const STATUS_BG: Record<string, string> = {
  open: colors.successLight,
  matched: colors.primaryLight,
  completed: colors.divider,
};
const STATUS_FG: Record<string, string> = {
  open: colors.success,
  matched: colors.primary,
  completed: colors.textSecondary,
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  matched: 'Matched',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// MatchCard
// ---------------------------------------------------------------------------
function MatchCard({
  match,
  onAccept,
}: {
  match: Match;
  onAccept: (match: Match) => void;
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

  return (
    <View style={styles.matchCard}>
      {/* Traveler row */}
      <View style={styles.travelerRow}>
        {match.traveler.avatar_url ? (
          <Avatar.Image size={48} source={{ uri: match.traveler.avatar_url }} style={styles.avatar} />
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={styles.avatar}
            color={colors.white}
          />
        )}
        <View style={styles.travelerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.travelerName}>{match.traveler.full_name}</Text>
            {match.traveler.verified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color={colors.primary}
              />
            )}
          </View>
          <View style={styles.scoreRow}>
            <MaterialCommunityIcons name="star" size={13} color={colors.warning} />
            <Text style={styles.scoreText}>Trust Score: {match.traveler.trust_score}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.matchDivider} />

      {/* Flight row */}
      <View style={styles.flightRow}>
        <View style={styles.flightIconWrap}>
          <MaterialCommunityIcons name="airplane" size={14} color={colors.primary} />
        </View>
        <Text style={styles.flightText}>
          {match.trip.airline ?? ''} {match.trip.flight_number ?? ''} · {departureDate}
        </Text>
      </View>

      {/* Accept button */}
      <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(match)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="handshake" size={16} color={colors.white} style={styles.acceptIcon} />
        <Text style={styles.acceptButtonText}>Accept &amp; Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RequestDetailScreen
// ---------------------------------------------------------------------------
export default function RequestDetailScreen() {
  const router = useRouter();
  const { selectedRequest, setSelectedMatch, unlockContact, getMatchesForRequest } =
    useRequestsStore();
  const { balance } = useCreditStore();
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!selectedRequest) {
      router.back();
    }
  }, [selectedRequest]);

  if (!selectedRequest) {
    return null;
  }

  const request = selectedRequest;
  const matches = getMatchesForRequest(request.id);

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
      setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'accepted' });

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ---------------------------------------------------------------- */}
        {/* Hero header card                                                  */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.heroCard}>
          {/* Route row */}
          <View style={styles.routeRow}>
            {/* Origin */}
            <View style={styles.cityBlock}>
              <View style={styles.cityIconWrap}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
              </View>
              <Text style={styles.cityName}>{request.origin_city}</Text>
              <Text style={styles.countryName}>{request.origin_country}</Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowWrap}>
              <MaterialCommunityIcons name="arrow-right-circle" size={28} color={colors.primary} />
            </View>

            {/* Destination */}
            <View style={[styles.cityBlock, styles.cityBlockRight]}>
              <View style={[styles.cityIconWrap, styles.cityIconRight]}>
                <MaterialCommunityIcons name="map-marker-check" size={14} color={colors.success} />
              </View>
              <Text style={[styles.cityName, styles.textRight]}>{request.destination_city}</Text>
              <Text style={[styles.countryName, styles.textRight]}>{request.destination_country}</Text>
            </View>
          </View>

          {/* Meta chips row */}
          <View style={styles.metaRow}>
            {/* Weight */}
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="weight-kilogram" size={13} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>{request.package_weight_kg} kg</Text>
            </View>

            {/* Deadline */}
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="calendar-clock" size={13} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>By {neededByDate}</Text>
            </View>

            {/* Status */}
            <View style={[styles.metaChip, { backgroundColor: statusBg }]}>
              <MaterialCommunityIcons name="check-circle" size={13} color={statusFg} />
              <Text style={[styles.metaChipText, { color: statusFg }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Description */}
          {!!request.package_description && (
            <View style={styles.descriptionRow}>
              <MaterialCommunityIcons name="package-variant" size={16} color={colors.textSecondary} />
              <Text style={styles.descriptionText}>{request.package_description}</Text>
            </View>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section header                                                    */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {matches.length} Matching Traveler{matches.length !== 1 ? 's' : ''}
          </Text>
          {matches.length > 0 && (
            <Text style={styles.sectionSubtitle}>
              Travelers with verified flights to {request.destination_city}
            </Text>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Match cards / empty state                                         */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.matchesList}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="account-search" size={36} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you when a traveler matches your route.
              </Text>
            </View>
          ) : (
            matches.map((match) => (
              <MatchCard key={match.id} match={match} onAccept={handleAcceptMatch} />
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Unlock Contact Modal                                                */}
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
                  <MaterialCommunityIcons name="lock-open" size={15} color={colors.white} style={styles.unlockIcon} />
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
  scrollView: {
    flex: 1,
  },

  // ---- Hero card ----
  heroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    // Subtle shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  cityIconWrap: {
    marginBottom: 2,
  },
  cityIconRight: {
    alignItems: 'flex-end',
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  countryName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textRight: {
    textAlign: 'right',
  },
  arrowWrap: {
    paddingHorizontal: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ---- Section header ----
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ---- Matches list ----
  matchesList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // ---- Match card ----
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  travelerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  travelerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  matchDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  flightIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  acceptIcon: {
    // no extra style needed, gap handles it
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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

  // Bottom spacing
  bottomSpacing: {
    height: spacing.xl,
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
    // no extra style needed, gap handles it
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
