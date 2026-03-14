// @ts-ignore — react-native-razorpay has no bundled types
import RazorpayCheckout from 'react-native-razorpay';
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  ScrollView, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';
import { useCreditStore } from '@/stores/creditStore';

interface CreditPack {
  id: string;
  credits: number;
  amount_paise: number;
  label: string;
}

export default function BuyCreditsScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { balance, purchaseCredits, fetchBalance, purchaseWithRazorpay } = useCreditStore();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPacks();
    fetchBalance();
  }, []);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await api.payments.getPacks();
      setPacks(res.data);
      setSelectedPack(res.data[1]); // default: middle pack
    } catch {
      Alert.alert('Error', 'Could not load credit packs');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseRazorpay = async () => {
    if (!selectedPack) return;
    setPurchasing(true);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await api.payments.razorpayCreateOrder({ pack_id: selectedPack.id });
      const { order_id, amount, currency, key_id } = orderRes.data;

      // 2. Open Razorpay checkout (handles UPI, NetBanking, Cards, Wallets natively)
      const options = {
        description: `${selectedPack.credits} Travorier Credits`,
        currency,
        key: key_id,
        amount: String(amount),
        order_id,
        name: 'Travorier',
        prefill: {},
        theme: { color: '#136dec' },
      };

      const paymentData = await RazorpayCheckout.open(options) as {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };

      // 3. Verify on backend and add credits
      const { newBalance } = await purchaseWithRazorpay(
        selectedPack.id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        paymentData.razorpay_signature,
      );

      Alert.alert(
        'Credits Added!',
        `${selectedPack.credits} credits added. New balance: ${newBalance}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      // User cancelled Razorpay checkout — don't show error
      if (err?.code === 'PAYMENT_CANCELLED') return;
      Alert.alert('Payment Failed', err.message || 'Something went wrong');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseStripe = async () => {
    if (!selectedPack) return;
    setPurchasing(true);
    try {
      // 1. Create payment intent on backend
      const intentRes = await api.payments.createIntent({ pack_id: selectedPack.id });
      const { client_secret, payment_intent_id } = intentRes.data;

      // 2. Init Stripe PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'Travorier',
        defaultBillingDetails: {},
      });
      if (initError) throw new Error(initError.message);

      // 3. Present PaymentSheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message);
        }
        return;
      }

      // 4. Confirm with backend (adds credits)
      const { newBalance } = await purchaseCredits(selectedPack.id, payment_intent_id);
      Alert.alert(
        'Credits Added!',
        `${selectedPack.credits} credits added. New balance: ${newBalance}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  const savings = (pack: CreditPack) => {
    const baseRate = packs[0] ? packs[0].amount_paise / packs[0].credits : 0;
    const packRate = pack.amount_paise / pack.credits;
    const savePct = Math.round(((baseRate - packRate) / baseRate) * 100);
    return savePct > 0 ? `Save ${savePct}%` : null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={styles.balanceBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.primary} />
          <Text style={styles.balanceText}>{balance}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Credits let you unlock traveler contact details</Text>
        <Text style={styles.costHint}>1 credit = 1 contact unlock</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.packsContainer}>
            {packs.map((pack) => {
              const isSelected = selectedPack?.id === pack.id;
              const saving = savings(pack);
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.packCard, isSelected && styles.packCardSelected]}
                  onPress={() => setSelectedPack(pack)}
                >
                  {saving && (
                    <View style={styles.savingBadge}>
                      <Text style={styles.savingText}>{saving}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={28}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.packCredits, isSelected && styles.packCreditsSelected]}>
                    {pack.credits} Credits
                  </Text>
                  <Text style={[styles.packPrice, isSelected && styles.packPriceSelected]}>
                    {formatPrice(pack.amount_paise)}
                  </Text>
                  <Text style={styles.packPerCredit}>
                    {formatPrice(pack.amount_paise / pack.credits)} / credit
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedPack && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedPack.label}</Text>
              <Text style={styles.summaryValue}>{formatPrice(selectedPack.amount_paise)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current balance</Text>
              <Text style={styles.summaryValue}>{balance} credits</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>After purchase</Text>
              <Text style={styles.summaryTotalValue}>{balance + selectedPack.credits} credits</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Primary: Razorpay (UPI / Cards / NetBanking / Wallets) */}
        <TouchableOpacity
          style={[styles.buyButton, (!selectedPack || purchasing) && styles.buyButtonDisabled]}
          onPress={handlePurchaseRazorpay}
          disabled={!selectedPack || purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.surface} />
              <Text style={styles.buyButtonText}>
                Pay {selectedPack ? formatPrice(selectedPack.amount_paise) : ''} · UPI / Card / NetBanking
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Fallback: Stripe (international cards) */}
        <TouchableOpacity
          style={[styles.stripeButton, (!selectedPack || purchasing) && styles.buyButtonDisabled]}
          onPress={handlePurchaseStripe}
          disabled={!selectedPack || purchasing}
        >
          <Text style={styles.stripeButtonText}>Pay with international card (Stripe)</Text>
        </TouchableOpacity>

        <Text style={styles.secureNote}>Secured by Razorpay · Stripe</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySubtle, paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  balanceText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  content: { padding: spacing.md, gap: spacing.md },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  costHint: { fontSize: 13, color: colors.textDisabled, textAlign: 'center' },
  packsContainer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  packCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
    borderWidth: 2, borderColor: colors.border, position: 'relative',
  },
  packCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  savingBadge: {
    position: 'absolute', top: -10,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  savingText: { fontSize: 10, color: colors.surface, fontWeight: '700' },
  packCredits: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  packCreditsSelected: { color: colors.primary },
  packPrice: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  packPriceSelected: { color: colors.primary },
  packPerCredit: { fontSize: 11, color: colors.textDisabled },
  checkIcon: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.textPrimary },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  summaryTotalValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  footer: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs,
  },
  buyButton: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  buyButtonDisabled: { backgroundColor: colors.border },
  buyButtonText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  secureNote: { fontSize: 12, color: colors.textDisabled, textAlign: 'center' },
  stripeButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },
  stripeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
