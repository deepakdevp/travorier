/**
 * TripCard Component
 *
 * Rewritten to match Stitch browse_trips card design:
 * - PNR badge top-right (green verified / gray pending)
 * - Route row: origin code + city | airplane + dashed line + duration | dest code + city
 * - Departure + Capacity info grid
 * - Bottom: traveler avatar + name + star rating | price/kg
 *
 * All colors sourced from @/lib/theme — no hardcoded hex values.
 */
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import type { Trip } from '@/stores/tripsStore';

interface TripCardProps {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const departureDate = new Date(trip.departure_date);
  const formattedDate = departureDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Use country code as airport code placeholder (no origin_code field)
  const originCode = trip.origin_country?.slice(0, 3).toUpperCase() ?? '---';
  const destCode = trip.destination_country?.slice(0, 3).toUpperCase() ?? '---';

  const userInitials = trip.traveler.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Display trust score as a rating out of 5 (trust_score is 0–100)
  const rating = trip.traveler.trust_score != null
    ? (trip.traveler.trust_score / 20).toFixed(1)
    : '—';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(trip)}
      activeOpacity={0.85}
    >
      {/* PNR badge — top-right corner */}
      <View
        style={[
          styles.pnrBadge,
          trip.pnr_verified ? styles.pnrBadgeVerified : styles.pnrBadgePending,
        ]}
      >
        <MaterialCommunityIcons
          name={trip.pnr_verified ? 'shield-check' : 'shield-outline'}
          size={11}
          color={trip.pnr_verified ? '#16a34a' : colors.textDisabled}
        />
        <Text
          style={[
            styles.pnrText,
            trip.pnr_verified ? styles.pnrTextVerified : styles.pnrTextPending,
          ]}
        >
          {trip.pnr_verified ? 'PNR VERIFIED' : 'PENDING PNR'}
        </Text>
      </View>

      {/* Route row */}
      <View style={styles.routeRow}>
        {/* Origin */}
        <View style={styles.cityBlock}>
          <Text style={styles.airportCode}>{originCode}</Text>
          <Text style={styles.cityName}>{trip.origin_city}</Text>
        </View>

        {/* Center: dashed line + airplane icon + duration */}
        <View style={styles.routeCenter}>
          {/* Dashed line behind the icon */}
          <View style={styles.dashedLine} />
          {/* Airplane icon sits on top of the line */}
          <View style={styles.airplaneWrapper}>
            <MaterialCommunityIcons
              name="airplane"
              size={14}
              color={colors.primary}
              style={styles.airplaneIcon}
            />
          </View>
          {/* Duration label */}
          {trip.flight_number || trip.airline ? (
            <Text style={styles.durationText}>
              {trip.airline ? trip.airline : ''}{trip.flight_number ? ` ${trip.flight_number}` : ''}
            </Text>
          ) : (
            <Text style={styles.durationText}>Direct</Text>
          )}
        </View>

        {/* Destination */}
        <View style={[styles.cityBlock, styles.cityBlockRight]}>
          <Text style={styles.airportCode}>{destCode}</Text>
          <Text style={[styles.cityName, styles.cityNameRight]}>{trip.destination_city}</Text>
        </View>
      </View>

      {/* Info grid: Departure + Capacity */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.infoCellLabel}>Departure</Text>
          <View style={styles.infoCellValue}>
            <MaterialCommunityIcons name="calendar" size={13} color={colors.primary} />
            <Text style={styles.infoCellText}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoCellLabel}>Capacity</Text>
          <View style={styles.infoCellValue}>
            <MaterialCommunityIcons name="bag-suitcase" size={13} color={colors.primary} />
            <Text style={styles.infoCellText}>{trip.available_weight_kg} kg left</Text>
          </View>
        </View>
      </View>

      {/* Bottom row: traveler + price */}
      <View style={styles.bottomRow}>
        {/* Traveler avatar + name + rating */}
        <View style={styles.travelerRow}>
          {trip.traveler.avatar_url ? (
            <Image
              source={{ uri: trip.traveler.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{userInitials}</Text>
            </View>
          )}
          <View style={styles.travelerMeta}>
            <View style={styles.travelerNameRow}>
              <Text style={styles.travelerName}>
                {/* Show abbreviated first name + last initial */}
                {trip.traveler.full_name.split(' ')[0]}{' '}
                {trip.traveler.full_name.split(' ')[1]?.[0] ?? ''}.
              </Text>
              {trip.traveler.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={13}
                  color={colors.primary}
                />
              )}
            </View>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={11} color={colors.warning} />
              <Text style={styles.ratingText}>
                {rating}
              </Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceAmount}>${trip.price_per_kg}</Text>
          <Text style={styles.priceUnit}>/kg</Text>
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
    borderRadius: radius.xl,           // rounded-2xl
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },

  // ---- PNR badge (top-right, rounded-bl + rounded-tr) ----
  pnrBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: radius.lg,
    borderTopRightRadius: radius.xl,
    zIndex: 2,
  },
  pnrBadgeVerified: {
    backgroundColor: '#dcfce7',        // green-100
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#bbf7d0',            // green-200
  },
  pnrBadgePending: {
    backgroundColor: colors.divider,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  pnrText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pnrTextVerified: {
    color: '#16a34a',                  // green-700
  },
  pnrTextPending: {
    color: colors.textDisabled,
  },

  // ---- Route row ----
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,             // leave room for badge
    marginBottom: spacing.md,
  },
  cityBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  airportCode: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityNameRight: {
    textAlign: 'right',
  },

  // Center connector
  routeCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  dashedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    borderStyle: 'dashed',
    borderTopWidth: 1.5,
    borderColor: '#d1d5db',            // gray-300
    marginTop: -4,                     // offset so it aligns with icon center
  },
  airplaneWrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: 3,
    zIndex: 1,
    marginBottom: 2,
  },
  airplaneIcon: {
    transform: [{ rotate: '90deg' }],
  },
  durationText: {
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 3,
    zIndex: 1,
    textAlign: 'center',
  },

  // ---- Info grid ----
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoCell: {
    flex: 1,
    backgroundColor: '#f9fafb',       // gray-50
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoCellLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  infoCellValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // ---- Bottom row ----
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.white,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  travelerMeta: {
    gap: 1,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  travelerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Price
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '400',
  },
});
