/**
 * Request Detail Screen
 * Shows request info and matching travelers, allows accepting a match
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  Surface,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestsStore, Match } from '@/stores/requestsStore';

function MatchCard({
  match,
  onAccept,
}: {
  match: Match;
  onAccept: (match: Match) => void;
}) {
  const initials = match.traveler.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card style={styles.matchCard}>
      <Card.Content>
        {/* Traveler */}
        <View style={styles.travelerRow}>
          {match.traveler.avatar_url ? (
            <Avatar.Image size={48} source={{ uri: match.traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={48} label={initials} />
          )}
          <View style={styles.travelerInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.travelerName}>
                {match.traveler.full_name}
              </Text>
              {match.traveler.verified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#0066cc" />
              )}
            </View>
            <View style={styles.scoreRow}>
              <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
              <Text variant="bodySmall" style={styles.scoreText}>
                Trust Score: {match.traveler.trust_score}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Flight */}
        <View style={styles.flightRow}>
          <MaterialCommunityIcons name="airplane" size={16} color="#666666" />
          <Text variant="bodySmall" style={styles.flightText}>
            {match.trip.airline} {match.trip.flight_number} ·{' '}
            {new Date(match.trip.departure_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => onAccept(match)}
          icon="handshake"
          compact
          style={styles.acceptButton}
        >
          Accept & Chat
        </Button>
      </Card.Actions>
    </Card>
  );
}

export default function RequestDetailScreen() {
  const router = useRouter();
  const { selectedRequest, setSelectedMatch, unlockContact, getMatchesForRequest } =
    useRequestsStore();
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  if (!selectedRequest) {
    router.back();
    return null;
  }

  const request = selectedRequest;
  const matches = getMatchesForRequest(request.id);

  const handleAcceptMatch = (match: Match) => {
    setPendingMatch(match);
    setUnlockModalVisible(true);
  };

  const handleConfirmUnlock = async () => {
    if (!pendingMatch) return;
    setUnlocking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In production: deduct 1 credit via Stripe + update match in Supabase
      unlockContact(pendingMatch.id);
      setSelectedMatch({ ...pendingMatch, contact_unlocked: true, status: 'accepted' });

      setUnlockModalVisible(false);
      setUnlocking(false);
      router.push('/chat');
    } catch {
      setUnlocking(false);
      Alert.alert('Error', 'Failed to unlock contact. Please try again.');
    }
  };

  return (
    <Portal.Host>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Request Summary */}
          <Surface style={styles.header} elevation={2}>
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text variant="headlineSmall" style={styles.cityText}>
                  {request.origin_city}
                </Text>
                <Text variant="bodySmall" style={styles.countryText}>
                  {request.origin_country}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={28} color="#00A86B" />
              <View style={styles.cityBlock}>
                <Text variant="headlineSmall" style={styles.cityText}>
                  {request.destination_city}
                </Text>
                <Text variant="bodySmall" style={styles.countryText}>
                  {request.destination_country}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Chip icon="weight-kilogram" compact style={styles.metaChip}>
                {request.package_weight_kg} kg
              </Chip>
              <Chip icon="calendar" compact style={styles.metaChip}>
                By {new Date(request.needed_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Chip>
              <Chip
                compact
                style={[
                  styles.metaChip,
                  { backgroundColor: request.status === 'open' ? '#E8F5E9' : '#E3F2FD' },
                ]}
                textStyle={{ color: request.status === 'open' ? '#2E7D32' : '#1976D2' }}
              >
                {request.status === 'open' ? 'Open' : 'Matched'}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.descriptionText}>
              {request.package_description}
            </Text>
          </Surface>

          {/* Matching Travelers */}
          <View style={styles.matchesSection}>
            <Text variant="titleMedium" style={styles.matchesTitle}>
              {matches.length} Matching Traveler{matches.length !== 1 ? 's' : ''}
            </Text>

            {matches.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-search" size={48} color="#cccccc" />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No matches yet. We'll notify you when a traveler matches your route.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} onAccept={handleAcceptMatch} />
              ))
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Unlock Contact Modal */}
        <Portal>
          <Modal
            visible={unlockModalVisible}
            onDismiss={() => setUnlockModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <MaterialCommunityIcons name="lock-open-variant" size={48} color="#00A86B" style={styles.modalIcon} />
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Unlock Contact
            </Text>
            <Text variant="bodyMedium" style={styles.modalText}>
              Use 1 credit (₹99) to unlock{' '}
              <Text style={styles.bold}>{pendingMatch?.traveler.full_name}</Text>'s contact
              details and start chatting.
            </Text>
            <Text variant="bodySmall" style={styles.modalNote}>
              Your credits balance: 5 credits
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setUnlockModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmUnlock}
                loading={unlocking}
                disabled={unlocking}
                style={styles.modalButton}
              >
                Unlock (1 credit)
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: '#ffffff', marginBottom: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cityBlock: { flex: 1 },
  cityText: { fontWeight: 'bold', color: '#333333' },
  countryText: { color: '#666666', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metaChip: { backgroundColor: '#f5f5f5' },
  descriptionText: { color: '#555555', lineHeight: 20 },
  matchesSection: { padding: 16 },
  matchesTitle: { fontWeight: 'bold', color: '#333333', marginBottom: 12 },
  matchCard: { backgroundColor: '#ffffff', marginBottom: 12 },
  travelerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  travelerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  travelerName: { fontWeight: 'bold', color: '#333333' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { color: '#666666' },
  divider: { marginBottom: 12 },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flightText: { color: '#666666' },
  acceptButton: { backgroundColor: '#00A86B' },
  emptyCard: { backgroundColor: '#ffffff' },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 12, paddingHorizontal: 16 },
  bottomSpacing: { height: 40 },
  modal: { backgroundColor: '#ffffff', margin: 24, borderRadius: 12, padding: 24 },
  modalIcon: { textAlign: 'center', marginBottom: 12 },
  modalTitle: { fontWeight: 'bold', color: '#333333', textAlign: 'center', marginBottom: 8 },
  modalText: { color: '#555555', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  modalNote: { color: '#00A86B', textAlign: 'center', marginBottom: 20 },
  bold: { fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1 },
});
