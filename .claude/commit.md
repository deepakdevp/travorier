# Git Commit Conventions for Travorier

## 📋 Commit Guidelines

### When to Commit
- **After every minor task completion** (e.g., single file created/updated)
- **After every major task completion** (e.g., phase completed, feature working)
- **After every milestone completion** (e.g., authentication working end-to-end)
- **Before switching context** (e.g., moving from backend to mobile work)
- **Before testing** (so you can revert if needed)

### Commit Message Format

Follow **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

---

## 🏷️ Commit Types

| Type | Description | Example |
|------|-------------|---------|
| **feat** | New feature | `feat(auth): add Google OAuth login screen` |
| **fix** | Bug fix | `fix(api): handle null user profile in auth endpoint` |
| **docs** | Documentation only | `docs(readme): update setup instructions` |
| **style** | Code style/formatting (no logic change) | `style(mobile): format login screen with Prettier` |
| **refactor** | Code refactoring (no feature change) | `refactor(auth): extract OAuth logic to separate function` |
| **perf** | Performance improvement | `perf(api): add database query caching` |
| **test** | Adding/updating tests | `test(auth): add unit tests for login flow` |
| **build** | Build system/dependencies | `build(mobile): upgrade Expo SDK to 50.1` |
| **ci** | CI/CD configuration | `ci: add GitHub Actions workflow` |
| **chore** | Maintenance tasks | `chore: update .gitignore` |
| **revert** | Revert previous commit | `revert: revert "feat(auth): add email login"` |

---

## 🎯 Commit Scopes

**Use descriptive scopes to indicate which part of the codebase changed:**

### Mobile App Scopes
- `mobile` - General mobile app changes
- `auth` - Authentication related
- `ui` - UI components
- `nav` - Navigation
- `screens` - Specific screens (home, trips, requests, profile)
- `stores` - State management (Zustand stores)
- `services` - API/Supabase services
- `types` - TypeScript types

### Backend Scopes
- `backend` - General backend changes
- `api` - API endpoints
- `schemas` - Pydantic schemas
- `auth` - Authentication logic
- `db` - Database/Supabase
- `middleware` - Middleware/dependencies
- `config` - Configuration

### Database Scopes
- `db` - Database schema/migrations
- `rls` - Row-Level Security policies
- `triggers` - Database triggers

### Shared Scopes
- `deps` - Dependencies/packages
- `config` - Configuration files
- `docs` - Documentation
- `env` - Environment variables

---

## ✍️ Commit Description

**Rules:**
1. Use **imperative mood** ("add" not "added" or "adds")
2. **Lowercase** first letter
3. **No period** at the end
4. **50 characters max** (keep it concise)
5. Complete the sentence: "If applied, this commit will..."

**Good Examples:**
- ✅ `feat(auth): add Google OAuth login button`
- ✅ `fix(api): validate user input in trip creation`
- ✅ `refactor(mobile): extract Card component`
- ✅ `docs(api): add endpoint documentation`

**Bad Examples:**
- ❌ `feat(auth): Added Google OAuth.` (past tense, period)
- ❌ `feat: changes` (too vague, no scope)
- ❌ `Fixed bug` (no type, no scope)
- ❌ `WIP` (not descriptive)

---

## 📝 Commit Body (Optional but Recommended)

**When to add body:**
- Explaining **why** the change was made
- Providing **context** that isn't obvious from the description
- Describing **breaking changes**
- Referencing **issues or tickets**

**Format:**
- Leave one blank line after description
- Wrap at 72 characters
- Use bullet points for multiple items

**Example:**
```
feat(auth): implement Google OAuth authentication

- Add signInWithGoogle method to auth store
- Create login screen with Google sign-in button
- Configure OAuth redirect URLs for Expo

This completes Phase 1.1 and 1.2 of Milestone 1.
Closes #12
```

---

## 🔖 Commit Footer (Optional)

**Breaking Changes:**
```
feat(api)!: change auth response structure

BREAKING CHANGE: Auth response now returns nested user object instead of flat structure
```

**Issue References:**
```
fix(auth): resolve session persistence issue

Fixes #45
Closes #46
Related to #47
```

---

## 📚 Commit Examples for Travorier

### Milestone 1 - Authentication

**Phase 1.1:**
```bash
feat(mobile): create auth layout navigator

- Add (auth) route group with stack navigator
- Configure headerShown: false for auth screens

Phase 1.1 of Milestone 1
```

```bash
feat(auth): add Google OAuth login screen

- Create login screen with Travorier branding
- Add "Sign in with Google" button
- Include Terms & Privacy links
- Implement loading state

Phase 1.1 of Milestone 1
```

