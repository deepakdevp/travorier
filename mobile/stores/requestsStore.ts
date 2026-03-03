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
  matches: Match[];
  matchesLoading: boolean;
  selectedRequest: Request | null;
  selectedMatch: Match | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedRequest: (request: Request | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  addRequest: (request: Omit<Request, 'id' | 'sender_id' | 'status' | 'created_at'>) => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  unlockContact: (matchId: string) => void;
  fetchRequests: () => Promise<void>;
  fetchMatchesForRequest: (requestId: string) => Promise<void>;
}


export const useRequestsStore = create<RequestsStore>((set) => ({
  // Initial state
  requests: [],
  matches: [],
  matchesLoading: false,
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

  acceptMatch: async (matchId) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'agreed' })
      .eq('id', matchId);

    if (error) throw new Error(error.message);

    // Update local state
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, status: 'agreed' } : m
      ),
      selectedMatch: state.selectedMatch?.id === matchId
        ? { ...state.selectedMatch, status: 'agreed' }
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

  fetchMatchesForRequest: async (requestId) => {
    set({ matchesLoading: true });
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, request_id, trip_id, status, contact_unlocked, agreed_weight_kg,
          traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified),
          trip:trips!trip_id(origin_city, destination_city, departure_date, airline, flight_number)
        `)
        .eq('request_id', requestId)
        .not('status', 'in', '("cancelled","disputed")');

      if (error) {
        set({ matchesLoading: false });
        return;
      }

      const matches: Match[] = (data ?? []).map((row: any) => ({
        id: row.id,
        request_id: row.request_id,
        trip_id: row.trip_id,
        status: row.status,
        contact_unlocked: row.contact_unlocked,
        agreed_weight_kg: row.agreed_weight_kg ?? 0,
        traveler: {
          full_name: row.traveler?.full_name ?? 'Unknown',
          avatar_url: row.traveler?.avatar_url,
          trust_score: row.traveler?.trust_score ?? 0,
          verified: row.traveler?.id_verified ?? false,
        },
        trip: {
          origin_city: row.trip?.origin_city ?? '',
          destination_city: row.trip?.destination_city ?? '',
          departure_date: row.trip?.departure_date ?? '',
          airline: row.trip?.airline,
          flight_number: row.trip?.flight_number,
        },
      }));

      set({ matches, matchesLoading: false });
    } catch (err) {
      set({ matchesLoading: false });
    }
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
