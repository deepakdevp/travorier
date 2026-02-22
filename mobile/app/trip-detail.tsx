/**
 * Trip Detail Screen
 * Revamped UI based on Stitch "Trip Detail View" design.
 * Preserves all original business logic unchanged.
 */
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { useState } from 'react';
import { colors, spacing, radius } from '@/lib/theme';

export default function TripDetailScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (!selectedTrip) {
    router.back();
    return null;
  }

  const trip = selectedTrip;
  const departureDate = new Date(trip.departure_date);
  const formattedDate = departureDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <Surface style={styles.headerBar} elevation={0}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </Surface>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Hero - Route Section */}
        <View style={styles.heroSection}>
          {trip.is_boosted && (
            <View style={styles.featuredBadge}>
              <MaterialCommunityIcons name="star" size={13} color={colors.warning} />
              <Text style={styles.featuredBadgeText}>Featured Trip</Text>
            </View>
          )}

          <View style={styles.routeRow}>
            {/* Origin */}
            <View style={styles.cityBlock}>
              <Text style={styles.cityCode}>{trip.origin_city}</Text>
              <Text style={styles.countryLabel}>{trip.origin_country}</Text>
            </View>

            {/* Flight arc */}
            <View style={styles.routeArc}>
              <View style={styles.routeLine} />
              <View style={styles.airplaneCircle}>
                <MaterialCommunityIcons name="airplane" size={20} color={colors.primary} />
              </View>
              <View style={styles.routeLine} />
            </View>

            {/* Destination */}
            <View style={[styles.cityBlock, styles.cityBlockRight]}>
              <Text style={styles.cityCode}>{trip.destination_city}</Text>
              <Text style={styles.countryLabel}>{trip.destination_country}</Text>
            </View>
          </View>

          {/* Date + Time row */}
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.heroBadgeText}>{formattedDate}</Text>
            </View>
            {trip.departure_time && (
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.heroBadgeText}>{trip.departure_time}</Text>
              </View>
            )}
          </View>

          {/* Flight badge */}
          {trip.flight_number && (
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="airplane" size={13} color={colors.textSecondary} />
                <Text style={styles.heroBadgeText}>
                  {trip.airline} {trip.flight_number}
                </Text>
              </View>
              {trip.pnr_verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="shield-check" size={13} color={colors.success} />
                  <Text style={styles.verifiedBadgeText}>PNR Verified</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Traveler Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Traveler</Text>

          <View style={styles.travelerRow}>
            {trip.traveler.avatar_url ? (
              <Avatar.Image size={56} source={{ uri: trip.traveler.avatar_url }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={56} label={userInitials} style={styles.avatarText} />
            )}

            <View style={styles.travelerMeta}>
              <View style={styles.travelerNameRow}>
                <Text style={styles.travelerName}>{trip.traveler.full_name}</Text>
                {trip.traveler.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={18} color={colors.primary} />
                )}
              </View>

              <View style={styles.trustRow}>
                <MaterialCommunityIcons name="star" size={15} color={colors.warning} />
                <Text style={styles.trustScore}>{trip.traveler.trust_score}</Text>
                <Text style={styles.trustLabel}> Trust Score</Text>
              </View>

              {trip.traveler.verified && (
                <View style={styles.idVerifiedChip}>
                  <MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />
                  <Text style={styles.idVerifiedChipText}>ID Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Capacity & Pricing Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Capacity & Pricing</Text>

          <View style={styles.statsRow}>
            {/* Available Weight */}
            <View style={styles.statCell}>
              <View style={styles.statIconCircle}>
                <MaterialCommunityIcons name="weight-kilogram" size={22} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{trip.available_weight_kg} kg</Text>
              <Text style={styles.statSubLabel}>Available weight</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Price per kg */}
            <View style={styles.statCell}>
              <View style={[styles.statIconCircle, styles.statIconCircleBlue]}>
                <MaterialCommunityIcons name="currency-inr" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, styles.statValueBlue]}>₹{trip.price_per_kg}/kg</Text>
              <Text style={styles.statSubLabel}>Rate per kg</Text>
            </View>
          </View>

          {/* Pricing tiers */}
          <View style={styles.pricingTable}>
            <Text style={styles.pricingTableTitle}>Estimated Pricing</Text>

            <View style={styles.pricingRow}>
              <View style={styles.pricingPackageInfo}>
                <MaterialCommunityIcons name="package-variant" size={16} color={colors.textSecondary} />
                <Text style={styles.pricingPackageLabel}>Small (2 kg)</Text>
              </View>
              <Text style={styles.pricingAmount}>₹{trip.price_per_kg * 2}</Text>
            </View>

            <View style={styles.pricingRowDivider} />

            <View style={styles.pricingRow}>
              <View style={styles.pricingPackageInfo}>
                <MaterialCommunityIcons name="package-variant-closed" size={16} color={colors.textSecondary} />
                <Text style={styles.pricingPackageLabel}>Medium (5 kg)</Text>
              </View>
              <Text style={styles.pricingAmount}>₹{trip.price_per_kg * 5}</Text>
            </View>

            <View style={styles.pricingRowDivider} />

            <View style={styles.pricingRow}>
              <View style={styles.pricingPackageInfo}>
                <MaterialCommunityIcons name="package-variant-closed-plus" size={16} color={colors.textSecondary} />
                <Text style={styles.pricingPackageLabel}>Large (10 kg)</Text>
              </View>
              <Text style={styles.pricingAmount}>₹{trip.price_per_kg * 10}</Text>
            </View>
          </View>
        </View>

        {/* How it works Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>How It Works</Text>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="lock-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              Unlock contact details after match confirmation (₹99 credit)
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.successLight }]}>
              <MaterialCommunityIcons name="handshake-outline" size={16} color={colors.success} />
            </View>
            <Text style={styles.infoText}>
              Delivery fee is negotiated directly with the traveler
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.warningLight }]}>
              <MaterialCommunityIcons name="camera-outline" size={16} color={colors.warning} />
            </View>
            <Text style={styles.infoText}>
              Package inspection photos required before handover
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <Surface style={styles.bottomBar} elevation={8}>
        <Button
          mode="contained"
          onPress={handleRequestToCarry}
          icon="package-variant-plus"
          contentStyle={styles.ctaButtonContent}
          labelStyle={styles.ctaButtonLabel}
          style={styles.ctaButton}
        >
          Request to Carry Package
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

  // ── Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    padding: spacing.xs,
  },

  // ── ScrollView
  scrollView: {
    flex: 1,
  },

  // ── Hero / Route Section
  heroSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cityBlock: {
    flex: 1,
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  cityCode: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  countryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeArc: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  airplaneCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },

  // ── Generic card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },

  // ── Traveler card
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    backgroundColor: colors.primary,
  },
  travelerMeta: {
    flex: 1,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  travelerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trustScore: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  trustLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  idVerifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.full,
    gap: 4,
  },
  idVerifiedChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },

  // ── Stats row (capacity / price)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIconCircleBlue: {
    backgroundColor: colors.primaryLight,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  statValueBlue: {
    color: colors.primary,
  },
  statSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // ── Pricing table
  pricingTable: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  pricingTableTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  pricingPackageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pricingPackageLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pricingAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  pricingRowDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // ── Info items (how it works)
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingTop: 6,
  },

  // ── Bottom CTA
  bottomSpacing: {
    height: 100,
  },
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
