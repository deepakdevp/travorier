/**
 * TripCard Component
 *
 * Displays a trip in a card format with route, date, traveler info, and pricing.
 * Design tokens sourced from @/lib/theme — no hardcoded colors.
 */
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import type { Trip } from '@/stores/tripsStore';

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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(trip)}
      activeOpacity={0.85}
    >
      {/* Boosted Badge */}
      {trip.is_boosted && (
        <View style={styles.boostedBadge}>
          <MaterialCommunityIcons name="star" size={12} color={colors.warning} />
          <Text style={styles.boostedText}>Featured</Text>
        </View>
      )}

      {/* Route Section */}
      <View style={styles.routeContainer}>
        <View style={styles.cityContainer}>
          <Text style={styles.cityText}>{trip.origin_city}</Text>
          <Text style={styles.countryText}>{trip.origin_country}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="airplane" size={20} color={colors.primary} />
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textSecondary} />
        </View>

        <View style={[styles.cityContainer, styles.cityContainerRight]}>
          <Text style={[styles.cityText, styles.cityTextRight]}>{trip.destination_city}</Text>
          <Text style={[styles.countryText, styles.countryTextRight]}>{trip.destination_country}</Text>
        </View>
      </View>

      {/* Flight Info */}
      <View style={styles.flightInfo}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formattedDate}</Text>
        </View>
        {trip.flight_number && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="airplane-clock" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {trip.airline} {trip.flight_number}
            </Text>
          </View>
        )}
        {trip.pnr_verified && (
          <Chip
            icon="shield-check"
            compact
            style={styles.verifiedChip}
            textStyle={styles.verifiedChipText}
          >
            PNR Verified
          </Chip>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Traveler Info */}
      <View style={styles.travelerContainer}>
        {trip.traveler.avatar_url ? (
          <Avatar.Image size={36} source={{ uri: trip.traveler.avatar_url }} />
        ) : (
          <Avatar.Text size={36} label={userInitials} />
        )}
        <View style={styles.travelerInfo}>
          <View style={styles.travelerNameRow}>
            <Text style={styles.travelerName}>{trip.traveler.full_name}</Text>
            {trip.traveler.verified && (
              <MaterialCommunityIcons name="check-decagram" size={15} color={colors.primary} />
            )}
          </View>
          <View style={styles.trustScoreContainer}>
            <MaterialCommunityIcons name="star" size={12} color={colors.warning} />
            <Text style={styles.trustScore}>Trust Score: {trip.traveler.trust_score}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Capacity and Pricing */}
      <View style={styles.bottomSection}>
        <View style={styles.capacityContainer}>
          <MaterialCommunityIcons name="weight-kilogram" size={18} color={colors.success} />
          <Text style={styles.capacityText}>{trip.available_weight_kg} kg available</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{trip.price_per_kg}</Text>
          <Text style={styles.perKgText}>/ kg</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ---- Boosted badge ----
  boostedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    zIndex: 1,
  },
  boostedText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },

  // ---- Route ----
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  cityContainer: {
    flex: 1,
  },
  cityContainerRight: {
    alignItems: 'flex-end',
  },
  cityText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityTextRight: {
    textAlign: 'right',
  },
  countryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '400',
  },
  countryTextRight: {
    textAlign: 'right',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    gap: 2,
  },

  // ---- Flight info ----
  flightInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  verifiedChip: {
    height: 22,
    backgroundColor: colors.successLight,
  },
  verifiedChipText: {
    fontSize: 10,
    color: colors.success,
  },

  // ---- Divider ----
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.md,
  },

  // ---- Traveler ----
  travelerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  travelerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  travelerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  trustScore: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // ---- Bottom: capacity + price ----
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  perKgText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
});
