# Travorier - Claude Context

> **Last Updated**: February 16, 2026
> **Current Phase**: Week 1 - Authentication (Day 2-3)
> **Current Milestone**: Milestone 1 - Visual Authentication (In Progress)
> **Developer**: Solo full-stack (Deepak Panwar)
> **Timeline**: 12 weeks to MVP

---

## 📋 Important References

**ALWAYS refer to these files when working on Travorier:**

1. **[.claude/plan.md](.claude/plan.md)** - Current development plan with milestones and phases
   - Check this FIRST to understand what you're building
   - Update status after completing each phase/milestone

2. **[.claude/commit.md](.claude/commit.md)** - Git commit conventions
   - **CRITICAL**: Commit after EVERY minor or major task completion
   - Follow Conventional Commits format: `<type>(<scope>): <description>`
   - Reference plan phase/milestone in commit body

3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and database schema

4. **[docs/API.md](docs/API.md)** - API endpoint specifications

5. **[docs/PRD.md](docs/PRD.md)** - Product requirements

---

## 🔄 Development Workflow

### After Every Task:
1. ✅ **Complete the task** (file created/updated and working)
2. ✅ **Test locally** (verify it works as expected)
3. ✅ **Stage changes**: `git add <files>`
4. ✅ **Commit**: `git commit -m "type(scope): description"` (see commit.md)
5. ✅ **Update plan.md** status if phase/milestone complete
6. ✅ **Continue** to next task or push to remote

### Commit Frequency:
- After **every file creation/update** that works
- After **every phase completion**
- After **every milestone completion**
- Before **switching between backend ↔ mobile work**
- **Every 15-30 minutes** during active development

---

## Quick Facts

