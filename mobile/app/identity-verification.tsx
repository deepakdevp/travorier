// mobile/app/identity-verification.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '@/lib/theme';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

const STATUS_CONFIG = {
  not_submitted: { label: 'Not Submitted', bg: colors.background, text: colors.textSecondary, icon: 'card-account-details-outline' as const },
  pending: { label: 'Under Review', bg: '#fef3c7', text: '#d97706', icon: 'clock-outline' as const },
  approved: { label: 'Verified', bg: '#dcfce7', text: '#16a34a', icon: 'check-circle-outline' as const },
  rejected: { label: 'Rejected', bg: '#fee2e2', text: colors.error, icon: 'close-circle-outline' as const },
};

export default function IdentityVerificationScreen() {
  const { profile, loadProfile } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const status = (profile?.id_verification_status ?? 'not_submitted') as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[status];
  const canUpload = status === 'not_submitted' || status === 'rejected';

  const handleUpload = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${user.id}/id-document-${Date.now()}.${ext}`;

      // Read file as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      // Update profile status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id_verification_status: 'pending' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await loadProfile();
      Alert.alert('Submitted!', "Your ID has been submitted for review. We'll notify you within 1-2 business days.");
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons name={config.icon} size={20} color={config.text} />
            <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
          </View>
          {status === 'approved' && (
            <Text style={styles.approvedNote}>
              Your identity has been verified. The green checkmark is now visible on your profile.
            </Text>
          )}
          {status === 'pending' && (
            <Text style={styles.pendingNote}>
              Your document is being reviewed. This usually takes 1–2 business days.
            </Text>
          )}
          {status === 'rejected' && (
            <Text style={styles.rejectedNote}>
              Your submission was rejected. Please upload a clearer photo of your ID.
            </Text>
          )}
        </View>

        {/* Instructions */}
        {canUpload && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>Upload a clear, unobstructed photo of your government-issued ID</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>Our team reviews your document within 1–2 business days</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepText}>Once approved, a verified badge appears on your profile</Text>
            </View>

            <Text style={styles.acceptedLabel}>Accepted documents</Text>
            <Text style={styles.acceptedList}>{'• Passport\n• Driver\'s license\n• National ID card'}</Text>
          </View>
        )}

        {/* Upload button */}
        {canUpload && (
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <MaterialCommunityIcons name="upload" size={20} color={colors.surface} />
                <Text style={styles.uploadBtnText}>
                  {status === 'rejected' ? 'Re-upload ID Document' : 'Upload ID Document'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.privacyNote}>
          Your ID is stored securely and only used for identity verification purposes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  scroll: { padding: spacing.md, gap: spacing.md },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 15, fontWeight: '700' },
  approvedNote: { fontSize: 13, color: colors.success, textAlign: 'center' },
  pendingNote: { fontSize: 13, color: '#d97706', textAlign: 'center' },
  rejectedNote: { fontSize: 13, color: colors.error, textAlign: 'center' },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  stepText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  acceptedLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.xs },
  acceptedList: { fontSize: 13, color: colors.textSecondary, lineHeight: 22 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  uploadBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  privacyNote: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
