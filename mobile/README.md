# Travorier Mobile App

React Native mobile application built with Expo.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase and Stripe credentials
```

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile/
├── app/                 # Expo Router pages
│   ├── (auth)/         # Authentication screens
│   ├── (tabs)/         # Main app tabs
│   ├── _layout.tsx     # Root layout
│   └── index.tsx       # Landing screen
├── components/          # Reusable components
├── stores/             # Zustand state stores
│   ├── authStore.ts    # Authentication state
│   └── creditStore.ts  # Credit balance state
├── services/           # API clients
│   ├── api.ts          # Backend API client
│   └── supabase.ts     # Supabase client
├── utils/              # Utility functions
├── assets/             # Images, fonts, etc.
├── app.json            # Expo configuration
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

## Key Features

### MVP (v1.0)
- ✅ Google OAuth authentication
- ✅ Phone OTP verification
- ✅ Trip posting and search
- ✅ Request posting and search
- ✅ Real-time chat (Supabase Realtime)
- ✅ Contact unlock (Stripe payments)
- ✅ Physical inspection (camera)
- ✅ QR code generation and scanning
- ✅ Push notifications (Firebase)
- ✅ Credit wallet system

## Development Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

## Environment Variables

Required environment variables (see `.env.example`):

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_FIREBASE_*` - Firebase configuration

## Tech Stack

- **Framework**: Expo ~50 / React Native 0.73
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Database**: Supabase (with Realtime)
- **Payments**: Stripe
- **Notifications**: Firebase Cloud Messaging

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --clear
```

### iOS simulator not opening
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

### Android emulator issues
Ensure Android Studio is installed and ANDROID_HOME is set.

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe React Native](https://stripe.dev/stripe-react-native)
