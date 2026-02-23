/**
 * Match Confirmation Screen
 * "Request Sent Successfully" — matches Stitch design:
 * projects/7580322135798196968/screens/77a90f99ad9b4730b2c5766003088b39
 */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripsStore } from '@/stores/tripsStore';
import { colors, spacing, radius } from '@/lib/theme';

const STEPS = [
  {
    title: 'Traveler Accepts Request',
    desc: 'A verified traveler reviews and accepts your delivery offer.',
    active: true,
  },
  {
    title: 'Secure Payment',
    desc: 'Funds are held in escrow until delivery is confirmed.',
    active: false,
  },
  {
    title: 'Handover & Transit',
    desc: 'Meet the traveler to hand over the package.',
    active: false,
  },
  {
    title: 'Delivery & Release',
    desc: 'Recipient confirms receipt and funds are released.',
    active: false,
  },
];

export default function MatchConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useTripsStore();

  const handleBrowseMore = () => {
    router.replace('/(tabs)/trips');
  };

  const handleViewMatches = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Success icon — double ring */}
      <View style={styles.iconWrap}>
        <View style={styles.iconRingOuter}>
          <View style={styles.iconRingInner}>
            <MaterialCommunityIcons name="check" size={40} color="#ffffff" />
          </View>
        </View>
      </View>

      {/* Title + subtitle */}
      <Text style={styles.title}>Request Sent{'\n'}Successfully!</Text>
      <Text style={styles.subtitle}>
        Your package request has been broadcasted to travelers heading your way.
      </Text>

      {/* What Happens Next card */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsHeader}>WHAT HAPPENS NEXT?</Text>

        <View style={styles.stepsContainer}>
          {/* Vertical connector line */}
          <View style={styles.stepLine} />

          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              {/* Circle */}
              <View
                style={[
                  styles.stepCircle,
                  step.active ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    step.active ? styles.stepNumberActive : styles.stepNumberInactive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleBrowseMore}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="compass-outline" size={20} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Browse More Trips</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleViewMatches}
        activeOpacity={0.85}
      >
        <Text style={styles.secondaryButtonText}>Go to Homepage</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },

  // ── Success icon ──────────────────────────────────────────────────────────
  iconWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconRingOuter: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: '#d1fae5',   // green-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingInner: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Heading ───────────────────────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },

  // ── Steps card ────────────────────────────────────────────────────────────
  stepsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  stepsContainer: {
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: '#e5e7eb',
    zIndex: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexShrink: 0,
  },
  stepCircleActive: {
    backgroundColor: colors.success,
  },
  stepCircleInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepNumberInactive: {
    color: '#9ca3af',
  },
  stepBody: {
    flex: 1,
    paddingTop: 6,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});
