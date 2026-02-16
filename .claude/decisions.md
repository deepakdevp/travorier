# Travorier - Architectural Decision Records (ADRs)

This document tracks all significant architectural and technical decisions made during the development of Travorier.

**Purpose**: Document the "why" behind major technical choices to help future contributors (and AI assistants) understand the reasoning.

**Last Updated**: February 16, 2026

---

## ADR Template

```markdown
## ADR-XXX: [Decision Title]

**Status**: Accepted | Proposed | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Deciders**: [Name(s)]
**Tags**: [category tags]

### Context
[The problem or situation requiring a decision]

### Decision
[The decision that was made]

### Rationale
[Why this decision was made - key factors, trade-offs considered]

### Consequences

**Positive**:
- [Benefits of this decision]

**Negative**:
- [Drawbacks or trade-offs]

**Neutral**:
- [Other impacts]

### Alternatives Considered
[Other options that were evaluated and why they were rejected]

### Compliance
[How this decision satisfies requirements, regulations, or constraints]

### Review Date
[When this decision should be reconsidered]
```

---

## ADR-001: Use Supabase Instead of Custom PostgreSQL + Auth

**Status**: Accepted
**Date**: 2026-02-14
**Deciders**: Deepak Panwar
**Tags**: #database #authentication #infrastructure

### Context

Need a database and authentication system for MVP. Options:
1. Self-managed PostgreSQL + custom auth (JWT, OAuth implementation)
2. AWS RDS + AWS Cognito
3. Supabase (PostgreSQL + Auth + Storage + Realtime)

**Constraints**:
- Solo developer with 12-week timeline
- Bootstrap budget (<₹500/month for MVP)
- Need: Database, Auth (Google OAuth, Phone OTP), Storage, Real-time chat

### Decision

**Use Supabase** as the primary backend infrastructure.

### Rationale

1. **Time Savings**: Supabase provides pre-built auth (Google OAuth, Phone OTP) without custom implementation (saves 2-3 weeks)
2. **Cost**: Free tier includes 500MB DB + 1GB storage + unlimited auth (vs $50+/month for AWS RDS + Cognito)
3. **Row-Level Security (RLS)**: Built-in authorization at database level (more secure than application-level checks)
4. **Real-time**: Built-in PostgreSQL LISTEN/NOTIFY for chat (no need for WebSocket server)
5. **Storage**: Integrated file storage with CDN (no need for S3)
6. **Developer Experience**: Excellent documentation, TypeScript SDKs, dashboard

### Consequences

**Positive**:
- Saves 2-3 weeks of auth implementation time
- Zero infrastructure costs for MVP
- Built-in RLS reduces security vulnerabilities
- Real-time chat without custom WebSocket server
- Storage + CDN included (profile pics, inspection media)
- Automatic API generation from database schema

**Negative**:
- Vendor lock-in (migration to self-hosted PostgreSQL is complex)
- Free tier limitations (500MB DB, 1GB storage, 2GB bandwidth/month)
- Less control over infrastructure
- PostgreSQL-only (no NoSQL option)

**Neutral**:
- Need to learn Supabase-specific patterns (RLS policies, client SDKs)
- Dependent on Supabase uptime (99.9% SLA on paid tiers)

### Alternatives Considered

**AWS RDS + Cognito**:
- ❌ Cost: ~$50-100/month (RDS t3.micro + Cognito)
- ❌ Complexity: Custom integration, more code to maintain
- ✅ Scalability: Better for large scale
- **Rejected**: Too expensive and complex for MVP

**Self-hosted PostgreSQL + Custom Auth**:
- ❌ Time: 2-3 weeks for auth implementation
- ❌ Maintenance: Server management, backups, security patches
- ✅ Control: Full control over infrastructure
- **Rejected**: Exceeds 12-week timeline

**Firebase (Firestore + Auth)**:
- ✅ Cost: Free tier generous
- ❌ NoSQL: Difficult to model relational data (trips, matches, reviews)
- ❌ Queries: Limited query capabilities vs SQL
- **Rejected**: NoSQL not suitable for relational data model

### Compliance

- ✅ Bootstrap budget: $0 for MVP (free tier)
- ✅ Timeline: Saves 2-3 weeks (fits 12-week MVP)
- ✅ Security: RLS provides database-level authorization
- ✅ Scalability: Free tier → Paid tier transition is seamless

### Review Date

**Month 6** (post-MVP) - Evaluate if hitting free tier limits:
- Database size approaching 500MB → Consider paid tier ($25/month)
- Bandwidth approaching 2GB/month → Consider paid tier
- If scaling beyond Supabase capabilities → Migrate to AWS/GCP

---

## ADR-002: Manual Verification for MVP (Defer Automated KYC)

