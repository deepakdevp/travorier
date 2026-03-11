import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera/next';
import type { BarcodeScanningResult } from 'expo-camera/next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';

export default function QRScannerScreen() {
  const params = useLocalSearchParams<{ matchId: string }>();
  const matchId = params.matchId;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScan = async (result: BarcodeScanningResult) => {
    if (scanned || confirming) return;
    setScanned(true);
    setConfirming(true);

    try {
      const res = await api.handover.scanQR(matchId!, result.data);
      if (res.data.success) {
        Alert.alert(
          'Delivered!',
          res.data.message,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/requests') }],
        );
      } else {
        Alert.alert('Error', 'QR verification failed');
        setScanned(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Scan failed');
      setScanned(false);
    } finally {
      setConfirming(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.surface} />
        </TouchableOpacity>

        <View style={styles.scanFrame} />

        <Text style={styles.scanHint}>
          {confirming ? 'Verifying...' : 'Point camera at the handover QR code'}
        </Text>

        {scanned && !confirming && (
          <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  permissionText: { color: colors.textPrimary, textAlign: 'center', margin: spacing.xl },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    margin: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: colors.surface, fontWeight: '700' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    padding: spacing.sm,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: colors.surface,
    marginTop: spacing.lg,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  rescanBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rescanText: { color: colors.surface, fontWeight: '600' },
});
