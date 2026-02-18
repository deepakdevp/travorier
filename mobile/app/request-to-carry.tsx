/**
 * Request to Carry Screen
 * Form for senders to request travelers to carry their package
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';

export default function RequestToCarryScreen() {
  const router = useRouter();
  const { selectedTrip } = useTripsStore();

  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [senderNotes, setSenderNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedTrip) {
    router.back();
    return null;
  }

  const trip = selectedTrip;
  const weight = parseFloat(packageWeight) || 0;
  const estimatedCost = weight * trip.price_per_kg;

  const hasErrors = () => {
    if (!packageWeight || weight <= 0) return true;
    if (weight > trip.available_weight_kg) return true;
    if (!packageDescription.trim()) return true;
    if (packageDescription.trim().length < 10) return true;
    return false;
  };

  const handleSubmitRequest = async () => {
    if (hasErrors()) {
      Alert.alert('Invalid Input', 'Please fill in all required fields correctly.');
      return;
    }

    Alert.alert(
      'Confirm Request',
      `Submit request to carry ${packageWeight}kg package from ${trip.origin_city} to ${trip.destination_city}?\n\nEstimated cost: ₹${estimatedCost}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async () => {
            setLoading(true);
            try {
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // In production, this would be:
              // const { data, error } = await supabase
              //   .from('matches')
              //   .insert({
              //     trip_id: trip.id,
              //     sender_id: currentUserId,
              //     agreed_weight_kg: weight,
              //     agreed_price: estimatedCost,
              //     status: 'initiated',
              //   });

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Trip Summary */}
        <Surface style={styles.tripSummary} elevation={2}>
          <View style={styles.routeRow}>
            <Text variant="titleMedium" style={styles.cityText}>
              {trip.origin_city}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#666666" />
            <Text variant="titleMedium" style={styles.cityText}>
              {trip.destination_city}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.travelerText}>
            Traveler: {trip.traveler.full_name}
          </Text>
          <Text variant="bodySmall" style={styles.dateText}>
            {new Date(trip.departure_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </Surface>

        {/* Request Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Package Details
            </Text>

            {/* Package Weight */}
            <TextInput
              label="Package Weight (kg) *"
              value={packageWeight}
              onChangeText={setPackageWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="weight-kilogram" />}
              style={styles.input}
              error={weight > trip.available_weight_kg}
            />
            <HelperText
              type={weight > trip.available_weight_kg ? 'error' : 'info'}
              visible={packageWeight.length > 0}
            >
              {weight > trip.available_weight_kg
                ? `Exceeds available capacity (${trip.available_weight_kg} kg)`
                : `Available: ${trip.available_weight_kg} kg`}
            </HelperText>

            {/* Package Description */}
            <TextInput
              label="Package Description *"
              value={packageDescription}
              onChangeText={setPackageDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              left={<TextInput.Icon icon="package-variant" />}
              style={styles.input}
              placeholder="e.g., Books, clothes, electronics (no prohibited items)"
              error={packageDescription.trim().length > 0 && packageDescription.trim().length < 10}
            />
            <HelperText
              type={
                packageDescription.trim().length > 0 && packageDescription.trim().length < 10
                  ? 'error'
                  : 'info'
              }
              visible={true}
            >
              {packageDescription.trim().length < 10
                ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
                : 'Be specific about contents'}
            </HelperText>

            {/* Package Value */}
            <TextInput
              label="Package Value (₹) (Optional)"
              value={packageValue}
              onChangeText={setPackageValue}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="currency-inr" />}
              style={styles.input}
              placeholder="Approximate value of contents"
            />
            <HelperText type="info" visible={true}>
              Helps traveler understand insurance needs
            </HelperText>

            {/* Additional Notes */}
            <TextInput
              label="Additional Notes (Optional)"
              value={senderNotes}
              onChangeText={setSenderNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="message-text" />}
              style={styles.input}
              placeholder="Special instructions, delivery preferences, etc."
            />
          </Card.Content>
        </Card>

        {/* Estimated Cost */}
        {weight > 0 && weight <= trip.available_weight_kg && (
          <Card style={styles.costCard}>
            <Card.Content>
              <View style={styles.costRow}>
                <Text variant="titleMedium" style={styles.costLabel}>
                  Estimated Delivery Cost:
                </Text>
                <Text variant="headlineSmall" style={styles.costValue}>
                  ₹{estimatedCost}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.costNote}>
                {packageWeight} kg × ₹{trip.price_per_kg}/kg
              </Text>
              <Text variant="bodySmall" style={styles.costDisclaimer}>
                Final price negotiated with traveler after match
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Important Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>
              Next Steps:
            </Text>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="numeric-1-circle" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Request sent to traveler for review
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="numeric-2-circle" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Unlock contact (₹99 credit) after confirmation
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="numeric-3-circle" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Coordinate handover and delivery details
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
          onPress={handleSubmitRequest}
          loading={loading}
          disabled={hasErrors() || loading}
          icon="send"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
        >
          Submit Request
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
  tripSummary: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
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
    color: '#666666',
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
  input: {
    backgroundColor: '#ffffff',
  },
  costCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#E3F2FD',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    color: '#333333',
  },
  costValue: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  costNote: {
    color: '#666666',
    marginBottom: 4,
  },
  costDisclaimer: {
    color: '#999999',
    fontStyle: 'italic',
    fontSize: 11,
  },
  infoCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#ffffff',
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#666666',
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
  submitButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});