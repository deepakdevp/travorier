/**
 * Trips Screen - Browse and Manage Trips
 * Placeholder for Milestone 3
 */
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TripsScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialCommunityIcons name="airplane-search" size={80} color="#0066cc" />
          <Text variant="headlineMedium" style={styles.title}>
            Browse Trips
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Find travelers heading to your destination and request them to carry your packages
          </Text>
          <Text variant="bodySmall" style={styles.placeholder}>
            Trip browsing and search will be available in Milestone 3
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            disabled
            icon="airplane-search"
          >
            Browse Available Trips
          </Button>
        </Card.Actions>
      </Card>

      {/* Feature Preview */}
      <Card style={styles.featureCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.featureTitle}>
            Coming Soon:
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="filter-variant" size={24} color="#0066cc" />
              <Text variant="bodyMedium" style={styles.featureText}>
                Filter by route, date, and capacity
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#0066cc" />
              <Text variant="bodyMedium" style={styles.featureText}>
                View trip details and traveler profiles
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="message-text" size={24} color="#0066cc" />
              <Text variant="bodyMedium" style={styles.featureText}>
                Request to carry and chat with travelers
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  placeholder: {
    textAlign: 'center',
    color: '#999999',
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
  },
  featureTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
    color: '#666666',
  },
});
