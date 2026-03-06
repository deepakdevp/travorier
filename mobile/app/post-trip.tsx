/**
 * Post Trip Screen
 * Form for travelers to post a new trip
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore } from '@/stores/tripsStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function PostTripScreen() {
  const router = useRouter();
  const { createTrip } = useTripsStore();

  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = parseFloat(weightKg) || 0;
  const price = parseFloat(pricePerKg) || 0;

  const isValid = () =>
    originCity.trim().length > 0 &&
    originCountry.trim().length > 0 &&
    destinationCity.trim().length > 0 &&
    destinationCountry.trim().length > 0 &&
    departureDate.trim().length > 0 &&
    weight > 0 &&
    price >= 0;

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }
    Alert.alert(
      'Post Trip',
      `Post trip from ${originCity} to ${destinationCity} on ${departureDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            setLoading(true);
            try {
              await createTrip({
                origin_city: originCity.trim(),
                origin_country: originCountry.trim(),
                destination_city: destinationCity.trim(),
                destination_country: destinationCountry.trim(),
                departure_date: departureDate.trim(),
                departure_time: departureTime.trim() || undefined,
                flight_number: flightNumber.trim() || undefined,
                airline: airline.trim() || undefined,
                available_weight_kg: weight,
                price_per_kg: price,
                notes: notes.trim() || undefined,
              });
              Alert.alert('Posted!', 'Your trip has been posted successfully.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/trips') },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to post trip. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Route</Text>
            <View style={styles.row}>
              <TextInput
                label="Origin City *"
                value={originCity}
                onChangeText={setOriginCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
              />
              <TextInput
                label="Country *"
                value={originCountry}
                onChangeText={setOriginCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
              />
            </View>
            <View style={styles.arrowRow}>
              <MaterialCommunityIcons name="arrow-down" size={24} color={colors.primary} />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Destination City *"
                value={destinationCity}
                onChangeText={setDestinationCity}
                mode="outlined"
                style={[styles.input, styles.flex2]}
              />
              <TextInput
                label="Country *"
                value={destinationCountry}
                onChangeText={setDestinationCountry}
                mode="outlined"
                style={[styles.input, styles.flex1]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Flight Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Flight Details</Text>
            <View style={styles.row}>
              <TextInput
                label="Departure Date * (YYYY-MM-DD)"
                value={departureDate}
                onChangeText={setDepartureDate}
                mode="outlined"
                style={[styles.input, styles.flex2]}
                left={<TextInput.Icon icon="calendar" />}
                placeholder="2026-04-15"
              />
              <TextInput
                label="Time (HH:MM)"
                value={departureTime}
                onChangeText={setDepartureTime}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="14:30"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Flight Number"
                value={flightNumber}
                onChangeText={setFlightNumber}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="AI191"
              />
              <TextInput
                label="Airline"
                value={airline}
                onChangeText={setAirline}
                mode="outlined"
                style={[styles.input, styles.flex1]}
                placeholder="Air India"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Capacity & Pricing Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Capacity & Pricing</Text>
            <View style={styles.row}>
              <TextInput
                label="Weight * (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                mode="outlined"
                style={[styles.input, styles.flex1]}
                left={<TextInput.Icon icon="weight-kilogram" />}
              />
              <TextInput
                label="Price/kg * (₹)"
                value={pricePerKg}
                onChangeText={setPricePerKg}
                keyboardType="decimal-pad"
                mode="outlined"
                style={[styles.input, styles.flex1]}
                left={<TextInput.Icon icon="currency-inr" />}
              />
            </View>
            <HelperText type="info" visible={weight > 0 && price >= 0}>
              Potential earnings: ₹{(weight * price).toFixed(0)} if fully booked
            </HelperText>
          </Card.Content>
        </Card>

        {/* Notes Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Notes</Text>
            <TextInput
              label="Additional notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Any special instructions or preferences..."
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid() || loading}
          icon="airplane-takeoff"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
        >
          Post Trip
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  card: { marginHorizontal: spacing.md, marginVertical: spacing.sm, backgroundColor: colors.surface },
  sectionTitle: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: { backgroundColor: colors.surface, marginBottom: 4 },
  arrowRow: { alignItems: 'center', marginVertical: 4 },
  bottomBar: { backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { borderRadius: radius.md, backgroundColor: colors.primary },
  buttonContent: { paddingVertical: spacing.sm },
});
