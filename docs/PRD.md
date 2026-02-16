# Travorier - Product Requirements Document (PRD)

## Document Information

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0 |
| **Status** | Finalized for Development |
| **Last Updated** | February 16, 2026 |
| **Author** | Deepak Panwar |
| **Target Market** | India ↔ UAE (Initial Corridor) |
| **Future Expansion** | USA, Europe |

---

## 1. Executive Summary

### Product Vision

Travorier (formerly CarryShare) is a crowdsourced logistics SaaS platform that connects travelers with spare luggage capacity to individuals needing to send packages. By leveraging the existing travel routes of verified individuals, the platform provides a faster and more affordable alternative to traditional courier services.

### Core Value Proposition

**For Senders**: Affordable, fast delivery via travelers instead of expensive couriers
**For Travelers**: Monetize spare luggage capacity
**For Platform**: Discovery & verification engine with access fee revenue model

### Platform Role

The platform acts as a **discovery and verification engine**. The delivery transaction remains a **peer-to-peer agreement** between users. Travorier is NOT a courier service and takes zero commission on delivery fees.

---

## 2. Problem Statement

### Current State

**Problem**: International courier services (DHL, FedEx) are expensive (₹3,000-5,000 for 2kg Mumbai→Dubai) and slow (3-5 days). Many travelers have unused luggage capacity that goes to waste.

**Opportunity**: Millions of people travel between India and UAE annually. Most carry less than their allowed luggage weight.

### Target Impact

- **70% cost savings** for senders vs traditional couriers
- **Monetization opportunity** for travelers (₹500-1,500 per trip)
- **Faster delivery** (same-day to next-day vs 3-5 days)
- **Environmental benefit**: Utilizing existing trips (no additional carbon footprint)

---

## 3. Target Users

### Primary Personas

#### Persona 1: Frequent Travelers
**Name**: Rajesh, 32, IT Professional
**Demographics**: Lives in Mumbai, travels to Dubai for work monthly
**Travel Frequency**: 10-12 trips/year
**Goals**:
- Monetize spare luggage capacity (typically carries 10-12kg of allowed 23kg)
- Cover travel expenses (meals, transport)
- Help people in a safe, legal way

**Pain Points**:
- Doesn't know how to find people who need delivery
- Worried about carrying illegal items
- Concerned about customs issues

**Motivations**:
- Extra income (₹500-1,500 per trip)
- Helping community
- Utilizing wasted capacity

#### Persona 2: Package Senders (Expatriates)
**Name**: Priya, 28, Marketing Manager
**Demographics**: Works in Dubai, family in Mumbai
**Sending Frequency**: 4-6 times/year (gifts, documents, medicine)
**Goals**:
- Send packages to family affordably
- Fast delivery (avoid 5-day courier wait)
- Reliable and trustworthy service

**Pain Points**:
- Couriers too expensive (₹4,000 for 2kg)
- Uncertainty about who to trust
- Customs delays and paperwork

**Motivations**:
- Cost savings (₹99 unlock + ₹500 delivery vs ₹4,000 courier)
- Faster delivery (next-day vs 5 days)
- Personal touch (human interaction vs faceless courier)

#### Persona 3: Package Senders (Small Businesses)
**Name**: Ahmed, 40, Electronics Store Owner
**Demographics**: Runs electronics shop in UAE, sources parts from India
**Sending Frequency**: Weekly (small electronic components, samples)
**Goals**:
- Cost-effective way to get samples/parts quickly
- Bypass expensive DHL/FedEx for small shipments
- Reliable delivery for business needs

**Pain Points**:
- Courier minimum charges too high for small parcels
- Customs clearance expensive for business shipments
- Need fast turnaround for customer orders

**Motivations**:
- Massive cost savings (10x cheaper)
- Faster delivery for urgent parts
- Flexible pricing based on weight

---

## 4. User Stories

### Traveler User Stories

**T-001**: As a frequent traveler, I want to post my trip details (route, date, luggage capacity) so that senders can find me and I can earn extra income.

**T-002**: As a traveler, I want to verify my flight PNR so that senders trust I'm a real traveler with a confirmed booking.

**T-003**: As a traveler, I want to set my own price per kilogram so that I can decide how much to charge based on route and effort.

**T-004**: As a traveler, I want to physically inspect packages before accepting them so that I'm confident I'm not carrying illegal items.

**T-005**: As a traveler, I want to record a video of the unsealed package so that I have proof of contents in case of customs issues.

**T-006**: As a traveler, I want to generate a QR code after handing over the package so that I can confirm delivery only when the recipient presents the code.

**T-007**: As a traveler, I want to chat with the sender in real-time so that we can coordinate handover location and time.

**T-008**: As a traveler, I want to see the sender's trust score and verification status so that I can decide if I want to accept their package.

**T-009**: As a traveler, I want the chat to auto-lock after 24 hours post-flight so that senders can't spam me after delivery is complete.

**T-010**: As a traveler, I want to earn a "Frequent Flyer" badge after 5+ deliveries so that senders trust me more and I get more requests.

### Sender User Stories

**S-001**: As a sender, I want to search for travelers going to my destination city so that I can find someone to carry my package.

