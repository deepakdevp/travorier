/**
 * Requests Store - Manage package requests and matches
 * Uses Zustand for state management
 */
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

export interface Request {
  id: string;
  sender_id: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  needed_by_date: string;
  package_weight_kg: number;
  package_description: string;
  package_value?: number;
  notes?: string;                          // was: special_instructions (schema uses "notes")
  status: 'active' | 'matched' | 'completed' | 'cancelled';  // was: 'open' | 'matched' | 'completed'
  created_at: string;
}

export interface Match {
  id: string;
  request_id: string | null;              // nullable in schema (direct trip match has no request)
  trip_id: string;
  traveler: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    verified: boolean;                     // aliased from id_verified in query
  };
  trip: {
    origin_city: string;
    destination_city: string;
    departure_date: string;
    airline?: string;
    flight_number?: string;
  };
  agreed_weight_kg: number;
  status: 'initiated' | 'negotiating' | 'agreed' | 'handover_scheduled' | 'in_transit' | 'delivered' | 'cancelled' | 'disputed';
  contact_unlocked: boolean;
}

interface RequestsStore {
  // State
  requests: Request[];
  selectedRequest: Request | null;
  selectedMatch: Match | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedRequest: (request: Request | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  addRequest: (request: Omit<Request, 'id' | 'sender_id' | 'status' | 'created_at'>) => Promise<void>;
  acceptMatch: (matchId: string) => void;
  unlockContact: (matchId: string) => void;
  fetchRequests: () => Promise<void>;
  getMatchesForRequest: (requestId: string) => Match[];
}

// Mock matches per request
const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    request_id: 'r1',
    trip_id: '1',
    traveler: {
      full_name: 'Rajesh Kumar',
      trust_score: 85,
      verified: true,
    },
    trip: {
      origin_city: 'Mumbai',
      destination_city: 'New York',
      departure_date: '2026-03-15',
      airline: 'Air India',
      flight_number: 'AI191',
    },
    agreed_weight_kg: 3,
    status: 'initiated',
    contact_unlocked: false,
  },
  {
    id: 'm2',
    request_id: 'r1',
    trip_id: '4',
    traveler: {
      full_name: 'Sarah Johnson',
      avatar_url: 'https://i.pravatar.cc/150?img=9',
      trust_score: 95,
      verified: true,
    },
    trip: {
      origin_city: 'Mumbai',
      destination_city: 'New York',
      departure_date: '2026-03-18',
      airline: 'Emirates',
      flight_number: 'EK500',
    },
    agreed_weight_kg: 3,
    status: 'initiated',
    contact_unlocked: false,
  },
];


export const useRequestsStore = create<RequestsStore>((set, get) => ({
  // Initial state
  requests: [],
  selectedRequest: null,
  selectedMatch: null,
  loading: false,
  error: null,

  setSelectedRequest: (request) => set({ selectedRequest: request }),

  setSelectedMatch: (match) => set({ selectedMatch: match }),

  addRequest: async (requestData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('requests')
      .insert({
        sender_id: session.user.id,
        origin_city: requestData.origin_city,
        origin_country: requestData.origin_country,
        destination_city: requestData.destination_city,
        destination_country: requestData.destination_country,
        needed_by_date: requestData.needed_by_date,
        package_weight_kg: requestData.package_weight_kg,
        package_description: requestData.package_description,
        package_value: requestData.package_value ?? null,
        notes: requestData.notes ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (data) {
      set((state) => ({ requests: [data as Request, ...state.requests] }));
    }
  },

  acceptMatch: (matchId) => {
    // In production: update match status in Supabase
    set((state) => ({
      selectedMatch: state.selectedMatch?.id === matchId
        ? { ...state.selectedMatch, status: 'accepted' }
        : state.selectedMatch,
    }));
  },

  unlockContact: (matchId) => {
    // In production: deduct 1 credit via Stripe, update match in Supabase
    set((state) => ({
      selectedMatch: state.selectedMatch?.id === matchId
        ? { ...state.selectedMatch, contact_unlocked: true }
        : state.selectedMatch,
    }));
  },

  getMatchesForRequest: (requestId) => {
    return MOCK_MATCHES.filter((m) => m.request_id === requestId);
  },

  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('sender_id', session.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      set({ requests: (data ?? []) as Request[], loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch requests', loading: false });
    }
  },
}));
