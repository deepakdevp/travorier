/**
 * Trips Store - Manage trips data and filters
 * Uses Zustand for state management
 */
import { create } from 'zustand';

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

// Mock data for development
const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    traveler_id: 'user1',
    traveler: {
      full_name: 'Rajesh Kumar',
      trust_score: 85,
      verified: true,
    },
    origin_city: 'Mumbai',
    origin_country: 'India',
    destination_city: 'New York',
    destination_country: 'USA',
    departure_date: '2026-03-15',
    departure_time: '14:30',
    arrival_date: '2026-03-16',
    flight_number: 'AI191',
    airline: 'Air India',
    available_weight_kg: 15.0,
    price_per_kg: 500,
    status: 'active',
    is_boosted: true,
    pnr_verified: true,
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: '2',
    traveler_id: 'user2',
    traveler: {
      full_name: 'Priya Sharma',
      avatar_url: 'https://i.pravatar.cc/150?img=5',
      trust_score: 92,
      verified: true,
    },
    origin_city: 'Delhi',
    origin_country: 'India',
    destination_city: 'London',
    destination_country: 'UK',
    departure_date: '2026-03-20',
    departure_time: '23:00',
    flight_number: 'BA142',
    airline: 'British Airways',
    available_weight_kg: 10.0,
    price_per_kg: 450,
    status: 'active',
    is_boosted: false,
    pnr_verified: true,
    created_at: '2026-02-12T14:30:00Z',
  },
  {
    id: '3',
    traveler_id: 'user3',
    traveler: {
      full_name: 'Amit Patel',
      trust_score: 78,
      verified: false,
    },
    origin_city: 'Bangalore',
    origin_country: 'India',
    destination_city: 'Singapore',
    destination_country: 'Singapore',
    departure_date: '2026-03-18',
    departure_time: '09:15',
    flight_number: 'SQ502',
    airline: 'Singapore Airlines',
    available_weight_kg: 20.0,
    price_per_kg: 350,
    status: 'active',
    is_boosted: false,
    pnr_verified: false,
    created_at: '2026-02-14T08:00:00Z',
  },
  {
    id: '4',
    traveler_id: 'user4',
    traveler: {
      full_name: 'Sarah Johnson',
      avatar_url: 'https://i.pravatar.cc/150?img=9',
      trust_score: 95,
      verified: true,
    },
    origin_city: 'Mumbai',
    origin_country: 'India',
    destination_city: 'Dubai',
    destination_country: 'UAE',
    departure_date: '2026-03-12',
    departure_time: '16:45',
    flight_number: 'EK500',
    airline: 'Emirates',
    available_weight_kg: 12.0,
    price_per_kg: 400,
    status: 'active',
    is_boosted: true,
    pnr_verified: true,
    created_at: '2026-02-11T12:00:00Z',
  },
  {
    id: '5',
    traveler_id: 'user5',
    traveler: {
      full_name: 'Vikram Singh',
      trust_score: 88,
      verified: true,
    },
    origin_city: 'Delhi',
    origin_country: 'India',
    destination_city: 'Toronto',
    destination_country: 'Canada',
    departure_date: '2026-03-25',
    departure_time: '20:30',
    flight_number: 'AC042',
    airline: 'Air Canada',
    available_weight_kg: 18.0,
    price_per_kg: 550,
    status: 'active',
    is_boosted: false,
    pnr_verified: true,
    created_at: '2026-02-13T16:20:00Z',
  },
];

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

  // Fetch trips (mock implementation)
  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production, this would be:
      // const { data, error } = await supabase
      //   .from('trips')
      //   .select('*, traveler:profiles(*)')
      //   .eq('status', 'active');

      set({ trips: MOCK_TRIPS, filteredTrips: MOCK_TRIPS, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch trips', loading: false });
    }
  },
}));
