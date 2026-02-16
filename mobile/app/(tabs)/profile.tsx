/**
 * Profile Screen - User Profile and Settings
 * Placeholder for Milestone 5
 */
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Profile
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Profile management will be added in Milestone 5
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
