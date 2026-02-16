/**
 * Main landing/splash screen
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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
      <Text style={styles.title}>Travorier</Text>
      <Text style={styles.subtitle}>Crowdsourced Logistics</Text>
      <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
});
