/**
 * TripCard Component
 * Displays a trip in a card format with route, date, traveler info, and pricing
 */
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    <Card style={styles.card} mode="elevated" onPress={() => onPress(trip)}>
      {/* Boosted Badge */}
      {trip.is_boosted && (
        <View style={styles.boostedBadge}>
          <MaterialCommunityIcons name="star" size={12} color="#FFB800" />
          <Text variant="labelSmall" style={styles.boostedText}>
            Featured
          </Text>
        </View>
      )}

      <Card.Content>
        {/* Route Section */}
        <View style={styles.routeContainer}>
          <View style={styles.cityContainer}>
            <Text variant="titleMedium" style={styles.cityText}>
              {trip.origin_city}
            </Text>
            <Text variant="bodySmall" style={styles.countryText}>
              {trip.origin_country}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons name="airplane" size={24} color="#0066cc" />
            <MaterialCommunityIcons name="arrow-right" size={20} color="#666666" />
          </View>

          <View style={styles.cityContainer}>
            <Text variant="titleMedium" style={styles.cityText}>
              {trip.destination_city}
            </Text>
            <Text variant="bodySmall" style={styles.countryText}>
              {trip.destination_country}
            </Text>
          </View>
        </View>

        {/* Flight Info */}
        <View style={styles.flightInfo}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#666666" />
            <Text variant="bodySmall" style={styles.infoText}>
              {formattedDate}
            </Text>
          </View>
          {trip.flight_number && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="airplane-clock" size={16} color="#666666" />
              <Text variant="bodySmall" style={styles.infoText}>
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

        {/* Traveler Info */}
        <View style={styles.travelerContainer}>
          {trip.traveler.avatar_url ? (
            <Avatar.Image size={40} source={{ uri: trip.traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={40} label={userInitials} />
          )}
          <View style={styles.travelerInfo}>
            <View style={styles.travelerNameRow}>
              <Text variant="bodyMedium" style={styles.travelerName}>
                {trip.traveler.full_name}
              </Text>
              {trip.traveler.verified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#0066cc" />
              )}
            </View>
            <View style={styles.trustScoreContainer}>
              <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
              <Text variant="bodySmall" style={styles.trustScore}>
                Trust Score: {trip.traveler.trust_score}
              </Text>
            </View>
          </View>
        </View>

        {/* Capacity and Pricing */}
        <View style={styles.bottomSection}>
          <View style={styles.capacityContainer}>
            <MaterialCommunityIcons name="weight-kilogram" size={20} color="#00A86B" />
            <Text variant="bodyMedium" style={styles.capacityText}>
              {trip.available_weight_kg} kg available
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text variant="titleMedium" style={styles.priceText}>
              ₹{trip.price_per_kg}
            </Text>
            <Text variant="bodySmall" style={styles.perKgText}>
              per kg
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#ffffff',
  },
  boostedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  boostedText: {
    marginLeft: 4,
    color: '#FFB800',
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4,
  },
  cityContainer: {
    flex: 1,
  },
  cityText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  countryText: {
    color: '#666666',
    marginTop: 2,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  flightInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    color: '#666666',
  },
  verifiedChip: {
    height: 24,
    backgroundColor: '#E8F5E9',
  },
  verifiedChipText: {
    fontSize: 11,
    color: '#2E7D32',
  },
  travelerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  travelerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  travelerName: {
    fontWeight: '500',
    color: '#333333',
  },
  trustScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trustScore: {
    marginLeft: 4,
    color: '#666666',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    marginLeft: 6,
    color: '#00A86B',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  perKgText: {
    marginLeft: 4,
    color: '#666666',
  },
});
