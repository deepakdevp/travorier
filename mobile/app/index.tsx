/**
 * Main landing/splash screen
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/lib/theme';

export default function Index() {
  const router = useRouter();
  const { session, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized || loading) return;

    // Navigate based on auth state
    if (session) {
      // User is authenticated - go to main app
      router.replace('/(tabs)');
    } else {
      // User is not authenticated - go to auth flow
      router.replace('/(auth)/login');
    }
  }, [session, loading, initialized]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconRow}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>📦</Text>
          </View>
          <View style={styles.iconDivider} />
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>✈️</Text>
          </View>
        </View>

        <Text style={styles.title}>Travorier</Text>
        <Text style={styles.subtitle}>Crowdsourced Logistics</Text>
      </View>

      <View style={styles.loaderSection}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing secure session...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  iconDivider: {
    width: spacing.md,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  loaderSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
});
