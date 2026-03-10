/**
 * Credit balance state management with Zustand
 */
import { create } from 'zustand';
import { api } from '@/services/api';

interface CreditStore {
  balance: number;
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  purchaseCredits: (packId: string, paymentIntentId: string) => Promise<{ success: boolean; newBalance: number }>;
  deductCredit: (amount?: number) => void;
}

export const useCreditStore = create<CreditStore>((set) => ({
  balance: 0,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.payments.getCredits();
      set({ balance: res.data.balance, loading: false });
    } catch {
      set({ error: 'Failed to fetch balance', loading: false });
    }
  },

  purchaseCredits: async (packId: string, paymentIntentId: string) => {
    try {
      const res = await api.payments.confirmPayment({ payment_intent_id: paymentIntentId });
      const newBalance = res.data.new_balance;
      set({ balance: newBalance });
      return { success: true, newBalance };
    } catch (err: any) {
      throw new Error(err?.response?.data?.detail || 'Payment confirmation failed');
    }
  },

  deductCredit: (amount = 1) =>
    set((state) => ({ balance: Math.max(0, state.balance - amount) })),
}));
