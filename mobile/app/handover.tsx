import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';
import { useRequestsStore } from '@/stores/requestsStore';

export default function HandoverScreen() {
  const { selectedMatch } = useRequestsStore();
  const matchId = selectedMatch?.id;

  const [location, setLocation] = useState('');
  const [datetimeStr, setDatetimeStr] = useState('');
  const [datetimeError, setDatetimeError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'schedule' | 'qr'>('schedule');

  // Check if QR already generated
  useEffect(() => {
    if (!matchId) return;
    api.matches
      .getQR(matchId)
      .then((res) => {
        setQrUrl(res.data.qr_code_url);
        setStep('qr');
      })
      .catch(() => {}); // not generated yet — ignore
  }, [matchId]);

  const parseDatetime = (value: string): Date | null => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  const handleSchedule = async () => {
    if (!matchId || !location.trim()) {
      Alert.alert('Required', 'Please enter a handover location');
      return;
    }
    const parsed = parseDatetime(datetimeStr);
    if (!parsed) {
      setDatetimeError('Enter a valid date/time, e.g. 2026-03-15 14:30');
      return;
    }
    if (parsed < new Date()) {
      setDatetimeError('Handover date must be in the future');
      return;
    }
    setDatetimeError('');
    setScheduling(true);
    try {
      await api.matches.scheduleHandover(matchId, {
        handover_location: location.trim(),
        handover_time: parsed.toISOString(),
      });
      setStep('qr');
      Alert.alert('Confirmed!', 'Handover scheduled. Generate the QR code next.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to schedule handover');
    } finally {
      setScheduling(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!matchId) return;
    setGenerating(true);
    try {
      const res = await api.matches.generateQR(matchId);
      setQrUrl(res.data.qr_code_url);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to generate QR');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Handover</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.steps}>
          <View style={[styles.stepDot, step === 'schedule' && styles.stepDotActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'qr' && styles.stepDotActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Schedule</Text>
          <Text style={styles.stepLabel}>QR Code</Text>
        </View>

        {step === 'schedule' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Confirm Handover Details</Text>

            <Text style={styles.fieldLabel}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Blue Tokai Coffee, Indiranagar"
              placeholderTextColor={colors.textDisabled}
              value={location}
              onChangeText={setLocation}
              multiline
            />

            <Text style={styles.fieldLabel}>Date & Time</Text>
            <TextInput
              style={[styles.input, datetimeError ? styles.inputError : null]}
              placeholder="YYYY-MM-DD HH:MM  (e.g. 2026-03-15 14:30)"
              placeholderTextColor={colors.textDisabled}
              value={datetimeStr}
              onChangeText={(v) => {
                setDatetimeStr(v);
                setDatetimeError('');
              }}
              keyboardType="default"
            />
            {datetimeError ? <Text style={styles.errorText}>{datetimeError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, scheduling && styles.btnDisabled]}
              onPress={handleSchedule}
              disabled={scheduling}
            >
              {scheduling ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'qr' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Handover QR Code</Text>
            {qrUrl ? (
              <>
                <Text style={styles.qrHint}>Show this QR code to the sender at pickup</Text>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                <View style={styles.proceedRow}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/inspection')}
                  >
                    <Text style={styles.primaryBtnText}>Photograph Package →</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.qrHint}>Generate a unique QR for this handover</Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, generating && styles.btnDisabled]}
                  onPress={handleGenerateQR}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <View style={styles.btnRow}>
                      <MaterialCommunityIcons name="qrcode" size={18} color={colors.surface} />
                      <Text style={styles.primaryBtnText}>Generate QR Code</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
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
  content: { padding: spacing.md, gap: spacing.md },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepNum: { fontSize: 14, fontWeight: '700', color: colors.surface },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, maxWidth: 80 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xs },
  stepLabel: { fontSize: 12, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
  qrHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  qrImage: { width: '100%', height: 240, alignSelf: 'center' },
  proceedRow: { marginTop: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnDisabled: { backgroundColor: colors.border },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
