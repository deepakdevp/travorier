/**
 * Trip Detail Screen
 * Shows comprehensive trip information and allows requesting to carry
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { useState } from 'react';

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
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleRequestToCarry = () => {
    router.push('/request-to-carry');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Route Header */}
        <Surface style={styles.header} elevation={2}>
          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text variant="headlineSmall" style={styles.cityText}>
                {trip.origin_city}
              </Text>
              <Text variant="bodySmall" style={styles.countryText}>
                {trip.origin_country}
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <MaterialCommunityIcons name="airplane" size={32} color="#0066cc" />
              <MaterialCommunityIcons name="arrow-right" size={24} color="#666666" />
            </View>

            <View style={styles.cityContainer}>
              <Text variant="headlineSmall" style={styles.cityText}>
                {trip.destination_city}
              </Text>
              <Text variant="bodySmall" style={styles.countryText}>
                {trip.destination_country}
              </Text>
            </View>
          </View>

          {trip.is_boosted && (
            <Chip icon="star" style={styles.featuredChip} textStyle={styles.featuredChipText}>
              Featured Trip
            </Chip>
          )}
        </Surface>

        {/* Flight Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Flight Details
            </Text>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color="#666666" />
              <View style={styles.detailContent}>
                <Text variant="labelSmall" style={styles.detailLabel}>
                  Departure Date
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {formattedDate}
                </Text>
                {trip.departure_time && (
                  <Text variant="bodySmall" style={styles.detailTime}>
                    {trip.departure_time}
                  </Text>
                )}
              </View>
            </View>

            {trip.flight_number && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="airplane" size={20} color="#666666" />
                <View style={styles.detailContent}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    Flight
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {trip.airline} {trip.flight_number}
                  </Text>
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
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Traveler Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Traveler Information
            </Text>

            <View style={styles.travelerContainer}>
              {trip.traveler.avatar_url ? (
                <Avatar.Image size={64} source={{ uri: trip.traveler.avatar_url }} />
              ) : (
                <Avatar.Text size={64} label={userInitials} />
              )}

              <View style={styles.travelerInfo}>
                <View style={styles.travelerNameRow}>
                  <Text variant="titleMedium" style={styles.travelerName}>
                    {trip.traveler.full_name}
                  </Text>
                  {trip.traveler.verified && (
                    <MaterialCommunityIcons name="check-decagram" size={20} color="#0066cc" />
                  )}
                </View>

                <View style={styles.trustScoreRow}>
                  <MaterialCommunityIcons name="star" size={18} color="#FFB800" />
                  <Text variant="bodyMedium" style={styles.trustScoreValue}>
                    Trust Score: {trip.traveler.trust_score}
                  </Text>
                </View>

                {trip.traveler.verified && (
                  <Chip
                    icon="shield-check"
                    compact
                    style={styles.idVerifiedChip}
                    textStyle={styles.idVerifiedChipText}
                  >
                    ID Verified
                  </Chip>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Capacity & Pricing */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Capacity & Pricing
            </Text>

            <View style={styles.capacityRow}>
              <View style={styles.capacityItem}>
                <MaterialCommunityIcons name="weight-kilogram" size={24} color="#00A86B" />
                <Text variant="labelSmall" style={styles.capacityLabel}>
                  Available Weight
                </Text>
                <Text variant="headlineSmall" style={styles.capacityValue}>
                  {trip.available_weight_kg} kg
                </Text>
              </View>

              <Divider style={styles.verticalDivider} />

              <View style={styles.capacityItem}>
                <MaterialCommunityIcons name="currency-inr" size={24} color="#0066cc" />
                <Text variant="labelSmall" style={styles.capacityLabel}>
                  Price per kg
                </Text>
                <Text variant="headlineSmall" style={styles.priceValue}>
                  ₹{trip.price_per_kg}
                </Text>
              </View>
            </View>

            {/* Pricing Examples */}
            <View style={styles.pricingExamples}>
              <Text variant="labelSmall" style={styles.examplesLabel}>
                Pricing Examples:
              </Text>
              <View style={styles.exampleRow}>
                <Text variant="bodySmall" style={styles.exampleText}>
                  2 kg package
                </Text>
                <Text variant="bodyMedium" style={styles.examplePrice}>
                  ₹{trip.price_per_kg * 2}
                </Text>
              </View>
              <View style={styles.exampleRow}>
                <Text variant="bodySmall" style={styles.exampleText}>
                  5 kg package
                </Text>
                <Text variant="bodyMedium" style={styles.examplePrice}>
                  ₹{trip.price_per_kg * 5}
                </Text>
              </View>
              <View style={styles.exampleRow}>
                <Text variant="bodySmall" style={styles.exampleText}>
                  10 kg package
                </Text>
                <Text variant="bodyMedium" style={styles.examplePrice}>
                  ₹{trip.price_per_kg * 10}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Important Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Important Information
            </Text>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons name="information" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.noteText}>
                Contact will be unlocked after match confirmation (₹99 credit)
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons name="handshake" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.noteText}>
                Delivery fee is negotiated directly with the traveler
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialCommunityIcons name="package-variant-closed-check" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.noteText}>
                Package inspection required before handover
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleRequestToCarry}
          icon="package-variant-plus"
          contentStyle={styles.buttonContent}
          style={styles.requestButton}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    marginHorizontal: 12,
  },
  featuredChip: {
    backgroundColor: '#FFF9E6',
    alignSelf: 'flex-start',
  },
  featuredChipText: {
    color: '#FFB800',
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    color: '#999999',
    marginBottom: 4,
  },
  detailValue: {
    color: '#333333',
    fontWeight: '500',
  },
  detailTime: {
    color: '#666666',
    marginTop: 2,
  },
  verifiedChip: {
    backgroundColor: '#E8F5E9',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verifiedChipText: {
    fontSize: 11,
    color: '#2E7D32',
  },
  travelerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  travelerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  travelerName: {
    fontWeight: 'bold',
    color: '#333333',
  },
  trustScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustScoreValue: {
    marginLeft: 6,
    color: '#666666',
  },
  idVerifiedChip: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  idVerifiedChipText: {
    fontSize: 11,
    color: '#1976D2',
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
  },
  capacityLabel: {
    color: '#999999',
    marginTop: 8,
    marginBottom: 4,
  },
  capacityValue: {
    fontWeight: 'bold',
    color: '#00A86B',
  },
  priceValue: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
  },
  pricingExamples: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  examplesLabel: {
    color: '#666666',
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  exampleText: {
    color: '#666666',
  },
  examplePrice: {
    fontWeight: '500',
    color: '#333333',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    marginLeft: 12,
    color: '#666666',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  requestButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});