/**
 * Post Request Screen
 * Form for senders to post a package delivery request
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
  Divider,
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
              await addRequest({
                origin_city: originCity.trim(),
                origin_country: originCountry.trim(),
                destination_city: destinationCity.trim(),
                destination_country: destinationCountry.trim(),
                needed_by_date: neededByDate.trim(),
                package_weight_kg: weight,
                package_description: packageDescription.trim(),
                package_value: packageValue ? parseFloat(packageValue) : undefined,
                notes: specialInstructions.trim() || undefined,
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Route Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ROUTE DETAILS</Text>

          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="airplane-takeoff" size={20} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <Text style={styles.fieldLabel}>Origin</Text>
                <View style={styles.rowInputs}>
                  <TextInput
                    label="City *"
                    value={originCity}
                    onChangeText={setOriginCity}
                    mode="outlined"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[styles.input, styles.flex2]}
                    contentStyle={styles.inputContent}
                  />
                  <TextInput
                    label="Country *"
                    value={originCountry}
                    onChangeText={setOriginCountry}
                    mode="outlined"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[styles.input, styles.flex1]}
                    contentStyle={styles.inputContent}
                  />
                </View>
              </View>
            </View>

            <Divider style={styles.fieldDivider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="airplane-landing" size={20} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <Text style={styles.fieldLabel}>Destination</Text>
                <View style={styles.rowInputs}>
                  <TextInput
                    label="City *"
                    value={destinationCity}
                    onChangeText={setDestinationCity}
                    mode="outlined"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[styles.input, styles.flex2]}
                    contentStyle={styles.inputContent}
                  />
                  <TextInput
                    label="Country *"
                    value={destinationCountry}
                    onChangeText={setDestinationCountry}
                    mode="outlined"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[styles.input, styles.flex1]}
                    contentStyle={styles.inputContent}
                  />
                </View>
              </View>
            </View>

            <Divider style={styles.fieldDivider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="calendar-today" size={20} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <Text style={styles.fieldLabel}>Needed By</Text>
                <TextInput
                  label="Date * (YYYY-MM-DD)"
                  value={neededByDate}
                  onChangeText={setNeededByDate}
                  mode="outlined"
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  placeholder="e.g. 2026-03-20"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Package Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PACKAGE DETAILS</Text>

          <View style={styles.card}>
            {/* Weight */}
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <Text style={styles.fieldLabel}>Weight (kg) *</Text>
                <TextInput
                  label="e.g. 2.5"
                  value={packageWeight}
                  onChangeText={setPackageWeight}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
                <HelperText type="info" visible={weight > 0} style={styles.helperText}>
                  {weight} kg requested
                </HelperText>
              </View>
            </View>

            <Divider style={styles.fieldDivider} />

            {/* Description */}
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="package-variant" size={20} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <Text style={styles.fieldLabel}>Package Description *</Text>
                <TextInput
                  label="What's in the package?"
                  value={packageDescription}
                  onChangeText={setPackageDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  placeholder="e.g. Books, clothes, electronics (no prohibited items)"
                  error={packageDescription.trim().length > 0 && packageDescription.trim().length < 10}
                />
                <HelperText
                  type={packageDescription.trim().length > 0 && packageDescription.trim().length < 10 ? 'error' : 'info'}
                  visible={true}
                  style={styles.helperText}
                >
                  {packageDescription.trim().length < 10
                    ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
                    : 'Be specific — traveler needs to know what they are carrying'}
                </HelperText>
              </View>
            </View>

            <Divider style={styles.fieldDivider} />

            {/* Estimated Value */}
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={colors.textSecondary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <View style={styles.optionalLabelRow}>
                  <Text style={styles.fieldLabel}>Estimated Value (₹)</Text>
                  <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <TextInput
                  label="e.g. 500"
                  value={packageValue}
                  onChangeText={setPackageValue}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
                <HelperText type="info" visible={true} style={styles.helperText}>
                  Helps traveler understand insurance needs
                </HelperText>
              </View>
            </View>

            <Divider style={styles.fieldDivider} />

            {/* Special Instructions */}
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.textSecondary} style={styles.fieldIcon} />
              <View style={styles.fieldInputs}>
                <View style={styles.optionalLabelRow}>
                  <Text style={styles.fieldLabel}>Special Instructions</Text>
                  <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <TextInput
                  label="Handle with care, fragile, etc."
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Matching travelers will be notified about your request
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Unlock traveler contact for ₹99 (1 credit) after match
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid() || loading}
          icon="send"
          buttonColor={colors.primary}
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
          labelStyle={styles.submitButtonLabel}
        >
          Post Request
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  // Section wrapper
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },

  // Card surface
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Field row inside card
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fieldIcon: {
    marginTop: spacing.sm + 2,
    marginRight: spacing.md,
  },
  fieldInputs: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  optionalBadge: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  // Inputs
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: {
    backgroundColor: colors.surface,
    marginBottom: 0,
  },
  inputContent: {
    fontSize: 14,
  },
  helperText: {
    marginTop: 0,
    paddingLeft: 0,
  },

  fieldDivider: {
    backgroundColor: colors.border,
  },

  // Info banner
  infoBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },

  // Bottom
  bottomSpacing: { height: 100 },
  bottomBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    borderRadius: radius.md,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
