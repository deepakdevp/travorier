import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { supabase } from '@/services/supabase';
import { api } from '@/services/api';
import { useRequestsStore } from '@/stores/requestsStore';

export default function InspectionScreen() {
  const { selectedMatch } = useRequestsStore();
  const matchId = selectedMatch?.id;

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const fileName = `inspections/${matchId}/${Date.now()}.${ext}`;
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const { error } = await supabase.storage
      .from('inspections')
      .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('inspections').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed to add photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        const urls = await Promise.all(result.assets.map(uploadPhoto));
        setPhotos((prev) => [...prev, ...urls]);
      } catch {
        Alert.alert('Upload failed', 'Could not upload photos. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const url = await uploadPhoto(result.assets[0]);
        setPhotos((prev) => [...prev, url]);
      } catch {
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!matchId) return;
    if (photos.length === 0) {
      Alert.alert('Required', 'Please add at least one photo of the package');
      return;
    }
    setSubmitting(true);
    try {
      await api.handover.createInspection({
        match_id: matchId,
        media_urls: photos,
        media_type: 'photo',
      });
      Alert.alert(
        'Inspection Recorded!',
        'Package photos uploaded. The match is now in transit.',
        [{ text: 'OK', onPress: () => router.replace('/my-trip-detail') }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photograph Package</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Take clear photos of the package before accepting it. This protects both you and the sender.
        </Text>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photoThumb} />
            ))}
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        <View style={styles.addButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={takePhoto} disabled={uploading}>
            <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
            <Text style={styles.addBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={pickPhoto} disabled={uploading}>
            <MaterialCommunityIcons name="image-multiple" size={22} color={colors.primary} />
            <Text style={styles.addBtnText}>From Library</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} added
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || photos.length === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || photos.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitBtnText}>Submit & Mark In Transit</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: spacing.md, gap: spacing.md },
  instructions: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  photoThumb: { width: 100, height: 100, borderRadius: radius.md },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  uploadingText: { fontSize: 14, color: colors.textSecondary },
  addButtons: { flexDirection: 'row', gap: spacing.sm },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  hint: { fontSize: 12, color: colors.textDisabled, textAlign: 'center' },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
