/**
 * Requests Screen - Browse and Manage Package Requests
 * Placeholder for Milestone 4
 */
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function RequestsScreen() {
  const [view, setView] = useState('browse');

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <SegmentedButtons
        value={view}
        onValueChange={setView}
        buttons={[
          {
            value: 'browse',
            label: 'Browse',
            icon: 'magnify',
          },
          {
            value: 'my-requests',
            label: 'My Requests',
            icon: 'package-variant',
          },
        ]}
        style={styles.segmented}
      />

      {view === 'browse' ? (
        <>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              <MaterialCommunityIcons name="package-variant-closed-plus" size={80} color="#00A86B" />
              <Text variant="headlineMedium" style={styles.title}>
                Post a Request
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                Need something delivered? Post your package request and connect with travelers
              </Text>
              <Text variant="bodySmall" style={styles.placeholder}>
                Request posting will be available in Milestone 4
              </Text>
            </Card.Content>
            <Card.Actions style={styles.actions}>
              <Button
                mode="contained"
                disabled
                icon="package-variant-plus"
              >
                Post New Request
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
                  <MaterialCommunityIcons name="form-textbox" size={24} color="#00A86B" />
                  <Text variant="bodyMedium" style={styles.featureText}>
                    Create detailed package requests
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="earth" size={24} color="#00A86B" />
                  <Text variant="bodyMedium" style={styles.featureText}>
                    Specify route and delivery timeline
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="account-multiple" size={24} color="#00A86B" />
                  <Text variant="bodyMedium" style={styles.featureText}>
                    Match with verified travelers
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      ) : (
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#666666" />
            <Text variant="headlineMedium" style={styles.title}>
              Your Requests
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              View and manage all your package delivery requests
            </Text>
            <Text variant="bodySmall" style={styles.emptyText}>
              No requests yet. Post your first request to get started!
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  segmented: {
    marginBottom: 16,
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
    color: '#00A86B',
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
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 8,
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