| Attribute | Value |
|-----------|-------|
| **Product Type** | Crowdsourced logistics platform |
| **Business Model** | Discovery & Access fee (B2C marketplace) |
| **Target Market** | India (primary), International (secondary) |
| **Launch Timeline** | Week 12 (March 2026) |
| **Bootstrap Budget** | ₹876/month (MVP: ₹167/month) |
| **GitHub Repo** | [github.com/deepakdevp/travorier](https://github.com/deepakdevp/travorier) |

---

## Core Business Model

**Value Proposition**: Connect travelers willing to carry packages with senders who need affordable, fast delivery via trusted individuals.

**Revenue Streams**:
1. **Contact Unlock Fee**: ₹99/unlock (1 credit) - Primary revenue
2. **Trip Listing Fee**: ₹49/listing (optional, post-MVP)
3. **Boost Trip**: ₹199 for 7-day featured placement (optional)

**Credit Packs** (Stripe payments):
- Starter: ₹249 → 5 credits (₹49.80/credit)
- Value: ₹399 → 10 credits (₹39.90/credit, 20% off)
- Pro: ₹749 → 25 credits (₹29.96/credit, 40% off)

**Key Differentiator**: Offline P2P delivery payment (zero commission), platform only charges for discovery.

---

## Technology Stack

### Frontend
- **Framework**: React Native (Expo SDK 50)
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router (file-based)
- **Key Libraries**: @supabase/supabase-js, @stripe/stripe-react-native, axios

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Deployment**: Vercel (serverless)
- **Key Libraries**: supabase-py, stripe, firebase-admin, pydantic

### Database & Auth
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth (Google OAuth, Phone OTP)
- **Storage**: Supabase Storage (profile pics, inspection media, documents)
- **Real-time**: Supabase Realtime (chat messaging)

### Payments & Notifications
- **Payments**: Stripe (test mode for MVP)
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Development Tools
- **Version Control**: Git + GitHub
- **Package Managers**: pip (Python), npm (Node.js)
- **Testing**: Manual testing (MVP), pytest + Jest (post-MVP)
- **Monitoring**: Sentry (error tracking)

---

## Current Development Phase

### Week 1 Progress (Days 2-3)

**✅ Infrastructure Completed (Days 1-2)**:
- [x] Git repository initialized and pushed to GitHub
- [x] Complete project documentation (9 docs totaling 7,000+ lines)
- [x] Database schema with 10 tables + RLS policies deployed to Supabase
- [x] Backend FastAPI boilerplate with all dependencies installed
- [x] Mobile React Native (Expo) boilerplate with npm packages installed
- [x] Supabase project created and connection verified
- [x] Google OAuth configured in Supabase and Google Cloud
- [x] Environment variables configured (.env files)
- [x] Development plan created (plan.md)
- [x] Git commit conventions documented (commit.md)

**🔄 Currently Working On: Milestone 1 - Visual Authentication**:
- [ ] Phase 1.1: Create mobile login screen UI (30 min)
- [ ] Phase 1.2: Add Google OAuth method to auth store (20 min)
- [ ] Phase 1.3: Enable navigation logic (10 min)
- [ ] Phase 1.4: Create backend auth schemas (15 min)
- [ ] Phase 1.5: Implement Google OAuth endpoint (30 min)
- [ ] Phase 1.6: Enable auth routes (5 min)
- [ ] Phase 1.7: Test end-to-end authentication (15 min)

**⏳ Next Milestones (Days 3-7)**:
- Milestone 2: Homepage & Navigation (2.5 hours)
- Milestone 3: Traveler Journey - Browse & Match (4 hours)
- Milestone 4: Sender Journey - Post & Match (3.5 hours)
- Milestone 5: Profile & Settings (2 hours)

---

## Key Architectural Patterns

### Database Schema (10 Tables)

1. **profiles** - User profiles with trust score, verification status
2. **trips** - Traveler trip listings with origin/destination/dates
3. **requests** - Sender package requests
4. **matches** - Trip-request pairings (core business logic)
5. **messages** - Real-time chat (Supabase Realtime)
6. **inspections** - Package inspection evidence (photos/videos)
7. **transactions** - Payment and credit transactions
8. **credits** - Credit balance ledger
9. **reviews** - User ratings (both directions)
10. **notifications** - Push notification queue

### Authorization: Row-Level Security (RLS)

**All tables** have RLS enabled with policies enforcing:
- Users can only read/update their own data
- Public profiles visible to all authenticated users
- Private data (contacts, documents) hidden until unlocked
- Supabase Auth JWT automatically enforces policies

**Example Policy**:
```sql
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### API Structure

**Base URL**: `https://api.travorier.com` (or `localhost:8000` in dev)

**Endpoint Groups**:
- `/api/v1/auth` - Authentication (Google OAuth, OTP, JWT)
- `/api/v1/users` - Profile management, verification
- `/api/v1/trips` - Trip CRUD, search, filters
- `/api/v1/requests` - Request CRUD, search
- `/api/v1/matches` - Match creation, contact unlock (₹99)
- `/api/v1/payments` - Stripe integration, credit purchase
- `/api/v1/reviews` - Rating system

**Authentication**: JWT Bearer tokens (1-hour expiry, auto-refresh)

---

## Important Constraints (MVP / Bootstrap)

### MVP Compromises (Cost Savings)

1. **Manual ID Verification** (not automated KYC)
   - Rationale: iDenfy costs ₹80-100/verification
   - MVP: Admin manually verifies Aadhaar/PAN/Passport
   - Post-MVP: Integrate Digio or equivalent

2. **Manual PNR Verification** (not automated flight API)
   - Rationale: FlightAPI.io costs ₹8,000-24,000/month
   - MVP: Travelers upload boarding pass, admin verifies
   - Post-MVP: Integrate FlightStats or Amadeus

3. **Email + FCM Only** (no WhatsApp Business API)
   - Rationale: WhatsApp API requires business verification
   - MVP: Push notifications via Firebase FCM
   - Post-MVP: Add WhatsApp integration

4. **No Automated Testing** (manual QA)
   - Rationale: 30-50% dev time overhead
   - MVP: Comprehensive manual test plan (250+ tests)
   - Post-MVP: Add pytest, Jest, Detox for automation

### Bootstrap Budget

| Service | MVP Cost | Post-MVP Cost |
|---------|----------|---------------|
| Supabase | ₹0 (free tier) | ₹0 (scale as needed) |
| Vercel | ₹0 (free tier) | ₹0 (free tier sufficient) |
| Stripe | ₹0 (test mode) | 2.9% + ₹2/transaction |
| Firebase | ₹0 (unlimited FCM) | ₹0 |
| Google Cloud | ₹0 ($300 credit) | ₹0 |
| Google Play | ₹167/month (one-time $25) | ₹167/month |
| Apple Developer | Deferred to post-MVP | ₹667/month |
| Domain | Deferred to post-MVP | ₹42-83/month |
| **Total MVP** | **₹167/month** | - |
| **Total Post-MVP** | - | **₹876-917/month** |

---

## Code Conventions

### Git Commit Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`

**Examples**:
```
feat(auth): implement Google OAuth signup
fix(payments): handle Stripe webhook timeout
docs: update API endpoint specifications
```

### File Structure

```
travorier/
├── .claude/                   # Claude Code context & config
│   ├── context.md             # This file
│   ├── decisions.md           # Architectural Decision Records (ADRs)
│   ├── prompts.md             # Reusable prompt templates
│   └── .claude-config.json    # Claude Code configuration
├── docs/                      # Project documentation
│   ├── README.md              # Project overview & roadmap
│   ├── ARCHITECTURE.md        # System architecture deep-dive
│   ├── PRD.md                 # Product requirements document
│   ├── API.md                 # API endpoint specifications
│   ├── TESTING.md             # Testing strategy & test plan
│   ├── ACCOUNTS_AND_KEYS.md   # External service setup guide
│   ├── GIT_WORKFLOW.md        # Git best practices
│   └── GETTING_STARTED.md     # Setup instructions
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app initialization
│   │   ├── api/v1/            # API route handlers
│   │   ├── core/              # Config, security, dependencies
│   │   ├── services/          # Supabase, Stripe, Firebase clients
│   │   └── schemas/           # Pydantic models
│   ├── requirements.txt       # Python dependencies
│   └── vercel.json            # Vercel deployment config
├── mobile/                    # React Native Expo app
│   ├── app/                   # Expo Router file-based routing
│   ├── services/              # API clients (Supabase, backend)
│   ├── stores/                # Zustand state management
│   ├── package.json           # NPM dependencies
│   └── app.json               # Expo configuration
└── supabase/                  # Database migrations
    └── migrations/
        └── 20260215000001_initial_schema.sql
```

### Python Code Style
- **Formatter**: Black (line length: 100)
- **Linter**: Flake8
- **Type Hints**: Required for public functions
- **Docstrings**: Google style (optional for MVP)

### TypeScript Code Style
- **Formatter**: Prettier
- **Linter**: ESLint (Expo defaults)
- **Type Safety**: Strict mode enabled
- **Components**: Functional components with hooks

---

## Database Schema Summary

### Core Tables (MVP Critical)

**profiles** (User accounts):
```sql
id UUID PRIMARY KEY (references auth.users)
email TEXT UNIQUE
phone TEXT UNIQUE
full_name TEXT NOT NULL
trust_score INTEGER DEFAULT 0
verified BOOLEAN DEFAULT false
average_rating DECIMAL(3,2) DEFAULT 0.00
total_deliveries INTEGER DEFAULT 0
credit_balance INTEGER DEFAULT 0
```

**trips** (Traveler listings):
```sql
id UUID PRIMARY KEY
traveler_id UUID REFERENCES profiles(id)
origin_city TEXT NOT NULL
destination_city TEXT NOT NULL
departure_date DATE NOT NULL
available_weight_kg DECIMAL(5,2) NOT NULL
price_per_kg DECIMAL(8,2) NOT NULL
status TEXT CHECK (status IN ('draft', 'active', 'matched', 'in_transit', 'completed', 'cancelled'))
```

**matches** (Core business logic):
```sql
id UUID PRIMARY KEY
trip_id UUID REFERENCES trips(id)
request_id UUID REFERENCES requests(id)
sender_id UUID REFERENCES profiles(id)
traveler_id UUID REFERENCES profiles(id)
status TEXT CHECK (status IN ('pending', 'contact_unlocked', 'inspection_approved', 'in_transit', 'completed', 'cancelled'))
contact_unlocked BOOLEAN DEFAULT false
qr_code TEXT UNIQUE
inspection_approved BOOLEAN DEFAULT false
```

**transactions** (Payment tracking):
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(id)
type TEXT CHECK (type IN ('credit_purchase', 'credit_deduction', 'refund'))
amount INTEGER NOT NULL  -- Credits (not money)
stripe_payment_id TEXT  -- For purchases only
description TEXT
```

### Indexes (Performance Optimization)

```sql
-- Search trips by route
CREATE INDEX idx_trips_route ON trips(origin_city, destination_city);

-- Search by date
CREATE INDEX idx_trips_date ON trips(departure_date) WHERE status = 'active';

-- User's matches
CREATE INDEX idx_matches_sender ON matches(sender_id, status);
CREATE INDEX idx_matches_traveler ON matches(traveler_id, status);
```

---

## Key Business Flows

### Flow 1: Trip Posting (Traveler)

1. Traveler creates trip (origin, destination, date, weight, price)
2. Trip saved with status: `draft` or `active`
3. If active, trip appears in search results
4. Traveler can edit/cancel anytime before match

### Flow 2: Request Creation (Sender)

1. Sender creates request (route, date, package details)
2. Optionally adds photos
3. Request visible to travelers on matching routes
4. Sender can edit/cancel anytime before match

### Flow 3: Matching & Contact Unlock (CRITICAL REVENUE)

1. Either party initiates match
2. Match created with status: `pending`
3. **Sender** must unlock traveler contact (costs 1 credit = ₹99)
4. If sender has 0 credits → Prompted to buy credits via Stripe
5. After credit purchase, sender unlocks contact
6. Traveler's phone number revealed
7. Both parties can now chat and arrange handover

### Flow 4: Handover & Inspection (CRITICAL SAFETY)

1. Traveler and sender meet in person
2. **Traveler** performs mandatory package inspection
3. Takes 3+ photos + optional video + notes
4. Uploads to Supabase Storage (`inspection-media` bucket)
5. **Sender** reviews inspection evidence
6. Sender approves or rejects:
   - **Approve** → Match proceeds to next stage
   - **Reject** → Match cancelled, credit refunded to sender

### Flow 5: In-Flight Verification (CRITICAL TRUST)

1. After inspection approved, traveler uploads boarding pass
2. **Admin** manually verifies:
   - Flight number matches trip details
   - Date matches departure date
   - Traveler name matches profile
3. Admin approves → Trip status: `in_transit`
4. Sender notified: "Your package is on the way!"

### Flow 6: Delivery Confirmation (CRITICAL COMPLETION)

1. Traveler lands at destination, updates status: `landed`
2. System generates unique QR code for this match
3. Sender shows QR code at meetup
4. **Traveler** scans QR code with app camera
5. QR verified → Match status: `completed`
6. Both parties prompted to leave reviews
7. Trust scores updated (+100 points each)
8. Chat auto-locks after 24 hours

---

## Trust & Safety Mechanisms

### Trust Score Calculation

| Event | Points | Notes |
|-------|--------|-------|
| Account created | 0 | Starting point |
| ID verified (manual) | +300 | One-time bonus |
| First delivery | +100 | Milestone bonus |
| Each subsequent delivery | +100 | No cap |
| 5-star review received | +50 | Per review |
| 4-star review | +20 | - |
| 3-star review | +10 | - |
| 2-star review | -20 | Penalty |
| 1-star review | -50 | Penalty |
| Match cancelled (their fault) | -30 | Penalty |
| 90 days inactivity | -10% | Decay mechanism |

**Trust Score Tiers**:
- 0-299: New User (⚠️ badge)
- 300-599: Verified (✅ badge)
- 600-899: Trusted (⭐ badge)
- 900+: Elite (🏆 badge)

### Safety Features (MVP)

1. **Mandatory Inspection**: Cannot proceed without inspection approval
2. **Manual Verification**: Admin reviews ID documents and boarding passes
3. **QR Code Confirmation**: Physical meetup required, QR prevents fraud
4. **Review System**: Bidirectional ratings build reputation
5. **Report & Block**: Users can report inappropriate behavior
6. **Chat Auto-Lock**: Prevents harassment after delivery complete
7. **Row-Level Security**: Database prevents unauthorized data access

---

## External Service Integration

### Supabase (Database, Auth, Storage, Realtime)

**Configuration**:
- Project: `travorier` (to be created)
- Region: Southeast Asia (Singapore) - closest to India
- Authentication: Google OAuth + Phone OTP enabled
- Storage: 4 buckets (profile-pictures, id-documents, inspection-media, boarding-passes)

**RLS Policies**: Defined in migration file, enforce:
- Users see only their own data
- Public profiles visible to all
- Private contact info hidden until unlock

**Realtime**: Used for chat messaging (PostgreSQL LISTEN/NOTIFY)

### Stripe (Payments)

**Products**:
- Starter Pack: ₹249 → 5 credits
- Value Pack: ₹399 → 10 credits
- Pro Pack: ₹749 → 25 credits

**Payment Methods** (India):
- Cards (Visa, Mastercard, Amex)
- UPI
- Netbanking
- Wallets

**Webhook Events**:
- `payment_intent.succeeded` → Add credits to user
- `payment_intent.payment_failed` → Notify user
- `charge.refunded` → Update transactions

### Firebase (Push Notifications)

**Use Cases**:
- New match notification
- Contact unlocked notification
- New chat message
- Inspection approved
- Traveler landed
- Delivery reminder
- Review reminder

**FCM Token Storage**: Stored in `profiles.fcm_token` column

---

## Common Commands

### Backend (FastAPI)

```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health

# Deploy to Vercel (auto-deploys on git push)
git push origin main
```

### Mobile (React Native Expo)

```bash
# Setup
cd mobile
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios  # or press 'i' in Expo CLI

# Run on Android emulator
npm run android  # or press 'a' in Expo CLI

# Run on physical device
# Scan QR code with Expo Go app

# Clear cache
npx expo start --clear
```

### Database (Supabase)

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project (after creating in dashboard)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or via dashboard: SQL Editor → Run migration file
```

### Git Workflow

```bash
# Daily workflow
git pull origin main
# Make changes...
git add .
git commit -m "feat(component): description"
git push origin main

# View commit history
git log --oneline --graph --all

# View current status
git status
```

---

## Gotchas & Known Issues

### 1. Supabase RLS Can Be Tricky

**Issue**: Queries fail with "permission denied" even for valid users.

**Solution**:
- Always check RLS policies in Supabase Dashboard
- Test queries in SQL Editor with `auth.uid()` simulation
- Use service_role key in backend (bypasses RLS)
- Use anon key in mobile app (enforces RLS)

### 2. Stripe Webhooks in Development

**Issue**: Stripe cannot reach `localhost` for webhooks.

**Solution**:
- Use Stripe CLI: `stripe listen --forward-to localhost:8000/api/v1/payments/webhook`
- Or use ngrok for tunneling
- For MVP: Test in deployed Vercel environment

### 3. Expo File System Permissions

**Issue**: Cannot access camera or gallery on physical device.

**Solution**:
- Add permissions to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos for profile pictures and package inspection."
        }
      ]
    ]
  }
}
```

### 4. Firebase FCM on iOS Requires APNS

**Issue**: Push notifications don't work on iOS.

**Solution**:
- Need Apple Developer account (₹667/month)
- Generate APNS certificate
- Upload to Firebase Console
- For MVP: Test on Android only (deferred iOS)

### 5. Vercel Cold Starts

**Issue**: First request after inactivity is slow (5-10 seconds).

**Solution**:
- Acceptable for MVP (free tier limitation)
- Post-MVP: Upgrade to paid plan or self-host
- Use warming requests (scheduled CRON)

---

## Out of Scope for MVP

These features are **deferred to post-MVP** to meet 12-week timeline:

1. ❌ Automated ID verification (iDenfy, Digio) - Using manual admin verification
2. ❌ Automated flight tracking (FlightAPI.io) - Using manual PNR verification
3. ❌ WhatsApp Business API - Using FCM push notifications only
4. ❌ In-app wallet - Using direct Stripe payments only
5. ❌ Automated testing - Using manual test plan (250+ tests)
6. ❌ iOS app - Building Android-first (Apple Developer account deferred)
7. ❌ Admin dashboard - Using Supabase Dashboard + SQL queries
8. ❌ Analytics dashboard - Using basic Supabase metrics
9. ❌ Multi-language support - English only for MVP
10. ❌ Package insurance - P2P agreement only, no insurance
11. ❌ Dispute resolution system - Manual admin intervention
12. ❌ Referral program - Post-MVP growth feature
13. ❌ Traveler background checks - Trust score system only
14. ❌ Real-time flight status - Manual status updates by traveler
15. ❌ Package tracking history - Basic timeline only

---

## Success Metrics (MVP)

### Launch Goals (Week 12)

- 50+ registered users (target)
- 10+ trips posted
- 5+ successful deliveries
- 0 security incidents
- <2% payment failures
- 4+ star average rating

### Technical Metrics

- API response time: <500ms (p95)
- App crash rate: <0.1%
- Payment success rate: >98%
- QR verification success: >95%
- Chat message delivery: <2 seconds

### Business Metrics

- Credit purchase conversion: 30% (senders unlock at least once)
- Average credits per purchase: 10 credits (₹399 Value Pack)
- Repeat traveler rate: 40% (post 2+ trips)
- Average rating: 4+ stars

---

## Documentation References

| Document | Purpose | Lines | File Path |
|----------|---------|-------|-----------|
| **README.md** | Project overview | 56 | `docs/README.md` |
| **ARCHITECTURE.md** | System architecture | 990 | `docs/ARCHITECTURE.md` |
| **PRD.md** | Product requirements | 970 | `docs/PRD.md` |
| **API.md** | API specifications | 1200 | `docs/API.md` |
| **TESTING.md** | Testing strategy | 892 | `docs/TESTING.md` |
| **ACCOUNTS_AND_KEYS.md** | Service setup guide | 1197 | `docs/ACCOUNTS_AND_KEYS.md` |
| **GIT_WORKFLOW.md** | Git best practices | 495 | `docs/GIT_WORKFLOW.md` |
| **GETTING_STARTED.md** | Setup instructions | 353 | `docs/GETTING_STARTED.md` |
| **context.md** (this file) | Claude quick reference | - | `.claude/context.md` |
| **decisions.md** | Architectural decisions | - | `.claude/decisions.md` (pending) |
| **prompts.md** | Prompt templates | - | `.claude/prompts.md` (pending) |

---

## Quick Links

- **GitHub Repo**: https://github.com/deepakdevp/travorier
- **Supabase Dashboard**: (to be created)
- **Stripe Dashboard**: (to be created)
- **Firebase Console**: (to be created)
- **Vercel Deployment**: (to be deployed)

---

## Development Principles

1. **Ship Fast, Iterate**: MVP in 12 weeks, perfection is the enemy of progress
2. **Manual First, Automate Later**: Manual testing/verification for MVP, automation post-MVP
3. **Cost-Conscious**: Every service must justify its cost, use free tiers aggressively
4. **Security First**: Never compromise on RLS, JWT validation, webhook verification
5. **User Trust > Features**: Trust score and safety mechanisms are non-negotiable
6. **Document Everything**: Write it down now, save time later
7. **Test Thoroughly**: 250+ manual tests before launch, no exceptions
8. **Commit Often**: After every feature, no matter how small

---

**This document is the single source of truth for Claude to understand Travorier.**

When in doubt, refer to this context file first, then consult detailed docs.

---

**Last Updated**: February 16, 2026
**Next Update**: After Week 1 completion (authentication implemented)
