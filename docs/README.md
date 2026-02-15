# Travorier - Crowdsourced Logistics Platform

## Overview

Travorier is a crowdsourced logistics SaaS that connects travelers with spare luggage capacity to individuals needing to send packages. By leveraging existing travel routes of verified individuals, the platform provides a faster and more affordable alternative to traditional courier services.

**Target Market**: India ↔️ UAE (Initial corridor)
**Future Expansion**: USA, Europe

## Project Status

- **Version**: 1.0 MVP
- **Status**: Development Phase
- **Timeline**: 12 weeks (Aggressive)
- **Development Mode**: Bootstrap (Solo Developer)

## Core Value Proposition

- **For Senders**: Affordable, fast delivery via travelers instead of expensive couriers
- **For Travelers**: Monetize spare luggage capacity
- **For Platform**: Discovery & access fee model (no delivery commission)

## Business Model

### Platform Revenue (Discovery & Access Fees)
- **Contact Unlock Fee**: ₹99 (one-time access to traveler contact)
- **Traveler Listing Fee**: ₹49 (prevents spam, ensures intent)
- **Trip Boost**: ₹199 (48-hour top listing - V2 feature)
- **Bulk Credit Packs**:
  - 5 Credits: 10% discount (1-year validity)
  - 10 Credits: 20% discount (1-year validity)

### Delivery Payment (Offline P2P)
- Travelers set their own "Price per KG" (1kg increments)
- Payment happens directly between sender and traveler
- Platform takes 0% commission on delivery fees

## Key Features

### MVP (v1.0) - Included
- ✅ Google OAuth + Mobile OTP authentication
- ✅ Manual ID verification (admin approval)
- ✅ Manual PNR verification (boarding pass screenshot)
- ✅ Trip posting and search (India ↔️ UAE)
- ✅ Credit-based unlock system
- ✅ Stripe payment integration
- ✅ Real-time chat (24-hour auto-lock post-flight)
- ✅ Physical inspection protocol (photos/videos)
- ✅ QR code delivery confirmation
- ✅ Push notifications (Firebase FCM)
- ✅ Email notifications
- ✅ Legal disclaimers and ToS

### Post-MVP (v2.0) - Deferred
- ⏳ Automated KYC (iDenfy integration)
- ⏳ Automated flight verification (FlightAPI.io)
- ⏳ WhatsApp Business API notifications
- ⏳ Live location sharing during handover
- ⏳ Trip boost feature
- ⏳ Multi-country expansion

## Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router / React Navigation
- **UI Components**: React Native Paper / NativeWind

### Backend
- **Framework**: FastAPI (Python)
- **Language**: Python 3.11+
- **API Style**: REST
- **Hosting**: Vercel

### Database & Services
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (OAuth + OTP)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Payments**: Stripe
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Error Tracking**: Sentry (Free tier)

### Development Tools
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier, Black
- **Testing**: Jest, Pytest
- **CI/CD**: GitHub Actions (planned)

## Project Structure

```
travorier/
├── docs/                      # Documentation
│   ├── README.md             # This file
│   ├── ARCHITECTURE.md       # Technical architecture
│   └── API.md                # API documentation (to be created)
├── mobile/                    # React Native app
│   ├── app/                  # Expo Router pages
│   ├── components/           # Reusable components
│   ├── stores/               # Zustand stores
│   ├── services/             # API clients
│   └── utils/                # Helpers
├── backend/                   # FastAPI server
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Config, security
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   └── tests/                # Backend tests
├── supabase/                  # Supabase config
│   ├── migrations/           # SQL migrations
│   └── functions/            # Edge functions (if needed)
└── scripts/                   # Utility scripts
```

## Getting Started

### Prerequisites

1. **Node.js**: v18+ (for React Native)
2. **Python**: 3.11+ (for FastAPI)
3. **Expo CLI**: `npm install -g expo-cli`
4. **Supabase Account**: Free tier
5. **Stripe Account**: Test mode

### Environment Setup

#### 1. Clone Repository
```bash
cd /Users/deepak.panwar/personal/travorier
```

#### 2. Supabase Setup
- Create project at supabase.com
- Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Enable Auth providers (Google OAuth, Phone OTP)
- Set up database schema (see ARCHITECTURE.md)

#### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload
```

#### 4. Mobile App Setup
```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with Supabase and Firebase credentials
npx expo start
```

#### 5. Stripe Setup
- Create Stripe account (test mode)
- Get API keys from dashboard
- Configure webhook endpoints

## Development Workflow

### Phase-by-Phase Approach

**Week 1-3**: Foundation (Auth, Database, Core Discovery)
**Week 4-7**: Core Features (Payments, Chat, Handover)
**Week 8-10**: Safety & Polish (Legal, Notifications, Testing)
**Week 11-12**: Pre-Launch (Admin Tools, Beta Testing)

See detailed roadmap in the main project documentation.

### Daily Development Cycle
1. Pick feature from current phase
2. Write tests first (TDD when possible)
3. Implement feature
4. Test on iOS/Android
5. Commit with clear messages
6. Deploy backend changes to Vercel staging

## Security & Compliance

### Data Protection
- All PII encrypted at rest (Supabase)
- JWT-based authentication
- Row-level security (RLS) on all tables
- HTTPS only

### Legal Safeguards
- **Disclaimer**: Platform is a matching service, not a courier
- **ToS Checkboxes**: Mandatory before posting/requesting
- **Prohibited Items List**: Gold, seeds, medicines, contraband
- **Customs Responsibility**: Sender is legally responsible

### Trust & Safety
- Manual ID verification (MVP)
- PNR verification via boarding pass screenshot
- Physical inspection protocol (10s video or 3 photos)
- QR delivery confirmation
- 24-hour chat auto-lock

## Cost Estimation

### Development Phase (Months 1-3)
- Supabase: ₹0 (Free tier)
- Vercel: ₹0 (Free tier)
- Firebase: ₹0 (Free tier)
- Stripe: ₹0 (Pay per transaction)
- Domain: ₹42/month
- Apple Developer: ₹542/month
- Google Play: ₹167/month (one-time ₹2,000)

**Total: ~₹750/month**

### Post-Launch Upgrade Path
- At 100+ users: Still within free tiers
- At 1000+ users: Supabase Pro (~₹1,800/month)
- After PMF: Add iDenfy, FlightAPI.io, WhatsApp (~₹10,000/month)

## Success Metrics (MVP)

### User Acquisition
- 50+ registered users (25 travelers, 25 senders)
- 10+ successful deliveries

### Quality Metrics
- 0 fraud/safety incidents
- <2% payment failure rate
- Average 4+ star rating
- <1 minute average response time in chat

### Business Metrics
- ₹5,000+ in platform fees (50 unlocks)
- 80%+ handover completion rate
- 30%+ repeat user rate

## Risk Management

### Technical Risks
- **React Native complexity**: Use Expo managed workflow
- **Real-time chat scaling**: Supabase handles via RLS
- **Payment bugs**: Extensive testing in Stripe test mode

### Business Risks
- **Legal liability**: Clear ToS, user assumes risk
- **Fraud**: Manual verification initially
- **Customs issues**: Sender responsibility, clear disclaimers

### Mitigation Strategies
- Lawyer review of ToS (₹10-15K one-time)
- Phased rollout (beta → limited launch → full launch)
- Manual oversight during MVP phase

## Support & Contribution

### For Issues
- Check existing documentation
- Review ARCHITECTURE.md for technical details
- Create detailed bug reports

### Code Standards
- TypeScript strict mode
- Python type hints
- 80% test coverage target
- Commit messages: Conventional Commits format

## Roadmap

### Q1 2026 (Current)
- ✅ Project setup and documentation
- 🔄 Foundation phase (Weeks 1-3)
- ⏳ Core features (Weeks 4-7)

### Q2 2026
- ⏳ Safety & polish (Weeks 8-10)
- ⏳ Pre-launch (Weeks 11-12)
- ⏳ Beta testing and iteration
- ⏳ App Store submission

### Q3 2026 (Post-MVP)
- Launch in India-UAE corridor
- Gather user feedback
- Iterate based on metrics
- Plan automated verification (iDenfy, FlightAPI)

### Q4 2026 (Growth)
- Scale to 1000+ users
- Add automated KYC and flight verification
- Expand to additional routes
- Consider Series A fundraising

## License

Proprietary - All rights reserved

## Contact

**Developer**: Deepak Panwar
**Project**: Travorier MVP
**Timeline**: February 2026 - April 2026
