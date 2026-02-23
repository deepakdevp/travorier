/**
 * Home Screen - Main Dashboard
 *
 * Design based on Stitch screen:
 * projects/7580322135798196968/screens/user_dashboard
 */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const [avatarError, setAvatarError] = React.useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — white card with rounded bottom */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {/* Top row: avatar + name + bell */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              {avatarUrl && !avatarError ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <MaterialCommunityIcons name="account-outline" size={24} color="#9ca3af" />
              )}
            </View>
            <View>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#4b5563" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Trust Score */}
          <View style={styles.trustCard}>
            <View style={styles.trustValueRow}>
              <MaterialCommunityIcons name="shield-check" size={18} color={colors.primary} />
              <Text style={styles.trustValue}>4.9</Text>
            </View>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
        </View>
      </View>

      {/* Main actions grid */}
      <View style={styles.actionsGrid}>
        {/* Find a Traveler — orange card */}
        <TouchableOpacity
          style={styles.findCard}
          onPress={() => router.push('/trips')}
          activeOpacity={0.9}
        >
          <View style={styles.findCardDecorRight} />
          <View style={styles.findCardDecorLeft} />
          <View style={styles.actionIconBg}>
            <MaterialCommunityIcons name="map-search" size={24} color="#ffffff" />
          </View>
          <View style={styles.actionCardText}>
            <Text style={styles.findCardTitle}>Find a{'\n'}Traveler</Text>
            <Text style={styles.findCardSub}>Send packages fast</Text>
          </View>
        </TouchableOpacity>

        {/* Post a Trip — white card */}
        <TouchableOpacity
          style={styles.postCard}
          onPress={() => router.push('/requests')}
          activeOpacity={0.9}
        >
          <View style={styles.postIconBg}>
            <MaterialCommunityIcons name="airplane-takeoff" size={24} color="#2563eb" />
          </View>
          <View style={styles.actionCardText}>
            <Text style={styles.postCardTitle}>Post a Trip</Text>
            <Text style={styles.postCardSub}>Earn while you travel</Text>
          </View>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={22}
            color="#9ca3af"
            style={styles.postCardPlus}
          />
        </TouchableOpacity>
      </View>

      {/* How it Works */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How it Works</Text>
          <Text style={styles.learnMore}>Learn more</Text>
        </View>

        <View style={styles.howCard}>
          <View style={styles.stepsContainer}>
            {/* Vertical connector line */}
            <View style={styles.stepLine} />

            {/* Step 1 — green */}
            <View style={styles.step}>
              <View style={[styles.stepCircle, styles.stepGreen]}>
                <Text style={[styles.stepNumber, { color: '#16a34a' }]}>1</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Connect</Text>
                <Text style={styles.stepDesc}>Match with a verified traveler heading your way.</Text>
              </View>
            </View>

            {/* Step 2 — blue */}
            <View style={styles.step}>
              <View style={[styles.stepCircle, styles.stepBlue]}>
                <Text style={[styles.stepNumber, { color: '#2563eb' }]}>2</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Handover</Text>
                <Text style={styles.stepDesc}>Meet safely to hand over the package and details.</Text>
              </View>
            </View>

            {/* Step 3 — purple */}
            <View style={styles.step}>
              <View style={[styles.stepCircle, styles.stepPurple]}>
                <Text style={[styles.stepNumber, { color: '#9333ea' }]}>3</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Track & Receive</Text>
                <Text style={styles.stepDesc}>Real-time updates until safe delivery.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Active Shipments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Shipments</Text>
        <View style={styles.shipmentCard}>
          <View style={styles.shipmentIconWrap}>
            <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
          </View>
          <View style={styles.shipmentInfo}>
            <Text style={styles.shipmentName}>Macbook Pro M2</Text>
            <Text style={styles.shipmentDest}>To: San Francisco, CA</Text>
          </View>
          <View style={styles.shipmentStatus}>
            <View style={styles.transitBadge}>
              <Text style={styles.transitText}>IN TRANSIT</Text>
            </View>
            <Text style={styles.arrivalText}>Arrives in 2 days</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // ---- Header ----
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,   // overridden inline with safe-area inset
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    lineHeight: 24,
  },
  bellButton: {
    padding: spacing.sm,
    borderRadius: radius.full,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  trustValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  trustValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginHorizontal: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },

  // ---- Actions Grid ----
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // Find a Traveler card (orange)
  findCard: {
    flex: 1,
    height: 176,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  findCardDecorRight: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  findCardDecorLeft: {
    position: 'absolute',
    left: -24,
    bottom: -24,
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    zIndex: 1,
  },
  findCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 4,
  },
  findCardSub: {
    fontSize: 11,
    color: '#fde8df',
  },

  // Post a Trip card (white)
  postCard: {
    flex: 1,
    height: 176,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  postCardSub: {
    fontSize: 11,
    color: '#718096',
  },
  postCardPlus: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },

  // ---- Sections ----
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
  },
  learnMore: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // ---- How it Works ----
  howCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  stepsContainer: {
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: 16,
    width: 2,
    backgroundColor: '#f3f4f6',
    zIndex: 0,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    zIndex: 1,
  },
  stepGreen: { backgroundColor: '#dcfce7' },
  stepBlue:  { backgroundColor: '#dbeafe' },
  stepPurple:{ backgroundColor: '#f3e8ff' },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepBody: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
  },

  // ---- Active Shipments ----
  shipmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  shipmentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  shipmentInfo: {
    flex: 1,
  },
  shipmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  shipmentDest: {
    fontSize: 12,
    color: '#718096',
  },
  shipmentStatus: {
    alignItems: 'flex-end',
  },
  transitBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  transitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  arrivalText: {
    fontSize: 10,
    color: '#718096',
  },
});
