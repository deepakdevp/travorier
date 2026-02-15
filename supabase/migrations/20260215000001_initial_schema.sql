-- Travorier Initial Database Schema
-- Created: 2026-02-15
-- Description: Core tables for MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,

  -- Verification Status
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  id_verification_status TEXT CHECK (id_verification_status IN ('pending', 'approved', 'rejected', 'not_submitted')) DEFAULT 'not_submitted',
  id_document_url TEXT,
  selfie_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Trust Metrics
  trust_score INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  frequent_flyer BOOLEAN DEFAULT FALSE,
  frequent_flyer_earned_at TIMESTAMP WITH TIME ZONE,

  -- Credit System
  credit_balance INTEGER DEFAULT 0,
  total_credits_purchased INTEGER DEFAULT 0,

  -- FCM Token for push notifications
  fcm_token TEXT,

  -- User Type
  user_types TEXT[] DEFAULT '{}', -- ['traveler', 'sender']

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for profiles
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_id_verified ON public.profiles(id_verified);
CREATE INDEX idx_profiles_trust_score ON public.profiles(trust_score DESC);

-- =====================================================
-- TRIPS TABLE
-- =====================================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Route Information
  origin_city TEXT NOT NULL,
  origin_country TEXT NOT NULL DEFAULT 'India',
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,

  -- Flight Details
  flight_number TEXT,
  airline TEXT,
  pnr_code TEXT,
  pnr_verified BOOLEAN DEFAULT FALSE,
  boarding_pass_url TEXT,
  departure_date DATE NOT NULL,
  departure_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  flight_status TEXT CHECK (flight_status IN ('scheduled', 'delayed', 'departed', 'landed', 'cancelled')) DEFAULT 'scheduled',

  -- Capacity & Pricing
  available_weight_kg DECIMAL(5,2) NOT NULL CHECK (available_weight_kg > 0),
  price_per_kg DECIMAL(8,2) NOT NULL CHECK (price_per_kg >= 0),

  -- Status
  status TEXT CHECK (status IN ('draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled')) DEFAULT 'draft',
  is_boosted BOOLEAN DEFAULT FALSE,
  boosted_until TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for trips
CREATE INDEX idx_trips_traveler ON public.trips(traveler_id);
CREATE INDEX idx_trips_route ON public.trips(origin_city, destination_city, departure_date);
CREATE INDEX idx_trips_status ON public.trips(status) WHERE status = 'active';
CREATE INDEX idx_trips_departure ON public.trips(departure_date DESC);
CREATE INDEX idx_trips_boosted ON public.trips(is_boosted, boosted_until) WHERE is_boosted = TRUE;

-- =====================================================
-- REQUESTS TABLE
-- =====================================================
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Route Information
  origin_city TEXT NOT NULL,
  origin_country TEXT NOT NULL DEFAULT 'India',
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,

  -- Package Details
  package_weight_kg DECIMAL(5,2) NOT NULL CHECK (package_weight_kg > 0),
  package_description TEXT NOT NULL,
  package_value DECIMAL(10,2),

  -- Timing
  needed_by_date DATE NOT NULL,
  flexible_dates BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT CHECK (status IN ('active', 'matched', 'completed', 'cancelled')) DEFAULT 'active',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for requests
CREATE INDEX idx_requests_sender ON public.requests(sender_id);
CREATE INDEX idx_requests_route ON public.requests(origin_city, destination_city, needed_by_date);
CREATE INDEX idx_requests_status ON public.requests(status) WHERE status = 'active';

-- =====================================================
-- TRANSACTIONS TABLE (must be created before matches)
-- =====================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Transaction Type
  transaction_type TEXT CHECK (transaction_type IN ('credit_purchase', 'contact_unlock', 'listing_fee', 'trip_boost', 'refund')) NOT NULL,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  credits_purchased INTEGER,
  credits_used INTEGER,

  -- Payment Details
  stripe_payment_intent_id TEXT UNIQUE,
  payment_status TEXT CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',

  -- Credit Pack Details
  credit_pack_size INTEGER,
  discount_percentage INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_stripe ON public.transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_status ON public.transactions(payment_status);

-- =====================================================
-- MATCHES TABLE
-- =====================================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  traveler_id UUID NOT NULL REFERENCES public.profiles(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Contact Unlock
  contact_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlock_transaction_id UUID REFERENCES public.transactions(id),

  -- Agreement Details
  agreed_weight_kg DECIMAL(5,2),
  agreed_price DECIMAL(10,2),
  delivery_fee_paid BOOLEAN DEFAULT FALSE,

  -- Status Tracking
  status TEXT CHECK (status IN ('initiated', 'negotiating', 'agreed', 'handover_scheduled', 'in_transit', 'delivered', 'cancelled', 'disputed')) DEFAULT 'initiated',

  -- Handover
  handover_location TEXT,
  handover_time TIMESTAMP WITH TIME ZONE,
  inspection_completed BOOLEAN DEFAULT FALSE,

  -- Delivery
  qr_code TEXT UNIQUE,
  qr_code_url TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,

  -- Post-Delivery
  sender_rated BOOLEAN DEFAULT FALSE,
  traveler_rated BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for matches
CREATE INDEX idx_matches_trip ON public.matches(trip_id);
CREATE INDEX idx_matches_traveler ON public.matches(traveler_id);
CREATE INDEX idx_matches_sender ON public.matches(sender_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE UNIQUE INDEX idx_matches_qr ON public.matches(qr_code) WHERE qr_code IS NOT NULL;

-- Add foreign key reference to transactions.match_id (now that matches table exists)
ALTER TABLE public.transactions ADD COLUMN match_id UUID REFERENCES public.matches(id);
ALTER TABLE public.transactions ADD COLUMN trip_id UUID REFERENCES public.trips(id);
CREATE INDEX idx_transactions_match ON public.transactions(match_id);
CREATE INDEX idx_transactions_trip ON public.transactions(trip_id);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Message Content
  content TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'video', 'system')) DEFAULT 'text',
  media_url TEXT,

  -- System Messages
  is_system_message BOOLEAN DEFAULT FALSE,
  system_event_type TEXT,

  -- Status
  read_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for messages
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_unread ON public.messages(match_id) WHERE read_at IS NULL;