**S-002**: As a sender, I want to filter trips by date and price so that I can find the best option for my timeline and budget.

**S-003**: As a sender, I want to see the traveler's verification status (ID verified, PNR verified) so that I can trust them with my package.

**S-004**: As a sender, I want to unlock a traveler's contact for ₹99 so that I can chat with them and negotiate handover details.

**S-005**: As a sender, I want to buy credit packs (5 or 10 credits) at a discount so that I can save money if I send packages frequently.

**S-006**: As a sender, I want the traveler to inspect my package and record proof so that both of us are protected from accusations.

**S-007**: As a sender, I want to receive a QR code after handover so that my recipient can use it to confirm delivery.

**S-008**: As a sender, I want to receive push notifications when the traveler lands so that I can remind my recipient to meet them.

**S-009**: As a sender, I want to rate the traveler after delivery so that I can help other senders make informed decisions.

**S-010**: As a sender, I want clear disclaimers about customs responsibility so that I understand I'm responsible for duties, not the platform or traveler.

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

**FR-001**: System shall support Google OAuth sign-in for one-tap onboarding. *(Priority: P0 - Critical)*

**FR-002**: System shall support Apple Sign-In for iOS users (mandatory for App Store). *(Priority: P0 - Critical)*

**FR-003**: System shall require mobile phone number verification via OTP before users can post trips or buy credits. *(Priority: P0 - Critical)*

**FR-004**: System shall support OTP delivery for +91 (India) and +971 (UAE) phone numbers. *(Priority: P0 - Critical)*

**FR-005**: System shall link social profiles (Google/Apple) with verified phone numbers to create a unified "Trust Profile." *(Priority: P1 - High)*

**FR-006**: System shall use Supabase Auth for centralized JWT management across React Native and FastAPI. *(Priority: P0 - Critical)*

### 5.2 Identity Verification

**FR-007**: System shall require ID verification (manual admin review of ID + selfie) before users can complete transactions. *(Priority: P0 - Critical for MVP with manual process)*

