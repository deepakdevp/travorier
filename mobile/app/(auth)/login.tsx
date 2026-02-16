/**
 * Login Screen - Google OAuth Authentication
 */
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={['#0066cc', '#0052a3', '#003d7a']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text variant="displayLarge" style={styles.logo}>
            ✈️
          </Text>
          <Text variant="headlineLarge" style={styles.brandName}>
            Travorier
          </Text>
          <Text variant="titleMedium" style={styles.tagline}>
            Connect Travelers with Package Senders
          </Text>
        </View>

        {/* Auth Section */}
        <View style={styles.authSection}>
          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            disabled={loading}
            icon="google"
            contentStyle={styles.buttonContent}
            style={styles.googleButton}
            labelStyle={styles.buttonLabel}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {loading && (
            <ActivityIndicator
              animating={true}
              color="#ffffff"
              size="small"
              style={styles.loader}
            />
          )}

          <Text variant="bodySmall" style={styles.disclaimer}>
            By continuing, you agree to our
          </Text>
          <View style={styles.linksRow}>
            <Text
              variant="bodySmall"
              style={styles.link}
              onPress={handleTermsPress}
            >
              Terms of Service
            </Text>
            <Text variant="bodySmall" style={styles.linkSeparator}>
              {' • '}
            </Text>
            <Text
              variant="bodySmall"
              style={styles.link}
              onPress={handlePrivacyPress}
            >
              Privacy Policy
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Crowdsourced Logistics Platform
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  brandName: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    color: '#e0e0e0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  authSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 16,
  },
  disclaimer: {
    color: '#e0e0e0',
    marginTop: 32,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  link: {
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    color: '#e0e0e0',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#b0b0b0',
    marginTop: 4,
  },
});
