# Travorier - Accounts & API Keys Setup Guide

Complete guide for setting up all external services, creating accounts, and generating API keys needed for the Travorier platform.

**Last Updated**: February 16, 2026

---

## Overview

This document provides step-by-step instructions for creating accounts and obtaining API keys for all external services used in Travorier. Follow this guide **in order** to ensure proper setup.

### Quick Reference Table

| Service | Purpose | Free Tier | Setup Time | Priority |
|---------|---------|-----------|------------|----------|
| GitHub | Version control | Yes (unlimited) | 5 min | ⭐⭐⭐ Critical |
| Supabase | Database, Auth, Storage | Yes (500MB DB, 1GB storage) | 10 min | ⭐⭐⭐ Critical |
| Stripe | Payment processing | Yes (test mode) | 15 min | ⭐⭐⭐ Critical |
| Firebase | Push notifications (FCM) | Yes (unlimited FCM) | 20 min | ⭐⭐⭐ Critical |
| Google Cloud | OAuth credentials | Yes ($300 credit) | 15 min | ⭐⭐⭐ Critical |
| Vercel | Backend deployment | Yes (100GB bandwidth) | 5 min | ⭐⭐ High |
| Apple Developer | iOS app distribution | No ($99/year) | 2 days | ⭐ Medium |
| Google Play Console | Android app distribution | No ($25 one-time) | 1 day | ⭐ Medium |
| Domain Registrar | Custom domain (optional) | No (~₹500-1000/year) | 10 min | Low |

**Total Estimated Setup Time**: 2-3 hours (excluding app store approvals)

---

## 1. GitHub Account

**Purpose**: Version control, code hosting, collaboration

**Cost**: Free (unlimited repositories)

### Setup Steps

