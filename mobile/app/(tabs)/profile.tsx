/**
 * Profile Screen - User Profile and Settings
 * Design: Stitch "User Account Profile" screen
 * projects/7580322135798196968/screens/316b74388bb042aa997649d5c2423ea2
 */
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';

// Stat icon tint colors (from Stitch design)
const STAT_COLORS = {
  trustScore: { icon: '#2563eb', bg: '#eff6ff' },    // blue-600 / blue-50
  trips:      { icon: '#9333ea', bg: '#faf5ff' },    // purple-600 / purple-50
  deliveries: { icon: '#ea580c', bg: '#fff7ed' },    // orange-600 / orange-50
  rating:     { icon: '#ca8a04', bg: '#fefce8' },    // yellow-600 / yellow-50
};

// Menu item icon tint: slate
const MENU_ICON_BG   = '#f1f5f9';   // slate-100
const MENU_ICON_COLOR = '#475569';  // slate-600

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  const userName    = user?.user_metadata?.full_name || 'User';
  const userEmail   = user?.email || '';
  const avatarUrl   = user?.user_metadata?.avatar_url;
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* ── Profile Header ── */}
      <View style={styles.profileHeader}>
        {/* Avatar with verified badge */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Avatar.Image size={96} source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Avatar.Text size={96} label={userInitials} style={styles.avatarImage} />
          )}
          {/* Online / verified indicator */}
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check" size={12} color={colors.white} />
          </View>
        </View>

        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>

        {/* Verified pill */}
        <View style={styles.verifiedPill}>
          <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} />
          <Text style={styles.verifiedPillText}>Verified Traveler</Text>
        </View>
      </View>

      {/* ── Performance Stats ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Performance Stats</Text>

        <View style={styles.statsGrid}>
          {/* Trust Score */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: STAT_COLORS.trustScore.bg }]}>
              <MaterialCommunityIcons name="shield-check" size={22} color={STAT_COLORS.trustScore.icon} />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>

          {/* Trips Posted */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: STAT_COLORS.trips.bg }]}>
              <MaterialCommunityIcons name="airplane-takeoff" size={22} color={STAT_COLORS.trips.icon} />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Trips Posted</Text>
          </View>

          {/* Deliveries */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: STAT_COLORS.deliveries.bg }]}>
              <MaterialCommunityIcons name="truck-delivery" size={22} color={STAT_COLORS.deliveries.icon} />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          {/* Rating */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: STAT_COLORS.rating.bg }]}>
              <MaterialCommunityIcons name="star" size={22} color={STAT_COLORS.rating.icon} />
            </View>
            <Text style={styles.statValue}>0.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* ── Account Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account Settings</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="account-outline"
            label="Edit Personal Details"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in Milestone 5')}
          />
          <Divider style={styles.divider} />
          <MenuItem
            icon="card-account-details-outline"
            label="Identity Verification"
            subtitle="Not Verified"
            onPress={() => Alert.alert('Coming Soon', 'Identity verification will be available soon')}
          />
          <Divider style={styles.divider} />
          <MenuItem
            icon="credit-card-outline"
            label="Payment & Payouts"
            onPress={() => Alert.alert('Coming Soon', 'Payment settings will be available soon')}
          />
          <Divider style={styles.divider} />
          <MenuItem
            icon="bell-outline"
            label="Notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
          />
        </View>
      </View>

      {/* ── App Info ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App Info</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            trailingIcon="open-in-new"
            onPress={() => Alert.alert('Help & Support', 'Support features will be available soon')}
          />
          <Divider style={styles.divider} />
          <MenuItem
            icon="file-document-outline"
            label="Terms & Privacy Policy"
            onPress={() => Alert.alert('Terms & Privacy', 'Legal documents will be available soon')}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.75}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// MenuItem sub-component
// ---------------------------------------------------------------------------
interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  trailingIcon?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, subtitle, trailingIcon = 'chevron-right', onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      {/* Leading icon */}
      <View style={styles.menuIconBox}>
        <MaterialCommunityIcons name={icon as any} size={20} color={MENU_ICON_COLOR} />
      </View>

      {/* Label (+ optional subtitle) */}
      <View style={styles.menuLabelGroup}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>

      {/* Trailing chevron */}
      <MaterialCommunityIcons name={trailingIcon as any} size={20} color={colors.textDisabled} />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },

  // ── Profile Header ──────────────────────────────────────────────────────
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarImage: {
    borderWidth: 3,
    borderColor: colors.white,
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 4,
    textAlign: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // ── Section ─────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // ── Stats Grid ───────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // ── Menu Card ────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: MENU_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 4,
  },
  menuLabelGroup: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },

  // ── Sign Out ─────────────────────────────────────────────────────────────
  signOutButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#fef2f2',   // red-50 equivalent
    borderWidth: 1,
    borderColor: '#fee2e2',       // red-100 equivalent
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textDisabled,
    marginTop: spacing.lg,
  },
});
