/**
 * Requests Screen - View and manage package requests
 */
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Request } from '@/stores/requestsStore';

function RequestCard({ request, onPress }: { request: Request; onPress: (r: Request) => void }) {
  const statusColor = {
    open: '#00A86B',
    matched: '#0066cc',
    completed: '#666666',
  }[request.status];

  const statusLabel = {
    open: 'Open',
    matched: 'Matched',
    completed: 'Completed',
  }[request.status];

  return (
    <Card style={styles.card} onPress={() => onPress(request)}>
      <Card.Content>
        {/* Route */}
        <View style={styles.routeRow}>
          <Text variant="titleMedium" style={styles.cityText}>
            {request.origin_city}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#666666" />
          <Text variant="titleMedium" style={styles.cityText}>
            {request.destination_city}
          </Text>
          <View style={styles.spacer} />
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
            textStyle={[styles.statusChipText, { color: statusColor }]}
          >
            {statusLabel}
          </Chip>
        </View>

        {/* Details */}
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="weight-kilogram" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.detailText}>
            {request.package_weight_kg} kg
          </Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="calendar" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.detailText}>
            Needed by{' '}
            {new Date(request.needed_by_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
          {request.package_description}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests, setSelectedRequest } = useRequestsStore();

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestPress = (request: Request) => {
    setSelectedRequest(request);
    router.push('/request-detail');
  };

  const handlePostRequest = () => {
    router.push('/post-request');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={handleRequestPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={64} color="#cccccc" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No requests yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Post your first package request to find a traveler
              </Text>
            </View>
          ) : null
        }
      />

      <FAB
        icon="plus"
        label="Post Request"
        style={styles.fab}
        onPress={handlePostRequest}
        color="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cityText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  spacer: {
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  detailText: {
    color: '#666666',
  },
  dot: {
    color: '#cccccc',
    marginHorizontal: 2,
  },
  description: {
    color: '#888888',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666666',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#00A86B',
  },
});