**Status**: Accepted
**Date**: 2026-02-14
**Deciders**: Deepak Panwar
**Tags**: #verification #cost-optimization #mvp

### Context

Need to verify user identities (ID documents) to build trust. Options:
1. Automated KYC services (iDenfy, Digio, AU Small Finance Bank API)
2. Manual verification by admin

**Constraints**:
- iDenfy: ₹80-100 per verification (~₹8,000-10,000/month for 100 users)
- Digio: ~₹50-70 per verification
- Bootstrap budget: <₹500/month for MVP
- Target: 50 users by Week 12

### Decision

**Use manual verification for MVP**, automated KYC post-MVP (Month 4+).

### Rationale

1. **Cost Savings**: Manual verification costs ₹0 vs ₹5,000-10,000/month for automated KYC
2. **MVP Scope**: 50 users × manual verification (5 min each) = 250 minutes/month (~4 hours) - manageable
3. **Quality Control**: Human review can catch issues automated systems miss
4. **Flexibility**: Can accept Aadhaar, PAN, Passport, Driving License (automated systems often support limited document types)
5. **Iterative Improvement**: Learn what documents work best before automating

### Consequences

**Positive**:
- Saves ₹5,000-10,000/month (critical for bootstrap budget)
- Admin has full control over verification criteria
- Can provide personalized feedback to users (e.g., "Image too blurry, please resubmit")
- Builds operational knowledge before automating

**Negative**:
- Admin time required (4-6 hours/month for 100 verifications)
- Verification delay: 24-48 hours vs instant (automated)
- Scalability limit: Manual verification doesn't scale beyond 500-1000 users/month
- User experience: Longer wait time for verification

**Neutral**:
- Need to build admin UI for verification review (Supabase Dashboard sufficient for MVP)
- Process documentation required (verification criteria, approval/rejection reasons)

### Alternatives Considered

**iDenfy**:
- ✅ Instant verification (< 1 minute)
- ✅ High accuracy with liveness detection
- ❌ Cost: ₹80-100/verification (₹8,000-10,000/month for 100 users)
- **Rejected**: Exceeds bootstrap budget by 16-20x

**Digio**:
- ✅ India-specific, supports Aadhaar eKYC
- ✅ Lower cost: ₹50-70/verification
- ❌ Still ₹5,000-7,000/month for 100 users
- **Rejected**: Still exceeds budget by 10-14x

**AU Small Finance Bank KYC API**:
- ✅ Bank-grade verification
- ❌ Requires business account, complex integration
- ❌ Cost unclear (enterprise pricing)
- **Rejected**: Too complex for MVP

### Compliance

- ✅ Bootstrap budget: ₹0 cost for MVP
- ✅ Legal: Manual verification is legally valid (not using automated eKYC)
- ✅ Security: Admin reviews documents in Supabase Dashboard (encrypted storage)
- ⚠️ Scalability: Limited to ~500 users/month (acceptable for MVP)

### Review Date

**Month 4** (after MVP launch):
- If user growth > 200 verifications/month → Integrate Digio (₹50/verification)
- If budget allows > ₹5,000/month → Consider iDenfy for better UX

**Transition Plan** (Post-MVP):
1. Month 4: Integrate Digio API for Aadhaar eKYC
2. Month 5: A/B test manual vs automated (measure approval rate, turnaround time)
3. Month 6: Fully migrate to automated KYC if metrics are positive

---

## ADR-003: Credit-Based Unlock System (Not Subscription)

**Status**: Accepted
**Date**: 2026-02-14
**Deciders**: Deepak Panwar
**Tags**: #monetization #business-model #payments

### Context

