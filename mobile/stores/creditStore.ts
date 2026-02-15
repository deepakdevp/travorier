/**
 * Credit balance state management with Zustand
 */
import { create } from 'zustand';
import { api } from '@/services/api';

interface CreditState {
  balance: number;
  loading: boolean;

  // Actions
  fetchBalance: () => Promise<void>;
  deductCredit: (amount: number) => void;
  addCredits: (amount: number) => void;
}

export const useCreditStore = create<CreditState>((set) => ({
  balance: 0,
  loading: false,

  fetchBalance: async () => {
    set({ loading: true });
    try {
      const response = await api.payments.getCredits();
      set({ balance: response.data.balance, loading: false });
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      set({ loading: false });
    }
  },

  deductCredit: (amount) =>
    set((state) => ({ balance: Math.max(0, state.balance - amount) })),

  addCredits: (amount) =>
    set((state) => ({ balance: state.balance + amount })),
}));
