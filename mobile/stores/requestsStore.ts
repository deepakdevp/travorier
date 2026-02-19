/**
 * Requests Store - Manage package requests and matches
 * Uses Zustand for state management
 */
import { create } from 'zustand';

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
  special_instructions?: string;
  status: 'open' | 'matched' | 'completed';
  created_at: string;
}

export interface Match {
  id: string;
  request_id: string;
  trip_id: string;
  traveler: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    verified: boolean;
  };
  trip: {
    origin_city: string;
    destination_city: string;
    departure_date: string;
    airline?: string;
    flight_number?: string;
  };
  agreed_weight_kg: number;
  status: 'initiated' | 'accepted' | 'rejected';
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
  addRequest: (request: Omit<Request, 'id' | 'sender_id' | 'status' | 'created_at'>) => void;
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

// Mock requests
const MOCK_REQUESTS: Request[] = [
  {
    id: 'r1',
    sender_id: 'current-user',
    origin_city: 'Mumbai',
    origin_country: 'India',
    destination_city: 'New York',
    destination_country: 'USA',
    needed_by_date: '2026-03-20',
    package_weight_kg: 3,
    package_description: 'Books and documents for university admission',
    package_value: 2000,
    status: 'open',
    created_at: '2026-02-19T10:00:00Z',
  },
  {
    id: 'r2',
    sender_id: 'current-user',
    origin_city: 'Delhi',
    origin_country: 'India',
    destination_city: 'London',
    destination_country: 'UK',
    needed_by_date: '2026-04-01',
    package_weight_kg: 5,
    package_description: 'Traditional Indian sweets and spices for family',
    status: 'matched',
    created_at: '2026-02-18T08:30:00Z',
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

  addRequest: (requestData) => {
    const newRequest: Request = {
      ...requestData,
      id: `r${Date.now()}`,
      sender_id: 'current-user',
      status: 'open',
      created_at: new Date().toISOString(),
    };
    set((state) => ({ requests: [newRequest, ...state.requests] }));
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
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production:
      // const { data, error } = await supabase
      //   .from('requests')
      //   .select('*')
      //   .eq('sender_id', currentUserId)
      //   .order('created_at', { ascending: false });

      set({ requests: MOCK_REQUESTS, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch requests', loading: false });
    }
  },
}));
