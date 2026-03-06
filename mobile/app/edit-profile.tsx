/**
 * Edit Profile Screen
 * Update name, phone, and avatar
 */
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius } from '@/lib/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, loadProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = fullName.trim()
    ? fullName.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `${user!.id}.${fileExt}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUri(data.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message ?? 'Could not upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUri,
        })
        .eq('id', user!.id);

      if (error) throw error;
      await loadProfile();
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <Surface style={styles.avatarSection} elevation={1}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} disabled={uploadingAvatar}>
            {avatarUri ? (
              <Avatar.Image size={88} source={{ uri: avatarUri }} />
            ) : (
              <Avatar.Text size={88} label={initials} style={{ backgroundColor: colors.primarySubtle }} labelStyle={{ color: colors.primary }} />
            )}
            <View style={styles.cameraOverlay}>
              <MaterialCommunityIcons
                name={uploadingAvatar ? 'loading' : 'camera'}
                size={16}
                color={colors.surface}
              />
            </View>
          </TouchableOpacity>
          <Text variant="bodySmall" style={styles.avatarHint}>
            {uploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
          </Text>
        </Surface>

        {/* Form */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              placeholder="+91 98765 43210"
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || uploadingAvatar}
          icon="content-save"
          contentStyle={styles.buttonContent}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, marginBottom: spacing.md },
  avatarWrapper: { position: 'relative', marginBottom: spacing.sm },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.success, borderRadius: radius.full,
    width: 26, height: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { color: colors.textDisabled },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface },
  input: { backgroundColor: colors.surface, marginBottom: spacing.sm },
  bottomBar: { backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { borderRadius: radius.md, backgroundColor: colors.primary },
  buttonContent: { paddingVertical: spacing.sm },
});
