/**
 * Request to Carry Screen
 * Form for senders to request travelers to carry their package
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function RequestToCarryScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();
  const { user } = useAuthStore();

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
            if (!user) {
              Alert.alert('Error', 'You must be logged in to submit a request.');
              return;
            }
            setLoading(true);
            try {
              const { error } = await supabase.from('matches').insert({
                trip_id: trip.id,
                traveler_id: trip.traveler_id,
                sender_id: user.id,
                agreed_weight_kg: weight,
                agreed_price: estimatedCost,
                status: 'initiated',
              });

              if (error) throw new Error(error.message);

              setLoading(false);
              router.replace('/match-confirmation');
            } catch (err: any) {
              setLoading(false);
              Alert.alert('Error', err?.message ?? 'Failed to submit request. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          icon="arrow-left"
          textColor={colors.textPrimary}
          style={styles.backButton}
          contentStyle={styles.backButtonContent}
          compact
        >
          {''}
        </Button>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Request to Carry
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trip Summary Card */}
        <View style={styles.tripCard}>
          <View style={styles.tripCardHeader}>
            <MaterialCommunityIcons name="airplane" size={18} color={colors.primary} />
            <Text variant="labelMedium" style={styles.tripCardLabel}>
              Trip Details
            </Text>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.cityBlock}>
              <MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} />
              <Text variant="titleMedium" style={styles.cityText}>
                {trip.origin_city}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textSecondary} />
            <View style={styles.cityBlock}>
              <MaterialCommunityIcons name="map-marker-check" size={16} color={colors.primary} />
              <Text variant="titleMedium" style={styles.cityText}>
                {trip.destination_city}
              </Text>
            </View>
          </View>

          <View style={styles.tripMeta}>
            <View style={styles.tripMetaItem}>
              <MaterialCommunityIcons name="account" size={14} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.tripMetaText}>
                {trip.traveler.full_name}
              </Text>
            </View>
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
            <View style={styles.tripMetaItem}>
              <MaterialCommunityIcons name="scale" size={14} color={colors.textSecondary} />
              <Text variant="bodySmall" style={styles.tripMetaText}>
                {trip.available_weight_kg} kg available
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details Form */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Package Details
          </Text>

          {/* Package Weight */}
          <TextInput
            label="Package Weight (kg) *"
            value={packageWeight}
            onChangeText={setPackageWeight}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="weight-kilogram" color={colors.textSecondary} />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            error={packageWeight.length > 0 && weight > trip.available_weight_kg}
          />
          <HelperText
            type={packageWeight.length > 0 && weight > trip.available_weight_kg ? 'error' : 'info'}
            visible={packageWeight.length > 0}
            style={styles.helperText}
          >
            {weight > trip.available_weight_kg
              ? `Exceeds available capacity (${trip.available_weight_kg} kg)`
              : `Available capacity: ${trip.available_weight_kg} kg`}
          </HelperText>

          {/* Package Description */}
          <TextInput
            label="Package Description *"
            value={packageDescription}
            onChangeText={setPackageDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            left={<TextInput.Icon icon="package-variant" color={colors.textSecondary} />}
            style={[styles.input, styles.multilineInput]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
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
            style={styles.helperText}
          >
            {packageDescription.trim().length < 10
              ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
              : 'Be specific about contents for smooth handover'}
          </HelperText>

          {/* Package Value */}
          <TextInput
            label="Package Value (₹) — Optional"
            value={packageValue}
            onChangeText={setPackageValue}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="currency-inr" color={colors.textSecondary} />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="Approximate value of contents"
          />
          <HelperText type="info" visible={true} style={styles.helperText}>
            Helps traveler understand insurance needs
          </HelperText>

          {/* Additional Notes */}
          <TextInput
            label="Message to Traveler — Optional"
            value={senderNotes}
            onChangeText={setSenderNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="message-text-outline" color={colors.textSecondary} />}
            style={[styles.input, styles.multilineInput]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            placeholder="Special instructions, delivery preferences, etc."
          />
        </View>

        {/* Estimated Cost */}
        {weight > 0 && weight <= trip.available_weight_kg && (
          <View style={styles.costBox}>
            <View style={styles.costRow}>
              <View>
                <Text variant="labelMedium" style={styles.costLabel}>
                  Estimated Delivery Cost
                </Text>
                <Text variant="bodySmall" style={styles.costNote}>
                  {packageWeight} kg × ₹{trip.price_per_kg}/kg
                </Text>
              </View>
              <Text variant="headlineSmall" style={styles.costValue}>
                ₹{estimatedCost}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.costDisclaimer}>
              Final price is negotiated with the traveler after matching.
            </Text>
          </View>
        )}

        {/* Info / Terms Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
            <Text variant="labelMedium" style={styles.infoBoxTitle}>
              How it works
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoStep}>
              <Text style={styles.infoStepNumber}>1</Text>
            </View>
            <Text variant="bodySmall" style={styles.infoText}>
              Your request is sent to the traveler for review
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoStep}>
              <Text style={styles.infoStepNumber}>2</Text>
            </View>
            <Text variant="bodySmall" style={styles.infoText}>
              Unlock contact (₹99 credit) once the traveler agrees
            </Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoStep}>
              <Text style={styles.infoStepNumber}>3</Text>
            </View>
            <Text variant="bodySmall" style={styles.infoText}>
              Coordinate handover and delivery details directly
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmitRequest}
          loading={loading}
          disabled={hasErrors() || loading}
          icon="send"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
          buttonColor={colors.primary}
        >
          Send Request
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: 0,
  },
  backButtonContent: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 48,
  },
  // ─── Scroll ────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  // ─── Trip Card ─────────────────────────────────────────────────────────────
  tripCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tripCardLabel: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cityText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tripMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tripMetaText: {
    color: colors.textSecondary,
  },
  // ─── Section ───────────────────────────────────────────────────────────────
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  multilineInput: {
    minHeight: 80,
  },
  helperText: {
    marginBottom: spacing.xs,
  },
  // ─── Cost Box ──────────────────────────────────────────────────────────────
  costBox: {
    backgroundColor: colors.primarySubtle,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  costLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  costNote: {
    color: colors.textSecondary,
  },
  costValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  costDisclaimer: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 11,
    marginTop: spacing.xs,
  },
  // ─── Info Box ──────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: colors.primarySubtle,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  infoBoxTitle: {
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoStep: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoStepNumber: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  infoText: {
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // ─── Bottom ────────────────────────────────────────────────────────────────
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    borderRadius: radius.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
