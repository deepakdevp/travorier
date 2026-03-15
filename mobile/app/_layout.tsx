/**
 * Root layout component for Expo Router
 */
import * as Sentry from 'sentry-expo';
import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
// import { StripeProvider } from '@stripe/stripe-react-native'; // Stripe halted — Razorpay only
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/authStore';
import { AppTheme } from '@/lib/theme';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enableInExpoDevelopment: false,
  debug: false,
});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initialize();

    // Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Received foreground notification:', notification.request.content.title);
    });

    // User tapped a notification (foreground or background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        deep_link?: string;
      };
      if (data?.deep_link) {
        router.push(data.deep_link as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    // <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!} merchantIdentifier="merchant.com.travorier">
    <PaperProvider theme={AppTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="qr-scanner" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="handover" options={{ headerShown: false }} />
        <Stack.Screen name="inspection" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="write-review" options={{ headerShown: false }} />
        <Stack.Screen name="identity-verification" options={{ headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
    // </StripeProvider>
  );
}
