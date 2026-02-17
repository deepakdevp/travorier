/**
 * Home Screen - Main Dashboard
 * Welcome dashboard with quick actions
 */
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Surface } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome back, {userName}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Connect travelers with package senders
        </Text>
      </Surface>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="star" size={32} color="#FFB800" />
            <Text variant="headlineSmall" style={styles.statValue}>0</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Trust Score</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="airplane" size={32} color="#0066cc" />
            <Text variant="headlineSmall" style={styles.statValue}>0</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Trips</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="package-variant" size={32} color="#00A86B" />
            <Text variant="headlineSmall" style={styles.statValue}>0</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Deliveries</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          What would you like to do?
        </Text>

        <Card style={styles.actionCard} mode="elevated">
          <Card.Content>
            <View style={styles.actionContent}>
              <MaterialCommunityIcons name="airplane-search" size={48} color="#0066cc" />
              <View style={styles.actionText}>
                <Text variant="titleMedium" style={styles.actionTitle}>
                  Browse Trips
                </Text>
                <Text variant="bodySmall" style={styles.actionDescription}>
                  Find travelers going to your destination
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => router.push('/trips')}
              icon="arrow-right"
              contentStyle={styles.buttonContent}
            >
              Browse
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.actionCard} mode="elevated">
          <Card.Content>
            <View style={styles.actionContent}>
              <MaterialCommunityIcons name="package-variant-plus" size={48} color="#00A86B" />
              <View style={styles.actionText}>
                <Text variant="titleMedium" style={styles.actionTitle}>
                  Post Request
                </Text>
                <Text variant="bodySmall" style={styles.actionDescription}>
                  Need something delivered? Post your request
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => router.push('/requests')}
              icon="arrow-right"
              contentStyle={styles.buttonContent}
            >
              Post
            </Button>
          </Card.Actions>
        </Card>
      </View>

      {/* Info Section */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            How Travorier Works
          </Text>
          <View style={styles.infoStep}>
            <MaterialCommunityIcons name="numeric-1-circle" size={24} color="#0066cc" />
            <Text variant="bodyMedium" style={styles.infoText}>
              Travelers post their upcoming trips
            </Text>
          </View>
          <View style={styles.infoStep}>
            <MaterialCommunityIcons name="numeric-2-circle" size={24} color="#0066cc" />
            <Text variant="bodyMedium" style={styles.infoText}>
              Senders request package delivery on matching routes
            </Text>
          </View>
          <View style={styles.infoStep}>
            <MaterialCommunityIcons name="numeric-3-circle" size={24} color="#0066cc" />
            <Text variant="bodyMedium" style={styles.infoText}>
              Connect, agree on terms, and complete delivery
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#0066cc',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 4,
  },
  statLabel: {
    color: '#666666',
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  actionCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#666666',
  },
  buttonContent: {
    flexDirection: 'row-reverse',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  infoTitle: {
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#666666',
  },
});
