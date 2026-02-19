/**
 * Post Request Screen
 * Form for senders to post a package delivery request
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
import { useRequestsStore } from '@/stores/requestsStore';

export default function PostRequestScreen() {
  const router = useRouter();
  const { addRequest } = useRequestsStore();

  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = parseFloat(packageWeight) || 0;

  const isValid = () => {
    return (
      originCity.trim().length > 0 &&
      originCountry.trim().length > 0 &&
      destinationCity.trim().length > 0 &&
      destinationCountry.trim().length > 0 &&
      neededByDate.trim().length > 0 &&
      weight > 0 &&
      packageDescription.trim().length >= 10
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Post Request',
      `Post request for ${packageWeight}kg package from ${originCity} to ${destinationCity}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            setLoading(true);
            try {
              await new Promise((resolve) => setTimeout(resolve, 800));

              // In production:
              // const { data, error } = await supabase
              //   .from('requests')
              //   .insert({ sender_id: userId, origin_city, ... });

              addRequest({
                origin_city: originCity.trim(),
                origin_country: originCountry.trim(),
                destination_city: destinationCity.trim(),
                destination_country: destinationCountry.trim(),
                needed_by_date: neededByDate.trim(),
                package_weight_kg: weight,
                package_description: packageDescription.trim(),
                package_value: packageValue ? parseFloat(packageValue) : undefined,
                special_instructions: specialInstructions.trim() || undefined,
              });

              setLoading(false);
              Alert.alert('Posted!', 'Your request has been posted. Matching travelers will be notified.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/requests') },
              ]);
            } catch {
              setLoading(false);
              Alert.alert('Error', 'Failed to post request. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Route Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Route
            </Text>

            <View style={styles.rowInputs}>
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
              <MaterialCommunityIcons name="arrow-down" size={24} color="#00A86B" />
            </View>

            <View style={styles.rowInputs}>
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

        {/* Package Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Package Details
            </Text>

            <TextInput
              label="Needed by Date * (YYYY-MM-DD)"
              value={neededByDate}
              onChangeText={setNeededByDate}
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              placeholder="e.g. 2026-03-20"
            />

            <TextInput
              label="Package Weight (kg) *"
              value={packageWeight}
              onChangeText={setPackageWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="weight-kilogram" />}
              style={styles.input}
            />
            <HelperText type="info" visible={weight > 0}>
              {weight} kg requested
            </HelperText>

            <TextInput
              label="Package Description *"
              value={packageDescription}
              onChangeText={setPackageDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              left={<TextInput.Icon icon="package-variant" />}
              style={styles.input}
              placeholder="e.g. Books, clothes, electronics (no prohibited items)"
              error={packageDescription.trim().length > 0 && packageDescription.trim().length < 10}
            />
            <HelperText
              type={packageDescription.trim().length > 0 && packageDescription.trim().length < 10 ? 'error' : 'info'}
              visible={true}
            >
              {packageDescription.trim().length < 10
                ? `Minimum 10 characters (${packageDescription.trim().length}/10)`
                : 'Be specific — traveler needs to know what they are carrying'}
            </HelperText>

            <TextInput
              label="Estimated Value (₹) (Optional)"
              value={packageValue}
              onChangeText={setPackageValue}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Icon icon="currency-inr" />}
              style={styles.input}
            />
            <HelperText type="info" visible={true}>
              Helps traveler understand insurance needs
            </HelperText>

            <TextInput
              label="Special Instructions (Optional)"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="message-text" />}
              style={styles.input}
              placeholder="Handle with care, fragile, etc."
            />
          </Card.Content>
        </Card>

        {/* Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="information" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Matching travelers will be notified about your request
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="lock-open" size={20} color="#0066cc" />
              <Text variant="bodySmall" style={styles.infoText}>
                Unlock traveler contact for ₹99 (1 credit) after match
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid() || loading}
          icon="send"
          contentStyle={styles.buttonContent}
          style={styles.submitButton}
        >
          Post Request
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  card: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#ffffff' },
  sectionTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  input: { backgroundColor: '#ffffff', marginBottom: 4 },
  arrowRow: { alignItems: 'center', marginVertical: 4 },
  infoCard: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#E3F2FD' },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoText: { flex: 1, marginLeft: 12, color: '#666666', lineHeight: 18 },
  bottomSpacing: { height: 100 },
  bottomBar: { backgroundColor: '#ffffff', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  submitButton: { borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
});
