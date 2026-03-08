/**
 * Trip Detail Screen — revamped to match Stitch design
 * Shows comprehensive trip information and allows requesting to carry
 */
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Card, Chip, Divider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { colors, spacing, radius, statusColors } from '@/lib/theme';

export default function TripDetailScreen() {
  const router = useRouter();
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

  const handleBack = () => {
    router.back();
  };

  const trustScore = trip.traveler.trust_score ?? 0;
  const fullStars = Math.floor(trustScore / 20);
  const halfStar = (trustScore % 20) >= 10;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.headerBar} elevation={2}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Trip Details
        </Text>
        <View style={styles.headerRight}>
          {trip.is_boosted && (
            <Chip
              icon="star"
              compact
              style={styles.boostedBadge}
              textStyle={styles.boostedBadgeText}
            >
              Featured
            </Chip>
          )}
        </View>
      </Surface>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Traveler Hero Card */}
        <Surface style={styles.heroCard} elevation={1}>
          <View style={styles.heroContent}>
            {trip.traveler.avatar_url ? (
              <Avatar.Image size={72} source={{ uri: trip.traveler.avatar_url }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={72} label={userInitials} style={styles.avatar} />
            )}
            <View style={styles.travelerDetails}>
              <View style={styles.travelerNameRow}>
                <Text variant="titleLarge" style={styles.travelerName}>
                  {trip.traveler.full_name}
                </Text>
                {trip.traveler.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={20} color={colors.primary} />
                )}
              </View>

              {/* Star rating */}
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialCommunityIcons
                    key={i}
                    name={i < fullStars ? 'star' : i === fullStars && halfStar ? 'star-half-full' : 'star-outline'}
                    size={16}
                    color={colors.star}
                  />
                ))}
                <Text variant="bodySmall" style={styles.ratingText}>
                  {(trustScore / 20).toFixed(1)} Trust Score
                </Text>
              </View>

              {/* Verified badges */}
              <View style={styles.badgesRow}>
                {trip.traveler.verified && (
                  <Chip
                    icon="shield-check"
                    compact
                    style={styles.verifiedChip}
                    textStyle={styles.verifiedChipText}
                  >
                    ID Verified
                  </Chip>
                )}
                {trip.pnr_verified && (
                  <Chip
                    icon="check-circle"
                    compact
                    style={styles.pnrChip}
                    textStyle={styles.pnrChipText}
                  >
                    PNR Verified
                  </Chip>
                )}
              </View>
            </View>
          </View>
        </Surface>

        {/* Route Section */}
        <Surface style={styles.routeCard} elevation={1}>
          <View style={styles.routeRow}>
            <View style={styles.routeCity}>
              <Text variant="headlineMedium" style={styles.cityCode}>
                {trip.origin_city.slice(0, 3).toUpperCase()}
              </Text>
              <Text variant="bodyMedium" style={styles.cityName}>
                {trip.origin_city}
              </Text>
              <Text variant="bodySmall" style={styles.countryName}>
                {trip.origin_country}
              </Text>
            </View>

            <View style={styles.routeCenter}>
              <MaterialCommunityIcons name="airplane" size={28} color={colors.primary} />
              <View style={styles.routeLine} />
              {trip.departure_time && (
                <Text variant="bodySmall" style={styles.flightDuration}>
                  {trip.departure_time}
                </Text>
              )}
            </View>

            <View style={[styles.routeCity, styles.routeCityRight]}>
              <Text variant="headlineMedium" style={styles.cityCode}>
                {trip.destination_city.slice(0, 3).toUpperCase()}
              </Text>
              <Text variant="bodyMedium" style={styles.cityName}>
                {trip.destination_city}
              </Text>
              <Text variant="bodySmall" style={styles.countryName}>
                {trip.destination_country}
              </Text>
            </View>
          </View>

          <Divider style={styles.routeDivider} />

          {/* Date row */}
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text variant="bodyMedium" style={styles.dateText}>
              {formattedDate}
            </Text>
          </View>
        </Surface>

        {/* Flight Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Flight Details
            </Text>

            {trip.flight_number && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <MaterialCommunityIcons name="airplane-takeoff" size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Flight
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {trip.airline} · {trip.flight_number}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Departure
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {formattedDate}
                  {trip.departure_time ? `  ·  ${trip.departure_time}` : ''}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Capacity & Pricing Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Capacity & Pricing
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="weight-kilogram" size={24} color={colors.primary} />
                <Text variant="headlineSmall" style={styles.statValue}>
                  {trip.available_weight_kg} kg
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Available
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="currency-inr" size={24} color={colors.primary} />
                <Text variant="headlineSmall" style={styles.statValue}>
                  ₹{trip.price_per_kg}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  per kg
                </Text>
              </View>
            </View>

            {/* Pricing tiers */}
            <View style={styles.pricingTiers}>
              <Text variant="bodySmall" style={styles.tiersLabel}>
                Estimate
              </Text>
              <View style={styles.tiersRow}>
                {[
                  { label: 'Small', kg: 2 },
                  { label: 'Medium', kg: 5 },
                  { label: 'Large', kg: 10 },
                ].map((tier) => (
                  <View key={tier.label} style={styles.tierItem}>
                    <Text variant="bodySmall" style={styles.tierLabel}>
                      {tier.label}
                    </Text>
                    <Text variant="bodySmall" style={styles.tierKg}>
                      {tier.kg} kg
                    </Text>
                    <Text variant="bodyMedium" style={styles.tierPrice}>
                      ₹{trip.price_per_kg * tier.kg}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Traveler Notes */}
        {trip.notes ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Traveler Notes
              </Text>
              <View style={styles.notesContent}>
                <MaterialCommunityIcons name="chat-outline" size={18} color={colors.textSecondary} />
                <Text variant="bodyMedium" style={styles.notesText}>
                  {trip.notes}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {/* How it works */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              How It Works
            </Text>
            {[
              {
                icon: 'lock-open-outline',
                text: 'Contact unlocked after match confirmation (₹99 credit)',
              },
              {
                icon: 'handshake-outline',
                text: 'Delivery fee negotiated directly with the traveler',
              },
              {
                icon: 'package-variant-closed-check',
                text: 'Package inspection required before handover',
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.infoItem}>
                <View style={styles.infoIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text variant="bodySmall" style={styles.infoText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed CTA */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleRequestToCarry}
          icon="send"
          contentStyle={styles.ctaContent}
          style={styles.ctaButton}
          labelStyle={styles.ctaLabel}
        >
          Request to Carry Package
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

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boostedBadge: {
    backgroundColor: colors.primarySubtle,
  },
  boostedBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
  },

  // Hero traveler card
  heroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    marginRight: spacing.md,
  },
  travelerDetails: {
    flex: 1,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  travelerName: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.sm,
  },
  ratingText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  verifiedChip: {
    backgroundColor: statusColors.active.bg,
  },
  verifiedChipText: {
    color: statusColors.active.text,
    fontSize: 11,
  },
  pnrChip: {
    backgroundColor: statusColors.matched.bg,
  },
  pnrChipText: {
    color: statusColors.matched.text,
    fontSize: 11,
  },

  // Route section
  routeCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  routeCity: {
    flex: 1,
    alignItems: 'flex-start',
  },
  routeCityRight: {
    alignItems: 'flex-end',
  },
  cityCode: {
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  cityName: {
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 2,
  },
  countryName: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeCenter: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  routeLine: {
    width: 60,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  flightDuration: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  routeDivider: {
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    color: colors.textSecondary,
  },

  // Cards
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },

  // Flight detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },

  // Pricing tiers
  pricingTiers: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  tiersLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  tiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tierLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tierKg: {
    color: colors.textSecondary,
  },
  tierPrice: {
    fontWeight: '700',
    color: colors.primary,
  },

  // Notes
  notesContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  notesText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Info items
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  bottomSpacing: {
    height: 100,
  },

  // CTA
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaButton: {
    borderRadius: radius.lg,
  },
  ctaContent: {
    paddingVertical: spacing.sm,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
