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
}));
