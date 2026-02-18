/**
 * Match Confirmation Screen
 * Success screen after submitting a request to carry
 */
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import LottieView from 'lottie-react-native';

export default function MatchConfirmationScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();

  const handleUnlockContact = () => {
    // In production, this would navigate to payment/credit flow
    // For now, just show alert
    alert('Payment/credit feature coming in next milestone');
  };

  const handleViewMatches = () => {
    router.replace('/(tabs)');
  };

  const handleBrowseMore = () => {
    router.replace('/(tabs)/trips');
  };

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.animationContainer}>
        <MaterialCommunityIcons name="check-circle" size={120} color="#00A86B" />
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Request Sent Successfully!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your package delivery request has been sent to the traveler
        </Text>
      </View>

      {/* Trip Summary */}
      {selectedTrip && (
        <Card style={styles.tripCard}>
          <Card.Content>
            <View style={styles.routeRow}>
              <Text variant="titleMedium" style={styles.cityText}>
                {selectedTrip.origin_city}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#666666" />
              <Text variant="titleMedium" style={styles.cityText}>
                {selectedTrip.destination_city}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.travelerText}>
              Traveler: {selectedTrip.traveler.full_name}
            </Text>
            <Text variant="bodySmall" style={styles.dateText}>
              Departure: {new Date(selectedTrip.departure_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Next Steps */}
      <Card style={styles.stepsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.stepsTitle}>
            What Happens Next?
          </Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#0066cc" />
            </View>
            <View style={styles.stepContent}>
              <Text variant="titleSmall" style={styles.stepTitle}>
                Traveler Reviews Request
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                The traveler will review your request and confirm availability
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="bell-ring" size={24} color="#0066cc" />
            </View>
            <View style={styles.stepContent}>
              <Text variant="titleSmall" style={styles.stepTitle}>
                Get Notified
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                You'll receive a notification when the traveler responds
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="lock-open" size={24} color="#0066cc" />
            </View>
            <View style={styles.stepContent}>
              <Text variant="titleSmall" style={styles.stepTitle}>
                Unlock Contact
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                Use 1 credit (₹99) to unlock contact details and start chatting
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="handshake" size={24} color="#0066cc" />
            </View>
            <View style={styles.stepContent}>
              <Text variant="titleSmall" style={styles.stepTitle}>
                Coordinate Delivery
              </Text>
              <Text variant="bodySmall" style={styles.stepText}>
                Discuss handover details, finalize delivery fee, and arrange meeting
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={handleBrowseMore}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          Browse More Trips
        </Button>

        <Button
          mode="contained"
          onPress={handleViewMatches}
          icon="home"
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          Go to Homepage
        </Button>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information" size={16} color="#666666" />
        <Text variant="bodySmall" style={styles.infoText}>
          You can view all your matches and messages in the Profile tab
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  animationContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#00A86B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  tripCard: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cityText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  travelerText: {
    color: '#666666',
    marginBottom: 4,
  },
  dateText: {
    color: '#999999',
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  stepsTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#333333',
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    color: '#666666',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 8,
  },
  secondaryButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  infoText: {
    color: '#666666',
    textAlign: 'center',
    flex: 1,
  },
});