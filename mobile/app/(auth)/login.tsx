/**
 * Login Screen - Google OAuth Authentication
 */
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Navigation will be handled automatically by auth state change
    } catch (error: any) {
      setLoading(false);

      // User-friendly error messages
      let errorMessage = 'Unable to sign in. Please try again.';

      if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
        errorMessage = 'Sign in was cancelled. Please try again.';
      } else if (error?.message?.includes('popup')) {
        errorMessage = 'Please allow popups to continue with Google Sign-In.';
      }

      Alert.alert('Sign In Failed', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);

      console.error('Google sign-in error:', error);
    }
  };

  const handleTermsPress = () => {
    // TODO: Link to terms page when available
    Alert.alert('Terms of Service', 'Terms of Service will be available soon.');
  };

  const handlePrivacyPress = () => {
    // TODO: Link to privacy page when available
    Alert.alert('Privacy Policy', 'Privacy Policy will be available soon.');
  };

  return (
    <View style={styles.screen}>
      {/* Hero Section */}
      <View style={styles.hero}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>✈</Text>
        </View>

        <Text style={styles.brandName}>Travorier</Text>
        <Text style={styles.tagline}>Connect Travelers with{'\n'}Package Senders</Text>

        {/* Decorative pill badges */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Trusted</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Secure</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Global</Text>
          </View>
        </View>
      </View>

      {/* Auth Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Welcome</Text>
        <Text style={styles.cardSubheading}>Sign in to continue</Text>

        <Button
          mode="outlined"
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={styles.googleButton}
          contentStyle={styles.googleButtonContent}
          labelStyle={styles.googleButtonLabel}
        >
          {loading ? 'Signing in...' : 'G   Continue with Google'}
        </Button>

        {loading && (
          <ActivityIndicator
            animating={true}
            color={colors.primary}
            size="small"
            style={styles.loader}
          />
        )}

        {/* Terms row */}
        <Text style={styles.disclaimer}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={handleTermsPress}>
            Terms of Service
          </Text>
          {' and '}
          <Text style={styles.link} onPress={handlePrivacyPress}>
            Privacy Policy
          </Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Crowdsourced delivery, powered by travellers worldwide
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 32,
    color: colors.primary,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 16,
    color: colors.primarySubtle,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Auth Card ─────────────────────────────────────────────────────────────
  card: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  googleButton: {
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  googleButtonContent: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  loader: {
    marginTop: spacing.md,
  },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
