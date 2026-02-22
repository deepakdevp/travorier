/**
 * Request to Carry Screen
 * Form for senders to request travelers to carry their package
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
  Avatar,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function RequestToCarryScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();

  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [senderNotes, setSenderNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedTrip) {
    router.back();
    return null;
  }

  const trip = selectedTrip;
  const weight = parseFloat(packageWeight) || 0;
  const estimatedCost = weight * trip.price_per_kg;

  const hasErrors = () => {
    if (!packageWeight || weight <= 0) return true;
    if (weight > trip.available_weight_kg) return true;
    if (!packageDescription.trim()) return true;
    if (packageDescription.trim().length < 10) return true;
    return false;
  };

  const handleSubmitRequest = async () => {
    if (hasErrors()) {
      Alert.alert('Invalid Input', 'Please fill in all required fields correctly.');
      return;
    }

    Alert.alert(
      'Confirm Request',
      `Submit request to carry ${packageWeight}kg package from ${trip.origin_city} to ${trip.destination_city}?\n\nEstimated cost: ₹${estimatedCost}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async () => {
            setLoading(true);
            try {
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // In production, this would be:
              // const { data, error } = await supabase
              //   .from('matches')
              //   .insert({
              //     trip_id: trip.id,
              //     sender_id: currentUserId,
              //     agreed_weight_kg: weight,
              //     agreed_price: estimatedCost,
              //     status: 'initiated',
              //   });

              setLoading(false);
              router.replace('/match-confirmation');
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to submit request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const travelerInitial = trip.traveler.full_name
    ? trip.traveler.full_name.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Traveler Profile Card */}
        <Surface style={styles.travelerCard} elevation={0}>
          <View style={styles.travelerHeader}>
            <Avatar.Text
              size={52}
              label={travelerInitial}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.travelerInfo}>
              <Text variant="titleMedium" style={styles.travelerName}>
                {trip.traveler.full_name}
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text variant="bodySmall" style={styles.ratingText}>
                  4.9 · Verified Traveler
                </Text>
              </View>
            </View>
            <Chip
              compact
              style={styles.verifiedChip}
              textStyle={styles.verifiedChipText}
              icon={() => (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={colors.primary}
                />
              )}
            >
              Verified
            </Chip>
          </View>

          <Divider style={styles.cardDivider} />

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeEndpoint}>
              <View style={styles.routeDot} />
              <Text variant="bodySmall" style={styles.routeLabel}>FROM</Text>
              <Text variant="titleSmall" style={styles.cityText}>
                {trip.origin_city}
              </Text>
            </View>

            <View style={styles.routeLineContainer}>
              <View style={styles.routeLine} />
              <MaterialCommunityIcons
                name="airplane"
                size={18}
                color={colors.primary}
                style={styles.routeIcon}
              />
            </View>

            <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
              <View style={[styles.routeDot, styles.routeDotDest]} />
              <Text variant="bodySmall" style={styles.routeLabel}>TO</Text>
              <Text variant="titleSmall" style={styles.cityText}>
                {trip.destination_city}
              </Text>
            </View>
          </View>

          {/* Trip Meta */}
          <View style={styles.tripMetaRow}>
            <View style={styles.tripMetaItem}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.tripMetaText}>
                {new Date(trip.departure_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.tripMetaDot} />
            <View style={styles.tripMetaItem}>
              <MaterialCommunityIcons name="weight-kilogram" size={14} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.tripMetaText}>
                {trip.available_weight_kg} kg available
              </Text>
            </View>
            <View style={styles.tripMetaDot} />
            <View style={styles.tripMetaItem}>
              <MaterialCommunityIcons name="currency-inr" size={14} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.tripMetaText}>
                ₹{trip.price_per_kg}/kg
              </Text>
            </View>
          </View>
        </Surface>

        {/* Capacity Indicator */}
        <Surface style={styles.capacityCard} elevation={0}>
          <View style={styles.capacityHeader}>
            <MaterialCommunityIcons name="bag-suitcase" size={20} color={colors.primary} />
            <Text variant="labelLarge" style={styles.capacityTitle}>
              Luggage Capacity
            </Text>
            <Text variant="labelLarge" style={styles.capacityValue}>
              {trip.available_weight_kg} kg remaining
            </Text>
          </View>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${Math.min((weight / trip.available_weight_kg) * 100, 100)}%`,
                  backgroundColor:
                    weight > trip.available_weight_kg ? colors.error : colors.primary,
                },
              ]}
            />
          </View>
          {weight > 0 && (
            <Text
              variant="bodySmall"
              style={[
                styles.capacityHint,
                { color: weight > trip.available_weight_kg ? colors.error : colors.textSecondary },
              ]}
            >
              {weight > trip.available_weight_kg
                ? `${weight} kg exceeds limit by ${(weight - trip.available_weight_kg).toFixed(1)} kg`
                : `Your package: ${weight} kg`}
            </Text>
          )}
        </Surface>

        {/* Package Details Form */}
        <Surface style={styles.formCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Package Details
          </Text>

          {/* Package Weight */}
          <TextInput
            label="Package Weight (kg) *"
            value={packageWeight}
            onChangeText={setPackageWeight}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="weight-kilogram" />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            error={weight > trip.available_weight_kg}
          />
          <HelperText
            type={weight > trip.available_weight_kg ? 'error' : 'info'}
            visible={packageWeight.length > 0}
          >
            {weight > trip.available_weight_kg
              ? `Exceeds available capacity (${trip.available_weight_kg} kg)`
              : `Available: ${trip.available_weight_kg} kg`}
          </HelperText>

          {/* Package Description */}
          <TextInput
            label="Package Description *"
            value={packageDescription}
            onChangeText={setPackageDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            left={<TextInput.Icon icon="package-variant" />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder="e.g., Books, clothes, electronics (no prohibited items)"
            error={packageDescription.trim().length > 0 && packageDescription.trim().length < 10}
          />
          <HelperText
            type={
              packageDescription.trim().length > 0 && packageDescription.trim().length < 10
                ? 'error'
                : 'info'
            }
            visible={true}
          >
            {packageDescription.trim().length < 10
              ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
              : 'Be specific about contents'}
          </HelperText>

          {/* Package Value */}
          <TextInput
            label="Package Value (₹) (Optional)"
            value={packageValue}
            onChangeText={setPackageValue}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="currency-inr" />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder="Approximate value of contents"
          />
          <HelperText type="info" visible={true}>
            Helps traveler understand insurance needs
          </HelperText>

          {/* Additional Notes */}
          <TextInput
            label="Additional Notes (Optional)"
            value={senderNotes}
            onChangeText={setSenderNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="message-text" />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder="Special instructions, delivery preferences, etc."
          />
        </Surface>

        {/* Estimated Cost Card */}
        {weight > 0 && weight <= trip.available_weight_kg && (
          <Surface style={styles.costCard} elevation={0}>
            <View style={styles.costHeader}>
              <MaterialCommunityIcons name="calculator" size={18} color={colors.primary} />
              <Text variant="titleSmall" style={styles.costTitle}>
                Cost Breakdown
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text variant="bodyMedium" style={styles.costLineLabel}>
                Base fee ({packageWeight} kg × ₹{trip.price_per_kg})
              </Text>
              <Text variant="bodyMedium" style={styles.costLineValue}>
                ₹{estimatedCost}
              </Text>
            </View>

            <Divider style={styles.costDivider} />

            <View style={styles.costTotalRow}>
              <Text variant="titleSmall" style={styles.costTotalLabel}>
                Estimated Total
              </Text>
              <Text variant="headlineSmall" style={styles.costTotalValue}>
                ₹{estimatedCost}
              </Text>
            </View>

            <Text variant="bodySmall" style={styles.costDisclaimer}>
              Final price negotiated with traveler after match
            </Text>
          </Surface>
        )}

        {/* Next Steps Info */}
        <Surface style={styles.stepsCard} elevation={0}>
          <Text variant="titleSmall" style={styles.stepsTitle}>
            How it works
          </Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <MaterialCommunityIcons name="send" size={16} color={colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text variant="labelMedium" style={styles.stepHeading}>
                Send Request
              </Text>
              <Text variant="bodySmall" style={styles.stepDesc}>
                Your request is sent to the traveler for review
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text variant="labelMedium" style={styles.stepHeading}>
                Get Approved
              </Text>
              <Text variant="bodySmall" style={styles.stepDesc}>
                Unlock contact (₹99 credit) after confirmation
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <MaterialCommunityIcons name="package-variant-closed" size={16} color={colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text variant="labelMedium" style={styles.stepHeading}>
                Coordinate Handover
              </Text>
              <Text variant="bodySmall" style={styles.stepDesc}>
                Arrange delivery details directly with the traveler
              </Text>
            </View>
          </View>
        </Surface>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.bottomBarInner}>
          {weight > 0 && weight <= trip.available_weight_kg && (
            <View style={styles.bottomCostPreview}>
              <Text variant="bodySmall" style={styles.bottomCostLabel}>
                Estimated cost
              </Text>
              <Text variant="titleMedium" style={styles.bottomCostValue}>
                ₹{estimatedCost}
              </Text>
            </View>
          )}
          <Button
            mode="contained"
            onPress={handleSubmitRequest}
            loading={loading}
            disabled={hasErrors() || loading}
            icon="send"
            contentStyle={styles.buttonContent}
            style={[
              styles.submitButton,
              weight > 0 && weight <= trip.available_weight_kg && styles.submitButtonFlex,
            ]}
            labelStyle={styles.buttonLabel}
          >
            Submit Request
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Traveler card
  travelerCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  travelerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  travelerInfo: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  travelerName: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    color: colors.textSecondary,
  },
  verifiedChip: {
    backgroundColor: colors.primaryLight,
    height: 28,
  },
  verifiedChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  // Route
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeEndpoint: {
    alignItems: 'flex-start',
    flex: 1,
  },
  routeEndpointRight: {
    alignItems: 'flex-end',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginBottom: spacing.xs,
  },
  routeDotDest: {
    backgroundColor: colors.success,
  },
  routeLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cityText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  routeLineContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    height: 1,
    left: spacing.sm,
    right: spacing.sm,
    top: '50%',
    backgroundColor: colors.border,
  },
  routeIcon: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },

  // Trip meta
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tripMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tripMetaText: {
    color: colors.textSecondary,
  },
  tripMetaDot: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.textDisabled,
    marginHorizontal: spacing.sm,
  },

  // Capacity bar
  capacityCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  capacityTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  capacityValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  capacityBar: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  capacityFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  capacityHint: {
    color: colors.textSecondary,
  },

  // Form card
  formCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  inputOutline: {
    borderRadius: radius.md,
    borderColor: colors.border,
  },

  // Cost card
  costCard: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  costTitle: {
    fontWeight: '700',
    color: colors.primary,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  costLineLabel: {
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  costLineValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  costDivider: {
    backgroundColor: colors.primary + '40',
    marginBottom: spacing.sm,
  },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  costTotalLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  costTotalValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  costDisclaimer: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Steps card
  stepsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  stepHeading: {
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  stepConnector: {
    width: 1,
    height: spacing.md,
    backgroundColor: colors.border,
    marginLeft: 15,
    marginVertical: spacing.xs,
  },

  // Bottom
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  bottomCostPreview: {
    flex: 0,
    minWidth: 80,
  },
  bottomCostLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bottomCostValue: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  submitButton: {
    borderRadius: radius.md,
    flex: 1,
  },
  submitButtonFlex: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
});
