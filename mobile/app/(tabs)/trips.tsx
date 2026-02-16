/**
 * Trips Screen - Browse and Manage Trips
 * Placeholder for Milestone 3
 */
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TripsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Trips
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Trip browsing will be added in Milestone 3
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 16,
    color: '#0066cc',
  },
  placeholder: {
    color: '#999999',
    textAlign: 'center',
  },
});
