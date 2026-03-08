/**
 * Trip Detail Screen
 * Rewritten to match Stitch "Trip Details" design exactly.
 * All business logic from the original file is preserved unchanged.
 */
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripsStore } from '@/stores/tripsStore';
import { useState } from 'react';
import { colors, spacing, radius } from '@/lib/theme';

export default function TripDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useTripsStore();

  if (!selectedTrip) {
    router.back();
    return null;
  }

  const trip = selectedTrip;
  const departureDate = new Date(trip.departure_date);
  const formattedDate = departureDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const userInitials = trip.traveler.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleRequestToCarry = () => {
    router.push('/request-to-carry');
  };

  // Derive 3-letter city abbreviations for display
  const originCode = trip.origin_city.toUpperCase().slice(0, 3);
  const destCode = trip.destination_city.toUpperCase().slice(0, 3);

  // Format departure date/time for card display (e.g. "Oct 24, 2023" / "06:30 PM")
  const cardDate = departureDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const cardTime = trip.departure_time
    ? (() => {
        const [h, m] = trip.departure_time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      })()
    : null;

  // Pricing tiers
  const smallPrice = trip.price_per_kg * 2;
  const mediumPrice = trip.price_per_kg * 5;

  return (
    <View style={styles.container}>
      {/* ── Fixed Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Trip Details</Text>

        <TouchableOpacity
          style={styles.headerShare}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Card 1 — Route
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.routeCard}>
          {/* Decorative blue circle top-right */}
          <View style={styles.routeCardDecoration} />

          {/* Airport row */}
          <View style={styles.airportRow}>
            {/* Origin */}
            <View style={styles.airportBlock}>
              <Text style={styles.airportCode}>{originCode}</Text>
              <Text style={styles.airportCity}>{trip.origin_city}</Text>
            </View>

            {/* Center: line + airplane + duration */}
            <View style={styles.routeCenter}>
              {/* Line with dots */}
              <View style={styles.routeLineRow}>
                <View style={styles.dotRed} />
                <View style={styles.routeLineSegment} />
                <View style={styles.dotGray} />
              </View>
              {/* Airplane icon below line */}
              <MaterialCommunityIcons
                name="airplane"
                size={20}
                color={colors.primary}
                style={styles.airplaneIcon}
              />
              {/* Duration placeholder */}
              <Text style={styles.durationText}>
                {trip.departure_time ? '~14h 20m' : '—'}
              </Text>
            </View>

            {/* Destination */}
            <View style={[styles.airportBlock, styles.airportBlockRight]}>
              <Text style={styles.airportCode}>{destCode}</Text>
              <Text style={[styles.airportCity, styles.airportCityRight]}>
                {trip.destination_city}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.routeInnerDivider} />

          {/* Flight info row */}
          <View style={styles.flightInfoRow}>
            {/* Airline */}
            <View style={styles.flightInfoLeft}>
              <View style={styles.airlineIconCircle}>
                <MaterialCommunityIcons name="airplane" size={16} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.airlineName}>
                  {trip.airline ?? 'Unknown Airline'}
                </Text>
                <Text style={styles.airlineDetail}>
                  {trip.flight_number ? `${trip.flight_number} • Economy` : 'Economy'}
                </Text>
              </View>
            </View>

            {/* Date / time */}
            <View style={styles.flightInfoRight}>
              <Text style={styles.flightDate}>{cardDate}</Text>
              {cardTime && <Text style={styles.flightTime}>{cardTime}</Text>}
            </View>
          </View>

          {/* PNR Verified badge */}
          {trip.pnr_verified && (
            <View style={styles.pnrBadgeRow}>
              <View style={styles.pnrBadge}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#15803d" />
                <Text style={styles.pnrBadgeText}>PNR Verified</Text>
              </View>
            </View>
          )}
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Card 2 — Traveler
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TRAVELER</Text>

          {/* Avatar + info row */}
          <View style={styles.travelerRow}>
            {/* Avatar with star badge */}
            <View style={styles.avatarWrapper}>
              {trip.traveler.avatar_url ? (
                <Avatar.Image
                  size={56}
                  source={{ uri: trip.traveler.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={56}
                  label={userInitials}
                  style={styles.avatarFallback}
                  labelStyle={styles.avatarLabel}
                />
              )}
              {/* Star rating badge overlay */}
              <View style={styles.starBadge}>
                <Text style={styles.starBadgeText}>
                  ★ {trip.traveler.trust_score >= 10
                    ? (trip.traveler.trust_score / 10).toFixed(1)
                    : trip.traveler.trust_score.toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Meta */}
            <View style={styles.travelerMeta}>
              {/* Name + View Profile */}
              <View style={styles.travelerNameRow}>
                <Text style={styles.travelerName}>{trip.traveler.full_name}</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Coming Soon', 'Profile view is coming soon.')}
                >
                  <Text style={styles.viewProfileLink}>View Profile</Text>
                </TouchableOpacity>
              </View>

              {/* Joined year */}
              <Text style={styles.travelerJoined}>Joined 2021</Text>

              {/* Chips row */}
              <View style={styles.travelerChipsRow}>
                <View style={styles.travelerChip}>
                  <MaterialCommunityIcons name="package-variant" size={13} color={colors.textSecondary} />
                  <Text style={styles.travelerChipText}>12 Trips</Text>
                </View>
                {trip.traveler.verified && (
                  <View style={styles.travelerChip}>
                    <MaterialCommunityIcons name="shield-check" size={13} color="#2563eb" />
                    <Text style={[styles.travelerChipText, { color: '#2563eb' }]}>
                      Identity Verified
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Bio quote */}
          <View style={styles.travelerBioDivider} />
          <Text style={styles.travelerBio}>
            "Frequent flyer between NYC and London. Happy to carry documents, clothes, or electronics. Reliable and fast."
          </Text>
        </View>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Card 3 — Capacity & Pricing
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.card}>
          {/* Header row with section label + weight pill */}
          <View style={styles.capacityHeaderRow}>
            <Text style={styles.sectionLabel}>CAPACITY &amp; PRICING</Text>
            <View style={styles.weightPill}>
              <Text style={styles.weightPillText}>
                {trip.available_weight_kg}kg Available
              </Text>
            </View>
          </View>

          {/* Big price */}
          <View style={styles.bigPriceRow}>
            <Text style={styles.bigPriceValue}>${trip.price_per_kg}</Text>
            <Text style={styles.bigPriceUnit}> / kg</Text>
          </View>

          {/* 2-column pricing grid */}
          <View style={styles.pricingGrid}>
            {/* Small */}
            <View style={styles.pricingCell}>
              <MaterialCommunityIcons name="briefcase-outline" size={22} color={colors.primary} />
              <Text style={styles.pricingCellSub}>Up to 2kg</Text>
              <Text style={styles.pricingCellPrice}>${smallPrice}</Text>
            </View>

            <View style={styles.pricingGridDivider} />

            {/* Medium */}
            <View style={styles.pricingCell}>
              <MaterialCommunityIcons name="bag-suitcase-outline" size={22} color="#9333ea" />
              <Text style={styles.pricingCellSub}>Up to 5kg</Text>
              <Text style={styles.pricingCellPrice}>${mediumPrice}</Text>
            </View>
          </View>
        </View>

        {/* Info text below pricing card */}
        <View style={styles.infoTextRow}>
          <MaterialCommunityIcons name="information-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Prices include insurance for package value up to $100. Forbidden items list applies.
          </Text>
        </View>

        {/* Bottom spacer so content clears the fixed bottom bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Fixed Bottom Bar
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        {/* Price estimate */}
        <View style={styles.bottomBarLeft}>
          <Text style={styles.totalEstimateLabel}>Total estimate</Text>
          <Text style={styles.totalEstimateValue}>
            <Text style={styles.totalEstimateFrom}>from </Text>
            ${trip.price_per_kg}.00
          </Text>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleRequestToCarry}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonLabel}>Request to Carry</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Root
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    // paddingTop is applied inline via insets
  },
  headerBack: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerShare: {
    padding: spacing.xs,
  },

  // ── ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card 1 — Route
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Shadow (Android)
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  // Decorative blue circle, top-right, partially off screen
  routeCardDecoration: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: '#eff6ff', // blue-50
  },

  // Airport row
  airportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  airportBlock: {
    flex: 1,
  },
  airportBlockRight: {
    alignItems: 'flex-end',
  },
  airportCode: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  airportCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  airportCityRight: {
    textAlign: 'right',
  },

  // Center: line + plane + duration
  routeCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: 6, // align vertically with the airport codes
  },
  routeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  routeLineSegment: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.border,
  },
  dotGray: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
  },
  airplaneIcon: {
    marginTop: 4,
    transform: [{ rotate: '0deg' }], // points right by default in MaterialCommunityIcons
  },
  durationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Route inner divider
  routeInnerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  // Flight info row
  flightInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  flightInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  airlineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9', // gray-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  airlineDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  flightInfoRight: {
    alignItems: 'flex-end',
  },
  flightDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  flightTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // PNR badge
  pnrBadgeRow: {
    marginTop: spacing.sm,
  },
  pnrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#f0fdf4', // green-50
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  pnrBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d', // green-700
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Generic card base
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md + 4, // ~20px
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card 2 — Traveler
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    color: colors.white,
    fontWeight: '700',
  },
  // Star badge overlaid at bottom-left of avatar
  starBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    backgroundColor: '#facc15', // yellow-400
    borderRadius: radius.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  starBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },

  travelerMeta: {
    flex: 1,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  travelerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  viewProfileLink: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  travelerJoined: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  travelerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  travelerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  travelerChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  travelerBioDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  travelerBio: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Card 3 — Capacity & Pricing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  capacityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weightPill: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  bigPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  bigPriceValue: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bigPriceUnit: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // 2-column grid
  pricingGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pricingCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  pricingGridDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  pricingCellSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pricingCellPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },

  // Info text below pricing card
  infoTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 90,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Fixed Bottom Bar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  bottomBarLeft: {
    flexDirection: 'column',
  },
  totalEstimateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalEstimateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalEstimateFrom: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
    // Orange glow shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.1,
  },
});
