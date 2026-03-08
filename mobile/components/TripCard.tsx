/**
 * TripCard Component
 * Displays a trip in a card format with route, date, traveler info, and pricing.
 * Follows the Travorier design system (docs/DESIGN.md).
 */
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Trip } from '@/stores/tripsStore';
import { colors, spacing, radius, statusColors } from '@/lib/theme';

interface TripCardProps {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const departureDate = new Date(trip.departure_date);
  const formattedDate = departureDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const userInitials = trip.traveler.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isVerified = trip.pnr_verified || trip.traveler.verified;

  return (
    <Card style={styles.card} mode="elevated" onPress={() => onPress(trip)}>
      <Card.Content style={styles.cardContent}>
        {/* ── Top Badge Row ── */}
        {(trip.is_boosted || isVerified) && (
          <View style={styles.badgeRow}>
            {trip.is_boosted && (
              <View style={styles.boostedBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.primary} />
                <Text variant="labelSmall" style={styles.boostedText}>
                  Boosted
                </Text>
              </View>
            )}
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={12}
                  color={statusColors.active.text}
                />
                <Text variant="labelSmall" style={styles.verifiedText}>
                  {trip.pnr_verified ? 'PNR Verified' : 'Verified'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Route Section ── */}
        <View style={styles.routeRow}>
          {/* Origin */}
          <View style={styles.cityBlock}>
            <Text variant="titleMedium" style={styles.cityName} numberOfLines={1}>
              {trip.origin_city}
            </Text>
            <Text variant="labelSmall" style={styles.countryName} numberOfLines={1}>
              {trip.origin_country}
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.routeArrow}>
            <View style={styles.arrowLine} />
            <MaterialCommunityIcons name="airplane" size={22} color={colors.primary} />
            <View style={styles.arrowLine} />
          </View>

          {/* Destination */}
          <View style={[styles.cityBlock, styles.cityBlockRight]}>
            <Text
              variant="titleMedium"
              style={[styles.cityName, styles.cityNameRight]}
              numberOfLines={1}
            >
              {trip.destination_city}
            </Text>
            <Text
              variant="labelSmall"
              style={[styles.countryName, styles.countryNameRight]}
              numberOfLines={1}
            >
              {trip.destination_country}
            </Text>
          </View>
        </View>

        {/* ── Flight Meta Row ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.metaText}>
              {formattedDate}
            </Text>
          </View>

          {trip.flight_number && trip.airline && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="airplane-clock"
                size={14}
                color={colors.textSecondary}
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {trip.airline} {trip.flight_number}
              </Text>
            </View>
          )}
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Traveler Row ── */}
        <View style={styles.travelerRow}>
          {trip.traveler.avatar_url ? (
            <Avatar.Image size={36} source={{ uri: trip.traveler.avatar_url }} />
          ) : (
            <Avatar.Text
              size={36}
              label={userInitials}
              style={styles.avatarFallback}
              labelStyle={styles.avatarLabel}
            />
          )}
          <View style={styles.travelerMeta}>
            <View style={styles.travelerNameRow}>
              <Text variant="bodyMedium" style={styles.travelerName} numberOfLines={1}>
                {trip.traveler.full_name}
              </Text>
              {trip.traveler.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={statusColors.active.text}
                />
              )}
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name={star <= Math.round(trip.traveler.trust_score / 20) ? 'star' : 'star-outline'}
                  size={12}
                  color={colors.star}
                />
              ))}
              <Text variant="labelSmall" style={styles.trustScore}>
                {trip.traveler.trust_score}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Bottom: Weight + Price ── */}
        <View style={styles.bottomRow}>
          <View style={styles.weightBadge}>
            <MaterialCommunityIcons
              name="weight-kilogram"
              size={14}
              color={colors.textSecondary}
            />
            <Text variant="bodySmall" style={styles.weightText}>
              {trip.available_weight_kg} kg available
            </Text>
          </View>

          <View style={styles.priceBadge}>
            <Text variant="titleSmall" style={styles.priceAmount}>
              ₹{trip.price_per_kg}
            </Text>
            <Text variant="labelSmall" style={styles.priceUnit}>
              /kg
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    // subtle shadow via elevation
  },
  cardContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // ── Badges ───────────────────────────────────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  boostedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    gap: 4,
  },
  boostedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: statusColors.active.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    gap: 4,
  },
  verifiedText: {
    color: statusColors.active.text,
    fontWeight: '600',
  },

  // ── Route ────────────────────────────────────────────────────────────────────
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cityBlock: {
    flex: 1,
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  cityName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cityNameRight: {
    textAlign: 'right',
  },
  countryName: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  countryNameRight: {
    textAlign: 'right',
  },
  routeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    minWidth: 8,
  },

  // ── Meta Row ─────────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textSecondary,
  },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // ── Traveler ─────────────────────────────────────────────────────────────────
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarFallback: {
    backgroundColor: colors.primarySubtle,
  },
  avatarLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  travelerMeta: {
    flex: 1,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  travelerName: {
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  trustScore: {
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // ── Bottom Row ───────────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
    gap: 2,
  },
  priceAmount: {
    color: colors.primary,
    fontWeight: '700',
  },
  priceUnit: {
    color: colors.primary,
    opacity: 0.8,
  },
});
