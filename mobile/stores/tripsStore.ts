/**
 * Trips Store - Manage trips data and filters
 * Uses Zustand for state management
 */
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

export interface Trip {
  id: string;
  traveler_id: string;
  traveler: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    verified: boolean;
  };
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  departure_date: string;
  departure_time?: string;
  arrival_date?: string;
  flight_number?: string;
  airline?: string;
  available_weight_kg: number;
  price_per_kg: number;
  status: 'active' | 'matched' | 'completed';
  is_boosted: boolean;
  pnr_verified: boolean;
  created_at: string;
}

export interface TripFilters {
  searchQuery: string;
  originCity?: string;
  destinationCity?: string;
  departureDate?: string;
  minWeight?: number;
  maxPricePerKg?: number;
  verifiedOnly: boolean;
}

export interface TravelerMatch {
  id: string;
  trip_id: string;
  request_id: string | null;
  sender: {
    full_name: string;
    avatar_url?: string;
    trust_score: number;
    id_verified: boolean;
  };
  agreed_weight_kg: number;
  agreed_price: number | null;
  package_description: string | null;
  package_weight_kg: number | null;
  needed_by_date: string | null;
  status: string;
  contact_unlocked: boolean;
}

export interface NewTripData {
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  departure_date: string;
  departure_time?: string;
  flight_number?: string;
  airline?: string;
  available_weight_kg: number;
  price_per_kg: number;
  notes?: string;
}

interface TripsStore {
  // State
  trips: Trip[];
  filteredTrips: Trip[];
  selectedTrip: Trip | null;
  filters: TripFilters;
  loading: boolean;
  error: string | null;

