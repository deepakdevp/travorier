/**
 * Home Screen - Main Dashboard
 *
 * Design based on Stitch screen:
 * projects/7580322135798196968/screens/db644f60aab34c87878fd30177674006
 */
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingLabel}>Welcome back,</Text>
            <Text style={styles.greetingName}>{userName}</Text>
            <Text style={styles.greetingSubtitle}>
              Connect travelers with package senders
            </Text>
          </View>
          <View style={styles.notificationButton}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <MaterialCommunityIcons name="star" size={22} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Trust Score</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="airplane" size={22} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="package-variant" size={22} color={colors.success} />
          </View>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
      </View>

      {/* Main Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        {/* Browse Trips CTA */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/trips')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="airplane-search" size={28} color={colors.primary} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Browse Trips</Text>
            <Text style={styles.actionDescription}>
              Find travelers going to your destination
            </Text>
          </View>
          <View style={styles.actionChevronWrap}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Post Request CTA */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/requests')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="package-variant" size={28} color={colors.success} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Post Request</Text>
            <Text style={styles.actionDescription}>
              Need something delivered? Post your request
            </Text>
          </View>
          <View style={styles.actionChevronWrap}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.success} />
          </View>
        </TouchableOpacity>
      </View>

      {/* How Travorier Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Travorier Works</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>1</Text>
            </View>
            <View style={styles.infoStepBody}>
              <Text style={styles.infoStepTitle}>Post Trip</Text>
              <Text style={styles.infoStepDesc}>
                Travelers post their upcoming trips with available capacity
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>2</Text>
            </View>
            <View style={styles.infoStepBody}>
              <Text style={styles.infoStepTitle}>Match Route</Text>
              <Text style={styles.infoStepDesc}>
                Senders request package delivery on matching routes
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoStep}>
            <View style={styles.infoStepNumber}>
              <Text style={styles.infoStepNumberText}>3</Text>
            </View>
            <View style={styles.infoStepBody}>
              <Text style={styles.infoStepTitle}>Complete Delivery</Text>
              <Text style={styles.infoStepDesc}>
                Connect, agree on terms, and complete the delivery
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },

  // ---- Header ----
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ---- Stats ----
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '400',
    textAlign: 'center',
  },

  // ---- Sections ----
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // ---- Action Cards ----
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    lineHeight: 18,
  },
  actionChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  // ---- How It Works ----
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  infoStepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  infoStepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryContent,
  },
  infoStepBody: {
    flex: 1,
  },
  infoStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  infoStepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 28 + spacing.md,
  },
});
