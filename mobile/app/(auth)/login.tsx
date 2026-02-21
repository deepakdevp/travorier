/**
 * Login Screen - Google OAuth Authentication
 *
 * Design based on Stitch screen:
 * projects/7580322135798196968/screens/d60fdf79a10b4eb39f118241d746ff67
 */
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
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
      {/* Hero / Logo section */}
      <View style={styles.heroSection}>
        {/* Icon badges row */}
        <View style={styles.iconRow}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>📦</Text>
          </View>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>✈️</Text>
          </View>
        </View>

        {/* Brand name */}
        <Text style={styles.brandName}>Travorier</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Connect Travelers with Package Senders</Text>
      </View>

      {/* Auth card */}
      <View style={styles.authCard}>
        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>

        {/* Google sign-in button */}
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              animating={true}
              color={colors.primary}
              size="small"
              style={styles.buttonSpinner}
            />
          ) : (
            <Text style={styles.googleIcon}>G</Text>
          )}
          <Text style={styles.googleButtonLabel}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        {/* Disclaimer + links */}
        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimerText}>By continuing, you agree to our </Text>
          <Text style={styles.linkText} onPress={handleTermsPress}>
            Terms of Service
          </Text>
          <Text style={styles.disclaimerText}> and </Text>
          <Text style={styles.linkText} onPress={handlePrivacyPress}>
            Privacy Policy
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Crowdsourced Logistics Platform</Text>
        <Text style={styles.versionText}>v1.0.4</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  // Auth card
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
    fontFamily: 'sans-serif',
  },
  googleButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonSpinner: {
    marginRight: spacing.sm,
  },

  // Disclaimer
  disclaimerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  versionText: {
    fontSize: 11,
    color: colors.textDisabled,
  },
});