-- =====================================================
-- INSPECTIONS TABLE
-- =====================================================
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.profiles(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Media Evidence
  media_type TEXT CHECK (media_type IN ('photo', 'video')) NOT NULL,
  media_urls TEXT[] NOT NULL,

  -- Inspection Details
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),

  -- Approval
  approved BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for inspections
CREATE INDEX idx_inspections_match ON public.inspections(match_id);
CREATE INDEX idx_inspections_traveler ON public.inspections(traveler_id);

-- =====================================================
-- CREDITS TABLE
-- =====================================================
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),

  -- Credit Details
  credits_remaining INTEGER NOT NULL DEFAULT 0 CHECK (credits_remaining >= 0),
  credits_original INTEGER NOT NULL CHECK (credits_original > 0),

  -- Validity
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expired BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for credits
CREATE INDEX idx_credits_user ON public.credits(user_id, expires_at);
CREATE INDEX idx_credits_expiry ON public.credits(expires_at) WHERE NOT expired;
CREATE INDEX idx_credits_valid ON public.credits(user_id) WHERE NOT expired AND credits_remaining > 0;

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,

  -- Context
  reviewer_role TEXT CHECK (reviewer_role IN ('traveler', 'sender')) NOT NULL,
  pnr_verified_trip BOOLEAN DEFAULT FALSE,

  -- Status
  flagged BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id, created_at DESC);
CREATE INDEX idx_reviews_match ON public.reviews(match_id);
CREATE UNIQUE INDEX idx_reviews_unique ON public.reviews(match_id, reviewer_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Notification Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('match', 'message', 'handover', 'flight_update', 'payment', 'review', 'system')) NOT NULL,

  -- Related Entity
  related_entity_type TEXT,
  related_entity_id UUID,

  -- Delivery
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Deep Link
  deep_link TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trips policies
CREATE POLICY "Active trips are viewable by everyone"
  ON trips FOR SELECT
  USING (status = 'active' OR traveler_id = auth.uid());

CREATE POLICY "Travelers can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (traveler_id = auth.uid());

CREATE POLICY "Travelers can update own trips"
  ON trips FOR UPDATE
  USING (traveler_id = auth.uid());

CREATE POLICY "Travelers can delete own trips"
  ON trips FOR DELETE
  USING (traveler_id = auth.uid());

-- Requests policies
CREATE POLICY "Active requests are viewable by everyone"
  ON requests FOR SELECT
  USING (status = 'active' OR sender_id = auth.uid());

CREATE POLICY "Senders can insert own requests"
  ON requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can update own requests"
  ON requests FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Senders can delete own requests"
  ON requests FOR DELETE
  USING (sender_id = auth.uid());

-- Matches policies
CREATE POLICY "Match participants can view matches"
  ON matches FOR SELECT
  USING (traveler_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Anyone can create matches"
  ON matches FOR INSERT
  WITH CHECK (traveler_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Match participants can update matches"
  ON matches FOR UPDATE
  USING (traveler_id = auth.uid() OR sender_id = auth.uid());

-- Messages policies
CREATE POLICY "Match participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
      AND matches.contact_unlocked = true
    )
  );

CREATE POLICY "Match participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
      AND matches.contact_unlocked = true
    )
  );

-- Inspections policies
CREATE POLICY "Match participants can view inspections"
  ON inspections FOR SELECT
  USING (traveler_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Travelers can insert inspections"
  ON inspections FOR INSERT
  WITH CHECK (traveler_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Credits policies
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (user_id = auth.uid());

-- Reviews policies
CREATE POLICY "Reviews are publicly viewable"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Match participants can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update trust score after review
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = NEW.reviewee_id
    ),
    trust_score = CASE
      WHEN (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id AND pnr_verified_trip = true) >= 5
      THEN (SELECT COALESCE(AVG(rating), 0) * 20 FROM reviews WHERE reviewee_id = NEW.reviewee_id)
      ELSE (SELECT COALESCE(AVG(rating), 0) * 15 FROM reviews WHERE reviewee_id = NEW.reviewee_id)
    END
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trust_score
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_trust_score();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS (created via Supabase Dashboard or CLI)
-- =====================================================

-- Note: These would typically be created via Supabase Dashboard or CLI
-- Bucket: id-documents (private)
-- Bucket: boarding-passes (private)
-- Bucket: inspections (private)
-- Bucket: avatars (public)

-- =====================================================
-- INITIAL DATA / SEED (Optional)
-- =====================================================

-- Insert admin user (optional, for testing)
-- INSERT INTO public.profiles (id, email, full_name, id_verified, trust_score)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@travorier.com', 'Admin User', true, 100);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
