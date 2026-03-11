// mobile/app/payment-methods.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { api } from '@/services/api';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  credits_purchased: number;
  payment_status: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function PaymentMethodsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.payments.getTransactions()
      .then((res: any) => setTransactions(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment & Credits</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Buy Credits CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        onPress={() => router.push('/buy-credits' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.ctaLeft}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={colors.primary} />
          <View>
            <Text style={styles.ctaTitle}>Buy Credits</Text>
            <Text style={styles.ctaSubtitle}>Credits are used to unlock traveler contact info</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
      </TouchableOpacity>

      {/* Transaction history */}
      <Text style={styles.sectionLabel}>Transaction History</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="text-box-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txIconCircle}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.primary} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>
                  {item.credits_purchased} credits purchased
                </Text>
                <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.txAmountCol}>
                <Text style={styles.txAmount}>
                  {item.currency === 'INR' ? '₹' : '$'}{item.amount.toFixed(0)}
                </Text>
                <View style={[styles.txStatusPill, item.payment_status === 'succeeded' ? styles.txStatusSuccess : styles.txStatusPending]}>
                  <Text style={[styles.txStatusText, item.payment_status === 'succeeded' ? styles.txStatusTextSuccess : styles.txStatusTextPending]}>
                    {item.payment_status === 'succeeded' ? 'Paid' : item.payment_status}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySubtle,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  ctaSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textDisabled },
  listContent: { paddingBottom: spacing.xl },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  txDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  txStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  txStatusSuccess: { backgroundColor: '#dcfce7' },
  txStatusPending: { backgroundColor: '#fef3c7' },
  txStatusText: { fontSize: 10, fontWeight: '600' },
  txStatusTextSuccess: { color: '#16a34a' },
  txStatusTextPending: { color: '#d97706' },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
});
