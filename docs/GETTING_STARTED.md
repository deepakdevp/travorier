# Getting Started with Travorier

Complete setup guide for local development.

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI**: `npm install -g expo-cli`
- **Code Editor**: VS Code recommended

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/travorier.git
cd travorier
```

## Step 2: Set Up Supabase

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `travorier`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_KEY) - **Keep this secret!**

### Run Database Migration

Option 1: Via Supabase Dashboard (Recommended for MVP)
1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Copy contents of `supabase/migrations/20260215000001_initial_schema.sql`
4. Paste and click "Run"

Option 2: Via Supabase CLI (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Enable Authentication Providers

1. Go to Authentication → Providers
2. Enable **Google OAuth**:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
3. Enable **Phone (OTP)**:
   - Choose provider (Twilio recommended for testing)
   - Add credentials

## Step 3: Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create account
2. Switch to "Test Mode" (toggle in dashboard)
3. Go to Developers → API Keys
4. Copy:
   - `Publishable key` (pk_test_...)
   - `Secret key` (sk_test_...)
5. Go to Developers → Webhooks
6. Click "Add endpoint"
7. URL: `https://your-api-url.vercel.app/api/v1/payments/webhook`
8. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
9. Copy webhook signing secret (whsec_...)

## Step 4: Set Up Firebase (for Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `travorier`
3. Add Android app:
   - Package name: `com.travorier.app`
   - Download `google-services.json`
   - Save to `mobile/` directory
4. Add iOS app:
   - Bundle ID: `com.travorier.app`
   - Download `GoogleService-Info.plist`
   - Save to `mobile/` directory
5. Enable Cloud Messaging:
   - Project Settings → Cloud Messaging
   - Copy Server Key
6. Download service account key:
   - Project Settings → Service Accounts
   - Generate new private key
   - Save as `backend/firebase-credentials.json`

## Step 5: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

### .env Configuration

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG... (service_role key)
SUPABASE_ANON_KEY=eyJhbG... (anon key)

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# JWT (generate random secret)
JWT_SECRET_KEY=your-super-secret-key-change-me

# CORS (add your frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000
```

### Start Backend Server

```bash
uvicorn app.main:app --reload
```

Backend will run at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

## Step 6: Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env
nano .env
```

### .env Configuration

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=travorier
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123
```

### Start Mobile App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR with Expo Go app on phone

## Step 7: Verify Setup

### Test Backend

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Travorier API",
  "version": "1.0.0",
  "environment": "development"
}
```

### Test Supabase Connection

1. Open mobile app
2. Try to sign up (should work if Supabase is configured)
3. Check Supabase Dashboard → Authentication → Users

### Test Stripe (Optional)

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

## Common Issues

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Python Dependencies Failed

```bash
# Upgrade pip
pip install --upgrade pip

# Try installing again
pip install -r requirements.txt
```

### Expo Dependencies Failed

```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Supabase Connection Error

- Check if SUPABASE_URL has `https://` prefix
- Verify API keys are correct
- Ensure RLS policies are set (run migration)

## Next Steps

Once everything is running:

1. **Week 1**: Complete authentication flow
   - Implement Google OAuth in mobile app
   - Add OTP verification UI
   - Test signup/login flows

2. **Week 2**: Build core discovery
   - Create trip posting form
   - Implement trip search with filters
   - Build listing cards UI

3. **Week 3**: Payment integration
   - Integrate Stripe payment sheet
   - Implement credit purchase
   - Add contact unlock flow

See [docs/README.md](./README.md) for full 12-week roadmap.

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Start backend (Terminal 1)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 3. Start mobile app (Terminal 2)
cd mobile
npm start

# 4. Make changes, test, commit
git add .
git commit -m "feat: description of feature"
git push origin main
```

### Commit Often

Follow the git workflow guide:
- Commit after each minor feature
- Write descriptive commit messages
- Push frequently to avoid conflicts

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [Stripe Docs](https://stripe.com/docs)
- [React Native Docs](https://reactnative.dev/)

## Support

If you encounter issues:
1. Check this guide first
2. Search existing documentation
3. Check GitHub Issues
4. Ask in project chat (if available)

## Security Reminders

- **NEVER** commit `.env` files
- **NEVER** commit Firebase credentials
- **NEVER** commit Stripe secret keys
- **ALWAYS** use test mode for Stripe during development
- **ROTATE** secrets if accidentally exposed

---

Happy coding! 🚀
