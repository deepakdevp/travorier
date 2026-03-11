// mobile/lib/registerPushToken.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@/services/api';

/**
 * Request notification permissions, get Expo push token,
 * and save it to the backend (profiles.fcm_token).
 * Call this after the user is authenticated.
 * Safe to call multiple times — no-op if token unchanged.
 * Never throws.
 */
export async function registerPushToken(): Promise<void> {
  // Only works on physical devices (not simulators/emulators)
  if (Constants.isDevice !== true) {
    console.log('[Push] Not a physical device — skipping token registration');
    return;
  }

  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted — skipping token registration');
      return;
    }

    // Android channel setup (before fetching token so channel exists on first notification)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#136dec',
      });
    }

    // Set notification handler so foreground notifications show alerts
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Get Expo push token
    const projectId =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    console.log('[Push] Expo push token:', token);

    // Save to backend
    try {
      await api.notifications.registerToken(token);
    } catch (err) {
      console.warn('[Push] Failed to register token with backend:', err);
    }
  } catch (err) {
    console.warn('[Push] registerPushToken failed:', err);
  }
}
