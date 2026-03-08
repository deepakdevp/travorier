/**
 * Request to Carry Screen
 * Revamped UI based on Stitch "Request Delivery / Request to Carry Form" design.
 * Preserves all original business logic unchanged.
 */
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripsStore } from '@/stores/tripsStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PackageType = 'parcel' | 'documents' | 'electronics';

interface CategoryPill {
  id: PackageType;
  label: string;
  icon: string;
}

const CATEGORY_PILLS: CategoryPill[] = [
  { id: 'parcel', label: 'Parcel', icon: 'package-variant' },
  { id: 'documents', label: 'Documents', icon: 'file-document-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'laptop' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Derive a 3-letter city "code" from the first 3 chars of the city name. */
function cityCode(city: string): string {
  return city.slice(0, 3).toUpperCase();
}

/** Format a date string as "Oct 24". */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function RequestToCarryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useTripsStore();
  const { user } = useAuthStore();

  // ── Business-logic state (preserved from original) ──────────────────────
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [senderNotes, setSenderNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // ── New UI state ─────────────────────────────────────────────────────────
  const [packageType, setPackageType] = useState<PackageType>('parcel');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [dimensionsExpanded, setDimensionsExpanded] = useState(false);

  // Guard — must have a selected trip
  if (!selectedTrip) {
    router.back();
    return null;
  }

  const trip = selectedTrip;
  const weight = parseFloat(packageWeight) || 0;
  const estimatedCost = weight * trip.price_per_kg;

  // ── Validation (preserved from original) ─────────────────────────────────
  const hasErrors = () => {
    if (!packageWeight || weight <= 0) return true;
    if (weight > trip.available_weight_kg) return true;
    if (!packageDescription.trim()) return true;
    if (packageDescription.trim().length < 10) return true;
    return false;
  };

  // ── Submit (preserved from original) ─────────────────────────────────────
  const handleSubmitRequest = async () => {
    if (hasErrors()) {
      Alert.alert('Invalid Input', 'Please fill in all required fields correctly.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service before submitting.');
      return;
    }

    Alert.alert(
      'Confirm Request',
      `Submit request to carry ${packageWeight}kg package from ${trip.origin_city} to ${trip.destination_city}?\n\nEstimated cost: ₹${estimatedCost}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('matches')
                .insert({
                  trip_id: trip.id,
                  traveler_id: trip.traveler_id,
                  sender_id: user?.id,
                  agreed_weight_kg: weight,
                  agreed_price: estimatedCost,
                  status: 'initiated',
                });

              if (error) throw error;

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

  // ── Derived display values ───────────────────────────────────────────────
  const originCode = cityCode(trip.origin_city);
  const destCode = cityCode(trip.destination_city);
  const departureDateShort = formatShortDate(trip.departure_date);

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------------------ */}
      {/* Sticky Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Request Delivery</Text>

        <TouchableOpacity style={styles.headerMenu} hitSlop={8}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Scrollable body                                                      */}
      {/* ------------------------------------------------------------------ */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* -------------------------------------------------------------- */}
          {/* Traveler Card (orange gradient bg)                               */}
          {/* -------------------------------------------------------------- */}
          <View style={styles.travelerCard}>
            {/* Top row: traveler identity + date pill */}
            <View style={styles.travelerTopRow}>
              {/* Left: icon + label + name */}
              <View style={styles.travelerIdentity}>
                <View style={styles.travelerAvatarCircle}>
                  <MaterialCommunityIcons name="airplane-takeoff" size={20} color={colors.primary} />
                </View>
                <View style={styles.travelerTextStack}>
                  <Text style={styles.travelerRoleLabel}>TRAVELER</Text>
                  <Text style={styles.travelerName} numberOfLines={1}>
                    {trip.traveler.full_name}
                  </Text>
                </View>
              </View>

              {/* Right: date pill */}
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{departureDateShort}</Text>
              </View>
            </View>

            {/* Route row */}
            <View style={styles.routeRow}>
              {/* Origin */}
              <View style={styles.routeEndpoint}>
                <Text style={styles.routeCode}>{originCode}</Text>
                <Text style={styles.routeCityFull} numberOfLines={1}>
                  {trip.origin_city}
                </Text>
              </View>

              {/* Center flight arc */}
              <View style={styles.routeArc}>
                <View style={styles.routeDashedLine} />
                <View style={styles.airplaneCircle}>
                  <MaterialCommunityIcons name="airplane" size={18} color={colors.primary} />
                </View>
                <View style={styles.routeDashedLine} />
              </View>

              {/* Destination */}
              <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
                <Text style={styles.routeCode}>{destCode}</Text>
                <Text style={styles.routeCityFull} numberOfLines={1}>
                  {trip.destination_city}
                </Text>
              </View>
            </View>

            {/* Direct flight label */}
            <View style={styles.directFlightRow}>
              <MaterialCommunityIcons name="map-marker-path" size={12} color={colors.textSecondary} />
              <Text style={styles.directFlightText}>Direct Flight</Text>
            </View>
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Package Details section                                          */}
          {/* -------------------------------------------------------------- */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Package Details</Text>
            <Text style={styles.sectionSubtitle}>Tell us what you need to send.</Text>

            {/* Category type pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
              style={styles.pillsScrollView}
            >
              {CATEGORY_PILLS.map((pill) => {
                const isSelected = packageType === pill.id;
                return (
                  <TouchableOpacity
                    key={pill.id}
                    style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                    onPress={() => setPackageType(pill.id)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={pill.icon as any}
                      size={16}
                      color={isSelected ? colors.white : colors.textSecondary}
                    />
                    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Item Description */}
            <Text style={styles.fieldLabel}>Item Description</Text>
            <View style={styles.textAreaWrapper}>
              <View style={styles.textAreaIconWrap}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
              </View>
              <TextInput
                style={styles.textArea}
                value={packageDescription}
                onChangeText={setPackageDescription}
                multiline
                numberOfLines={4}
                placeholder="e.g. MacBook Pro Charger, Box of Chocolate"
                placeholderTextColor={colors.textDisabled}
                textAlignVertical="top"
              />
            </View>
            {packageDescription.trim().length > 0 && packageDescription.trim().length < 10 && (
              <Text style={styles.fieldError}>
                Minimum 10 characters ({packageDescription.trim().length}/10)
              </Text>
            )}

            {/* Weight + Value row */}
            <View style={styles.twoColRow}>
              {/* Weight */}
              <View style={styles.twoColCell}>
                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <View style={[styles.inputWrapper, weight > trip.available_weight_kg && styles.inputWrapperError]}>
                  <MaterialCommunityIcons name="weight-kilogram" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={styles.inlineInput}
                    value={packageWeight}
                    onChangeText={setPackageWeight}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
                {weight > trip.available_weight_kg && (
                  <Text style={styles.fieldError}>Max {trip.available_weight_kg} kg</Text>
                )}
              </View>

              {/* Value */}
              <View style={styles.twoColCell}>
                <Text style={styles.fieldLabel}>Est. Value ($)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={packageValue}
                    onChangeText={setPackageValue}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              </View>
            </View>

            {/* Add Dimensions (optional expandable)                          */}
            {/* senderNotes state is captured via the expanded text input below */}
            <TouchableOpacity
              style={styles.dimensionsRow}
              onPress={() => setDimensionsExpanded(!dimensionsExpanded)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="ruler-square" size={18} color={colors.textSecondary} />
              <Text style={styles.dimensionsLabel}>Add Dimensions (Optional)</Text>
              <MaterialCommunityIcons
                name={dimensionsExpanded ? 'minus' : 'plus'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Notes input (expanded when dimensions toggled, reusing senderNotes) */}
            {dimensionsExpanded && (
              <View style={styles.notesInputWrapper}>
                <TextInput
                  style={styles.notesInput}
                  value={senderNotes}
                  onChangeText={setSenderNotes}
                  placeholder="e.g. 30cm × 20cm × 15cm, fragile, handle with care"
                  placeholderTextColor={colors.textDisabled}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Photos section                                                   */}
          {/* -------------------------------------------------------------- */}
          <View style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              {/* Add photo button */}
              <TouchableOpacity style={styles.photoAddBox} activeOpacity={0.75}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.textSecondary} />
                <Text style={styles.photoAddText}>Add</Text>
              </TouchableOpacity>

              {/* Placeholder uploaded photo thumbnails */}
              <View style={[styles.photoThumb, { backgroundColor: colors.success + '22' }]}>
                <MaterialCommunityIcons name="image-outline" size={22} color={colors.success} />
              </View>
              <View style={[styles.photoThumb, { backgroundColor: colors.textPrimary + '11' }]}>
                <MaterialCommunityIcons name="image-outline" size={22} color={colors.textSecondary} />
              </View>
            </ScrollView>
          </View>

          {/* -------------------------------------------------------------- */}
          {/* Cost preview (shown when weight > 0 and within limits)           */}
          {/* -------------------------------------------------------------- */}
          {weight > 0 && weight <= trip.available_weight_kg && (
            <View style={styles.costPreviewCard}>
              <View style={styles.costPreviewRow}>
                <Text style={styles.costPreviewLabel}>
                  {packageWeight} kg × ₹{trip.price_per_kg}/kg
                </Text>
                <Text style={styles.costPreviewValue}>₹{estimatedCost}</Text>
              </View>
              <Text style={styles.costPreviewDisclaimer}>
                Final price negotiated after match
              </Text>
            </View>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Terms checkbox + CTA                                             */}
          {/* -------------------------------------------------------------- */}
          <View style={styles.bottomSection}>
            {/* Terms of service row */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && (
                  <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
              </Text>
            </TouchableOpacity>

            {/* Send Request CTA */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                (hasErrors() || !agreedToTerms || loading) && styles.ctaButtonDisabled,
              ]}
              onPress={handleSubmitRequest}
              disabled={hasErrors() || !agreedToTerms || loading}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaButtonText}>
                {loading ? 'Sending...' : 'Send Request →'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    // Subtle shadow on iOS
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBack: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.1,
  },
  headerMenu: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },

  // ── ScrollView ───────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ── Traveler Card (gradient bg) ───────────────────────────────────────────
  travelerCard: {
    backgroundColor: '#fff7ed',   // orange-50
    borderWidth: 1,
    borderColor: '#fed7aa',       // orange-200
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: spacing.md,
    // Subtle gradient feel via background only (LinearGradient avoided for simplicity)
  },
  travelerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  travelerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  travelerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  travelerTextStack: {
    flex: 1,
  },
  travelerRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  travelerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  datePill: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Route row within traveler card
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  routeEndpoint: {
    flex: 1,
  },
  routeEndpointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  routeCityFull: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  routeArc: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  routeDashedLine: {
    flex: 1,
    height: 1.5,
    // React Native dashed border: use borderStyle + borderTopWidth trick
    borderStyle: 'dashed',
    borderTopWidth: 1.5,
    borderTopColor: '#fed7aa',
    backgroundColor: 'transparent',
  },
  airplaneCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  directFlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  directFlightText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Generic section card ─────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // ── Category pills ───────────────────────────────────────────────────────
  pillsScrollView: {
    marginBottom: spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f7f7f7',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  categoryPillSelected: {
    backgroundColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryPillTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },

  // ── Field label ──────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs - 2,
    marginBottom: spacing.xs,
  },

  // ── Text area (description) ──────────────────────────────────────────────
  textAreaWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7f7f7',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    minHeight: 90,
  },
  textAreaIconWrap: {
    paddingTop: spacing.xs,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 70,
    paddingTop: 0,
  },

  // ── Two-column inputs (Weight + Value) ───────────────────────────────────
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  twoColCell: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    padding: 0,
  },

  // ── Dimensions expandable row ────────────────────────────────────────────
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dimensionsLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  notesInputWrapper: {
    marginTop: spacing.sm,
    backgroundColor: '#f7f7f7',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesInput: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 50,
    textAlignVertical: 'top',
  },

  // ── Photos section ───────────────────────────────────────────────────────
  photosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoAddBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Cost preview card ────────────────────────────────────────────────────
  costPreviewCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  costPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  costPreviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costPreviewValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  costPreviewDisclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Bottom section (terms + CTA) ─────────────────────────────────────────
  bottomSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },

  // ── Bottom spacing ────────────────────────────────────────────────────────
  bottomSpacing: {
    height: spacing.xl,
  },
});