1. **Create Account** (if you don't have one)
   - Go to [github.com](https://github.com)
   - Click "Sign up"
   - Provide: Username, Email, Password
   - Verify email address

2. **Enable Two-Factor Authentication** (Recommended)
   - Go to Settings → Password and authentication
   - Enable 2FA using authenticator app or SMS

3. **Generate Personal Access Token** (for CLI access)
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: `Travorier Development`
   - Scopes: Select `repo` (full control of private repositories)
   - Expiration: 90 days (or custom)
   - Copy token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Save immediately** - you won't see it again!

4. **Configure Git CLI**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```

### Credentials to Save

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Security Best Practices

- ✅ Enable 2FA immediately
- ✅ Use SSH keys instead of HTTPS (optional but recommended)
- ✅ Never commit tokens to repository
- ✅ Rotate tokens every 90 days
- ❌ Don't share personal access tokens

---

## 2. Supabase Account

**Purpose**: PostgreSQL database, authentication, storage, real-time messaging

**Cost**: Free tier (500MB database, 1GB storage, 50MB file uploads, 2GB bandwidth)

### Setup Steps

1. **Create Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub (recommended) or email

2. **Create New Project**
   - Organization: Create new or use personal
   - Project name: `travorier`
   - Database password: Generate strong password (save immediately!)
   - Region: Choose closest to your users (e.g., `Southeast Asia (Singapore)` for India)
   - Pricing Plan: Free
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get API Credentials**
   - Navigate to Project Settings (⚙️ icon) → API
   - Copy the following:

   **Project URL**:
   ```
   https://xxxxxxxxxxxxxxxxx.supabase.co
   ```

   **API Keys**:
   ```
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
   ```

   ⚠️ **CRITICAL**: The `service_role` key has admin privileges - **NEVER** expose it client-side or commit to GitHub!

4. **Enable Authentication Providers**

   **Google OAuth**:
   - Go to Authentication → Providers
   - Find "Google" and toggle "Enabled"
   - You'll need Google OAuth credentials (see Section 5)
   - Add `Client ID` and `Client Secret`
   - Authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

   **Phone (OTP)**:
   - Toggle "Phone" enabled
   - For testing, use Twilio (has free trial)
   - For production, consider Twilio or MessageBird
   - Add Twilio credentials (see Section 4 below)

5. **Configure Storage Buckets**
   - Go to Storage → Create bucket
   - Create the following buckets:

   | Bucket Name | Public | Purpose |
   |-------------|--------|---------|
   | `profile-pictures` | Yes | User avatars |
   | `id-documents` | No | Verification documents |
   | `inspection-media` | No | Package inspection photos/videos |
   | `boarding-passes` | No | PNR verification uploads |

   For each bucket:
   - Click "Create bucket"
   - Set Public/Private as per table
   - Add RLS policies (defined in migration file)

6. **Run Database Migration**

   **Option A: Via Dashboard (Recommended for MVP)**
   - Go to SQL Editor
   - Click "New query"
   - Copy entire contents of `supabase/migrations/20260215000001_initial_schema.sql`
   - Paste and click "Run"
   - Verify: Should see "Success. No rows returned" (DDL operations don't return rows)
   - Check Database → Tables to confirm 10 tables created

   **Option B: Via CLI (Advanced)**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login
   supabase login

   # Link project (get project ref from dashboard URL)
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```

7. **Verify Setup**
   - Go to Database → Tables
   - Should see 10 tables: `profiles`, `trips`, `requests`, `matches`, `messages`, `inspections`, `transactions`, `credits`, `reviews`, `notifications`
   - Go to Authentication → Policies
   - Should see RLS policies for each table

### Credentials to Save

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYXZvcmllciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc5...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYXZvcmllciIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2Nzk...
SUPABASE_DB_PASSWORD=your-generated-strong-password
```

### Security Best Practices

- ✅ Use `anon` key for client-side (mobile app)
- ✅ Use `service_role` key **ONLY** in backend (server-side)
- ✅ Enable Row-Level Security (RLS) on all tables (already done in migration)
- ✅ Use RLS policies to enforce authorization
- ✅ Store database password in password manager
- ❌ Never commit service_role key to GitHub
- ❌ Never use service_role key in mobile app

---

## 3. Stripe Account

**Purpose**: Payment processing (credit purchases, unlock fees)

**Cost**: Free (test mode), 2.9% + ₹2 per successful transaction (live mode)

### Setup Steps

1. **Create Account**
   - Go to [stripe.com](https://stripe.com)
   - Click "Start now"
   - Provide: Email, Full name, Country (India), Password
   - Verify email address

2. **Switch to Test Mode**
   - Top-right corner: Toggle "Test mode" ON
   - ⚠️ **Always use test mode during development!**

3. **Get API Keys**
   - Go to Developers → API keys
   - Copy the following:

   **Publishable Key** (safe to expose client-side):
   ```
   pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **Secret Key** (NEVER expose client-side):
   ```
   sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Create Webhook Endpoint**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend.vercel.app/api/v1/payments/webhook`
     - ⚠️ **Note**: You'll update this URL after deploying backend to Vercel (Step 6)
     - For now, use placeholder: `https://placeholder.com/webhook`
   - Description: `Travorier Payment Events`
   - Events to listen for:
     - `payment_intent.succeeded` ✅
     - `payment_intent.payment_failed` ✅
     - `charge.refunded` ✅
   - Click "Add endpoint"
   - Copy **Signing secret**:
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **Configure Payment Methods**
   - Go to Settings → Payment methods
   - Enable the following for India:
     - Cards (Visa, Mastercard, Amex) ✅
     - UPI ✅
     - Netbanking ✅
     - Wallets (Paytm, PhonePe, etc.) ✅

6. **Set Up Products** (for credit packs)

   Create products for credit packs:

   **Product 1: Starter Pack**
   - Go to Products → Add product
   - Name: `Starter Pack - 5 Credits`
   - Description: `5 credits for unlocking traveler contacts`
   - Price: ₹249 INR (one-time)
   - Click "Save product"
   - Copy Product ID: `prod_xxxxxxxxxx`
   - Copy Price ID: `price_xxxxxxxxxx`

   **Product 2: Value Pack**
   - Name: `Value Pack - 10 Credits`
   - Description: `10 credits with 20% savings`
   - Price: ₹399 INR (one-time)
   - Copy Product ID & Price ID

   **Product 3: Pro Pack**
   - Name: `Pro Pack - 25 Credits`
   - Description: `25 credits with 40% savings`
   - Price: ₹749 INR (one-time)
   - Copy Product ID & Price ID

7. **Test with Test Cards**

   Use these cards for testing:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`
   - **Insufficient funds**: `4000 0000 0000 9995`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### Credentials to Save

```bash
# Stripe Configuration (TEST MODE)
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Product IDs
STRIPE_PRODUCT_STARTER_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_STARTER_PACK=price_xxxxxxxxxx
STRIPE_PRODUCT_VALUE_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_VALUE_PACK=price_xxxxxxxxxx
STRIPE_PRODUCT_PRO_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_PRO_PACK=price_xxxxxxxxxx
```

### Security Best Practices

- ✅ Use test mode keys during development
- ✅ Switch to live mode only after thorough testing
- ✅ Use publishable key in mobile app (safe)
- ✅ Use secret key **ONLY** in backend
- ✅ Verify webhook signatures to prevent fraud
- ✅ Enable webhook endpoint HTTPS only
- ❌ Never commit secret keys to GitHub
- ❌ Never use live mode keys in test environment

### Going Live Checklist (Post-MVP)

Before switching to live mode:
- [ ] Complete business verification (KYC)
- [ ] Add bank account for payouts
- [ ] Submit business documents (PAN, GST, etc.)
- [ ] Test all payment flows in test mode
- [ ] Set up Stripe Radar for fraud detection
- [ ] Configure payout schedule
- [ ] Update webhook URL to production backend
- [ ] Switch API keys to live mode

---

## 4. Twilio Account (Optional - for Phone OTP)

**Purpose**: SMS OTP verification for phone authentication

**Cost**: Free trial ($15.50 credit), then pay-as-you-go (~₹0.60/SMS in India)

### Setup Steps

1. **Create Account**
   - Go to [twilio.com](https://www.twilio.com/try-twilio)
   - Sign up with email
   - Verify phone number

2. **Get Phone Number**
   - Go to Phone Numbers → Manage → Buy a number
   - Country: India (+91)
   - Capabilities: SMS ✅
   - Click "Search" and purchase a number

3. **Get API Credentials**
   - Go to Console Dashboard
   - Copy:
     - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - **Phone Number**: `+91xxxxxxxxxx`

4. **Configure Supabase to Use Twilio**
   - In Supabase: Authentication → Providers → Phone
   - Select "Twilio" as provider
   - Paste Account SID, Auth Token, and Phone Number
   - Click "Save"

### Credentials to Save

```bash
# Twilio Configuration (Optional - only if using SMS OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+91xxxxxxxxxx
```

### Alternative: Skip for MVP

**Cost-saving option**: Disable phone OTP for MVP and only use Google OAuth. Add phone OTP later when you have budget.

---

## 5. Google Cloud Platform (for OAuth)

**Purpose**: Google Sign-In OAuth credentials

**Cost**: Free ($300 credit for new accounts)

### Setup Steps

1. **Create Account**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with Google account
   - Accept terms and conditions

2. **Create New Project**
   - Click project dropdown (top-left)
   - Click "New Project"
   - Project name: `Travorier`
   - Organization: No organization
   - Click "Create"

3. **Enable Google+ API**
   - Go to APIs & Services → Library
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - User Type: External
   - Click "Create"
   - Fill in:
     - App name: `Travorier`
     - User support email: Your email
     - App logo: Upload Travorier logo (optional for testing)
     - Application home page: `https://travorier.com` (or placeholder)
     - Authorized domains: `supabase.co`
     - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Add `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Test users: Add your email for testing
   - Click "Save and Continue"

5. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Name: `Travorier Web`
   - Authorized JavaScript origins:
     - `http://localhost:19006` (Expo web)
     - `https://your-project-ref.supabase.co`
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Click "Create"
   - Copy:
     - **Client ID**: `xxxxxx.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxx`

6. **Create OAuth Credentials for Mobile**
   - Click "Create Credentials" → "OAuth client ID" again
   - Application type: Android
   - Name: `Travorier Android`
   - Package name: `com.travorier.app`
   - SHA-1 certificate fingerprint: (get from Android Studio or `keytool`)
     ```bash
     # For debug builds
     keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
     # Password: android
     ```
   - Click "Create"
   - Copy Client ID

   Repeat for iOS:
   - Application type: iOS
   - Name: `Travorier iOS`
   - Bundle ID: `com.travorier.app`
   - Click "Create"
   - Copy Client ID

7. **Configure in Supabase**
   - Go to Supabase → Authentication → Providers → Google
   - Paste Web Client ID and Client Secret
   - Click "Save"

### Credentials to Save

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID_WEB=xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_ID_ANDROID=xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=xxxxxx.apps.googleusercontent.com
```

### Security Best Practices

- ✅ Use separate OAuth clients for web, Android, iOS
- ✅ Restrict authorized domains to only your domains
- ✅ Enable incremental authorization (request scopes as needed)
- ❌ Don't request unnecessary scopes
- ❌ Never expose client secret in mobile apps

---

## 6. Firebase (for Push Notifications)

**Purpose**: Firebase Cloud Messaging (FCM) for push notifications

**Cost**: Free (unlimited push notifications)

### Setup Steps

1. **Create Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Click "Add project"
   - Project name: `Travorier`
   - Enable Google Analytics: Yes (recommended)
   - Analytics location: India
   - Click "Create project"

2. **Add Android App**
   - Click "Add app" → Android icon
   - Android package name: `com.travorier.app`
   - App nickname: `Travorier Android`
   - Debug signing certificate SHA-1: (same as Google OAuth)
   - Click "Register app"
   - Download `google-services.json`
   - Save to: `mobile/google-services.json`
   - ⚠️ Add to `.gitignore` - **don't commit to GitHub**
   - Click "Next" → "Next" → "Continue to console"

3. **Add iOS App**
   - Click "Add app" → iOS icon
   - iOS bundle ID: `com.travorier.app`
   - App nickname: `Travorier iOS`
   - Click "Register app"
   - Download `GoogleService-Info.plist`
   - Save to: `mobile/GoogleService-Info.plist`
   - ⚠️ Add to `.gitignore` - **don't commit to GitHub**
   - Click "Next" → "Next" → "Continue to console"

4. **Enable Cloud Messaging**
   - Go to Project Settings (⚙️) → Cloud Messaging
   - Cloud Messaging API should be enabled automatically
   - Copy **Server Key**: `AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy **Sender ID**: `123456789012`

5. **Generate Service Account Key** (for backend)
   - Go to Project Settings (⚙️) → Service Accounts
   - Click "Generate new private key"
   - Confirm and download JSON file
   - Rename to: `firebase-credentials.json`
   - Save to: `backend/firebase-credentials.json`
   - ⚠️ Add to `.gitignore` - **NEVER commit to GitHub**

6. **Extract Firebase Config for Mobile**
   - From `google-services.json`, extract:
     ```json
     {
       "project_info": {
         "project_id": "travorier-xxxxx"
       },
       "client": [{
         "api_key": [{
           "current_key": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
         }],
         "client_info": {
           "mobilesdk_app_id": "1:123456789012:android:xxxxxxxxxxxxxxxx"
         }
       }]
     }
     ```

### Credentials to Save

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=travorier-xxxxx
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID_ANDROID=1:123456789012:android:xxxxxxxxxxxxxxxx
FIREBASE_APP_ID_IOS=1:123456789012:ios:xxxxxxxxxxxxxxxx
FIREBASE_SERVER_KEY=AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Backend only
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Files to Save (DON'T COMMIT)

- `mobile/google-services.json` (Android config)
- `mobile/GoogleService-Info.plist` (iOS config)
- `backend/firebase-credentials.json` (Service account key)

**Add to `.gitignore`**:
```
# Firebase
google-services.json
GoogleService-Info.plist
firebase-credentials.json
```

### Security Best Practices

- ✅ Store service account key securely (backend only)
- ✅ Use environment variables for sensitive values
- ✅ Restrict API key to specific apps (Android/iOS package names)
- ❌ Never commit Firebase config files to GitHub
- ❌ Never expose service account key client-side

---

## 7. Vercel Account (for Backend Deployment)

**Purpose**: Deploy FastAPI backend to production

**Cost**: Free (100GB bandwidth, serverless functions)

### Setup Steps

1. **Create Account**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up"
   - Sign up with GitHub (recommended for easy deployment)

2. **Connect GitHub Repository**
   - Click "Add New..." → "Project"
   - Import your repository: `github.com/yourusername/travorier`
   - Select `travorier` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `pip install -r requirements.txt`

4. **Add Environment Variables**
   - In project settings → Environment Variables
   - Add all backend `.env` variables:
     ```
     SUPABASE_URL=https://xxx.supabase.co
     SUPABASE_SERVICE_KEY=eyJhbG...
     SUPABASE_ANON_KEY=eyJhbG...
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
     JWT_SECRET_KEY=your-secret-key
     ALLOWED_ORIGINS=https://your-frontend.vercel.app,exp://localhost:19000
     ```
   - ⚠️ For `firebase-credentials.json`, you'll need to:
     - Base64 encode the file: `base64 firebase-credentials.json`
     - Add as env variable: `FIREBASE_CREDENTIALS_BASE64=<encoded-string>`
     - Decode in code on startup

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (~2-3 minutes)
   - Your backend will be live at: `https://travorier.vercel.app`

6. **Update Stripe Webhook URL**
   - Copy your Vercel deployment URL
   - Go to Stripe → Developers → Webhooks
   - Update endpoint URL to: `https://travorier.vercel.app/api/v1/payments/webhook`

7. **Test Deployment**
   ```bash
   curl https://travorier.vercel.app/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "Travorier API",
     "version": "1.0.0"
   }
   ```

### Credentials to Save

```bash
# Vercel Deployment URL
VERCEL_BACKEND_URL=https://travorier.vercel.app

# Update in mobile app .env
EXPO_PUBLIC_API_URL=https://travorier.vercel.app
```

### Security Best Practices

- ✅ Use environment variables for all secrets
- ✅ Enable automatic HTTPS (default on Vercel)
- ✅ Set up custom domain for production (optional)
- ✅ Enable deployment protection (password-protect preview deployments)
- ❌ Don't expose sensitive env vars in logs

---

## 8. Apple Developer Account (for iOS App)

**Purpose**: Distribute iOS app via App Store

**Cost**: $99/year (~₹8,000/year or ₹667/month)

### Setup Steps

1. **Create Account**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Click "Account"
   - Sign in with Apple ID
   - Click "Join the Apple Developer Program"
   - Entity Type: Individual
   - Pay $99/year enrollment fee

2. **Create App ID**
   - Go to Certificates, Identifiers & Profiles
   - Click "Identifiers" → "+"
   - Select "App IDs" → "Continue"
   - Description: `Travorier`
   - Bundle ID: `com.travorier.app`
   - Capabilities: Enable:
     - Push Notifications ✅
     - Sign in with Apple ✅ (optional)
   - Click "Continue" → "Register"

3. **Create App in App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+"
   - New App:
     - Platform: iOS
     - Name: `Travorier`
     - Primary Language: English
     - Bundle ID: `com.travorier.app`
     - SKU: `TRAVORIER-IOS-001`
     - User Access: Full Access
   - Click "Create"

4. **Configure App Information**
   - Category: Travel & Logistics
   - Content Rights: Doesn't contain third-party content
   - Age Rating: 4+ (no objectionable content)
   - App Store URL: `https://apps.apple.com/app/travorier/idXXXXXXXX`

5. **Upload Certificates**
   - Generate CSR (Certificate Signing Request) from Keychain Access (macOS)
   - Upload to Apple Developer Portal
   - Download distribution certificate

### Credentials to Save

```bash
# Apple Developer
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_APP_ID=com.travorier.app
APPLE_APP_STORE_ID=XXXXXXXXXX (will be assigned after submission)
```

### Files to Save (DON'T COMMIT)

- Distribution certificate (.p12 file)
- Provisioning profiles

### Notes

- ⏳ App review takes 1-3 days
- 🔄 Account approval can take 1-2 days
- 💰 ₹667/month when amortized over 12 months
- ⚠️ Required for TestFlight beta testing

---

## 9. Google Play Console (for Android App)

**Purpose**: Distribute Android app via Google Play Store

**Cost**: $25 one-time fee (~₹2,000 or ₹167/month amortized)

### Setup Steps

1. **Create Account**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Sign in with Google account
   - Accept Developer Distribution Agreement
   - Pay $25 one-time registration fee

2. **Create App**
   - Click "Create app"
   - App name: `Travorier`
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Declarations: Check all boxes
   - Click "Create app"

3. **Configure App Information**
   - Category: Travel & Local
   - Tags: Logistics, Crowdsourcing, Delivery
   - Email: your-email@example.com
   - Privacy Policy URL: `https://travorier.com/privacy` (create later)

4. **Set Up App Content**
   - Target audience: 13+
   - Content rating: Everyone
   - Privacy policy: Add URL
   - Data safety: Fill out questionnaire
     - Collects: Email, Name, Phone, Location, Payment info
     - Purpose: Account management, App functionality, Payments
     - Data sharing: Not shared with third parties
     - Security: Data encrypted in transit and at rest

5. **Generate Upload Key**
   ```bash
   # Generate keystore
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore travorier-upload-key.keystore \
     -alias travorier \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000

   # Enter strong password and save it!
   # Save keystore to: mobile/android/app/travorier-upload-key.keystore
   ```

6. **Configure Build**
   - Edit `mobile/android/app/build.gradle`:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('travorier-upload-key.keystore')
         storePassword System.getenv("KEYSTORE_PASSWORD")
         keyAlias 'travorier'
         keyPassword System.getenv("KEY_PASSWORD")
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

### Credentials to Save

```bash
# Google Play Console
GOOGLE_PLAY_PACKAGE_NAME=com.travorier.app
KEYSTORE_PASSWORD=your-keystore-password
KEY_ALIAS=travorier
KEY_PASSWORD=your-key-password
```

### Files to Save (DON'T COMMIT)

- `travorier-upload-key.keystore` (Upload keystore)
- Store keystore password in password manager

**Add to `.gitignore`**:
```
*.keystore
```

### Notes

- ⏳ App review takes 1-7 days (slower than Apple)
- 🔄 First submission may take longer (account verification)
- 💰 One-time $25 fee (₹167/month over 12 months)
- ⚠️ Use internal testing track for beta testing

---

## 10. Domain Registrar (Optional)

**Purpose**: Custom domain for branding (e.g., `travorier.com`)

**Cost**: ₹500-1000/year depending on TLD

### Recommended Registrars

1. **Namecheap** (recommended for India)
   - Affordable pricing
   - Free WHOIS privacy
   - Easy DNS management
   - Supports UPI payments

2. **Cloudflare Registrar**
   - At-cost pricing (no markup)
   - Free DDoS protection
   - Best DNS performance

3. **GoDaddy India**
   - Popular in India
   - Local support
   - Accepts all Indian payment methods

### Setup Steps

1. **Search for Domain**
   - Try: `travorier.com`, `travorier.in`, `travorier.app`
   - Price comparison: .com (~₹800/year), .in (~₹500/year), .app (~₹1200/year)

2. **Purchase Domain**
   - Add domain to cart
   - Enable WHOIS privacy (hide personal info)
   - Auto-renew: Recommended
   - Purchase for 1 year initially

3. **Configure DNS**

   **For Vercel backend**:
   - Add A record: `api.travorier.com` → Vercel IP
   - Or CNAME: `api.travorier.com` → `travorier.vercel.app`
   - In Vercel: Settings → Domains → Add `api.travorier.com`

   **For Supabase** (if using custom domain):
   - Add CNAME: `db.travorier.com` → `your-project.supabase.co`
   - Configure in Supabase settings

4. **SSL Certificate**
   - Vercel provides free SSL automatically
   - Ensure HTTPS is enforced

### Credentials to Save

```bash
# Domain Configuration
DOMAIN_NAME=travorier.com
DOMAIN_REGISTRAR=namecheap
DOMAIN_EXPIRY=2027-02-16
BACKEND_URL=https://api.travorier.com
```

### Notes

- ⏳ DNS propagation takes 1-24 hours
- 💰 Budget: ₹42-100/month (₹500-1200/year)
- ⚠️ For MVP: Can skip and use free Vercel subdomain

---

## Environment Files Reference

### Backend `.env` (Complete)

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Product IDs
STRIPE_PRODUCT_STARTER_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_STARTER_PACK=price_xxxxxxxxxx
STRIPE_PRODUCT_VALUE_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_VALUE_PACK=price_xxxxxxxxxx
STRIPE_PRODUCT_PRO_PACK=prod_xxxxxxxxxx
STRIPE_PRICE_PRO_PACK=price_xxxxxxxxxx

# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=travorier-xxxxx

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-characters-long
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:19006,exp://localhost:19000,https://your-frontend.vercel.app

# Sentry (Optional - for error tracking)
SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxxxxx

# Environment
ENVIRONMENT=development
DEBUG=true
```

### Mobile `.env` (Complete)

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API
EXPO_PUBLIC_API_URL=http://localhost:8000
# Production: EXPO_PUBLIC_API_URL=https://api.travorier.com

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_PROJECT_ID=travorier-xxxxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:android:xxxxxxxxxxxxxxxx

# Google OAuth (Optional - if not using Supabase Auth)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxxx.apps.googleusercontent.com

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

---

## Security Checklist

### ✅ DO

- Store all secrets in `.env` files
- Add `.env`, `*.keystore`, `firebase-credentials.json` to `.gitignore`
- Use password manager for storing credentials
- Enable 2FA on all accounts
- Use test mode for all services during development
- Rotate API keys every 90 days
- Use separate credentials for development/production
- Encrypt sensitive data at rest
- Use HTTPS for all API endpoints
- Validate webhook signatures (Stripe)

### ❌ DON'T

- Commit secrets to GitHub
- Share service_role keys with frontend
- Use production keys in development
- Hardcode API keys in code
- Expose admin credentials
- Use same password across services
- Skip webhook signature verification
- Deploy without environment variables
- Share credentials via email/chat
- Use weak JWT secrets

---

## Cost Summary (Monthly)

| Service | Free Tier | Paid Tier | MVP Cost |
|---------|-----------|-----------|----------|
| GitHub | ✅ Free | - | ₹0 |
| Supabase | ✅ Free (500MB) | $25/month after limits | ₹0 |
| Stripe | ✅ Free (test) | 2.9% + ₹2 per transaction | ₹0 (until live) |
| Firebase | ✅ Free (unlimited FCM) | - | ₹0 |
| Google Cloud | ✅ Free ($300 credit) | Pay-as-you-go | ₹0 |
| Twilio | ❌ Optional | ~₹0.60/SMS | ₹0 (skip for MVP) |
| Vercel | ✅ Free (100GB) | $20/month after limits | ₹0 |
| Apple Developer | ❌ $99/year | - | ₹667/month |
| Google Play | ❌ $25 one-time | - | ₹167/month (amortized) |
| Domain | ❌ Optional | ₹500-1000/year | ₹42-83/month |
| **TOTAL** | | | **₹876-917/month** |

**MVP Strategy to Stay Under ₹500/month**:
- Skip Apple Developer until iOS app is ready (save ₹667)
- Use free Vercel subdomain instead of custom domain (save ₹42)
- Result: **₹167/month** (Google Play only)

**Post-MVP** (when you have users):
- Add Apple Developer for iOS (₹667/month)
- Add custom domain (₹42/month)
- Total: **₹876/month**

---

## Setup Timeline

### Week 1: Core Infrastructure

**Day 1** (2-3 hours):
- [ ] Create GitHub account and repository
- [ ] Create Supabase account and project
- [ ] Run database migration
- [ ] Configure authentication providers
- [ ] Test Supabase connection

**Day 2** (2-3 hours):
- [ ] Create Stripe account
- [ ] Configure test mode products
- [ ] Create webhook endpoint
- [ ] Test with test cards

**Day 3** (1-2 hours):
- [ ] Create Firebase project
- [ ] Add Android and iOS apps
- [ ] Download config files
- [ ] Generate service account key

**Day 4** (1-2 hours):
- [ ] Create Google Cloud project
- [ ] Configure OAuth consent screen
- [ ] Generate OAuth credentials
- [ ] Link to Supabase Auth

**Day 5** (1 hour):
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Deploy backend

### Week 2: App Store Setup (Optional for MVP)

**Day 1-2**:
- [ ] Apply for Apple Developer account
- [ ] Wait for approval (1-2 days)
- [ ] Create App ID and certificates

**Day 3**:
- [ ] Create Google Play Console account
- [ ] Generate upload keystore
- [ ] Configure app information

**Day 4-5**:
- [ ] Purchase domain (optional)
- [ ] Configure DNS
- [ ] Set up SSL certificates

---

## Troubleshooting

### Common Issues

**Supabase Connection Error**:
- ✅ Check SUPABASE_URL has `https://` prefix
- ✅ Verify anon key is correct (not service_role key)
- ✅ Ensure RLS policies are configured
- ✅ Check CORS settings in Supabase dashboard

**Stripe Webhook Not Working**:
- ✅ Verify webhook URL is correct and accessible
- ✅ Check signing secret matches
- ✅ Ensure endpoint uses HTTPS (not HTTP)
- ✅ Verify webhook events are enabled

**Firebase Push Notifications Not Sending**:
- ✅ Check server key is correct
- ✅ Verify device token is valid
- ✅ Ensure FCM is enabled in Firebase console
- ✅ Check service account permissions

**Google OAuth Error**:
- ✅ Verify redirect URI matches exactly
- ✅ Check client ID and secret are correct
- ✅ Ensure OAuth consent screen is configured
- ✅ Verify authorized domains include supabase.co

**Vercel Deployment Failed**:
- ✅ Check all environment variables are set
- ✅ Verify requirements.txt has all dependencies
- ✅ Ensure Python version is 3.11+
- ✅ Check build logs for errors

---

## Next Steps

After completing this setup:

1. **Update Environment Files**
   - Fill in `backend/.env` with all credentials
   - Fill in `mobile/.env` with client-side keys
   - Verify no secrets are committed to GitHub

2. **Test All Integrations**
   - Test Supabase auth (signup/login)
   - Test Stripe payment (test cards)
   - Test Firebase FCM (send test notification)
   - Test Google OAuth (sign in with Google)

3. **Deploy to Production**
   - Push to GitHub
   - Vercel auto-deploys backend
   - Update Stripe webhook URL
   - Test live endpoints

4. **Start Development** (Week 1)
   - Implement authentication flow
   - Build user profile management
   - Create trip posting UI
   - Test end-to-end

---

## Support Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)

For project-specific help, refer to:
- [Getting Started Guide](./GETTING_STARTED.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)

---

**Last Updated**: February 16, 2026
**Maintained By**: Deepak Panwar
**Questions?**: Review documentation first, then check GitHub Issues

**Remember**: Never commit secrets to GitHub! Always use `.env` files and environment variables. 🔒
