/**
 * Main landing/splash screen
 *
 * Design based on Stitch screen:
 * projects/7580322135798196968/screens/3437b74128754a49a74b5b1229ead777
 */
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function Index() {
  const router = useRouter();
  const { session, loading, initialized } = useAuthStore();

  // Fade-in-up animation (0.8s ease-out, 20px vertical translation)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

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
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        ]}
      >
        {/* Icon row: local_shipping + flight_takeoff */}
        <View style={styles.iconRow}>
          {/* local_shipping icon (package box) */}
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>📦</Text>
          </View>
          {/* flight_takeoff icon (airplane) */}
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>✈️</Text>
          </View>
        </View>

        {/* Brand name */}
        <Text style={styles.title}>Travorier</Text>

        {/* Tagline */}
        <Text style={styles.subtitle}>Crowdsourced Logistics</Text>

        {/* Loading indicator + status text */}
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Initializing secure session...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  loader: {
    marginBottom: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