Need to monetize the platform while keeping traveler-sender payments P2P. Options:
1. **Subscription**: Monthly subscription for unlimited access (e.g., ₹299/month)
2. **Per-Transaction Fee**: Commission on delivery payment (e.g., 10% of ₹500 = ₹50)
3. **Credit-Based Unlock**: Pay per contact unlock (e.g., ₹99 to unlock one traveler's contact)
4. **Listing Fee**: Pay to post trips/requests (e.g., ₹49/listing)

**Constraints**:
- P2P delivery payment (zero commission on actual delivery fee to avoid courier regulations)
- User perception: "Paying for introduction, not delivery"
- Bootstrap budget: Need revenue from Day 1

### Decision

**Use credit-based unlock system** where senders pay ₹99 (1 credit) to unlock a traveler's contact information.

**Credit Packs**:
- Starter: ₹249 → 5 credits (₹49.80/credit)
- Value: ₹399 → 10 credits (₹39.90/credit, 20% off)
- Pro: ₹749 → 25 credits (₹29.96/credit, 40% off)

### Rationale

1. **Pay-Per-Value**: Users pay only when they find a match (vs subscription where they pay even if no matches)
2. **Low Friction**: ₹99 unlock fee is low enough to experiment, high enough to filter serious users
3. **Bulk Discounts**: Credit packs incentivize bulk purchase (higher LTV)
4. **Clear Value Prop**: "Pay ₹99 to get traveler's contact, negotiate delivery fee directly"
5. **Regulatory Compliance**: Clearly a "discovery fee" not a "delivery commission" (avoids courier license requirements)
6. **Predictable Revenue**: 1 unlock = ₹99 revenue (vs uncertain subscription churn)

### Consequences

**Positive**:
- **User-Friendly**: Pay only when you use it (vs monthly subscription)
- **Higher Conversion**: Low barrier to first purchase (₹99 vs ₹299 subscription)
- **Bulk Sales**: Credit packs increase average transaction value (₹249-749)
- **Regulatory Safety**: "Discovery fee" not "delivery commission"
- **Flexible Pricing**: Easy to A/B test different credit pack prices
- **Refund Handling**: Can refund credits if match fails (vs complex subscription refunds)

**Negative**:
- **Lower LTV**: One-time purchases vs recurring subscription revenue
- **Price Sensitivity**: Users may hesitate to unlock multiple travelers (vs unlimited with subscription)
- **Credit Expiry**: Need to decide if credits expire (creates friction vs prevents hoarding)
- **Fraud Risk**: Users might unlock contacts then transact offline (mitigated by requiring unlock before chat)

**Neutral**:
- Need to implement credit system in database (`credits` table)
- Need to handle refunds (e.g., if traveler cancels after unlock)
- Need to track credit transactions for accounting

### Alternatives Considered

**Subscription Model (₹299/month)**:
- ✅ Recurring revenue, higher LTV
- ✅ Unlimited unlocks encourages usage
- ❌ High barrier for new users (₹299 upfront vs ₹99 per unlock)
- ❌ Churn risk: Users cancel if no matches in a month
- **Rejected**: Too high-friction for MVP, difficult to recover from failed matches

**Commission on Delivery (10%)**:
- ✅ Revenue scales with transaction value
- ❌ Requires escrow/payment processing (complex, 7-10 days settlement)
- ❌ Regulatory risk: Might be classified as courier service (requires license)
- ❌ User perception: "Platform taking cut of my delivery fee"
- **Rejected**: Regulatory risk + complexity + negative perception

**Listing Fee (₹49/listing)**:
- ✅ Simple, pay to post
- ❌ Discourages trip posting (reduces supply)
- ❌ No guarantee of match (user pays even if no one responds)
- **Rejected**: Hurts supply side (travelers), reduces marketplace liquidity

**Freemium (Free unlock, pay for premium features)**:
- ✅ Low friction for new users
- ❌ Unclear what "premium" features would be
- ❌ Delayed monetization (many users might never upgrade)
- **Rejected**: Need revenue from Day 1 to validate business model

### Compliance

- ✅ Business Model: "Discovery & Access Fee" (not delivery commission)
- ✅ Regulatory: Avoids courier license requirements (P2P delivery payment offline)
- ✅ User Expectation: Clear value proposition ("₹99 to unlock contact")
- ✅ Stripe TOS: Virtual credits are allowed (prepaid credits for platform services)

### Review Date

**Month 3** (after 100+ transactions):
- Analyze metrics: Conversion rate (unlock %), average credits per user, refund rate
- A/B test pricing: Try ₹79 or ₹119 unlock fee
- Consider hybrid: Subscription + per-unlock (e.g., ₹199/month + ₹49/unlock)

**Potential Evolution** (Post-MVP):
- **Month 6**: Introduce subscription tier for power users (₹499/month for 10 unlocks)
- **Month 9**: Add "Boost Trip" feature (₹199 for 7-day featured placement)
- **Month 12**: Freemium model (first unlock free, then pay)

---

## ADR-004: Offline P2P Delivery Payment (Zero Commission)

**Status**: Accepted
**Date**: 2026-02-14
**Deciders**: Deepak Panwar
**Tags**: #business-model #payments #regulatory

### Context

Need to decide how delivery payment (traveler fee) is handled. Options:
1. **Platform Escrow**: Sender pays platform → Platform pays traveler (minus commission)
2. **Direct P2P Offline**: Sender pays traveler directly in cash/UPI (platform not involved)
3. **In-App Wallet**: Platform holds funds, releases after delivery

**Constraints**:
- If platform touches delivery payment → Might be classified as courier service
- Courier license requirements in India: Complex, time-consuming, expensive
- Bootstrap budget: Cannot afford legal/regulatory complexity
- Timeline: 12 weeks to MVP

### Decision

**Delivery payment is handled offline (P2P)** between sender and traveler. Platform does NOT process or hold delivery fees.

**Platform Revenue**: Only from contact unlock fee (₹99), not delivery commission.

### Rationale

1. **Regulatory Safety**: Platform is a "discovery service" not a "courier service" (avoids license requirements)
2. **Simplicity**: No escrow, no commission, no payout complexity (saves 3-4 weeks of development)
3. **User Flexibility**: Users negotiate delivery fee directly (market-driven pricing)
4. **Trust Building**: Forces users to build trust before transacting (aligns with trust score system)
5. **Cost Savings**: No payment processing fees on delivery amount (only on credit purchases)

### Consequences

**Positive**:
- **Regulatory Compliance**: Platform is discovery service, not courier (no license needed)
- **Simplicity**: No escrow, no payouts, no dispute resolution for delivery payment
- **User Control**: Users set their own delivery fees (competitive marketplace)
- **Trust System**: Offline payment reinforces need for trust score and verification
- **Lower Fees**: Platform doesn't take commission on delivery (user-friendly positioning)

**Negative**:
- **Fraud Risk**: Sender or traveler might not pay/deliver after offline arrangement
- **No Payment Guarantee**: Platform cannot guarantee payment (vs escrow)
- **Dispute Resolution**: Platform cannot mediate payment disputes (offline transaction)
- **Lower Revenue**: Missing potential commission income (e.g., 10% of delivery fee)
- **Competitive Disadvantage**: Other platforms with escrow might seem more secure

**Neutral**:
- Need strong trust & safety mechanisms (verification, reviews, trust score)
- Need clear Terms of Service stating platform is discovery service only
- Need user education: "Platform helps you find travelers, payment is between you"

### Alternatives Considered

**Escrow + Commission (10%)**:
- ✅ Payment guarantee for both parties
- ✅ Higher revenue (commission income)
- ❌ Regulatory risk: Classified as courier service
- ❌ Complexity: Escrow implementation, payout system, 7-10 day settlement
- ❌ User friction: Higher fees (10% commission + ₹99 unlock)
- **Rejected**: Regulatory risk too high, complexity exceeds MVP timeline

**In-App Wallet**:
- ✅ Funds held securely until delivery
- ❌ Requires RBI approval for Payment Aggregator license
- ❌ Compliance: KYC, AML, transaction reporting
- ❌ Development: 6-8 weeks for wallet + compliance
- **Rejected**: Legal complexity far exceeds MVP scope

**Partial Escrow** (Platform holds 50%, rest offline):
- ✅ Some payment guarantee
- ❌ Still requires escrow infrastructure
- ❌ Regulatory ambiguity (might still be classified as courier)
- **Rejected**: Complexity with unclear regulatory benefit

### Compliance

- ✅ **Regulatory**: Platform is "discovery service" under Indian law
- ✅ **Terms of Service**: Clearly states platform does not process delivery payments
- ✅ **GST**: Only charged on platform fees (credit purchases), not delivery fees
- ✅ **User Agreement**: Users acknowledge they arrange delivery payment independently

**Legal Text** (from TOS):
> "Travorier is a discovery platform that connects travelers and senders. All delivery arrangements, including fees, are negotiated directly between users. Travorier does not process, hold, or guarantee delivery payments."

### Review Date

**Month 6** (post-MVP):
- Monitor fraud/dispute rate: If > 5% → Consider escrow
- Evaluate regulatory landscape: Check if new guidelines clarify courier vs discovery distinction
- User feedback: If 30%+ users request escrow → Explore compliance path

**Potential Evolution** (Post-MVP):
- **Month 9**: Introduce optional escrow for high-value deliveries (e.g., >₹5,000 packages)
- **Month 12**: Partner with payment gateway (e.g., Razorpay Escrow) for managed solution
- **Year 2**: Apply for courier license if business scales significantly (>10,000 deliveries/month)

---

## ADR-005: React Native (Expo) Instead of Native

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #mobile #framework #development

### Context

Need a mobile app (iOS + Android). Options:
1. **Native**: Swift (iOS) + Kotlin (Android) - Two separate codebases
2. **React Native (Expo)**: JavaScript/TypeScript, shared codebase
3. **Flutter**: Dart, shared codebase
4. **Progressive Web App (PWA)**: Web-based, no app stores

**Constraints**:
- Solo developer with 12-week timeline
- Need iOS + Android support
- Features required: Camera (inspection photos), Push notifications, Real-time chat

### Decision

**Use React Native with Expo** for mobile development.

### Rationale

1. **Single Codebase**: Write once, run on iOS + Android (saves 50% dev time vs native)
2. **Developer Experience**: Expo provides pre-built modules (camera, notifications, OTA updates)
3. **Fast Iteration**: Hot reload, Expo Go for testing on physical devices
4. **Ecosystem**: Large community, extensive libraries (@supabase/supabase-js, @stripe/stripe-react-native)
5. **OTA Updates**: Deploy bug fixes without app store approval (critical for MVP iteration)
6. **Cost**: Expo free tier sufficient for MVP

### Consequences

**Positive**:
- **Time Savings**: 50% faster than native (6 weeks vs 12 weeks for both platforms)
- **Code Reuse**: Shared business logic, API clients, state management
- **Faster Deployment**: Build and deploy to both platforms simultaneously
- **OTA Updates**: Fix bugs without app store review (1-2 weeks saved per fix)
- **Easier Debugging**: Console logs, React DevTools work on iOS + Android

**Negative**:
- **Performance**: Slightly slower than native (acceptable for CRUD app, not gaming)
- **Bundle Size**: Larger APK/IPA size (~40-50MB vs ~10-20MB native)
- **Native Modules**: Limited access to platform-specific APIs (must use Expo modules or eject)
- **Learning Curve**: If unfamiliar with React (not applicable - already familiar)

**Neutral**:
- Expo SDK updates every 3 months (need to upgrade dependencies regularly)
- Need to test on both iOS + Android despite shared codebase (platform-specific bugs)

### Alternatives Considered

**Native (Swift + Kotlin)**:
- ✅ Best performance and native feel
- ✅ Full access to platform APIs
- ❌ Double development time (12+ weeks)
- ❌ Maintain two codebases (iOS + Android)
- **Rejected**: Timeline unfeasible for solo developer

**Flutter**:
- ✅ Single codebase, good performance
- ✅ Beautiful UI (Material Design + Cupertino widgets)
- ❌ Dart language (less familiar than JavaScript/TypeScript)
- ❌ Smaller ecosystem vs React Native
- ❌ Supabase/Stripe SDKs less mature for Flutter
- **Rejected**: Learning curve + ecosystem maturity concerns

**Progressive Web App (PWA)**:
- ✅ No app store approval needed
- ✅ Instant deployment (web URL)
- ❌ Limited camera access (no video recording on iOS)
- ❌ No push notifications on iOS (only Android)
- ❌ Poor offline support
- **Rejected**: Camera and push notifications are critical features

### Compliance

- ✅ Timeline: Fits 12-week MVP (6 weeks for mobile vs 12 for native)
- ✅ Features: Expo supports all required features (camera, push notifications, real-time)
- ✅ Budget: Expo free tier sufficient (no additional cost)

### Review Date

**Month 6** (post-MVP):
- Evaluate performance: If app feels sluggish → Optimize or consider ejecting to bare React Native
- Check Expo limitations: If hitting module constraints → Eject to bare workflow
- User feedback: If platform-specific issues frequent → Consider native rewrite (unlikely)

---

## ADR-006: FastAPI for Backend (Not Django/Flask)

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #backend #framework #api

### Context

Need a Python backend framework for REST API. Options:
1. **FastAPI**: Modern, async, automatic OpenAPI docs
2. **Django REST Framework**: Mature, batteries-included, ORM
3. **Flask**: Lightweight, flexible, minimalistic

**Requirements**:
- REST API for mobile app
- Stripe webhook handling
- Firebase FCM integration
- Supabase client integration

### Decision

**Use FastAPI** as the backend framework.

### Rationale

1. **Performance**: Async/await support (2-3x faster than Flask/Django for I/O-bound operations)
2. **Type Safety**: Pydantic models with automatic validation (reduces bugs)
3. **Auto-Documentation**: Automatic OpenAPI (Swagger) docs at `/docs` (saves documentation time)
4. **Modern Python**: Uses Python 3.11+ features (type hints, async)
5. **Developer Experience**: Less boilerplate than Django, more structure than Flask

### Consequences

**Positive**:
- **Performance**: Async support ideal for database queries, Stripe API calls, FCM requests
- **Type Safety**: Pydantic models catch validation errors at request time
- **Documentation**: Automatic API docs (no need to write OpenAPI spec manually)
- **Learning Curve**: If unfamiliar with FastAPI (moderate, but good docs)

**Negative**:
- **Less Mature**: Newer than Django/Flask (fewer Stack Overflow answers)
- **Smaller Ecosystem**: Fewer third-party libraries vs Django
- **No ORM**: No built-in ORM (using Supabase client instead)

**Neutral**:
- Need to learn async/await patterns (worth the investment)

### Alternatives Considered

**Django REST Framework**:
- ✅ Mature, excellent documentation
- ✅ Built-in ORM (but we're using Supabase)
- ❌ Synchronous (blocking I/O)
- ❌ More boilerplate (settings, apps, migrations)
- **Rejected**: Overkill for REST API, slower performance

**Flask**:
- ✅ Lightweight, minimal
- ❌ No async support (or complex with Quart/asyncio)
- ❌ Manual request validation (more code)
- ❌ No automatic API docs
- **Rejected**: Too minimalistic, requires more custom code

### Compliance

- ✅ Timeline: FastAPI development speed comparable to Flask, faster than Django
- ✅ Performance: Async ideal for I/O-bound operations (Stripe, FCM, Supabase)
- ✅ Budget: Deploys to Vercel free tier (serverless functions)

### Review Date

**Month 6** (post-MVP) - Generally stable, unlikely to change unless performance issues arise.

---

## ADR-007: Row-Level Security (RLS) for Authorization

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #security #authorization #database

### Context

Need to enforce authorization (who can access what data). Options:
1. **Application-Level**: Check user permissions in backend code
2. **Row-Level Security (RLS)**: Enforce permissions in database policies
3. **Hybrid**: RLS for sensitive data, application-level for complex logic

**Constraints**:
- Multi-tenant data (users should only see their own trips, matches, messages)
- Security-critical: Contact info, payment data, private messages

### Decision

**Use Supabase Row-Level Security (RLS) policies** for all authorization.

### Rationale

1. **Defense in Depth**: Authorization enforced at database level (cannot be bypassed by buggy application code)
2. **Consistency**: Same policies apply whether accessed from backend, mobile app, or SQL queries
3. **Supabase Native**: Automatic JWT validation, `auth.uid()` helper makes policies simple
4. **Reduced Code**: No need to write authorization checks in every API endpoint
5. **Auditable**: Policies are declarative SQL (easy to review and test)

### Consequences

**Positive**:
- **Security**: Cannot accidentally expose data (policies always enforced)
- **Less Code**: No manual authorization checks in backend
- **Consistency**: Same rules apply everywhere
- **Performance**: Policies compiled by PostgreSQL (efficient)

**Negative**:
- **Learning Curve**: Need to understand RLS syntax and `auth.uid()` usage
- **Debugging**: Policy violations return "permission denied" (less descriptive than application-level errors)
- **Complexity**: Complex policies (e.g., "user can see matches they're involved in") require careful writing

**Neutral**:
- Need to test policies thoroughly (can use SQL Editor with `set local role authenticated` to simulate users)

### Alternatives Considered

**Application-Level Authorization**:
- ✅ Easier to debug (custom error messages)
- ❌ Easy to forget checks (security risk)
- ❌ More code (every endpoint needs checks)
- **Rejected**: Higher risk of security vulnerabilities

**Hybrid (RLS + Application)**:
- ✅ Flexibility for complex logic
- ❌ Inconsistency (some checks in DB, some in code)
- **Rejected**: Adds complexity without clear benefit for MVP

### Compliance

- ✅ Security: Database-level authorization (cannot be bypassed)
- ✅ Best Practice: Aligned with Supabase recommendations
- ✅ Maintainability: Policies are version-controlled in migration files

### Review Date

**Stable** - RLS is a foundational security pattern, unlikely to change.

---

## ADR-008: 24-Hour Chat Auto-Lock Post-Flight

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #safety #chat #user-experience

### Context

Need to decide when to disable chat between sender and traveler. Options:
1. **Never**: Chat remains open indefinitely
2. **After Delivery**: Lock chat immediately after QR scan
3. **24-Hour Post-Flight**: Lock chat 24 hours after flight arrival
4. **7-Day Post-Flight**: Lock chat 7 days after flight

**Concerns**:
- Prevent harassment after delivery complete
- Allow follow-up questions (e.g., "I left my charger, can you return it?")
- Balance user safety with legitimate communication needs

### Decision

**Lock chat 24 hours after flight arrival** (based on `departure_date + 24 hours`).

### Rationale

1. **Safety**: Prevents long-term harassment (common in peer-to-peer platforms)
2. **Sufficient Time**: 24 hours allows follow-up questions or delayed delivery
3. **Clear Cutoff**: Tied to objective event (flight time), not subjective (delivery completion)
4. **User Expectation**: Users know chat will lock, encourages timely communication
5. **Support Escalation**: After lock, users can contact support if needed

### Consequences

**Positive**:
- **Safety**: Limits harassment window (vs indefinite open chat)
- **Clear Timeline**: Users know chat locks after 24h (manage expectations)
- **Support Funnel**: Post-24h issues go through support (provides oversight)

**Negative**:
- **Legitimate Use Cases**: User might need to contact after 24h (e.g., "You left something in my car")
- **User Frustration**: "Why can't I message them?" complaints
- **Edge Cases**: Delayed flights (departure_date + 24h might be inaccurate)

**Neutral**:
- Need to display clear messaging: "Chat will lock 24 hours after flight arrival"
- Need support email for post-lock communication

### Alternatives Considered

**Never Lock**:
- ✅ Maximum flexibility
- ❌ Harassment risk (users can contact indefinitely)
- **Rejected**: Safety concerns outweigh flexibility

**Immediate Lock After Delivery**:
- ✅ Strongest safety (no communication after delivery)
- ❌ Too restrictive (no follow-up for forgotten items, clarifications)
- **Rejected**: Users need some follow-up window

**7-Day Lock**:
- ✅ Very flexible
- ❌ Too long (harassment window)
- **Rejected**: 24h is sufficient, 7 days unnecessary

### Compliance

- ✅ Safety: Limits harassment window
- ✅ User Experience: Balanced (allows follow-up but prevents abuse)

### Review Date

**Month 3** (after 50+ deliveries):
- Analyze support tickets: If many "need to contact after lock" → Extend to 48h
- If harassment incidents > 5% → Reduce to 12h
- User feedback will guide adjustment

---

## ADR-009: QR Code for Delivery Confirmation

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #delivery #verification #trust

### Context

Need a secure way to confirm delivery. Options:
1. **Manual Confirmation**: Traveler taps "Delivered" button
2. **PIN Code**: Sender shares 6-digit PIN, traveler enters
3. **QR Code**: Sender shows QR code, traveler scans
4. **GPS Verification**: Confirm both users are at same location

**Requirements**:
- Prevent fraud (traveler marking delivered without actually meeting sender)
- Simple user experience (elderly users should be able to use it)
- Offline support (might not have internet at delivery location)

### Decision

**Use QR code verification** where sender displays QR code and traveler scans it.

**Fallback**: 6-digit alphanumeric code if camera fails.

### Rationale

1. **Fraud Prevention**: Requires physical proximity (sender must show QR code to traveler)
2. **User Experience**: QR scan is fast (< 5 seconds) and familiar (COVID-19 check-ins)
3. **Unique per Match**: Each QR code is unique to match (cannot reuse)
4. **Fallback**: Manual 6-digit code entry if camera not working
5. **Offline Support**: QR code embedded in match data (no server call needed during scan)

### Consequences

**Positive**:
- **Fraud Prevention**: Physical proximity required (vs remote "Delivered" button)
- **Fast**: Scan takes < 5 seconds (vs typing PIN)
- **Familiar**: QR codes are now ubiquitous (restaurants, payments)
- **Unique**: Cannot reuse QR codes (tied to specific match)

**Negative**:
- **Camera Required**: If camera broken/denied permission → Fallback to manual code
- **Lighting Issues**: Dark environment might make scanning difficult
- **User Education**: Some users might not know how to scan QR (need tutorial)

**Neutral**:
- Need to generate QR code (library: `qrcode` Python, `react-native-qrcode-svg`)
- Need to handle fallback (manual code entry)

### Alternatives Considered

**Manual Confirmation ("Delivered" Button)**:
- ✅ Simple, no camera needed
- ❌ Fraud risk: Traveler can mark delivered without meeting sender
- **Rejected**: Too easy to abuse

**PIN Code (6 digits)**:
- ✅ No camera needed
- ❌ Typing error-prone (especially for elderly users)
- ❌ Slower than QR scan
- **Rejected**: QR scan is faster and more reliable

**GPS Verification**:
- ✅ Automated, no user action
- ❌ Unreliable indoors/urban canyons
- ❌ Privacy concerns (tracking exact location)
- ❌ Battery drain (continuous GPS)
- **Rejected**: Technical unreliability + privacy concerns

### Compliance

- ✅ Fraud Prevention: Requires physical proximity
- ✅ User Experience: Fast and familiar (QR codes)
- ✅ Accessibility: Fallback for users without camera

### Review Date

**Month 3** (after 50+ deliveries):
- Measure QR scan success rate: If < 90% → Improve UI/tutorial
- If camera permission denied > 10% → Promote fallback (manual code) more prominently

---

## ADR-010: Stripe for Payments Instead of Razorpay

**Status**: Accepted
**Date**: 2026-02-15
**Deciders**: Deepak Panwar
**Tags**: #payments #stripe #revenue

### Context

Need a payment gateway for credit purchases. Options:
1. **Stripe**: Global payment processor
2. **Razorpay**: India-focused payment gateway
3. **PayPal**: Global, but focused on international payments
4. **Paytm Payment Gateway**: India-specific

**Requirements**:
- Support Indian payment methods (Cards, UPI, Netbanking, Wallets)
- Test mode for MVP
- Webhook support for transaction tracking
- React Native SDK

### Decision

**Use Stripe** as the payment processor.

### Rationale

1. **Developer Experience**: Excellent documentation, SDKs (React Native, Python)
2. **Test Mode**: Robust test mode with test cards (4242..., 0002, etc.)
3. **Webhook Reliability**: Industry-leading webhook system with signature verification
4. **Global Ready**: If we expand internationally, no migration needed
5. **Transparent Pricing**: 2.9% + ₹2 (vs Razorpay 2% + GST, but hidden fees)
6. **React Native SDK**: Official `@stripe/stripe-react-native` with excellent support

### Consequences

**Positive**:
- **Developer Experience**: Best-in-class documentation and SDKs
- **Test Mode**: Extensive test card suite (success, decline, 3DS, etc.)
- **Reliability**: 99.99% uptime SLA
- **Webhook System**: Robust, with signature verification (prevents fraud)
- **International**: If we expand to US/Europe, no migration needed

**Negative**:
- **India-Specific**: Razorpay has better UPI integration (Stripe UPI is newer)
- **Pricing**: 2.9% + ₹2 vs Razorpay 2% (0.9% higher)
- **Settlement**: 7-day rolling reserve (vs Razorpay T+2 instant settlement)
- **Local Support**: Stripe support is US-focused (vs Razorpay India support)

**Neutral**:
- Need to enable India payment methods in Stripe Dashboard (UPI, Netbanking, Wallets)

### Alternatives Considered

**Razorpay**:
- ✅ India-focused (better UPI, instant settlement)
- ✅ Lower fees: 2% + GST vs 2.9% + ₹2
- ❌ Documentation less comprehensive
- ❌ React Native SDK is community-maintained (not official)
- ❌ Webhook system less robust than Stripe
- **Rejected**: Developer experience and international scalability concerns

**Paytm Payment Gateway**:
- ✅ Popular in India
- ❌ Complex integration (poor documentation)
- ❌ No official React Native SDK
- ❌ Reputation issues (Paytm app quality)
- **Rejected**: Developer experience concerns

**PayPal**:
- ✅ Global, trusted brand
- ❌ Higher fees (3.9% + fixed fee)
- ❌ Primarily for international payments (not ideal for India domestic)
- **Rejected**: Not optimized for India market

### Compliance

- ✅ Timeline: Stripe integration is well-documented (2-3 days vs 1 week for Razorpay)
- ✅ Features: Supports all required Indian payment methods
- ✅ Security: PCI DSS compliant, strong webhook verification

### Review Date

**Month 6** (post-MVP):
- Analyze payment success rate: If UPI success < 95% → Consider Razorpay for better UPI
- Check settlement timing: If 7-day reserve is painful → Negotiate with Stripe or switch
- Compare fees: If processing ₹1 lakh+/month → Negotiate better rates with either provider

**Potential Switch Criteria** (Razorpay):
- If 80%+ payments are UPI → Razorpay's UPI integration might justify switch
- If settlement timing becomes critical → Razorpay T+2 vs Stripe 7-day reserve

---

## Summary of Key Decisions

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| 001 | Supabase | Time savings, cost, RLS, real-time, storage | ✅ Accepted |
| 002 | Manual Verification | Cost savings (₹0 vs ₹5-10k/month) | ✅ Accepted |
| 003 | Credit-Based Unlock | Pay-per-value, regulatory safety, flexible pricing | ✅ Accepted |
| 004 | Offline P2P Payment | Regulatory compliance, simplicity | ✅ Accepted |
| 005 | React Native (Expo) | Single codebase, time savings, OTA updates | ✅ Accepted |
| 006 | FastAPI | Performance, type safety, auto-docs | ✅ Accepted |
| 007 | Row-Level Security | Database-level authorization, defense in depth | ✅ Accepted |
| 008 | 24-Hour Chat Lock | Balance safety and user needs | ✅ Accepted |
| 009 | QR Code Delivery | Fraud prevention, user familiarity | ✅ Accepted |
| 010 | Stripe Payments | Developer experience, international scalability | ✅ Accepted |

---

## Future ADRs to Document

As development progresses, document decisions for:

1. **ADR-011**: State Management (Zustand vs Redux)
2. **ADR-012**: Real-time Chat (Supabase Realtime vs Socket.io)
3. **ADR-013**: Image Optimization (Cloudinary vs Supabase Storage CDN)
4. **ADR-014**: Error Tracking (Sentry vs alternatives)
5. **ADR-015**: Testing Strategy (Manual first vs TDD)
6. **ADR-016**: Deployment (Vercel vs AWS Lambda)
7. **ADR-017**: CI/CD (GitHub Actions vs alternatives)
8. **ADR-018**: Monitoring (Sentry + Vercel Analytics vs New Relic)

---

**Last Updated**: February 16, 2026
**Next Review**: Month 3 (post-MVP launch)

**Note**: ADRs are living documents. As we learn from real users, we'll update decisions (status: Superseded) and document new ADRs.