**Phase 1.2:**
```bash
feat(auth): add Google OAuth sign-in method

- Implement signInWithGoogle in authStore
- Configure OAuth redirect for Expo dev server
- Add error handling and loading states

Phase 1.2 of Milestone 1
```

**Phase 1.3:**
```bash
feat(mobile): enable authentication-based navigation

- Uncomment navigation logic in app/index.tsx
- Redirect authenticated users to (tabs)
- Redirect unauthenticated users to (auth)/login

Phase 1.3 of Milestone 1
```

**Phase 1.4:**
```bash
feat(api): create authentication schemas

- Add GoogleAuthRequest schema
- Add TokenResponse schema
- Add UserResponse schema with profile fields
- Add AuthResponse wrapper schema

Phase 1.4 of Milestone 1
```

**Phase 1.5:**
```bash
feat(api): implement Google OAuth endpoint

- Add POST /auth/google endpoint
- Verify Google ID token with Supabase
- Auto-create user profile on first login
- Return JWT token and user data

Phase 1.5 of Milestone 1
```

**Phase 1.6:**
```bash
build(backend): enable auth routes in main app

- Uncomment auth router registration
- Auth endpoints now accessible at /api/v1/auth/*

Phase 1.6 of Milestone 1
```

**Phase 1.7:**
```bash
test(auth): verify end-to-end Google OAuth flow

- Tested login screen displays correctly
- Verified OAuth flow opens and completes
- Confirmed profile creation in Supabase
- Validated session persistence after reload

✅ Milestone 1 Complete: Authentication Working
```

---

### Other Common Commits

**Adding UI Components:**
```bash
feat(ui): create reusable Button component

- Support primary, secondary, outline variants
- Add loading and disabled states
- Include size prop (small, medium, large)
```

**Fixing Bugs:**
```bash
fix(api): handle missing profile data in auth

- Add null check before accessing user profile
- Return 404 if profile not found
- Prevent server crash on missing data
```

**Updating Dependencies:**
```bash
build(mobile): update Supabase client to 2.28.0

- Fix compatibility issues with websockets
- Resolve httpx version conflict
- Update related dependencies
```

**Refactoring:**
```bash
refactor(mobile): extract navigation config to constants

- Move tab configuration to separate file
- Improve code organization
- No functional changes
```

**Documentation:**
```bash
docs(api): add Swagger documentation for auth endpoints

- Document request/response schemas
- Add example payloads
- Include error codes and descriptions
```

---

## 🚫 What NOT to Commit

**Never commit:**
- `.env` files
- `firebase-credentials.json`
- `*.keystore` files
- API keys or secrets
- `node_modules/` or `venv/`
- `.DS_Store` or system files
- Personal notes or TODO comments
- Commented-out code (remove it instead)

**Check `.gitignore` before committing!**

---

## 🔄 Commit Workflow

### Standard Workflow

```bash
# 1. Make changes to code
# 2. Test the changes locally
# 3. Stage files
git add mobile/app/(auth)/login.tsx

# 4. Commit with conventional message
git commit -m "feat(auth): add Google OAuth login screen

- Create login screen with Travorier branding
- Add 'Sign in with Google' button
- Include Terms & Privacy links

Phase 1.1 of Milestone 1"

# 5. Continue working or push to remote
git push origin main
```

### Quick Commits (for minor changes)

```bash
# Single file change
git add mobile/components/Button.tsx
git commit -m "style(ui): format Button component"

# Multiple related files
git add backend/app/schemas/*.py
git commit -m "feat(api): add all data schemas"
```

### Amending Last Commit (use sparingly)

```bash
# If you forgot to add a file
git add forgotten-file.tsx
git commit --amend --no-edit

# If you need to fix the commit message
git commit --amend -m "feat(auth): corrected commit message"
```

---

## 📊 Commit Frequency Guidelines

**Ideal Frequency:**
- **Every 15-30 minutes** during active development
- **After each file creation/update** that works
- **After each phase completion** (even if partial)
- **Before breaks** (lunch, end of day)

**Benefits:**
- Easy to revert small changes
- Clear history of what was built when
- Better collaboration (if working with team)
- Protects against data loss

---

## 🎯 Summary

**Golden Rules:**
1. ✅ Commit early, commit often
2. ✅ Use conventional commit format
3. ✅ Write clear, descriptive messages
4. ✅ One logical change per commit
5. ✅ Test before committing
6. ❌ Never commit secrets or generated files
7. ✅ Reference the plan phase/milestone

**Remember:** Good commit messages are for **future you** and your team. Make them count!
