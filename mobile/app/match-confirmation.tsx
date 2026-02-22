/**
 * Match Confirmation Screen
 * Success screen after submitting a request to carry
 */
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function MatchConfirmationScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();

  const handleUnlockContact = () => {
    // In production, this would navigate to payment/credit flow
    // For now, just show alert
    alert('Payment/credit feature coming in next milestone');
  };

  const handleViewMatches = () => {
    router.replace('/(tabs)');
  };

  const handleBrowseMore = () => {
    router.replace('/(tabs)/trips');
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Icon */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconCircleOuter}>
          <View style={styles.iconCircleInner}>
            <MaterialCommunityIcons name="check" size={48} color={colors.white} />
          </View>
        </View>
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Request Sent!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your request has been sent to the traveler.
        </Text>
      </View>

      {/* Trip Summary Card */}
      {selectedTrip && (
        <Card style={styles.tripCard} elevation={1}>
          <Card.Content style={styles.tripCardContent}>
            {/* Route */}
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text variant="bodySmall" style={styles.routeLabel}>From</Text>
                <Text variant="titleMedium" style={styles.cityText}>
                  {selectedTrip.origin_city}
                </Text>
              </View>
              <View style={styles.routeArrowBlock}>
                <MaterialCommunityIcons
                  name="airplane"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={[styles.cityBlock, styles.cityBlockRight]}>
                <Text variant="bodySmall" style={styles.routeLabel}>To</Text>
                <Text variant="titleMedium" style={styles.cityText}>
                  {selectedTrip.destination_city}
                </Text>
              </View>
            </View>

            <Divider style={styles.cardDivider} />

            {/* Traveler & Date */}
            <View style={styles.tripMeta}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text variant="bodyMedium" style={styles.metaText}>
                  {selectedTrip.traveler.full_name}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text variant="bodyMedium" style={styles.metaText}>
                  {new Date(selectedTrip.departure_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* What Happens Next */}
      <Card style={styles.stepsCard} elevation={1}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.stepsTitle}>
            What Happens Next?
          </Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="timer-sand" size={22} color={colors.primary} />
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepContent}>
              <Text variant="labelLarge" style={styles.stepTitle}>
                Traveler Reviews Request
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                The traveler will review your request within 24 hours and confirm availability.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepContent}>
              <Text variant="labelLarge" style={styles.stepTitle}>
                Get Notified
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                You'll receive a notification the moment the traveler responds.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="lock-open-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepContent}>
              <Text variant="labelLarge" style={styles.stepTitle}>
                Unlock Contact
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                Use 1 credit (₹99) to unlock contact details and start chatting directly.
              </Text>
            </View>
          </View>

          <View style={[styles.stepItem, styles.stepItemLast]}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="handshake-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text variant="labelLarge" style={styles.stepTitle}>
                Coordinate Delivery
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                Discuss handover details, finalize the delivery fee, and arrange a meeting point.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={handleUnlockContact}
          icon="lock-open-outline"
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Unlock Contact (1 Credit)
        </Button>

        <Button
          mode="contained-tonal"
          onPress={handleViewMatches}
          icon="home-outline"
          style={styles.tonalButton}
          contentStyle={styles.buttonContent}
        >
          Go to Homepage
        </Button>

        <Button
          mode="outlined"
          onPress={handleBrowseMore}
          style={styles.outlinedButton}
          contentStyle={styles.buttonContent}
        >
          Browse More Trips
        </Button>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information-outline" size={15} color={colors.textSecondary} />
        <Text variant="bodySmall" style={styles.infoText}>
          View all your matches and messages in the Profile tab.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // ── Success icon ──────────────────────────────────────────────────────────
  iconWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircleOuter: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleInner: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Message ───────────────────────────────────────────────────────────────
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },

  // ── Trip card ─────────────────────────────────────────────────────────────
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripCardContent: {
    paddingVertical: spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cityBlock: {
    flex: 1,
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  routeArrowBlock: {
    paddingHorizontal: spacing.sm,
  },
  routeLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDivider: {
    marginBottom: spacing.md,
    backgroundColor: colors.divider,
  },
  tripMeta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
  },

  // ── Steps card ────────────────────────────────────────────────────────────
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepsTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  stepItemLast: {
    marginBottom: 0,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  stepConnector: {
    position: 'absolute',
    left: 19,
    top: 44,
    width: 2,
    height: spacing.sm + 4,
    backgroundColor: colors.divider,
  },
  stepContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepText: {
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  actionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.success,
  },
  primaryButtonLabel: {
    color: colors.white,
  },
  tonalButton: {
    borderRadius: radius.md,
  },
  outlinedButton: {
    borderRadius: radius.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },

  // ── Info note ─────────────────────────────────────────────────────────────
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  infoText: {
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1,
    lineHeight: 18,
  },
});
