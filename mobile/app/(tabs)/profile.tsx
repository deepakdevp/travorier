/**
 * Profile Screen - User Profile and Settings
 * Design: Stitch "User Account Profile" screen
 * projects/7580322135798196968/screens/316b74388bb042aa997649d5c2423ea2
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useCreditStore } from '@/stores/creditStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// MenuItem sub-component
// ---------------------------------------------------------------------------
interface MenuItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  subtitleColor?: string;
  onPress: () => void;
  showDivider?: boolean;
}

function MenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  subtitleColor,
  onPress,
  showDivider = false,
}: MenuItemProps) {
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        {/* Leading icon circle */}
        <View style={[styles.menuIconCircle, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>

        {/* Label + optional subtitle */}
        <View style={styles.menuLabelGroup}>
          <Text style={styles.menuLabel}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.menuSubtitle, subtitleColor ? { color: subtitleColor } : null]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Trailing chevron */}
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
      </TouchableOpacity>

      {showDivider && <View style={styles.menuDivider} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  const { balance, fetchBalance } = useCreditStore();

  useEffect(() => {
    fetchBalance();
  }, []);

  const [avatarError, setAvatarError] = React.useState(false);

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
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
    ]);
  };

  const showAvatar = !!avatarUrl && !avatarError;

  return (
    <View style={styles.screen}>
      {/* ── Sticky Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Coming Soon', 'Settings will be available soon')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Section ── */}
        <View style={styles.profileSection}>
          {/* Avatar with verified badge */}
          <View style={styles.avatarWrapper}>
            {showAvatar ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={52} color="#9ca3af" />
                {userInitials ? (
                  <Text style={styles.avatarInitialsText}>{userInitials}</Text>
                ) : null}
              </View>
            )}

            {/* Green check badge */}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check" size={13} color={colors.white} />
            </View>
          </View>

          {/* Name */}
          <Text style={styles.profileName}>{userName}</Text>

          {/* Email */}
          <Text style={styles.profileEmail}>{userEmail}</Text>

          {/* Verified Traveler pill */}
          <View style={styles.verifiedPill}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#15803d" />
            <Text style={styles.verifiedPillText}>Verified Traveler</Text>
          </View>
        </View>

        {/* ── Stats Card ── */}
        <View style={styles.statsCard}>
          {/* Trust Score */}
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, { color: colors.primary }]}>0</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Trips */}
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Delivered */}
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>0kg</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* ── Credits Card ── */}
        <TouchableOpacity
          style={styles.creditsCard}
          onPress={() => router.push('/buy-credits')}
          activeOpacity={0.8}
        >
          <View style={styles.creditsLeft}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={colors.primary} />
            <View>
              <Text style={styles.creditsLabel}>Credits</Text>
              <Text style={styles.creditsBalance}>{balance} available</Text>
            </View>
          </View>
          <View style={styles.buyCreditsBtn}>
            <Text style={styles.buyCreditsText}>Buy More</Text>
          </View>
        </TouchableOpacity>

        {/* ── Menu Section 1 ── */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="account-outline"
            iconColor="#2563eb"
            iconBg="#dbeafe"
            label="Edit Profile"
            onPress={() =>
              Alert.alert('Coming Soon', 'Profile editing will be available in Milestone 5')
            }
            showDivider
          />
          <MenuItem
            icon="check-decagram"
            iconColor="#9333ea"
            iconBg="#f3e8ff"
            label="Identity Verification"
            subtitle="Completed"
            subtitleColor={colors.success}
            onPress={() =>
              Alert.alert('Coming Soon', 'Identity verification will be available soon')
            }
            showDivider
          />
          <MenuItem
            icon="credit-card-outline"
            iconColor="#ea580c"
            iconBg="#fff7ed"
            label="Payment Methods"
            onPress={() => Alert.alert('Coming Soon', 'Payment settings will be available soon')}
          />
        </View>

        {/* ── Menu Section 2 ── */}
        <View style={[styles.menuCard, styles.menuCardSpaced]}>
          <MenuItem
            icon="bell-outline"
            iconColor="#4b5563"
            iconBg="#f1f5f9"
            label="Notifications"
            onPress={() =>
              Alert.alert('Coming Soon', 'Notification settings will be available soon')
            }
            showDivider
          />
          <MenuItem
            icon="help-circle-outline"
            iconColor="#4b5563"
            iconBg="#f1f5f9"
            label="Help & Support"
            onPress={() => Alert.alert('Help & Support', 'Support features will be available soon')}
          />
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Version ── */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // ── ScrollView ────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + spacing.md,
  },

  // ── Profile Section ───────────────────────────────────────────────────────
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.white,
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarPlaceholder: {
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitialsText: {
    position: 'absolute',
    fontSize: 32,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.md - 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#dcfce7',
  },
  verifiedPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },

  // ── Stats Card ────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl + spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e5e7eb',
  },

  // ── Menu Card ─────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    // Shadow
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuCardSpaced: {
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 4,
  },
  menuLabelGroup: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },

  // ── Sign Out ──────────────────────────────────────────────────────────────
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 4,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },

  // ── Credits Card ──────────────────────────────────────────────────────────
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  creditsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creditsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  creditsBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buyCreditsBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  buyCreditsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface,
  },

  // ── Version ───────────────────────────────────────────────────────────────
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
});
