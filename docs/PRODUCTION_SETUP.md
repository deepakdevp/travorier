# Travorier Production Setup Guide

Each section below is one activation task. Complete them in order.

---

## Task 1: Supabase — Create `id-documents` Storage Bucket

**Where:** Supabase Dashboard → Storage → New Bucket

**Steps:**
1. Go to https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm/storage/buckets
2. Click **"New bucket"**
3. Name: `id-documents`
4. Toggle **Public bucket: OFF** (private — only the owner can upload, admins view)
5. Click **Create bucket**

**Then add RLS policies** — go to Storage → Policies → `id-documents` bucket:

Run this SQL in the SQL Editor (https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm/sql):

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own ID docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can read own ID docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role (admin) to read all (for review)
-- Service role bypasses RLS by default, no policy needed.
```

**Verify:** Upload test from the identity-verification screen — should succeed.

---

## Task 2: EAS Build — iOS & Android

**Prerequisites:**
- Expo account at https://expo.dev (free)
- Apple Developer account ($99/yr) for iOS
- Google Play Console account ($25 one-time) for Android

**Steps:**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Initialize EAS project (run from mobile/)
cd /Users/deepak.panwar/personal/travorier/mobile
eas init

# This sets the real projectId in app.json extra.eas.projectId
# Commit the updated app.json after this step

# 4. Build for iOS (simulator first)
eas build --platform ios --profile development

# 5. Build for Android
eas build --platform android --profile development

# 6. Production build (for App Store submission)
eas build --platform all --profile production
```

**Update `eas.json` submit section** with your real Apple credentials:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your@apple.id",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

---

## Task 3: Backend Deployment on Railway

**Prerequisites:** Railway account at https://railway.app (free tier available)

**Steps:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project (run from backend/)
cd /Users/deepak.panwar/personal/travorier/backend
railway init

# 4. Set environment variables (one by one or via dashboard)
railway variables set ENVIRONMENT=production
railway variables set DEBUG=False
railway variables set SUPABASE_URL=https://syjhflxtfcfavdacodgm.supabase.co
railway variables set SUPABASE_SERVICE_KEY=<your-service-key>
railway variables set SUPABASE_ANON_KEY=<your-anon-key>
railway variables set STRIPE_SECRET_KEY=<sk_live_...>
railway variables set STRIPE_PUBLISHABLE_KEY=<pk_live_...>
railway variables set STRIPE_WEBHOOK_SECRET=<whsec_...>  # Set after Step 5
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set ALLOWED_ORIGINS=https://your-app-domain.com,travorier://
railway variables set SENTRY_DSN=<your-sentry-dsn>  # Set after Task 5

# 5. Deploy
railway up

# 6. Get your deployed URL
railway status
# Note the URL: https://travorier-backend-xxxx.railway.app
```

**Update `EXPO_PUBLIC_API_URL` in mobile `.env`:**
```
EXPO_PUBLIC_API_URL=https://travorier-backend-xxxx.railway.app
```

---

## Task 4: Stripe Production Webhook

**Do this AFTER Task 3** (need the deployed backend URL).

**Steps:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. URL: `https://travorier-backend-xxxx.railway.app/api/v1/payments/webhook`
4. Events to listen for:
   - `payment_intent.succeeded`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (`whsec_...`)
7. Update Railway env var:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
   railway up  # Redeploy to pick up the new var
   ```

**Switch to live Stripe keys:**
```bash
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Update mobile `.env`:**
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Task 5: Sentry Error Tracking

**Steps:**

### Backend (already installed — just needs DSN)
1. Go to https://sentry.io → Create new project → Python → FastAPI
2. Copy your DSN
3. Set in Railway:
   ```bash
   railway variables set SENTRY_DSN=https://xxxx@yyyy.ingest.sentry.io/zzzz
   ```

### Mobile (already installed — just needs DSN)
1. Go to https://sentry.io → Create new project → React Native
2. Copy your DSN
3. Set in `mobile/.env`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxxx@yyyy.ingest.sentry.io/zzzz
   ```
4. Update `app.json` sentry-expo plugin with real org/project names:
   ```json
   ["sentry-expo", {
     "organization": "your-sentry-org-slug",
     "project": "travorier-mobile"
   }]
   ```
5. Rebuild the app (`eas build`) to pick up the Sentry source map upload

---

## Task 6: FCM (Firebase Cloud Messaging) — Production

The current push implementation uses **Expo Push Service** (not direct FCM), so full Firebase setup is optional for Expo Go / development builds.

For production EAS builds with direct FCM:

**Steps:**
1. Go to https://console.firebase.google.com
2. Create project: "Travorier"
3. Add Android app: package `com.travorier.app`
4. Download `google-services.json` → place in `mobile/` (already gitignored)
5. Add iOS app: bundle ID `com.travorier.app`
6. Download `GoogleService-Info.plist` → place in `mobile/` (already gitignored)
7. Go to Project Settings → Service Accounts → Generate new private key
8. Save as `backend/firebase-credentials.json`
9. Update Railway env:
   ```bash
   railway variables set FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
   ```
   (Or mount the file via Railway volume / set as base64 env var)

**Note:** For Expo-managed push tokens (`ExponentPushToken[...]`), the backend's
`push_service.py` already works without direct FCM. FCM is only needed for raw
device tokens from custom notification setups.

---

## Production Checklist

Before going live, verify:

- [ ] Supabase `id-documents` bucket created with RLS policies
- [ ] EAS build succeeds for both platforms
- [ ] Backend deployed on Railway, health check passes: `curl https://your-url.railway.app/health`
- [ ] Stripe webhook registered and `STRIPE_WEBHOOK_SECRET` set
- [ ] Sentry DSNs set in both backend and mobile
- [ ] Mobile `.env` updated with production `EXPO_PUBLIC_API_URL`
- [ ] Mobile `.env` updated with production `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Test a full end-to-end flow: post trip → match → chat → handover → review
- [ ] Submit to App Store via `eas submit --platform ios --profile production`
- [ ] Submit to Google Play via `eas submit --platform android --profile production`
