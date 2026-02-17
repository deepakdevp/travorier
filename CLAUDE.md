# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travorier is a crowdsourced logistics platform connecting travelers with package senders. Users can browse trips posted by travelers and request them to carry packages, or post package delivery requests that travelers can fulfill.

**Repository**: https://github.com/deepakdevp/travorier

## Technology Stack

- **Frontend**: React Native (Expo) + TypeScript + React Native Paper
- **Backend**: FastAPI (Python 3.11+) + Pydantic
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Auth**: Supabase Auth (Google OAuth, Phone OTP)
- **Payments**: Stripe
- **Notifications**: Firebase FCM
- **State Management**: Zustand
- **Routing**: Expo Router (file-based)

## Repository Structure

```
travorier/
├── mobile/          # React Native app (Expo)
│   ├── app/         # Expo Router screens (file-based routing)
│   ├── components/  # Reusable UI components
│   ├── stores/      # Zustand state management
│   ├── lib/         # Utilities and Supabase client
│   └── package.json
├── backend/         # FastAPI backend
│   ├── app/
│   │   ├── api/v1/  # API endpoints (auth, users, trips, matches, etc.)
│   │   ├── core/    # Config, security, dependencies
│   │   ├── models/  # SQLAlchemy models
│   │   ├── schemas/ # Pydantic request/response models
│   │   └── services/# Supabase, Stripe, FCM, QR services
│   ├── requirements.txt
│   └── venv/
├── supabase/        # Database migrations
├── docs/            # Architecture, API docs, ADRs
└── scripts/         # Utility scripts
```

## Development Commands

### Backend (FastAPI)

```bash
# Start backend server
cd backend
source venv/bin/activate  # macOS/Linux
uvicorn app.main:app --reload

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Format code
black .

# Type checking
mypy .
```

Backend runs at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Mobile (Expo/React Native)

```bash
# Start development server
cd mobile
npm start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser

# Install dependencies
npm install

# Lint
npm run lint

# Type checking
npm run typecheck
```

### Database (Supabase)

- Dashboard: https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm
- Migrations located in: `supabase/migrations/`
- Run migrations via Supabase CLI: `supabase db push`
- Or manually via SQL Editor in Supabase Dashboard

## Key Architecture Patterns

### Authentication Flow

- Mobile app uses Supabase Auth directly (no custom backend auth endpoints for OAuth)
- Google OAuth flow: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Auth state managed via Zustand store (`mobile/stores/authStore.ts`)
- Auto-redirect based on session: authenticated → `/(tabs)`, unauthenticated → `/(auth)/login`
- Backend validates Supabase JWT tokens via middleware for protected API endpoints

### File-Based Routing (Expo Router)

- `app/index.tsx` - Entry point (handles auth redirect)
- `app/(auth)/` - Auth screens (login, signup)
- `app/(tabs)/` - Main app tabs (home, trips, requests, profile)
- Use `router.push()`, `router.replace()` for navigation

### Database Schema

10 core tables with Row-Level Security (RLS):
- `profiles` - User data (extends auth.users)
- `trips` - Traveler trip postings
- `requests` - Sender package requests
- `matches` - Trip-request matches
- `messages` - Real-time chat (via Supabase Realtime)
- `inspections` - Package handover media
- `transactions` - Stripe payments, credits
- `credits` - User credit balances
- `reviews` - Post-delivery ratings
- `notifications` - Push notifications

See `docs/ARCHITECTURE.md` for complete schema and RLS policies.

### State Management

Using Zustand stores:
- `authStore.ts` - Authentication state, session, user profile
- Additional stores for trips, requests, matches (to be created)

### API Design

FastAPI backend provides supplementary endpoints:
- Supabase handles: Auth, database CRUD (via PostgREST), real-time, storage
- Backend handles: Stripe payments, FCM notifications, QR generation, manual verification

## Commit Conventions

Follow Conventional Commits format:

```
<type>(<scope>): <subject>

Examples:
feat(auth): implement Google OAuth login UI
fix(chat): resolve message ordering issue
docs(api): update endpoint documentation
chore(deps): update expo to v50
test(payments): add Stripe webhook tests
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Important**:
- Commit frequently after each logical feature/fix
- Always test before committing
- Never commit `.env` files or secrets
- Use feature branches, never commit directly to `main`

See `docs/GIT_WORKFLOW.md` for detailed guidelines.

## Development Workflow

1. Check current milestone in `.claude/plan.md`
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and test locally
4. Commit with conventional format
5. Push and create PR for review

## Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
SUPABASE_ANON_KEY=eyJxxx...
STRIPE_SECRET_KEY=sk_test_xxx
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Mobile (.env)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Current Development Status

**Active Milestone**: Milestone 1 - Visual Authentication (Google OAuth) - 60% complete
**Next Phase**: Testing OAuth login flow end-to-end

See `.claude/plan.md` for detailed phase-by-phase progress and upcoming milestones.

## Important Notes

- **Security**: All sensitive data goes in `.env` files (never committed)
- **Payments**: Always use Stripe test mode during development
- **Real-time**: Use Supabase Realtime subscriptions for chat messages and flight updates
- **File Storage**: Use Supabase Storage buckets with RLS policies (avatars, id-documents, boarding-passes, inspections)
- **Error Tracking**: Sentry configured for both backend and mobile (production only)

## Documentation

- `docs/GETTING_STARTED.md` - Complete setup guide
- `docs/ARCHITECTURE.md` - System architecture, database schema, API design
- `docs/API.md` - API endpoint specifications
- `docs/GIT_WORKFLOW.md` - Branching, commits, PR guidelines
- `docs/README.md` - Full project documentation index
