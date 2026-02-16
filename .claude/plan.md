# Travorier - Visual Incremental Development Plan

**Status**: Active - Milestone 1 in progress
**Last Updated**: 2026-02-16
**Approach**: Build features following the user journey from app load → authentication → homepage → core features
**Philosophy**: "See it, test it, iterate" - Build what's visible first, test immediately, then move forward

---

## 🎯 Development Milestones

### **Milestone 1: Visual Authentication (Google OAuth)** ⏳ IN PROGRESS
- User opens app → sees beautiful login screen
- User taps "Sign in with Google" → authenticates
- User redirected to homepage
- **Goal**: Working end-to-end authentication you can see and test
- **Estimated Time**: 2.5 hours
- **Status**: Not started

### **Milestone 2: Homepage & Navigation** 📋 PLANNED
- User sees welcome dashboard after login
- Two clear CTAs: "Browse Trips" and "Post Request"
- Bottom tab navigation: Home, Trips, Requests, Profile
- **Goal**: Complete app shell with navigation
- **Estimated Time**: 2.5 hours

### **Milestone 3: Traveler Journey (Browse & Match)** 📋 PLANNED
- Browse trips screen with search/filters
- View trip details
- Request to carry package
- See match confirmation
- **Goal**: First complete user flow from browse → match
- **Estimated Time**: 4 hours

### **Milestone 4: Sender Journey (Post & Match)** 📋 PLANNED
- Post package request screen
- View my requests
- Accept traveler match
- Chat with matched traveler
- **Goal**: Second complete user flow from post → match → chat
- **Estimated Time**: 3.5 hours

### **Milestone 5: Profile & Settings** 📋 PLANNED
- View/edit profile
- Upload avatar
- Logout functionality
- Trust score display
- **Goal**: Complete user profile management
- **Estimated Time**: 2 hours

---

## 📋 Milestone 1: Visual Authentication (Google OAuth)

**What Users See**: Professional login screen → Google sign-in → Welcome homepage

### Phase 1.1: Mobile - Login Screen UI (30 min) ⏳ NEXT

**Create Files:**
- `mobile/app/(auth)/_layout.tsx` - Auth stack navigator
- `mobile/app/(auth)/login.tsx` - Login screen UI

**Login Screen Components:**
```tsx
- Travorier logo/branding
- Tagline: "Connect Travelers with Package Senders"
- "Sign in with Google" button (prominent)
- Terms & Privacy links at bottom
- Loading state
```

**Design Notes:**
- Clean, minimal design
- Focus on Google OAuth button
- No email/password fields (skipping for now)
- Use gradient background for visual appeal

**Critical Files:**
- `/Users/deepak.panwar/personal/travorier/mobile/app/(auth)/_layout.tsx` (CREATE)
- `/Users/deepak.panwar/personal/travorier/mobile/app/(auth)/login.tsx` (CREATE)

---

### Phase 1.2: Mobile - Auth Store Methods (20 min) 📋 PENDING

**Update File:**
- `mobile/stores/authStore.ts`

**Add Methods:**
```typescript
signInWithGoogle: async () => {
  set({ loading: true })
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'exp://localhost:19000', // Expo dev URL
      }
    })
    if (error) throw error
    // Session will be set automatically by auth listener
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  } finally {
    set({ loading: false })
  }
}
```

**Critical File:**
- `/Users/deepak.panwar/personal/travorier/mobile/stores/authStore.ts` (UPDATE)

---

### Phase 1.3: Mobile - Enable Navigation (10 min) 📋 PENDING

**Update Files:**
- `mobile/app/index.tsx` - Uncomment navigation logic

**Changes:**
```typescript
// Uncomment lines 19-23 to enable auth redirect
useEffect(() => {
  if (!loading && initialized) {
    if (session) {
      router.replace('/(tabs)')  // Authenticated → Homepage
    } else {
      router.replace('/(auth)/login')  // Not authenticated → Login
    }
  }
}, [session, loading, initialized])
```

**Critical File:**
- `/Users/deepak.panwar/personal/travorier/mobile/app/index.tsx` (UPDATE)

---

### Phase 1.4: Backend - Auth Schemas (15 min) 📋 PENDING

**Create File:**
- `backend/app/schemas/auth.py`

**Schemas to Define:**
```python
class GoogleAuthRequest(BaseModel):
    id_token: str  # Google OAuth ID token

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    avatar_url: str | None
    phone: str | None
    phone_verified: bool = False
    id_verified: bool = False
    trust_score: int = 0

class AuthResponse(BaseModel):
    user: UserResponse
    token: TokenResponse
```

