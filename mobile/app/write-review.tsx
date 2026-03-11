// mobile/app/write-review.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';

export default function WriteReviewScreen() {
  const { matchId, revieweeName } = useLocalSearchParams<{
    matchId: string;
    revieweeName: string;
  }>();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }

    if (!matchId) {
      Alert.alert('Error', 'Missing match information.');
      return;
    }

    setSubmitting(true);
    try {
      await api.reviews.submit({
        match_id: matchId,
        rating,
        review_text: reviewText.trim() || undefined,
      });
      Alert.alert('Review submitted!', 'Thank you for your feedback.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        Alert.alert('Already reviewed', 'You have already submitted a review for this delivery.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Leave a Review</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Reviewee name */}
          <View style={styles.section}>
            <Text style={styles.forLabel}>Your review for</Text>
            <Text style={styles.revieweeName}>{revieweeName}</Text>
          </View>

          {/* Star selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? colors.star : colors.textDisabled}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
              </Text>
            )}
          </View>

          {/* Review text */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your experience with this delivery…"
              placeholderTextColor={colors.textDisabled}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  forLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  revieweeName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.md },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  starBtn: { padding: spacing.xs },
  ratingLabel: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    color: colors.star,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
  submitBtn: {
    margin: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
