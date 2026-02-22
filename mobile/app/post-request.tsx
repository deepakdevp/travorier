/**
 * Post Request Screen
 * Revamped UI based on Stitch "Post New Package Request" design.
 * Preserves all original form state and business logic unchanged.
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function PostRequestScreen() {
  const router = useRouter();
  const { addRequest } = useRequestsStore();

  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = parseFloat(packageWeight) || 0;

  const isValid = () => {
    return (
      originCity.trim().length > 0 &&
      originCountry.trim().length > 0 &&
      destinationCity.trim().length > 0 &&
      destinationCountry.trim().length > 0 &&
      neededByDate.trim().length > 0 &&
      weight > 0 &&
      packageDescription.trim().length >= 10
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Post Request',
      `Post request for ${packageWeight}kg package from ${originCity} to ${destinationCity}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            setLoading(true);
            try {
              await new Promise((resolve) => setTimeout(resolve, 800));

              // In production:
              // const { data, error } = await supabase
              //   .from('requests')
              //   .insert({ sender_id: userId, origin_city, ... });

              addRequest({
                origin_city: originCity.trim(),
                origin_country: originCountry.trim(),
                destination_city: destinationCity.trim(),
                destination_country: destinationCountry.trim(),
                needed_by_date: neededByDate.trim(),
                package_weight_kg: weight,
                package_description: packageDescription.trim(),
                package_value: packageValue ? parseFloat(packageValue) : undefined,
                special_instructions: specialInstructions.trim() || undefined,
              });

              setLoading(false);
              Alert.alert('Posted!', 'Your request has been posted. Matching travelers will be notified.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/requests') },
              ]);
            } catch {
              setLoading(false);
              Alert.alert('Error', 'Failed to post request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const descTrimmed = packageDescription.trim();
  const descError = descTrimmed.length > 0 && descTrimmed.length < 10;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Route Section                                                     */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.sectionCard}>
          {/* Section header */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionLabel}>Route Details</Text>
          </View>

          {/* Origin row */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>From</Text>
            <View style={styles.rowInputs}>
              <TextInput
                label="City *"
                value={originCity}
                onChangeText={setOriginCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
                left={<TextInput.Icon icon="airplane-takeoff" color={colors.primary} />}
              />
              <TextInput
                label="Country *"
                value={originCountry}
                onChangeText={setOriginCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
              />
            </View>
          </View>

          {/* Route arrow divider */}
          <View style={styles.routeArrowRow}>
            <View style={styles.routeArrowLine} />
            <View style={styles.routeArrowCircle}>
              <MaterialCommunityIcons name="arrow-down" size={18} color={colors.primary} />
            </View>
            <View style={styles.routeArrowLine} />
          </View>

          {/* Destination row */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>To</Text>
            <View style={styles.rowInputs}>
              <TextInput
                label="City *"
                value={destinationCity}
                onChangeText={setDestinationCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
                left={<TextInput.Icon icon="airplane-landing" color={colors.primary} />}
              />
              <TextInput
                label="Country *"
                value={destinationCountry}
                onChangeText={setDestinationCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
              />
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Package Details Section                                           */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.sectionCard}>
          {/* Section header */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <MaterialCommunityIcons name="package-variant-closed" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionLabel}>Package Details</Text>
          </View>

          {/* Needed by date */}
          <TextInput
            label="Needed by Date * (YYYY-MM-DD)"
            value={neededByDate}
            onChangeText={setNeededByDate}
            mode="outlined"
            left={<TextInput.Icon icon="calendar" color={colors.primary} />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            placeholder="e.g. 2026-03-20"
          />

          {/* Package weight */}
          <TextInput
            label="Package Weight (kg) *"
            value={packageWeight}
            onChangeText={setPackageWeight}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="weight-kilogram" color={colors.primary} />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />
          <HelperText type="info" visible={weight > 0} style={styles.helperText}>
            {weight} kg requested
          </HelperText>

          {/* Package description */}
          <TextInput
            label="Package Description *"
            value={packageDescription}
            onChangeText={setPackageDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            left={<TextInput.Icon icon="package-variant" color={colors.primary} />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            placeholder="e.g. Books, clothes, electronics (no prohibited items)"
            error={descError}
          />
          <HelperText
            type={descError ? 'error' : 'info'}
            visible={true}
            style={styles.helperText}
          >
            {descTrimmed.length < 10
              ? `Minimum 10 characters (${descTrimmed.length}/10)`
              : 'Be specific — traveler needs to know what they are carrying'}
          </HelperText>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Optional fields label */}
          <Text style={styles.optionalGroupLabel}>Optional Details</Text>

          {/* Estimated value */}
          <TextInput
            label="Estimated Value (₹)"
            value={packageValue}
            onChangeText={setPackageValue}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="currency-inr" color={colors.textSecondary} />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />
          <HelperText type="info" visible={true} style={styles.helperText}>
            Helps traveler understand insurance needs
          </HelperText>

          {/* Special instructions */}
          <TextInput
            label="Special Instructions"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="message-text" color={colors.textSecondary} />}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            placeholder="Handle with care, fragile, etc."
          />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Info Card                                                          */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="bell-ring-outline" size={15} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              Matching travelers will be notified about your request
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.successLight }]}>
              <MaterialCommunityIcons name="lock-open-outline" size={15} color={colors.success} />
            </View>
            <Text style={styles.infoText}>
              Unlock traveler contact for{' '}
              <Text style={styles.infoTextBold}>₹99 (1 credit)</Text> after match
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Fixed Bottom CTA                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid() || loading}
          icon="send"
          contentStyle={styles.ctaButtonContent}
          labelStyle={styles.ctaButtonLabel}
          style={styles.ctaButton}
        >
          Post Request
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Root
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.xl,
  },

  // ── Section cards
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // ── Section header row (icon + label)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },

  // ── Field group (From / To labels)
  fieldGroup: {
    marginBottom: spacing.xs,
  },
  fieldGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },

  // ── Row inputs (side-by-side city + country)
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },

  // ── Route arrow divider
  routeArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  routeArrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  routeArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── TextInput shared styles
  input: {
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  inputOutline: {
    borderRadius: radius.md,
    borderColor: colors.border,
  },
  inputContent: {
    fontSize: 14,
  },

  // ── HelperText
  helperText: {
    marginBottom: spacing.xs,
    fontSize: 12,
  },

  // ── Section divider (inside package card)
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  optionalGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // ── Info card
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoTextBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // ── Bottom CTA bar
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaButton: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaButtonContent: {
    paddingVertical: spacing.sm,
  },
  ctaButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
