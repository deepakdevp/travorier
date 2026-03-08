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
    router.replace('/(tabs)/requests');
  };

  const handleBrowseMore = () => {
    router.replace('/(tabs)');
  };

  const steps = [
    {
      icon: 'clock-outline' as const,
      title: 'Traveler Reviews Request',
      description: 'The traveler will review your request, typically within 24 hours',
    },
    {
      icon: 'bell-ring-outline' as const,
      title: 'Get Notified',
      description: "You'll receive an instant notification when the traveler accepts",
    },
    {
      icon: 'shield-check-outline' as const,
      title: 'Confirm & Secure Payment',
      description: 'Confirm details and secure your payment in escrow',
    },
    {
      icon: 'handshake-outline' as const,
      title: 'Coordinate Handover',
      description: 'Meet at an agreed public location for the package handover',
    },
  ];

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Hero */}
      <View style={styles.heroSection}>
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={56} color={colors.surface} />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          Request Sent!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your package delivery request has been sent to the traveler
        </Text>
      </View>

      {/* Trip Details Card */}
      {selectedTrip && (
        <Card style={styles.tripCard} elevation={0}>
          <Card.Content style={styles.tripCardContent}>
            <Text variant="labelMedium" style={styles.cardLabel}>
              LOGISTICS MATCH
            </Text>

            {/* Route */}
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text variant="titleLarge" style={styles.cityText}>
                  {selectedTrip.origin_city}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="airplane"
                size={22}
                color={colors.primary}
                style={styles.airplaneIcon}
              />
              <View style={styles.cityBlock}>
                <Text variant="titleLarge" style={styles.cityText}>
                  {selectedTrip.destination_city}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Traveler */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text variant="bodyMedium" style={styles.detailText}>
                {selectedTrip.traveler.full_name}
              </Text>
              {selectedTrip.pnr_verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={colors.success} />
                  <Text variant="labelSmall" style={styles.verifiedText}>
                    Verified
                  </Text>
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text variant="bodyMedium" style={styles.detailText}>
                {new Date(selectedTrip.departure_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Weight & Price */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={18}
                color={colors.textSecondary}
              />
              <Text variant="bodyMedium" style={styles.detailText}>
                Up to {selectedTrip.available_weight_kg} kg · ₹{selectedTrip.price_per_kg}/kg
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* What Happens Next */}
      <Card style={styles.stepsCard} elevation={0}>
        <Card.Content style={styles.stepsCardContent}>
          <Text variant="titleMedium" style={styles.stepsTitle}>
            What Happens Next?
          </Text>

          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepLeft}>
                <View style={styles.stepNumberBadge}>
                  <Text variant="labelSmall" style={styles.stepNumber}>
                    {index + 1}
                  </Text>
                </View>
                {index < steps.length - 1 && <View style={styles.stepConnector} />}
              </View>
              <View style={styles.stepBody}>
                <View style={styles.stepIconRow}>
                  <View style={styles.stepIconContainer}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text variant="titleSmall" style={styles.stepTitle}>
                    {step.title}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.stepText}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={handleViewMatches}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          View My Requests
        </Button>

        <Button
          mode="outlined"
          onPress={handleBrowseMore}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.secondaryButtonLabel}
        >
          Back to Home
        </Button>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information-outline" size={15} color={colors.textSecondary} />
        <Text variant="bodySmall" style={styles.infoText}>
          Track all your matches and messages in the Requests tab
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },

  // Trip Card
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tripCardContent: {
    paddingVertical: spacing.md,
  },
  cardLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
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
  cityText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  airplaneIcon: {
    marginHorizontal: spacing.sm,
    transform: [{ rotate: '45deg' }],
  },
  divider: {
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailText: {
    color: colors.textSecondary,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successSubtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  verifiedText: {
    color: colors.success,
    fontWeight: '600',
  },

  // Steps Card
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  stepsCardContent: {
    paddingVertical: spacing.md,
  },
  stepsTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.md,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    minHeight: spacing.lg,
  },
  stepBody: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
  stepIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  stepText: {
    color: colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 44,
  },

  // Buttons
  actionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    borderRadius: radius.lg,
    borderColor: colors.border,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  primaryButtonLabel: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButtonLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
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
