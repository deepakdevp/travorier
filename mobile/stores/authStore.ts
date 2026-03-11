/**
 * Authentication state management with Zustand
 */
import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { registerPushToken } from '@/lib/registerPushToken';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  id_verification_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  trust_score: number;
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
  credit_balance: number;
  user_types: string[];
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  setSession: (session: Session | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    }),

  signInWithGoogle: async () => {
    try {
      set({ loading: true });

      const getRedirectTo = () => {
        if (Platform.OS === 'web') {
          return window.location.origin;
        }
        return __DEV__ ? 'exp://localhost:19000' : 'travorier://';
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectTo(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        set({ loading: false });
        throw error;
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  loadProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });

      // Load profile if session exists
      if (session?.user) {
        get().loadProfile();
        registerPushToken().catch(console.warn);
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
        // Reload profile on sign-in
        if (session?.user) {
          get().loadProfile();
          registerPushToken().catch(console.warn);
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },
}));
