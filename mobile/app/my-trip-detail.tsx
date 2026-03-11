/**
 * My Trip Detail Screen
 * Shows trip info and incoming match requests (traveler match inbox)
 */
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTripsStore, TravelerMatch } from '@/stores/tripsStore';
import { useRequestsStore, Match } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

function MatchRequestCard({
  match,
  onAccept,
  onDecline,
  onHandover,
  onReview,
}: {
  match: TravelerMatch;
  onAccept: (m: TravelerMatch) => void;
  onDecline: (m: TravelerMatch) => void;
  onHandover: (m: TravelerMatch) => void;
  onReview: () => void;
}) {
  const initials = match.sender.full_name
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card style={styles.matchCard}>
      <Card.Content>
        <View style={styles.senderRow}>
          {match.sender.avatar_url ? (
            <Avatar.Image size={44} source={{ uri: match.sender.avatar_url }} />
          ) : (
            <Avatar.Text size={44} label={initials} style={{ backgroundColor: colors.primarySubtle }} labelStyle={{ color: colors.primary }} />
          )}
          <View style={styles.senderInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={styles.senderName}>{match.sender.full_name}</Text>
              {match.sender.id_verified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
              <MaterialCommunityIcons name="star" size={11} color={colors.star} />
              <Text style={styles.senderRating}>
                {match.sender.average_rating > 0 ? match.sender.average_rating.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.trustRow}>
              <MaterialCommunityIcons name="star" size={13} color={colors.star} />
              <Text variant="bodySmall" style={styles.trustText}>Trust: {match.sender.trust_score}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {match.package_description && (
          <Text variant="bodySmall" style={styles.packageDesc} numberOfLines={2}>
            {match.package_description}
          </Text>
        )}
        <View style={styles.chipsRow}>
          <Chip compact icon="weight-kilogram" style={styles.chip}>
            {match.agreed_weight_kg} kg
          </Chip>
          {match.needed_by_date && (
            <Chip compact icon="calendar" style={styles.chip}>
              By {new Date(match.needed_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Chip>
          )}
          {match.agreed_price != null && (
            <Chip compact style={[styles.chip, styles.priceChip]}>
              ₹{match.agreed_price}
            </Chip>
          )}
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="outlined"
          onPress={() => onDecline(match)}
          textColor={colors.error}
          style={[styles.actionButton, { borderColor: colors.error }]}
          compact
        >
          Decline
        </Button>
        <Button
          mode="contained"
          onPress={() => onAccept(match)}
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          compact
        >
          Accept &amp; Chat
        </Button>
      </Card.Actions>
      {(match.status === 'agreed' || match.status === 'handover_scheduled') && (
        <TouchableOpacity
          style={styles.handoverBtn}
          onPress={() => onHandover(match)}
        >
          <MaterialCommunityIcons name="qrcode" size={16} color={colors.surface} />
          <Text style={styles.handoverBtnText}>Handover Package</Text>
        </TouchableOpacity>
      )}
      {match.status === 'delivered' && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={onReview}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="star-outline" size={16} color={colors.surface} />
          <Text style={styles.reviewBtnText}>Leave a Review</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export default function MyTripDetailScreen() {
  const router = useRouter();
  const { selectedMyTrip, tripMatches, tripMatchesLoading, fetchTripMatches, respondToMatch } = useTripsStore();
  const { setSelectedMatch } = useRequestsStore();

  useEffect(() => {
    if (!selectedMyTrip) { router.back(); return; }
    fetchTripMatches(selectedMyTrip.id);
  }, [selectedMyTrip?.id]);

  if (!selectedMyTrip) return null;
  const trip = selectedMyTrip;

  const handleAccept = async (match: TravelerMatch) => {
    Alert.alert(
      'Accept Request',
      `Accept ${match.sender.full_name}'s request to carry ${match.agreed_weight_kg} kg?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Chat',
          onPress: async () => {
            try {
              await respondToMatch(match.id, 'agreed');
              setSelectedMatch({
                id: match.id,
                request_id: match.request_id,
                trip_id: match.trip_id,
                traveler: {
                  full_name: trip.traveler.full_name,
                  avatar_url: trip.traveler.avatar_url,
                  trust_score: trip.traveler.trust_score,
                  average_rating: trip.traveler.average_rating,
                  verified: trip.traveler.verified,
                },
                trip: {
                  origin_city: trip.origin_city,
                  destination_city: trip.destination_city,
                  departure_date: trip.departure_date,
                  airline: trip.airline,
                  flight_number: trip.flight_number,
                },
                agreed_weight_kg: match.agreed_weight_kg,
                status: 'agreed',
                contact_unlocked: match.contact_unlocked,
              });
              router.push('/chat');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to accept. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleHandover = (match: TravelerMatch) => {
    setSelectedMatch({
      id: match.id,
      request_id: match.request_id,
      trip_id: match.trip_id,
      traveler: {
        full_name: trip.traveler.full_name,
        avatar_url: trip.traveler.avatar_url,
        trust_score: trip.traveler.trust_score,
        average_rating: trip.traveler.average_rating,
        verified: trip.traveler.verified,
      },
      trip: {
        origin_city: trip.origin_city,
        destination_city: trip.destination_city,
        departure_date: trip.departure_date,
        airline: trip.airline,
        flight_number: trip.flight_number,
      },
      agreed_weight_kg: match.agreed_weight_kg,
      status: match.status as Match['status'],
      contact_unlocked: match.contact_unlocked,
    });
    router.push('/handover');
  };

  const handleDecline = async (match: TravelerMatch) => {
    Alert.alert(
      'Decline Request',
      `Decline ${match.sender.full_name}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await respondToMatch(match.id, 'cancelled');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to decline. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Trip Summary */}
      <Surface style={styles.tripSummary} elevation={1}>
        <View style={styles.routeRow}>
          <View style={styles.cityBlock}>
            <Text variant="headlineSmall" style={styles.cityText}>{trip.origin_city}</Text>
            <Text variant="bodySmall" style={styles.countryText}>{trip.origin_country}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={28} color={colors.primary} />
          <View style={[styles.cityBlock, styles.alignEnd]}>
            <Text variant="headlineSmall" style={styles.cityText}>{trip.destination_city}</Text>
            <Text variant="bodySmall" style={styles.countryText}>{trip.destination_country}</Text>
          </View>
        </View>
        <View style={styles.chipsRow}>
          <Chip compact icon="calendar" style={styles.chip}>
            {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Chip>
          <Chip compact icon="weight-kilogram" style={styles.chip}>
            {trip.available_weight_kg} kg
          </Chip>
          <Chip compact style={[styles.chip, styles.priceChip]}>
            ₹{trip.price_per_kg}/kg
          </Chip>
        </View>
        {trip.flight_number && (
          <View style={styles.flightRow}>
            <MaterialCommunityIcons name="airplane" size={14} color={colors.primary} />
            <Text variant="bodySmall" style={styles.flightText}>
              {trip.airline ? `${trip.airline} · ` : ''}{trip.flight_number}
            </Text>
          </View>
        )}
      </Surface>

      {/* Incoming Requests */}
      <View style={styles.requestsSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {tripMatchesLoading ? 'Loading requests...' : `Incoming Requests (${tripMatches.length})`}
        </Text>

        {!tripMatchesLoading && tripMatches.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="account-search" size={48} color={colors.border} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No requests yet. Share your trip to get matched!
              </Text>
            </Card.Content>
          </Card>
        )}

        {tripMatches.map((match) => (
          <MatchRequestCard
            key={match.id}
            match={match}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onHandover={handleHandover}
            onReview={() => {
              router.push({
                pathname: '/write-review',
                params: {
                  matchId: match.id,
                  revieweeName: match.sender?.full_name ?? 'Sender',
                },
              } as any);
            }}
          />
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tripSummary: { padding: spacing.lg, backgroundColor: colors.surface, marginBottom: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  cityBlock: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  cityText: { fontWeight: 'bold', color: colors.textPrimary },
  countryText: { color: colors.textSecondary, marginTop: 2 },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { backgroundColor: colors.background },
  priceChip: { backgroundColor: colors.primarySubtle },
  flightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flightText: { color: colors.primary },
  requestsSection: { padding: spacing.md },
  sectionTitle: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  matchCard: { backgroundColor: colors.surface, marginBottom: 12 },
  senderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  senderInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  senderName: { fontWeight: 'bold', color: colors.textPrimary },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: colors.textSecondary },
  senderRating: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  divider: { marginBottom: spacing.sm },
  packageDesc: { color: colors.textSecondary, marginBottom: spacing.sm },
  cardActions: { justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  actionButton: { flex: 1 },
  handoverBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  handoverBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.star,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  emptyCard: { backgroundColor: colors.surface },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', color: colors.textDisabled, marginTop: spacing.md },
});
