/**
 * Requests Screen - Browse and Manage Package Requests
 * Placeholder for Milestone 4
 */
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function RequestsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Requests
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Package requests will be added in Milestone 4
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
