/**
 * Login Screen - Google OAuth Authentication
 *
 * Design based on Stitch screen:
 * projects/7580322135798196968/screens/d60fdf79a10b4eb39f118241d746ff67
 */
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      // Navigation handled automatically by auth state change
    } catch (error: any) {
      setLoading(false);

      let errorMessage = 'Unable to sign in. Please try again.';
      if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
        errorMessage = 'Sign in was cancelled. Please try again.';
      } else if (error?.message?.includes('popup')) {
        errorMessage = 'Please allow popups to continue with Google Sign-In.';
      }

      Alert.alert('Sign In Failed', errorMessage, [{ text: 'OK', style: 'default' }]);
      console.error('Google sign-in error:', error);
    }
  };

  const handleEmailSignIn = () => {
    Alert.alert('Coming Soon', 'Email sign-in will be available soon.');
  };

  const handleCreateAccount = () => {
    Alert.alert('Coming Soon', 'Account creation will be available soon.');
  };

  const handleTermsPress = () => {
    Alert.alert('Terms of Service', 'Terms of Service will be available soon.');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Privacy Policy', 'Privacy Policy will be available soon.');
  };

  return (
    <View style={styles.screen}>
      {/* Center content */}
      <View style={styles.center}>
        {/* App icon — orange rounded square with truck, rotated 3° */}
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="truck-delivery" size={48} color="#ffffff" />
        </View>

        {/* Brand name */}
        <Text style={styles.brandName}>Travorier</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Connect Travelers with{'\n'}Package Senders
        </Text>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          {/* Sign in with Google */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator animating size="small" color={colors.textSecondary} style={styles.btnIcon} />
            ) : (
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeNITP2kf_zYcZQZvxI2OaT8bQlvabPTGzB-8C1DOjpUVOZwe1jLdOStQpQMayFS6QxzSHRQc6PbSdNH8zYe4Zrpi84Em7QZnDg10cqdT1QMPcsgkAEX94mgNeAYMarNsOXlR00WmRwihipeA1aPXKonRdU_GzjThI0l9fJ-o_3JZPldewyZ9LRuT2O9_5EH_yPyiesVYqUd53T87zR_ovToOM7jesgnEBTGzsqcPVKcbr0R2-1gDl6w8gs3OB0e4DRpWqtcaVIFg' }}
                style={styles.googleLogo}
              />
            )}
            <Text style={styles.googleButtonLabel}>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          {/* Continue with Email */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailSignIn}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.emailButtonLabel}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Account */}
        <Text style={styles.createAccountRow}>
          <Text style={styles.createAccountText}>New to Travorier? </Text>
          <Text style={styles.createAccountLink} onPress={handleCreateAccount}>
            Create Account
          </Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink} onPress={handleTermsPress}>Terms of Service</Text>
          {' '}and acknowledge that you have read our{' '}
          <Text style={styles.termsLink} onPress={handlePrivacyPress}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo — orange square, rotated 3°
  logoWrap: {
    width: 96,
    height: 96,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '3deg' }],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  brandName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },

  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },

  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  // Google button — white bg, gray border
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  googleButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },

  // Email button — solid orange
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emailButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },

  btnIcon: {
    marginRight: spacing.sm,
  },

  // OR divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: spacing.md,
    letterSpacing: 1,
    fontWeight: '500',
  },

  // Create Account
  createAccountRow: {
    textAlign: 'center',
  },
  createAccountText: {
    fontSize: 14,
    color: '#6b7280',
  },
  createAccountLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Footer terms
  footer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
