/**
 * Profile Screen - User Profile and Settings
 * Display user info, stats, and account actions
 */
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, Card, Button, Divider, List, Surface } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const router = useRouter();

  const userName = profile?.full_name ?? user?.user_metadata?.full_name ?? 'User';
  const userEmail = profile?.email ?? user?.email ?? '';
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Avatar.Image size={80} source={{ uri: avatarUrl }} />
          ) : (
            <Avatar.Text size={80} label={userInitials} />
          )}
        </View>
        <Text variant="headlineSmall" style={styles.name}>
          {userName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {userEmail}
        </Text>

        {/* Verification Status */}
        <View style={styles.verificationContainer}>
          <MaterialCommunityIcons
            name={profile?.id_verified ? 'shield-check' : 'shield-check-outline'}
            size={20}
            color={profile?.id_verified ? '#16a34a' : '#666666'}
          />
          <Text variant="bodySmall" style={styles.verificationText}>
            {profile?.id_verified ? 'ID Verified' : 'Not Verified'}
          </Text>
        </View>
      </Surface>

      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Your Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={32} color="#FFB800" />
              <Text variant="headlineSmall" style={styles.statValue}>{profile?.trust_score ?? 0}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Trust Score</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="airplane" size={32} color="#0066cc" />
              <Text variant="headlineSmall" style={styles.statValue}>{profile?.total_deliveries ?? 0}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Trips Posted</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="package-variant-closed" size={32} color="#00A86B" />
              <Text variant="headlineSmall" style={styles.statValue}>{profile?.successful_deliveries ?? 0}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star-circle" size={32} color="#9C27B0" />
              <Text variant="headlineSmall" style={styles.statValue}>{profile?.average_rating != null ? profile.average_rating.toFixed(1) : '0.0'}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Account Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Account Settings
          </Text>
        </Card.Content>
        <List.Item
          title="Edit Profile"
          description="Update your personal information"
          left={props => <List.Icon {...props} icon="account-edit" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/edit-profile')}
        />
        <Divider />
        <List.Item
          title="Verification"
          description="Verify your identity"
          left={props => <List.Icon {...props} icon="shield-check" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to verification (Milestone 5)
            Alert.alert('Coming Soon', 'Identity verification will be available soon');
          }}
        />
        <Divider />
        <List.Item
          title="Payment Methods"
          description="Manage credits and payment options"
          left={props => <List.Icon {...props} icon="credit-card" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to payment settings
            Alert.alert('Coming Soon', 'Payment settings will be available soon');
          }}
        />
        <Divider />
        <List.Item
          title="Notifications"
          description="Manage notification preferences"
          left={props => <List.Icon {...props} icon="bell" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to notification settings
            Alert.alert('Coming Soon', 'Notification settings will be available soon');
          }}
        />
      </Card>

      {/* App Info */}
      <Card style={styles.infoCard}>
        <List.Item
          title="Help & Support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            Alert.alert('Help & Support', 'Support features will be available soon');
          }}
        />
        <Divider />
        <List.Item
          title="Terms & Privacy"
          left={props => <List.Icon {...props} icon="file-document" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            Alert.alert('Terms & Privacy', 'Legal documents will be available soon');
          }}
        />
        <Divider />
        <List.Item
          title="About Travorier"
          description="Version 1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            Alert.alert('Travorier', 'Version 1.0.0\nCrowdsourced logistics platform');
          }}
        />
      </Card>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          icon="logout"
          textColor={colors.error}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, alignItems: 'center', backgroundColor: colors.surface, marginBottom: spacing.md },
  avatarContainer: { marginBottom: spacing.md },
  name: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  email: { color: colors.textSecondary, marginBottom: spacing.md },
  verificationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  verificationText: { marginLeft: 4, color: colors.textSecondary },
  statsCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface },
  cardTitle: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: '48%', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.md, marginBottom: spacing.md },
  statValue: { fontWeight: 'bold', color: colors.textPrimary, marginTop: spacing.sm },
  statLabel: { color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  settingsCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface },
  infoCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface },
  signOutContainer: { paddingHorizontal: spacing.md, paddingBottom: 32 },
  signOutButton: { borderColor: colors.error },
});