**FR-008**: System shall allow users to upload government-issued ID (passport, driver's license) and selfie photo. *(Priority: P0 - Critical)*

**FR-009**: System shall provide admin dashboard for manual ID verification approval/rejection. *(Priority: P0 - Critical)*

**FR-010**: System shall display verification status badges (ID Verified, Phone Verified, PNR Verified) on user profiles. *(Priority: P1 - High)*

**FR-011**: [V2] System shall integrate with iDenfy for automated AI-based KYC and liveness detection. *(Priority: P2 - Future)*

### 5.3 PNR & Flight Verification

**FR-012**: System shall allow travelers to input their PNR code and upload boarding pass screenshot. *(Priority: P0 - Critical)*

**FR-013**: System shall provide admin interface for manual PNR verification. *(Priority: P0 - Critical for MVP)*

**FR-014**: [V2] System shall integrate with FlightAPI.io for live PNR and flight status verification. *(Priority: P2 - Future)*

**FR-015**: System shall display "PNR Verified" badge on trip listings for verified flights. *(Priority: P1 - High)*

**FR-016**: System shall weight reviews from PNR-verified trips 2x higher in trust score calculation. *(Priority: P1 - High)*

### 5.4 Trip Management

**FR-017**: System shall allow travelers to create trip listings with origin, destination, date, flight number, and luggage capacity. *(Priority: P0 - Critical)*

**FR-018**: System shall enforce ₹49 listing fee for posting a trip to prevent spam. *(Priority: P1 - High)*

**FR-019**: System shall allow travelers to set "Price per KG" in ₹1 increments (min ₹100, max ₹5,000). *(Priority: P1 - High)*

**FR-020**: System shall display trip status (Draft, Active, Matched, In Transit, Completed, Cancelled). *(Priority: P1 - High)*

**FR-021**: [V2] System shall support "Trip Boost" feature (₹199 for 48-hour top listing). *(Priority: P3 - Nice to have)*

**FR-022**: System shall automatically mark trips as "Completed" 24 hours after flight landing if not manually updated. *(Priority: P2 - Medium)*

### 5.5 Request Management

**FR-023**: System shall allow senders to create package requests with origin, destination, weight, and needed-by date. *(Priority: P1 - High)*

**FR-024**: System shall require package description and estimated value for requests. *(Priority: P1 - High)*

**FR-025**: System shall allow "Flexible Dates" toggle for requests. *(Priority: P2 - Medium)*

### 5.6 Search & Discovery

**FR-026**: System shall provide search functionality for trips by origin city, destination city, and date range. *(Priority: P0 - Critical)*

**FR-027**: System shall support filters for price range, available weight, and verification status. *(Priority: P1 - High)*

**FR-028**: System shall display search results sorted by departure date (default) with option to sort by price or trust score. *(Priority: P1 - High)*

**FR-029**: System shall implement pagination for search results (20 trips per page). *(Priority: P1 - High)*

### 5.7 Matching & Contact Unlock

**FR-030**: System shall allow senders to unlock traveler contact for ₹99 (1 credit). *(Priority: P0 - Critical)*

**FR-031**: System shall process unlock payment via Stripe before revealing contact information. *(Priority: P0 - Critical)*

**FR-032**: System shall unlock chat access after successful payment. *(Priority: P0 - Critical)*

**FR-033**: System shall create "match" record linking trip, request (optional), traveler, and sender. *(Priority: P1 - High)*

**FR-034**: System shall prevent duplicate unlocks (if already unlocked, no second charge). *(Priority: P1 - High)*

### 5.8 Credit System

**FR-035**: System shall support credit purchase in packs: 1 credit (₹99), 5 credits (₹445, 10% off), 10 credits (₹792, 20% off). *(Priority: P1 - High)*

**FR-036**: System shall set credit expiry to 1 year from purchase date. *(Priority: P1 - High)*

**FR-037**: System shall automatically deduct expired credits and update user balance. *(Priority: P2 - Medium)*

**FR-038**: System shall display credit balance and expiry dates in user wallet dashboard. *(Priority: P1 - High)*

**FR-039**: System shall deduct credits in FIFO order (oldest credits first). *(Priority: P2 - Medium)*

### 5.9 Real-Time Chat

**FR-040**: System shall provide real-time chat between traveler and sender after contact unlock. *(Priority: P0 - Critical)*

**FR-041**: System shall support text messages, images, and videos in chat. *(Priority: P1 - High)*

**FR-042**: System shall display system-generated messages for key events (flight delayed, inspection complete, etc.). *(Priority: P1 - High)*

**FR-043**: System shall automatically lock chat 24 hours after flight landing to prevent spam. *(Priority: P1 - High)*

**FR-044**: System shall use Supabase Realtime for instant message sync across devices. *(Priority: P0 - Critical)*

**FR-045**: [V2] System shall support temporary live location sharing (30 minutes) for airport handover coordination. *(Priority: P3 - Future)*

### 5.10 Physical Inspection Protocol

**FR-046**: System shall enforce mandatory package inspection before handover (blocking). *(Priority: P0 - Critical)*

**FR-047**: System shall require traveler to take either 10-second video OR 3 high-resolution photos of unsealed package. *(Priority: P0 - Critical)*

**FR-048**: System shall upload inspection media to Supabase Storage with encryption. *(Priority: P1 - High)*

**FR-049**: System shall require sender approval of inspection before proceeding. *(Priority: P1 - High)*

**FR-050**: System shall capture optional GPS location during inspection. *(Priority: P2 - Medium)*

### 5.11 QR Delivery Confirmation

**FR-051**: System shall generate unique QR code for each match after inspection approval. *(Priority: P0 - Critical)*

**FR-052**: System shall display QR code prominently for sender to share with recipient. *(Priority: P1 - High)*

**FR-053**: System shall allow traveler to scan QR code via in-app camera to confirm delivery. *(Priority: P0 - Critical)*

**FR-054**: System shall mark match as "Delivered" only after correct QR scan. *(Priority: P1 - High)*

**FR-055**: System shall reject incorrect/duplicate QR scans with error message. *(Priority: P1 - High)*

**FR-056**: System shall record delivery timestamp and optional location. *(Priority: P2 - Medium)*

### 5.12 Ratings & Reviews

**FR-057**: System shall allow both parties to rate each other (1-5 stars) after delivery completion. *(Priority: P1 - High)*

**FR-058**: System shall require rating before releasing trust score updates. *(Priority: P2 - Medium)*

**FR-059**: System shall calculate average rating for each user and display on profile. *(Priority: P1 - High)*

**FR-060**: System shall award "Frequent Flyer" badge to travelers with 5+ successful deliveries in 3 months. *(Priority: P2 - Medium)*

**FR-061**: System shall weight PNR-verified trip reviews 2x in trust score calculation. *(Priority: P2 - Medium)*

**FR-062**: System shall allow optional review text (up to 500 characters). *(Priority: P2 - Medium)*

### 5.13 Notifications

**FR-063**: System shall send push notifications (FCM) for new matches, messages, and flight status updates. *(Priority: P1 - High)*

**FR-064**: System shall send handover reminder notification 3 hours before flight departure. *(Priority: P1 - High)*

**FR-065**: System shall send arrival notification when flight status changes to "Landed." *(Priority: P1 - High)*

**FR-066**: System shall support deep linking from notifications to relevant screens (chat, handover, etc.). *(Priority: P1 - High)*

**FR-067**: [V2] System shall integrate with Gupshup for WhatsApp Business API notifications. *(Priority: P3 - Future)*

### 5.14 Legal & Safety

**FR-068**: System shall display mandatory "Terms of Service" checkbox before trip posting or request creation. *(Priority: P0 - Critical)*

**FR-069**: System shall clearly state platform is NOT a courier service (discovery platform only). *(Priority: P0 - Critical)*

**FR-070**: System shall display prohibited items list (Gold, Seeds, Medicines, Liquids, Powders, Commercial Electronics). *(Priority: P0 - Critical)*

**FR-071**: System shall require "Declare & Agree" checkbox acknowledging customs responsibility. *(Priority: P0 - Critical)*

**FR-072**: System shall display zero-liability disclaimer ("Platform not responsible for loss, damage, or customs seizures"). *(Priority: P0 - Critical)*

**FR-073**: System shall block trip/request submission if ToS checkboxes not checked. *(Priority: P0 - Critical)*

---

## 6. Non-Functional Requirements

### 6.1 Performance

**NFR-001**: Search results shall load within 2 seconds for 90% of queries. *(Priority: P1 - High)*

**NFR-002**: Chat messages shall be delivered with <500ms latency. *(Priority: P1 - High)*

**NFR-003**: App shall launch within 3 seconds on mid-range devices (iPhone 12, Pixel 5). *(Priority: P2 - Medium)*

**NFR-004**: Payment processing (Stripe) shall complete within 5 seconds. *(Priority: P1 - High)*

**NFR-005**: Image uploads shall support up to 5MB files within 10 seconds. *(Priority: P2 - Medium)*

**NFR-006**: Video uploads (inspection) shall support up to 50MB files within 30 seconds. *(Priority: P2 - Medium)*

### 6.2 Security

**NFR-007**: All data in transit shall use HTTPS/TLS 1.3 encryption. *(Priority: P0 - Critical)*

**NFR-008**: All data at rest shall be encrypted (AES-256 via Supabase). *(Priority: P0 - Critical)*

**NFR-009**: JWT tokens shall expire after 1 hour (access token) and 7 days (refresh token). *(Priority: P1 - High)*

**NFR-010**: All database access shall enforce Row-Level Security (RLS) policies. *(Priority: P0 - Critical)*

**NFR-011**: Payment processing shall be PCI-DSS compliant (handled by Stripe). *(Priority: P0 - Critical)*

**NFR-012**: User passwords (if used) shall be hashed with bcrypt (min 10 rounds). *(Priority: P1 - High)*

**NFR-013**: Inspection media shall be stored in private Supabase Storage buckets with access control. *(Priority: P1 - High)*

**NFR-014**: Admin verification dashboard shall require additional authentication (2FA recommended). *(Priority: P2 - Medium)*

### 6.3 Scalability

**NFR-015**: System shall support 1,000 concurrent users during MVP phase. *(Priority: P2 - Medium)*

**NFR-016**: Database shall support 50,000 users and 10,000 trips without performance degradation. *(Priority: P2 - Medium)*

**NFR-017**: System shall gracefully scale to 100,000 users post-MVP (Supabase Pro tier). *(Priority: P3 - Future)*

**NFR-018**: Real-time chat shall support 500 concurrent active chats without latency increase. *(Priority: P2 - Medium)*

### 6.4 Reliability

**NFR-019**: System shall have 99% uptime during business hours (6 AM - 11 PM IST/GST). *(Priority: P1 - High)*

**NFR-020**: Payment failures shall be logged and auto-retried once before notifying user. *(Priority: P1 - High)*

**NFR-021**: Critical errors shall be logged to Sentry for monitoring. *(Priority: P1 - High)*

**NFR-022**: Database backups shall be taken daily and retained for 7 days (Supabase default). *(Priority: P1 - High)*

### 6.5 Usability

**NFR-023**: App shall support English language (Arabic planned for V2). *(Priority: P1 - High)*

**NFR-024**: App shall be accessible with screen readers (basic WCAG 2.1 Level A compliance). *(Priority: P3 - Future)*

**NFR-025**: Key actions (search, unlock, chat) shall be reachable within 3 taps from home screen. *(Priority: P1 - High)*

**NFR-026**: Error messages shall be user-friendly with actionable guidance. *(Priority: P1 - High)*

### 6.6 Compatibility

**NFR-027**: Mobile app shall support iOS 13+ and Android 10+. *(Priority: P1 - High)*

**NFR-028**: Backend API shall support HTTP/1.1 and HTTP/2. *(Priority: P2 - Medium)*

**NFR-029**: App shall work on screen sizes from 4.7" (iPhone SE) to 6.7" (iPhone Pro Max). *(Priority: P1 - High)*

---

## 7. User Flows

### Flow 1: Traveler Posts Trip

```
1. Traveler opens app → Signs in (Google OAuth or Apple)
2. Taps "Post Trip" → Fills form:
   - Origin city (dropdown: Mumbai, Delhi, Bangalore)
   - Destination city (dropdown: Dubai, Abu Dhabi)
   - Departure date (calendar picker)
   - Departure time (time picker)
   - Flight number (text input)
   - Airline (dropdown or autocomplete)
   - Available weight (slider: 1-30 kg)
   - Price per KG (input with ₹ symbol, min ₹100, max ₹5000)
   - Optional notes (text area, 500 char limit)
3. Taps "Upload Boarding Pass" → Takes photo or selects from gallery
4. Checks "I agree to Terms of Service" (mandatory, blocking)
5. Taps "Pay ₹49 Listing Fee" → Stripe payment sheet
6. On payment success → Trip status: "Pending Verification"
7. Admin reviews and approves PNR → Trip status: "Active"
8. Trip appears in search results for senders
```

### Flow 2: Sender Finds and Unlocks Traveler

```
1. Sender opens app → Signs in
2. Taps "Send Package" → Searches:
   - From: Mumbai
   - To: Dubai
   - Date: Feb 20-25, 2026
3. Views search results (list of trips sorted by date)
4. Taps on trip card → Views details:
   - Traveler profile (name, photo, trust score, badges)
   - Flight details (airline, date, PNR verified badge)
   - Pricing (₹800/kg, 15kg available)
   - Reviews (4.8 stars, "Punctual, friendly, safe delivery")
5. Taps "Unlock Contact (₹99)" → Sees credit balance:
   - If balance ≥ 1: "Unlock with 1 credit?"
   - If balance = 0: "Buy credits or pay ₹99 now?"
6. Chooses payment option → Stripe payment sheet
7. On success → Contact info revealed:
   - Phone number: +971 XXX XXX XX12 (tap to call/WhatsApp)
   - Email: traveler@example.com
   - Chat button unlocked
8. Taps "Chat Now" → Opens real-time chat
9. Negotiates handover location and time
```

### Flow 3: Complete Delivery Journey

```
1. [Handover Day] Both receive push notification 3 hours before flight
2. Sender and traveler meet at agreed location (e.g., Terminal 3, Gate A)
3. Traveler opens app → Taps "Start Inspection"
4. Sender presents package unsealed
5. Traveler uses in-app camera:
   - Option A: Record 10-second video of contents
   - Option B: Take 3 high-res photos
6. App uploads media to Supabase Storage (encrypted)
7. Traveler seals package in sender's presence
8. Sender receives notification: "Inspection complete, view media"
9. Sender reviews inspection → Taps "Approve"
10. System generates unique QR code
11. Sender receives QR code → Forwards to recipient via WhatsApp/Email
12. Traveler boards flight → App tracks status (manual update or V2 auto-track)
13. Flight lands → Both receive notification: "Traveler has landed at DXB"
14. Recipient meets traveler at destination
15. Traveler opens app → Taps "Scan QR to Complete Delivery"
16. Recipient shows QR code → Traveler scans
17. On successful scan → Match status: "Delivered"
18. Both receive notification: "Delivery confirmed! Please rate each other"
19. Both submit ratings (1-5 stars + optional review text)
20. Trust scores updated
21. Chat auto-locks after 24 hours
```

---

## 8. Success Metrics

### User Acquisition Metrics (MVP - First 3 Months)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Total Registered Users | 100 users | Supabase auth.users count |
| Travelers | 50 users | Profiles where user_types includes 'traveler' |
| Senders | 50 users | Profiles where user_types includes 'sender' |
| ID Verified Users | 80% | Profiles where id_verified = true |
| Phone Verified Users | 100% | Profiles where phone_verified = true |

### Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active Trips Posted | 50+ | Trips with status='active' |
| Successful Deliveries | 20+ | Matches with status='delivered' |
| Handover Completion Rate | >80% | Delivered matches / Agreed matches |
| Average Response Time (Chat) | <2 minutes | Time between message sent and first response |
| Daily Active Users (DAU) | 30+ | Users who open app daily |
| Weekly Active Users (WAU) | 70+ | Users who open app weekly |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Platform Revenue | ₹10,000+ | Sum of all transaction amounts |
| Contact Unlocks | 100+ | Transactions where type='contact_unlock' |
| Listing Fees Collected | ₹2,450+ | Transactions where type='listing_fee' (50 x ₹49) |
| Credit Purchases | 50+ | Transactions where type='credit_purchase' |
| Average Transaction Value | ₹150+ | Total revenue / Total transactions |
| Repeat User Rate | >30% | Users who unlock contact 2+ times |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average Rating | >4.0 stars | AVG(reviews.rating) |
| Fraud/Safety Incidents | 0 | Manual tracking + support tickets |
| Payment Failure Rate | <2% | Failed transactions / Total payment attempts |
| App Crash Rate | <1% | Sentry error rate / Total sessions |
| Customer Support Tickets | <10/week | Manual tracking |

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <500ms | Backend monitoring |
| Chat Message Latency | <500ms | Supabase Realtime monitoring |
| Search Results Load Time | <2s | Frontend performance monitoring |
| App Launch Time | <3s | Performance monitoring |
| Uptime | >99% | Vercel + Supabase status |

---

## 9. Assumptions & Constraints

### Assumptions

**User Assumptions**:
- Users have smartphones with internet connectivity (4G/WiFi)
- Users are comfortable with digital payments (UPI, cards)
- Users understand basic chat and QR code usage
- Travelers have confirmed flight bookings when posting trips
- Senders can describe package contents accurately

**Market Assumptions**:
- Demand exists for affordable international delivery (India ↔ UAE)
- Travelers are willing to carry packages for ₹500-1,500 payment
- Legal framework allows peer-to-peer package delivery (not courier service)
- Customs authorities allow personal items carried by travelers

**Technical Assumptions**:
- Supabase free tier sufficient for MVP (50K MAU, 500MB DB, 1GB storage)
- Firebase free tier sufficient for push notifications
- Stripe supports INR and AED currencies
- Manual verification sustainable for 100 users

### Constraints

**Budget Constraints**:
- Bootstrap mode: ~₹750/month during development
- No automation budget (iDenfy, FlightAPI.io) during MVP
- Free tiers only for all services
- Paid services deferred until revenue generation

**Team Constraints**:
- Solo developer (Deepak Panwar)
- No dedicated QA team (manual testing only)
- No dedicated designer (use React Native Paper defaults)
- No dedicated marketing budget

**Timeline Constraints**:
- 12-week development window (Feb-Apr 2026)
- MVP must launch before May 2026
- Limited time for extensive testing
- Aggressive feature prioritization required

**Technical Constraints**:
- React Native limitations (some features require native code)
- Expo managed workflow constraints (limited native modules)
- Supabase RLS complexity (learning curve)
- Manual processes bottleneck (ID verification, PNR verification)

**Legal Constraints**:
- Platform must NOT act as courier (liability)
- Zero commission on delivery fees (to avoid courier classification)
- Clear disclaimers required (ToS, prohibited items, customs responsibility)
- Cannot guarantee delivery or payment (peer-to-peer agreement)

**Geographic Constraints**:
- MVP limited to India ↔ UAE corridor only
- Support for +91 and +971 phone numbers only
- English language only (no localization)

---

## 10. Out of Scope (MVP)

### Explicitly Excluded from MVP

**Automation Features** (Deferred to V2):
- ❌ Automated KYC via iDenfy (too expensive: ~₹80-100 per verification)
- ❌ Automated flight verification via FlightAPI.io (too expensive: ~₹8,000-24,000/month)
- ❌ WhatsApp Business API notifications via Gupshup (verification required, cost)
- ❌ Live location sharing during handover
- ❌ Automated trust score calculation (manual review initially)

**Advanced Features** (V2+):
- ❌ Trip boost feature (₹199 for 48-hour top listing)
- ❌ In-app delivery payment (escrow) - Platform will NEVER handle delivery fees
- ❌ Package insurance - Too complex legally, deferred indefinitely
- ❌ Multi-currency support (AED, USD, EUR) - INR only for MVP
- ❌ Multi-language support (Arabic, Hindi) - English only
- ❌ Desktop web app - Mobile-first only

**Geographic Expansion** (Post-MVP):
- ❌ India ↔ USA
- ❌ India ↔ UK
- ❌ UAE ↔ USA
- ❌ Intra-India routes (Delhi-Mumbai, etc.)

**Platform Features** (Future):
- ❌ Traveler background checks (police verification)
- ❌ AI-powered fraud detection
- ❌ Dynamic pricing recommendations
- ❌ Affiliate/referral program
- ❌ Corporate/business accounts
- ❌ API for third-party integrations

**Support Features** (Future):
- ❌ In-app customer support chat
- ❌ 24/7 support hotline
- ❌ Multilingual support team
- ❌ Comprehensive help center with FAQs

---

## 11. Dependencies

### External Services

**Critical Dependencies** (MVP Cannot Launch Without):
1. **Supabase**: Database, Auth, Storage, Realtime - Status: Active (free tier)
2. **Stripe**: Payment processing - Status: Account created, test mode active
3. **Firebase**: Push notifications (FCM) - Status: Project created
4. **Vercel**: Backend API hosting - Status: Free tier account active
5. **Apple Developer Account**: iOS app distribution - Cost: ₹6,500/year
6. **Google Play Console**: Android app distribution - Cost: ₹2,000 one-time

**Optional Dependencies** (Enhance UX but not blocking):
1. **Sentry**: Error tracking - Status: Free tier (5K events/month)
2. **Google Cloud Console**: OAuth credentials - Status: Credentials generated

### Internal Dependencies

**Documentation**:
- Architecture documentation (ARCHITECTURE.md) - ✅ Complete
- API documentation (API.md) - ⏳ In progress
- Testing strategy (TESTING.md) - ⏳ In progress

**Development Infrastructure**:
- Git repository - ✅ Complete (GitHub)
- CI/CD pipeline - ⏳ Not started (optional for MVP)
- Development environment - ✅ Complete (VS Code, Python, Node.js)

**Legal/Compliance**:
- Terms of Service - ⏳ Draft needed (lawyer review recommended: ₹10-15K)
- Privacy Policy - ⏳ Draft needed
- Prohibited Items List - ✅ Defined in PRD
- Disclaimers - ✅ Defined in PRD

**Design Assets**:
- App icon - ⏳ Not started (can use placeholder)
- Splash screen - ⏳ Not started (can use Expo default)
- Marketing materials - ❌ Out of scope for MVP

---

## 12. Risks & Mitigation

### Technical Risks

**Risk 1: Supabase Free Tier Limits Exceeded**
**Probability**: Medium | **Impact**: High
**Mitigation**:
- Monitor usage via Supabase dashboard weekly
- Set up alerts at 80% capacity
- Upgrade to Pro tier (₹1,800/month) if approaching limits
- Optimize queries to reduce database load

**Risk 2: Payment Integration Failures**
**Probability**: Medium | **Impact**: Critical
**Mitigation**:
- Extensive testing with Stripe test cards
- Implement retry logic for failed payments
- Clear error messages guiding users to retry
- Monitor Stripe webhook failures via logging

**Risk 3: React Native Performance Issues**
**Probability**: Medium | **Impact**: Medium
**Mitigation**:
- Profile app performance early (Flipper, React DevTools)
- Optimize images (compress, lazy load)
- Use FlatList for long lists (virtualization)
- Consider ejecting from Expo if critical limitations found

**Risk 4: Real-Time Chat Scaling**
**Probability**: Low | **Impact**: High
**Mitigation**:
- Supabase Realtime handles scaling automatically
- Implement message pagination (load last 50 messages)
- Monitor Realtime connection limits
- Fallback to polling if Realtime fails

### Business Risks

**Risk 5: Legal Liability (Courier Classification)**
**Probability**: High | **Impact**: Critical
**Mitigation**:
- Crystal-clear ToS stating platform is "discovery service only"
- Zero commission on delivery fees (key differentiator from couriers)
- Mandatory disclaimers before every action
- Lawyer review of ToS and disclaimers (₹10-15K investment)

**Risk 6: Customs Issues and Package Seizures**
**Probability**: Medium | **Impact**: High
**Mitigation**:
- Sender legally responsible (clear in ToS)
- Prohibited items list prominently displayed
- Physical inspection protocol mandatory (proof of contents)
- Traveler has full discretion to refuse suspicious packages

**Risk 7: Fraud (Fake Travelers or Senders)**
**Probability**: Medium | **Impact**: High
**Mitigation**:
- Manual ID verification for all users
- PNR verification for travelers (boarding pass proof)
- Trust score system with weighted reviews
- QR code delivery confirmation (prevents false delivery claims)
- 24-hour chat auto-lock (prevents indefinite disputes)

**Risk 8: Low User Adoption (Chicken-and-Egg)**
**Probability**: High | **Impact**: Critical
**Mitigation**:
- Launch in India-UAE corridor (high travel volume)
- Target frequent flyers first (via LinkedIn, travel groups)
- Offer first 10 users free credits (₹500 budget)
- Word-of-mouth in expat communities (Dubai-based Indian groups)

### Operational Risks

**Risk 9: Manual Verification Bottleneck**
**Probability**: High | **Impact**: Medium
**Mitigation**:
- Set expectation: "Verification within 24-48 hours"
- Admin dashboard for quick review (5 min/user)
- Hire part-time admin if verifications exceed 50/week
- Migrate to iDenfy after revenue > ₹50K/month

**Risk 10: Solo Developer Burnout**
**Probability**: High | **Impact**: Critical
**Mitigation**:
- Strict MVP scope (ruthless prioritization)
- Use existing libraries/services (avoid reinventing)
- Weekly sprint planning (realistic goals)
- Allow 2 weeks buffer in 12-week timeline

---

## 13. Release Plan

### MVP Launch Roadmap

**Phase 1: Foundation** (Weeks 1-3)
- ✅ Week 1: Project setup, documentation, Git repository
- ⏳ Week 2: Authentication (Google OAuth, Phone OTP)
- ⏳ Week 3: User profile management, ID verification workflow

**Phase 2: Core Features** (Weeks 4-7)
- ⏳ Week 4: Trip posting, PNR verification (manual)
- ⏳ Week 5: Search & discovery, request management
- ⏳ Week 6: Payment integration (Stripe), credit system
- ⏳ Week 7: Real-time chat (Supabase Realtime)

**Phase 3: Safety & Polish** (Weeks 8-10)
- ⏳ Week 8: Physical inspection workflow, media upload
- ⏳ Week 9: QR delivery confirmation, ToS/disclaimers
- ⏳ Week 10: Ratings & reviews, trust score calculation

**Phase 4: Pre-Launch** (Weeks 11-12)
- ⏳ Week 11: Push notifications, admin dashboard, bug fixes
- ⏳ Week 12: Beta testing (10-20 users), final QA, App Store submission

**Launch Date**: April 30, 2026 (Target)

### Beta Testing Plan

**Beta User Recruitment**:
- 5 frequent travelers (personal network)
- 5 expats in UAE (LinkedIn outreach)
- 10 community members (India-UAE travel Facebook groups)

**Beta Testing Goals**:
- Complete 5 end-to-end deliveries
- Test all critical flows (signup, post trip, unlock, chat, delivery)
- Identify and fix major bugs
- Gather UX feedback (survey)

**Success Criteria for Launch**:
- Zero critical bugs
- >4.0 average rating from beta users
- All legal disclaimers reviewed by lawyer
- Payment system tested with real cards (small amounts)

### Post-MVP Roadmap

**V1.1** (Q2 2026 - 1 month post-launch):
- Implement trip boost feature (₹199)
- Add transaction history and receipts
- Improve search filters (sort by trust score, distance)
- Bug fixes based on user feedback

**V1.2** (Q3 2026 - 3 months post-launch):
- Add automated KYC (iDenfy integration) - Cost justified by revenue
- Implement WhatsApp notifications (Gupshup)
- Add live location sharing during handover
- Expand to India ↔ USA route

**V2.0** (Q4 2026 - 6 months post-launch):
- Automated flight verification (FlightAPI.io)
- Multi-language support (Arabic, Hindi)
- Advanced fraud detection algorithms
- Corporate/business accounts
- Expand to Europe (UK, Germany)

---

## Appendix

### A. Technical Priority Matrix

| Feature | Tech | Priority | MVP Status |
|---------|------|----------|------------|
| **OAuth (Google/Apple)** | Supabase Auth | P0 (Critical) | ✅ Planned |
| **SMS OTP (+91 / +971)** | Firebase / Gupshup | P0 (Critical) | ✅ Planned |
| **Mandatory ToS & Disclaimers** | React Native UI | P0 (Critical) | ✅ Planned |
| **Real-Time Chat** | Supabase Realtime | P1 (High) | ✅ Planned |
| **FCM Push Notifications** | Firebase Cloud Messaging | P1 (High) | ✅ Planned |
| **Inspection Media Upload** | Supabase Storage | P1 (High) | ✅ Planned |
| **Payment Processing** | Stripe | P0 (Critical) | ✅ Planned |
| **QR Code Generation/Scan** | React Native libraries | P0 (Critical) | ✅ Planned |
| **Automated KYC** | iDenfy | P2 (Future) | ❌ V2 |
| **Automated Flight Verification** | FlightAPI.io | P2 (Future) | ❌ V2 |
| **WhatsApp Notifications** | Gupshup | P3 (Nice to have) | ❌ V2 |
| **Live Location Sharing** | Google Maps SDK | P3 (Nice to have) | ❌ V2 |

### B. UI/UX Page Architecture

**Home Screen**:
- Toggle: "Send Package" vs "I'm Traveling"
- Search bar (origin → destination, date)
- Recent searches
- Featured trips (boosted)

**Trip Listing Screen**:
- Trip card (traveler name, route, date, price/kg, trust score)
- Filters (price, weight, verified only)
- Sort (date, price, trust score)

**Trip Details Screen**:
- Traveler profile (photo, name, badges, reviews)
- Flight details (airline, PNR verified, date/time)
- Pricing (price/kg, available weight, total estimate)
- "Unlock Contact" button (primary CTA)

**Credit Wallet Screen**:
- Current balance
- Credit pack options (1, 5, 10 credits with discounts)
- Expiry dates
- Transaction history

**Chat Screen**:
- Real-time messages (text, images, videos)
- System messages (bubbles for events)
- Message timestamp and read status
- Auto-lock countdown (24 hours after flight)

**Handover Dashboard**:
- For Traveler: "Start Inspection" button, camera portal, QR scanner
- For Sender: Inspection media viewer, QR code display
- Progress tracker (Handover → Flight → Landing → Delivered)

**Profile Screen**:
- User info (name, photo, verified badges)
- Trust score and reviews
- Posted trips / Sent packages
- Settings (notifications, account, logout)

**Verification Center**:
- ID upload (front + back)
- Selfie upload (liveness check instruction)
- Status (Pending, Approved, Rejected)

### C. Glossary

**Term** | **Definition**
---------|---------------
**Traveler** | User with spare luggage capacity who carries packages for senders
**Sender** | User who needs to send a package via a traveler
**Trip** | A traveler's journey (origin → destination) with available luggage capacity
**Request** | A sender's package delivery need (origin → destination)
**Match** | Connection between a traveler's trip and sender's request
**Contact Unlock** | ₹99 payment to reveal traveler's contact info and unlock chat
**Credit** | Virtual currency (1 credit = 1 unlock = ₹99 value)
**Trust Score** | User reputation score (0-100) based on ratings and verified deliveries
**Frequent Flyer** | Badge awarded to travelers with 5+ verified deliveries in 3 months
**PNR** | Passenger Name Record (flight booking confirmation code)
**Physical Inspection** | Mandatory process where traveler inspects and records unsealed package
**QR Delivery Confirmation** | Unique QR code used to confirm package delivery
**RLS** | Row-Level Security (database-level authorization in Supabase)
**MVP** | Minimum Viable Product (initial launch version)
**V2** | Version 2 (post-MVP features)

### D. References

**Market Research**:
- [Statista: India-UAE Travel Statistics 2025](https://www.statista.com)
- [DHL Express Pricing](https://www.dhl.com/ae-en/home/express.html)
- [FedEx International Shipping Rates](https://www.fedex.com/en-ae/shipping.html)

**Competitor Analysis**:
- Dunzo (India) - Hyperlocal delivery
- Porter (India) - Intra-city logistics
- PiggyBee (Defunct) - Similar P2P concept (lessons learned)

**Regulatory References**:
- India Customs Act, 1962
- UAE Federal Law No. 4 of 2002 on Prohib and Restricted Goods
- Personal baggage allowance rules (India & UAE customs)

**Technical Documentation**:
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Documentation](https://docs.expo.dev/)

---

**Document Version**: 1.0
**Created**: February 16, 2026
**Last Updated**: February 16, 2026
**Author**: Deepak Panwar
**Status**: Finalized for Development

**Next Review Date**: After Week 6 of development (validate assumptions and success metrics)
