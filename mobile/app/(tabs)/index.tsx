/**
 * Home Screen - Main Dashboard
 * Placeholder for Milestone 2
 */
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Welcome to Travorier!
      </Text>
      <Text variant="bodyLarge" style={styles.email}>
        {user?.email}
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Homepage content will be added in Milestone 2
      </Text>
      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.button}
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  welcome: {
    marginBottom: 8,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  email: {
    marginBottom: 16,
    color: '#666666',
  },
  placeholder: {
    marginBottom: 32,
    color: '#999999',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