**Critical File:**
- `/Users/deepak.panwar/personal/travorier/backend/app/schemas/auth.py` (CREATE)

---

### Phase 1.5: Backend - Google OAuth Endpoint (30 min) 📋 PENDING

**Update File:**
- `backend/app/api/v1/auth.py`

**Implement Google OAuth Handler:**
```python
@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """
    Handle Google OAuth authentication
    Steps:
    1. Verify Google ID token with Supabase Auth
    2. Check if user profile exists in profiles table
    3. If not, create profile from Google data
    4. Return user data and Supabase JWT token
    """
    supabase = get_supabase_admin()

    # Verify Google token with Supabase
    auth_response = supabase.auth.sign_in_with_oauth_id_token(
        provider='google',
        id_token=request.id_token
    )

    # Check/create profile
    profile = supabase.table('profiles').select('*').eq('id', auth_response.user.id).single().execute()

    if not profile.data:
        # Create profile from Google data
        profile = supabase.table('profiles').insert({
            'id': auth_response.user.id,
            'email': auth_response.user.email,
            'full_name': auth_response.user.user_metadata.get('full_name'),
            'avatar_url': auth_response.user.user_metadata.get('avatar_url'),
        }).execute()

    return AuthResponse(...)
```

**Critical Files:**
- `/Users/deepak.panwar/personal/travorier/backend/app/api/v1/auth.py` (UPDATE)
- `/Users/deepak.panwar/personal/travorier/backend/app/schemas/auth.py` (REFERENCE)

---

### Phase 1.6: Backend - Enable Auth Routes (5 min) 📋 PENDING

**Update File:**
- `backend/app/main.py`

**Uncomment Auth Routes:**
```python
# Line 74 - UNCOMMENT THIS:
app.include_router(auth_router, prefix=settings.API_V1_PREFIX, tags=["auth"])
```

**Critical File:**
- `/Users/deepak.panwar/personal/travorier/backend/app/main.py` (UPDATE - line 74)

---

### Phase 1.7: Test Milestone 1 (15 min) 📋 PENDING

**Test Steps:**
1. Start backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload`
2. Start mobile: `cd mobile && npm start`
3. Open app in Expo Go or web
4. Verify login screen appears
5. Tap "Sign in with Google"
6. Complete Google OAuth flow
7. Verify redirect to homepage (will be blank for now)
8. Check backend logs for successful profile creation
9. Verify user in Supabase profiles table

**Success Criteria:**
- ✅ Login screen displays correctly
- ✅ Google OAuth opens in browser/webview
- ✅ User authenticates successfully
- ✅ Profile created in Supabase
- ✅ App redirects to /(tabs) route
- ✅ Auth session persists (test by reloading app)

---

## 📁 Critical Files Reference

### Completed Infrastructure (Ready to Use)
- ✅ Database: 10 tables in Supabase with RLS
- ✅ Backend: FastAPI with dependencies installed
- ✅ Mobile: Expo with npm packages installed
- ✅ Supabase: Connection verified

### Files to Create for Milestone 1
**Mobile:**
- `mobile/app/(auth)/_layout.tsx`
- `mobile/app/(auth)/login.tsx`

**Backend:**
- `backend/app/schemas/auth.py`

### Files to Update for Milestone 1
**Mobile:**
- `mobile/app/index.tsx` - Uncomment navigation logic
- `mobile/stores/authStore.ts` - Add signInWithGoogle method

**Backend:**
- `backend/app/api/v1/auth.py` - Implement Google OAuth endpoint
- `backend/app/main.py` - Uncomment auth routes (line 74)

---

## 🚀 Next Steps

1. **Start Phase 1.1**: Create login screen UI
2. **Test immediately**: Verify each phase works before moving forward
3. **Commit regularly**: After each phase completion (see commit.md for conventions)
4. **Build visually**: Focus on what users see and interact with

**Current Priority**: Get authentication working end-to-end so users can log in and see the app!

---

## 💡 Development Commands

**Run Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Run Mobile:**
```bash
cd mobile
npm start
```

**View API Docs:**
http://localhost:8000/docs

**Supabase Dashboard:**
https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm

---

## 📊 Progress Tracking

**Total Milestones**: 5
**Completed**: 0
**In Progress**: 1 (Milestone 1 - Authentication)
**Remaining**: 4

**Estimated Total Time**: ~14.5 hours
**Time Spent**: 0 hours
**Time Remaining**: ~14.5 hours