  // Actions
  setTrips: (trips: Trip[]) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  updateFilters: (filters: Partial<TripFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  fetchTrips: () => Promise<void>;

  // Traveler-side state
  myTrips: Trip[];
  myTripsLoading: boolean;
  selectedMyTrip: Trip | null;
  tripMatches: TravelerMatch[];
  tripMatchesLoading: boolean;

  // Traveler-side actions
  fetchMyTrips: () => Promise<void>;
  createTrip: (data: NewTripData) => Promise<void>;
  setSelectedMyTrip: (trip: Trip | null) => void;
  fetchTripMatches: (tripId: string) => Promise<void>;
  respondToMatch: (matchId: string, response: 'agreed' | 'cancelled') => Promise<void>;
}

const defaultFilters: TripFilters = {
  searchQuery: '',
  verifiedOnly: false,
};

export const useTripsStore = create<TripsStore>((set, get) => ({
  // Initial state
  trips: [],
  filteredTrips: [],
  selectedTrip: null,
  filters: defaultFilters,
  loading: false,
  error: null,
  myTrips: [],
  myTripsLoading: false,
  selectedMyTrip: null,
  tripMatches: [],
  tripMatchesLoading: false,

  // Set trips
  setTrips: (trips) => {
    set({ trips, filteredTrips: trips });
  },

  // Set selected trip
  setSelectedTrip: (trip) => {
    set({ selectedTrip: trip });
  },

  // Update filters
  updateFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
    get().applyFilters();
  },

  // Reset filters
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  // Apply filters
  applyFilters: () => {
    const { trips, filters } = get();
    let filtered = [...trips];

    // Search query (origin or destination)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.origin_city.toLowerCase().includes(query) ||
          trip.destination_city.toLowerCase().includes(query) ||
          trip.origin_country.toLowerCase().includes(query) ||
          trip.destination_country.toLowerCase().includes(query)
      );
    }

    // Origin city filter
    if (filters.originCity) {
      filtered = filtered.filter(
        (trip) => trip.origin_city.toLowerCase() === filters.originCity?.toLowerCase()
      );
    }

    // Destination city filter
    if (filters.destinationCity) {
      filtered = filtered.filter(
        (trip) => trip.destination_city.toLowerCase() === filters.destinationCity?.toLowerCase()
      );
    }

    // Departure date filter
    if (filters.departureDate) {
      filtered = filtered.filter((trip) => trip.departure_date === filters.departureDate);
    }

    // Minimum weight filter
    if (filters.minWeight) {
      filtered = filtered.filter((trip) => trip.available_weight_kg >= filters.minWeight!);
    }

    // Max price per kg filter
    if (filters.maxPricePerKg) {
      filtered = filtered.filter((trip) => trip.price_per_kg <= filters.maxPricePerKg!);
    }

    // Verified travelers only
    if (filters.verifiedOnly) {
      filtered = filtered.filter((trip) => trip.traveler.verified);
    }

    // Sort: boosted first, then by departure date
    filtered.sort((a, b) => {
      if (a.is_boosted && !b.is_boosted) return -1;
      if (!a.is_boosted && b.is_boosted) return 1;
      return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
    });

    set({ filteredTrips: filtered });
  },

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, traveler_id,
          origin_city, origin_country,
          destination_city, destination_country,
          departure_date, departure_time, arrival_date,
          flight_number, airline,
          available_weight_kg, price_per_kg,
          status, is_boosted, pnr_verified, created_at,
          traveler:profiles!traveler_id(full_name, avatar_url, trust_score, id_verified)
        `)
        .eq('status', 'active')
        .order('is_boosted', { ascending: false })
        .order('departure_date', { ascending: true });

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      // Map id_verified → verified to match the Trip interface
      const trips: Trip[] = (data ?? []).map((row: any) => ({
        ...row,
        traveler: {
          full_name: row.traveler?.full_name ?? 'Unknown',
          avatar_url: row.traveler?.avatar_url,
          trust_score: row.traveler?.trust_score ?? 0,
          verified: row.traveler?.id_verified ?? false,
        },
      }));

      set({ trips, filteredTrips: trips, loading: false });
      get().applyFilters();
    } catch (err) {
      set({ error: 'Failed to fetch trips', loading: false });
    }
  },

  setSelectedMyTrip: (trip) => set({ selectedMyTrip: trip }),

  fetchMyTrips: async () => {
    set({ myTripsLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { set({ myTripsLoading: false }); return; }

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, traveler_id, origin_city, origin_country,
          destination_city, destination_country,
          departure_date, departure_time, arrival_date,
          flight_number, airline, available_weight_kg,
          price_per_kg, status, is_boosted, pnr_verified, created_at
        `)
        .eq('traveler_id', session.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) { set({ myTripsLoading: false }); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, trust_score, id_verified')
        .eq('id', session.user.id)
        .single();

      const myTrips: Trip[] = (data ?? []).map((row: any) => ({
        ...row,
        traveler: {
          full_name: profile?.full_name ?? 'You',
          avatar_url: profile?.avatar_url,
          trust_score: profile?.trust_score ?? 0,
          verified: profile?.id_verified ?? false,
        },
      }));

      set({ myTrips, myTripsLoading: false });
    } catch {
      set({ myTripsLoading: false });
    }
  },

  createTrip: async (tripData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { error } = await supabase.from('trips').insert({
      traveler_id: session.user.id,
      status: 'active',
      origin_city: tripData.origin_city,
      origin_country: tripData.origin_country,
      destination_city: tripData.destination_city,
      destination_country: tripData.destination_country,
      departure_date: tripData.departure_date,
      departure_time: tripData.departure_time || null,
      flight_number: tripData.flight_number || null,
      airline: tripData.airline || null,
      available_weight_kg: tripData.available_weight_kg,
      price_per_kg: tripData.price_per_kg,
      notes: tripData.notes || null,
    });

    if (error) throw new Error(error.message);
    await get().fetchMyTrips();
  },

  fetchTripMatches: async (tripId) => {
    set({ tripMatchesLoading: true });
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, trip_id, request_id, status, contact_unlocked,
          agreed_weight_kg, agreed_price,
          sender:profiles!sender_id(full_name, avatar_url, trust_score, id_verified),
          request:requests!request_id(package_description, package_weight_kg, needed_by_date)
        `)
        .eq('trip_id', tripId)
        .eq('status', 'initiated');

      if (error) { set({ tripMatchesLoading: false }); return; }

      const tripMatches: TravelerMatch[] = (data ?? []).map((row: any) => ({
        id: row.id,
        trip_id: row.trip_id,
        request_id: row.request_id,
        sender: {
          full_name: row.sender?.full_name ?? 'Unknown',
          avatar_url: row.sender?.avatar_url,
          trust_score: row.sender?.trust_score ?? 0,
          id_verified: row.sender?.id_verified ?? false,
        },
        agreed_weight_kg: row.agreed_weight_kg ?? 0,
        agreed_price: row.agreed_price ?? null,
        package_description: row.request?.package_description ?? null,
        package_weight_kg: row.request?.package_weight_kg ?? null,
        needed_by_date: row.request?.needed_by_date ?? null,
        status: row.status,
        contact_unlocked: row.contact_unlocked ?? false,
      }));

      set({ tripMatches, tripMatchesLoading: false });
    } catch {
      set({ tripMatchesLoading: false });
    }
  },

  respondToMatch: async (matchId, response) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: response })
      .eq('id', matchId);

    if (error) throw new Error(error.message);

    set((state) => ({
      tripMatches: response === 'cancelled'
        ? state.tripMatches.filter((m) => m.id !== matchId)
        : state.tripMatches.map((m) =>
            m.id === matchId ? { ...m, status: response } : m
          ),
    }));
  },
}));
