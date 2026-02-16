# Travorier - Technical Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [API Architecture](#api-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [Real-Time Features](#real-time-features)
6. [Payment Processing](#payment-processing)
7. [File Storage](#file-storage)
8. [Notification System](#notification-system)
9. [Security Model](#security-model)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### High-Level Architecture

```
┌─────────────────┐
│  React Native   │
│   Mobile App    │
│   (Expo/TS)     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   Supabase      │  │   FastAPI    │
│   PostgreSQL    │  │   Backend    │
│   Auth/Storage  │  │  (Vercel)    │
│   Realtime      │  └──────┬───────┘
└─────────────────┘         │
         │                  │
         └──────────┬───────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    ┌─────────┐          ┌─────────┐
    │ Stripe  │          │Firebase │
    │Payments │          │  FCM    │
    └─────────┘          └─────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native (Expo) | Cross-platform mobile app |
| **Backend** | FastAPI (Python) | REST API, business logic |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Auth** | Supabase Auth | OAuth, OTP, JWT management |
| **Storage** | Supabase Storage | Image/video uploads |
| **Real-time** | Supabase Realtime | Chat, live updates |
| **Payments** | Stripe | Credit purchases, unlock fees |
| **Notifications** | Firebase FCM | Push notifications |
| **Hosting** | Vercel | Backend API hosting |
| **Monitoring** | Sentry | Error tracking |

---

## Database Schema

### Core Tables

#### 1. `users` (Supabase Auth Extended)
```sql
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

  -- User Type
  user_types TEXT[] DEFAULT '{}', -- ['traveler', 'sender']

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_id_verified ON public.profiles(id_verified);
CREATE INDEX idx_profiles_trust_score ON public.profiles(trust_score DESC);
```

#### 2. `trips`
```sql
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
  available_weight_kg DECIMAL(5,2) NOT NULL,
  price_per_kg DECIMAL(8,2) NOT NULL,

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

-- Indexes
CREATE INDEX idx_trips_traveler ON public.trips(traveler_id);
CREATE INDEX idx_trips_route ON public.trips(origin_city, destination_city, departure_date);
CREATE INDEX idx_trips_status ON public.trips(status) WHERE status = 'active';
CREATE INDEX idx_trips_departure ON public.trips(departure_date DESC);
CREATE INDEX idx_trips_boosted ON public.trips(is_boosted, boosted_until) WHERE is_boosted = TRUE;
```

#### 3. `requests`
```sql
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Route Information
  origin_city TEXT NOT NULL,
  origin_country TEXT NOT NULL DEFAULT 'India',
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,

  -- Package Details
  package_weight_kg DECIMAL(5,2) NOT NULL,
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

-- Indexes
CREATE INDEX idx_requests_sender ON public.requests(sender_id);
CREATE INDEX idx_requests_route ON public.requests(origin_city, destination_city, needed_by_date);
CREATE INDEX idx_requests_status ON public.requests(status) WHERE status = 'active';
```

#### 4. `matches`
```sql
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
  delivery_fee_paid BOOLEAN DEFAULT FALSE, -- Offline payment

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

-- Indexes
CREATE INDEX idx_matches_trip ON public.matches(trip_id);
CREATE INDEX idx_matches_traveler ON public.matches(traveler_id);
CREATE INDEX idx_matches_sender ON public.matches(sender_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE UNIQUE INDEX idx_matches_qr ON public.matches(qr_code) WHERE qr_code IS NOT NULL;
```

#### 5. `messages`
```sql
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
  system_event_type TEXT, -- 'flight_delayed', 'inspection_complete', etc.

  -- Status
  read_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
```

#### 6. `inspections`
```sql
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.profiles(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Media Evidence
  media_type TEXT CHECK (media_type IN ('photo', 'video')) NOT NULL,
  media_urls TEXT[] NOT NULL, -- Array of URLs

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

-- Indexes
CREATE INDEX idx_inspections_match ON public.inspections(match_id);
CREATE INDEX idx_inspections_traveler ON public.inspections(traveler_id);
```

#### 7. `transactions`
```sql
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

  -- Related Entities
  match_id UUID REFERENCES public.matches(id),
  trip_id UUID REFERENCES public.trips(id),

  -- Credit Pack Details
  credit_pack_size INTEGER, -- 1, 5, 10
  discount_percentage INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE, -- 1 year from purchase

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_stripe ON public.transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_status ON public.transactions(payment_status);
```

#### 8. `credits`
```sql
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),

  -- Credit Details
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_original INTEGER NOT NULL,

  -- Validity
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expired BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credits_user ON public.credits(user_id, expires_at);
CREATE INDEX idx_credits_expiry ON public.credits(expires_at) WHERE NOT expired;
```

#### 9. `reviews`
```sql
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
  pnr_verified_trip BOOLEAN DEFAULT FALSE, -- 2x weight for verified trips

  -- Status
  flagged BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id, created_at DESC);
CREATE INDEX idx_reviews_match ON public.reviews(match_id);
CREATE UNIQUE INDEX idx_reviews_unique ON public.reviews(match_id, reviewer_id);
```

#### 10. `notifications`
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Notification Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('match', 'message', 'handover', 'flight_update', 'payment', 'review', 'system')) NOT NULL,

  -- Related Entity
  related_entity_type TEXT, -- 'match', 'trip', 'message', etc.
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

-- Indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
```

---

## API Architecture

For complete API endpoint specifications, request/response schemas, authentication details, error codes, and code examples, see **[API.md](./API.md)**.

### Backend Structure (FastAPI)

```
backend/
├── app/
│   ├── main.py                 # FastAPI app initialization
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Login, signup, OTP
│   │   │   ├── users.py        # Profile management
│   │   │   ├── trips.py        # Trip CRUD, search
│   │   │   ├── requests.py     # Request CRUD, search
│   │   │   ├── matches.py      # Match creation, contact unlock
│   │   │   ├── messages.py     # Chat (supplementary to Realtime)
│   │   │   ├── payments.py     # Stripe integration
│   │   │   ├── inspections.py  # Media upload, approval
│   │   │   ├── reviews.py      # Rating system
│   │   │   └── notifications.py # Push notification triggers
│   ├── core/
│   │   ├── config.py           # Settings, env vars
│   │   ├── security.py         # JWT validation, middleware
│   │   └── dependencies.py     # Common dependencies
│   ├── models/
│   │   └── ...                 # SQLAlchemy models (mirror of schema)
│   ├── schemas/
│   │   └── ...                 # Pydantic request/response models
│   ├── services/
│   │   ├── supabase.py         # Supabase client
│   │   ├── stripe_service.py   # Payment processing
│   │   ├── notification.py     # FCM integration
│   │   ├── qr_service.py       # QR generation
│   │   └── verification.py     # Manual verification logic
│   └── utils/
│       └── helpers.py
├── requirements.txt
└── vercel.json                 # Vercel deployment config
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─────────────────┐
     │                 │
     ▼                 ▼
┌─────────┐      ┌──────────┐
│ Google  │      │  Phone   │
│  OAuth  │      │   OTP    │
└────┬────┘      └─────┬────┘
     │                 │
     └────────┬────────┘
              │
              ▼
      ┌──────────────┐
      │  Supabase    │
      │    Auth      │
      └──────┬───────┘
             │
             ▼
        JWT Token
             │
             ▼
      ┌──────────────┐
      │   FastAPI    │
      │  + Supabase  │
      │   Clients    │
      └──────────────┘
```

### Row-Level Security (RLS) Policies

#### profiles
```sql
-- Users can read any profile
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### trips
```sql
-- Anyone can view active trips
CREATE POLICY "Active trips are viewable by everyone"
  ON trips FOR SELECT
  USING (status = 'active' OR traveler_id = auth.uid());

-- Only trip owner can update
CREATE POLICY "Travelers can update own trips"
  ON trips FOR UPDATE
  USING (traveler_id = auth.uid());
```

#### messages
```sql
-- Only match participants can read messages
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
```

---

## Real-Time Features

### Supabase Realtime Subscriptions

#### Chat Messages
```typescript
// Mobile app subscribes to match-specific messages
const subscription = supabase
  .channel(`match:${matchId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `match_id=eq.${matchId}`
    },
    (payload) => {
      // Add new message to chat UI
    }
  )
  .subscribe();
```

#### Flight Status Updates
```typescript
// Subscribe to trip updates
const tripSubscription = supabase
  .channel(`trip:${tripId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'trips',
      filter: `id=eq.${tripId}`
    },
    (payload) => {
      // Update flight status in UI
    }
  )
  .subscribe();
```

---

## Payment Processing

### Stripe Integration Flow

```
1. User clicks "Unlock Contact" (₹99)
   ↓
2. Mobile app calls: POST /api/v1/payments/create-intent
   ↓
3. Backend creates Stripe PaymentIntent
   ↓
4. Mobile app presents Stripe payment sheet
   ↓
5. User completes payment
   ↓
6. Stripe webhook → POST /api/v1/payments/webhook
   ↓
7. Backend updates:
   - transactions table (payment_status = 'succeeded')
   - matches table (contact_unlocked = true)
   - profiles table (credit_balance -= 1 OR direct charge)
   ↓
8. Real-time update unlocks chat in mobile app
```

### Credit Pack Pricing

| Pack Size | Price | Discount | Price per Credit | Validity |
|-----------|-------|----------|------------------|----------|
| 1 Credit  | ₹99   | 0%       | ₹99              | 1 year   |
| 5 Credits | ₹445  | 10%      | ₹89              | 1 year   |
| 10 Credits| ₹792  | 20%      | ₹79.20           | 1 year   |

---

## File Storage

### Supabase Storage Buckets

#### `id-documents` (Private)
- User ID uploads (passport, driver's license)
- Selfies for verification
- Access: Admin only

#### `boarding-passes` (Private)
- PNR verification screenshots
- Access: Trip owner + admin

#### `inspections` (Private)
- Package inspection photos/videos
- Access: Match participants only

#### `avatars` (Public)
- User profile pictures
- Access: Public read, owner write

### Storage Security
```sql
-- Example: Inspection media access policy
CREATE POLICY "Match participants can view inspection media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inspections'
    AND (storage.foldername(name))[1] IN (
      SELECT match_id::text FROM matches
      WHERE traveler_id = auth.uid() OR sender_id = auth.uid()
    )
  );
```

---

## Notification System

### Push Notification Types

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| New Match | Trip matches request | Traveler + Sender | High |
| Message Received | New chat message | Other participant | High |
| Handover Reminder | 3hrs before flight | Both parties | Critical |
| Flight Landed | Arrival detected | Sender + Recipient | Critical |
| QR Ready | Handover confirmed | Sender (for recipient) | High |
| Payment Success | Stripe webhook | Payer | Medium |
| Review Request | Delivery complete | Both parties | Low |

### Firebase Cloud Messaging Setup

```typescript
// Store FCM token on login
async function registerFCMToken(userId: string, token: string) {
  await supabase
    .from('profiles')
    .update({ fcm_token: token })
    .eq('id', userId);
}

// Backend sends notification
async function sendPushNotification(userId: string, notification: Notification) {
  const { data } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', userId)
    .single();

  if (data.fcm_token) {
    await admin.messaging().send({
      token: data.fcm_token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        deepLink: notification.deep_link
      }
    });
  }
}
```

---

## Security Model

### Data Protection

1. **Encryption at Rest**: All Supabase data encrypted (AES-256)
2. **Encryption in Transit**: HTTPS/TLS 1.3 only
3. **JWT Security**: Short-lived tokens (1 hour), refresh tokens (7 days)
4. **PII Handling**: Minimal collection, GDPR-ready deletion

### API Security

```python
# FastAPI middleware for JWT validation
from fastapi import Depends, HTTPException
from supabase import Client

async def get_current_user(
    authorization: str = Header(...),
    supabase: Client = Depends(get_supabase_client)
):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Input Validation
- All inputs validated via Pydantic schemas
- SQL injection prevented by Supabase client
- XSS prevention via React Native (no innerHTML)

---

## Deployment Architecture

### Production Setup

```
┌─────────────────┐
│   Cloudflare    │  (CDN, DDoS protection)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Vercel      │  (FastAPI hosting)
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   Supabase      │  │   Stripe     │
│   (Database)    │  │  (Payments)  │
└─────────────────┘  └──────────────┘
```

### Environment Variables

#### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FIREBASE_ADMIN_CREDENTIALS={"type": "service_account"...}
SENTRY_DSN=https://xxx@sentry.io/xxx
ENVIRONMENT=production
```

#### Mobile (.env)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_API_URL=https://api.travorier.com
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Monitoring & Observability

### Error Tracking (Sentry)
- Backend: Python SDK with FastAPI integration
- Mobile: React Native SDK with source maps

### Logging Strategy
- **Development**: Console logs
- **Production**: Structured JSON logs to Sentry
- **Audit Trail**: All transactions, matches logged

### Metrics to Track
- API response times (p50, p95, p99)
- Database query performance
- Payment success rate
- Push notification delivery rate
- Chat message latency

---

## Appendix: Database Triggers & Functions

### Auto-update Trust Score
```sql
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id
    ),
    trust_score = CASE
      WHEN (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id AND pnr_verified_trip = true) >= 5
      THEN (SELECT AVG(rating) * 20 FROM reviews WHERE reviewee_id = NEW.reviewee_id)
      ELSE (SELECT AVG(rating) * 15 FROM reviews WHERE reviewee_id = NEW.reviewee_id)
    END
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trust_score
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_trust_score();
```

### Auto-lock Chat After 24 Hours
```sql
CREATE OR REPLACE FUNCTION auto_lock_chat()
RETURNS void AS $$
BEGIN
  UPDATE matches
  SET status = 'completed'
  WHERE status = 'delivered'
  AND delivered_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Run via cron job or Supabase function
```

---

## Future Enhancements (V2)

1. **GraphQL API**: Consider for complex queries
2. **Redis Caching**: For trip search results
3. **Elasticsearch**: For better search with filters
4. **WebSockets**: Direct WebSocket for chat (if Realtime insufficient)
5. **CDN**: Cloudflare for media delivery
6. **Microservices**: Split verification, payments into separate services

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Author**: Deepak Panwar
