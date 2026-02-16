# Travorier - Testing Strategy & Manual Test Plan

Comprehensive testing documentation for MVP and beyond.

**Last Updated**: February 16, 2026

---

## Testing Philosophy

### MVP Approach: Manual Testing First

For the 12-week MVP timeline with a solo developer, we prioritize **manual testing** over automated testing to maximize feature development velocity.

**Rationale**:
- ✅ Faster to validate features manually than writing tests
- ✅ Catch UI/UX issues that automated tests miss
- ✅ More cost-effective for rapid iteration
- ✅ Critical user flows tested thoroughly by hand
- ❌ Automated tests add 30-50% dev time overhead (unfeasible for MVP)

**Post-MVP Transition**:
- After launch with real users, gradually add automated tests
- Focus on critical payment flows and authentication first
- Use user-reported bugs to guide test coverage
- Aim for 80% coverage by Month 6

---

## Manual Testing Checklist (MVP Phase)

### Test Environment Setup

**Required Test Accounts**:
1. Traveler Account 1: `traveler1@test.com` (verified, high trust score)
2. Traveler Account 2: `traveler2@test.com` (new user, unverified)
3. Sender Account 1: `sender1@test.com` (verified, has credits)
4. Sender Account 2: `sender2@test.com` (new user, no credits)
5. Admin Account: `admin@travorier.com` (for manual verification)

**Required Test Devices**:
- iOS Simulator (iPhone 14 Pro, iOS 16+)
- Android Emulator (Pixel 6, Android 13+)
- Physical device (for camera, location testing)

**Required Test Data**:
- Stripe test cards (see Section 7)
- Sample trip routes (DEL→BLR, MUM→NYC, etc.)
- Sample package requests (documents, gifts, electronics)

---

## 1. Authentication & Onboarding (15 Test Cases)

### 1.1 Google OAuth Sign-In

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| AUTH-001 | New user signup via Google | 1. Tap "Sign in with Google"<br>2. Select Google account<br>3. Authorize | Profile created, redirected to onboarding | ⬜ |
| AUTH-002 | Existing user login via Google | 1. Sign in with previously used Google account | Logged in, redirected to home screen | ⬜ |
| AUTH-003 | Cancel Google OAuth flow | 1. Tap "Sign in with Google"<br>2. Cancel on Google consent screen | Returned to login screen, no error | ⬜ |
| AUTH-004 | Google OAuth with no internet | 1. Disable WiFi/data<br>2. Tap "Sign in with Google" | Show "No internet connection" error | ⬜ |
| AUTH-005 | Multiple Google account selection | 1. Have 2+ Google accounts on device<br>2. Sign in with Google<br>3. Select specific account | Correct account used, profile matches | ⬜ |

### 1.2 Phone OTP Verification

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| AUTH-006 | Send OTP to valid Indian number | 1. Enter +91 9876543210<br>2. Tap "Send OTP" | OTP sent, timer starts (60s) | ⬜ |
| AUTH-007 | Verify correct OTP | 1. Enter received OTP code | Phone verified, badge added to profile | ⬜ |
| AUTH-008 | Verify incorrect OTP | 1. Enter wrong OTP (e.g., 000000) | Show "Invalid OTP" error, allow retry | ⬜ |
| AUTH-009 | Resend OTP after timeout | 1. Wait 60 seconds<br>2. Tap "Resend OTP" | New OTP sent, timer resets | ⬜ |
| AUTH-010 | Phone number already registered | 1. Enter phone number of existing user | Show "Phone already registered" error | ⬜ |

### 1.3 Profile Setup

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| AUTH-011 | Complete profile with all fields | 1. Fill full name, bio, languages<br>2. Upload profile picture<br>3. Add emergency contact | Profile saved, redirected to home | ⬜ |
| AUTH-012 | Skip optional fields | 1. Fill only required fields (name)<br>2. Skip bio, picture | Profile saved with defaults | ⬜ |
| AUTH-013 | Upload profile picture (valid) | 1. Select image from gallery<br>2. Crop and save | Image uploaded to Supabase storage, URL saved | ⬜ |
| AUTH-014 | Upload profile picture (invalid) | 1. Try uploading 10MB+ image | Show "File too large" error | ⬜ |
| AUTH-015 | Logout and login again | 1. Logout from settings<br>2. Login again with Google | Session restored, profile persists | ⬜ |

---

## 2. User Profile & Verification (12 Test Cases)

### 2.1 Profile Management

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PROF-001 | View own profile | 1. Navigate to Profile tab | Display full profile with stats | ⬜ |
| PROF-002 | Edit profile details | 1. Tap Edit<br>2. Change name, bio, languages<br>3. Save | Changes saved, reflected immediately | ⬜ |
| PROF-003 | View another user's profile | 1. Tap on user from search results | Display public profile (hide private info) | ⬜ |
| PROF-004 | View trust score breakdown | 1. Tap "Trust Score: 750"<br>2. View breakdown | Show: Verification +300, Deliveries +400, etc. | ⬜ |

### 2.2 ID Verification (Manual)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PROF-005 | Submit Aadhaar for verification | 1. Go to Profile → Verify ID<br>2. Select "Aadhaar Card"<br>3. Upload front image<br>4. Submit | Uploaded to `id-documents` bucket, status: Pending | ⬜ |
| PROF-006 | Submit PAN for verification | 1. Select "PAN Card"<br>2. Upload image<br>3. Submit | Uploaded, status: Pending | ⬜ |
| PROF-007 | Submit Passport for verification | 1. Select "Passport"<br>2. Upload image<br>3. Submit | Uploaded, status: Pending | ⬜ |
| PROF-008 | Admin approves ID | 1. Admin views submission in dashboard<br>2. Verify document matches profile<br>3. Approve | User status: Verified, trust score +300, badge added | ⬜ |
| PROF-009 | Admin rejects ID | 1. Admin views submission<br>2. Reject with reason "Blurry image" | User notified, status: Rejected, can resubmit | ⬜ |
| PROF-010 | View verification status | 1. Go to Profile → ID Verification | Show current status: Verified/Pending/Rejected | ⬜ |

### 2.3 Reviews & Ratings

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PROF-011 | View user reviews | 1. Tap on user profile<br>2. Scroll to Reviews section | Display list of reviews with ratings | ⬜ |
| PROF-012 | View user stats | 1. View profile<br>2. Check stats section | Show: Deliveries, Average rating, Trust score | ⬜ |

---

## 3. Trip Management (18 Test Cases)

### 3.1 Create Trip (Traveler)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TRIP-001 | Create domestic trip (valid) | 1. Tap "Post Trip"<br>2. Fill: DEL→BLR, 2024-03-15, 5kg, ₹100/kg<br>3. Submit | Trip created, status: Active, visible in search | ⬜ |
| TRIP-002 | Create international trip | 1. Fill: DEL→NYC, 2024-04-20, 10kg, ₹500/kg | Trip created with "International" badge | ⬜ |
| TRIP-003 | Create trip with past date | 1. Fill departure date: 2024-01-01 (past) | Show "Date must be in future" error | ⬜ |
| TRIP-004 | Create trip with 0kg weight | 1. Fill available weight: 0 kg | Show "Weight must be > 0" error | ⬜ |
| TRIP-005 | Create trip with negative price | 1. Fill price: -50/kg | Show "Price must be ≥ 0" error | ⬜ |
| TRIP-006 | Save trip as draft | 1. Fill partial details<br>2. Tap "Save as Draft" | Trip saved, status: Draft, not visible in search | ⬜ |
| TRIP-007 | Add restricted items | 1. Check "Documents only"<br>2. Add custom restrictions | Restrictions saved, displayed in listing | ⬜ |

### 3.2 Search & Discovery

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TRIP-008 | Search trips by route | 1. Enter origin: Delhi<br>2. Enter destination: Bangalore<br>3. Search | Show all DEL→BLR trips | ⬜ |
| TRIP-009 | Filter by date range | 1. Search DEL→BLR<br>2. Filter: March 15-31, 2024 | Show only trips in date range | ⬜ |
| TRIP-010 | Filter by price | 1. Search DEL→BLR<br>2. Filter: Max ₹150/kg | Show only trips ≤ ₹150/kg | ⬜ |
| TRIP-011 | Filter by weight capacity | 1. Filter: Min 3kg available | Show only trips with ≥3kg capacity | ⬜ |
| TRIP-012 | Sort by price (low to high) | 1. Search trips<br>2. Sort by Price | Display trips in ascending price order | ⬜ |
| TRIP-013 | Sort by trust score | 1. Sort by "Trust Score" | Display travelers with highest score first | ⬜ |
| TRIP-014 | Empty search results | 1. Search obscure route: Leh→Kanyakumari | Show "No trips found" message | ⬜ |

### 3.3 Manage Trip

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TRIP-015 | Edit trip details | 1. Go to My Trips<br>2. Edit trip<br>3. Change price to ₹120/kg<br>4. Save | Changes saved, updated in search results | ⬜ |
| TRIP-016 | Cancel trip (no matches) | 1. Cancel trip with no matches | Status: Cancelled, removed from search | ⬜ |
| TRIP-017 | Cancel trip (with matches) | 1. Try canceling trip with active matches | Show "Cannot cancel - has active matches" error | ⬜ |
| TRIP-018 | Boost trip (₹199) | 1. Tap "Boost Trip"<br>2. Pay ₹199<br>3. Confirm | Trip featured for 7 days, appears at top | ⬜ |

---

## 4. Request Management (Sender) (14 Test Cases)

### 4.1 Create Request

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REQ-001 | Create valid request | 1. Tap "Create Request"<br>2. Fill: MUM→DEL, 2024-03-20, Documents, 1kg<br>3. Submit | Request created, visible to travelers | ⬜ |
| REQ-002 | Create request with photos | 1. Fill details<br>2. Add 3 package photos<br>3. Submit | Photos uploaded to storage, thumbnails shown | ⬜ |
| REQ-003 | Create request without photos | 1. Fill details<br>2. Skip photos<br>3. Submit | Request created (photos optional) | ⬜ |
| REQ-004 | Add detailed description | 1. Write 200-word description<br>2. Submit | Description saved, searchable | ⬜ |
| REQ-005 | Select restricted category | 1. Select "Liquids" from dropdown | Show warning: "May be restricted by airlines" | ⬜ |

### 4.2 Search Requests (Traveler)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REQ-006 | Browse requests on my route | 1. Post trip DEL→BLR<br>2. View "Requests on your route" | Show matching requests (DEL→BLR) | ⬜ |
| REQ-007 | Filter by package type | 1. Search requests<br>2. Filter: Documents only | Show only document requests | ⬜ |
| REQ-008 | Filter by weight | 1. Filter: Max 2kg | Show only requests ≤2kg | ⬜ |
| REQ-009 | View request details | 1. Tap on request card | Show full details: photos, description, sender profile | ⬜ |

### 4.3 Manage Request

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REQ-010 | Edit request | 1. Go to My Requests<br>2. Edit weight to 2kg<br>3. Save | Changes saved | ⬜ |
| REQ-011 | Cancel request (no matches) | 1. Cancel unmatched request | Status: Cancelled, removed from search | ⬜ |
| REQ-012 | Cancel request (with matches) | 1. Try canceling matched request | Show "Cannot cancel - has active matches" error | ⬜ |
| REQ-013 | View interested travelers | 1. Go to My Requests<br>2. Check "3 travelers interested" | Show list of travelers who contacted | ⬜ |
| REQ-014 | Mark request as fulfilled | 1. After delivery complete<br>2. Mark as Fulfilled | Status: Completed, archived | ⬜ |

---

## 5. Matching & Contact Unlock (CRITICAL - 20 Test Cases)

### 5.1 Create Match

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| MATCH-001 | Traveler initiates match | 1. Traveler views request<br>2. Tap "I can deliver this"<br>3. Confirm | Match created, status: Pending | ⬜ |
| MATCH-002 | Sender initiates match | 1. Sender views trip<br>2. Tap "Request delivery"<br>3. Confirm | Match created, status: Pending | ⬜ |
| MATCH-003 | View match details | 1. Go to Matches<br>2. Tap on match | Show: Trip details, Request details, Status | ⬜ |
| MATCH-004 | Multiple matches on same trip | 1. Traveler accepts 3 requests for same trip | All 3 matches visible in list | ⬜ |

### 5.2 Credit Purchase (CRITICAL PAYMENT FLOW)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| MATCH-005 | View credit balance | 1. Go to Profile → Credits | Display current balance: "5 credits" | ⬜ |
| MATCH-006 | Buy Starter Pack (₹249) | 1. Tap "Buy Credits"<br>2. Select Starter Pack (5 credits)<br>3. Complete Stripe payment | Payment success, balance: +5 credits | ⬜ |
| MATCH-007 | Buy Value Pack (₹399) | 1. Select Value Pack (10 credits) | Payment success, balance: +10 credits | ⬜ |
| MATCH-008 | Buy Pro Pack (₹749) | 1. Select Pro Pack (25 credits) | Payment success, balance: +25 credits | ⬜ |
| MATCH-009 | Payment declined (insufficient funds) | 1. Use test card: 4000 0000 0000 9995 | Show "Payment failed" error, credits not added | ⬜ |
| MATCH-010 | Payment requires authentication | 1. Use test card: 4000 0025 0000 3155<br>2. Complete 3DS authentication | Payment success after authentication | ⬜ |
| MATCH-011 | View transaction history | 1. Go to Credits → Transactions | Show all credit purchases and unlocks | ⬜ |

### 5.3 Contact Unlock (CRITICAL REVENUE FLOW)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| MATCH-012 | Unlock contact (sufficient credits) | 1. Have 5 credits<br>2. Tap "Unlock Contact" (costs 1 credit)<br>3. Confirm | Credit deducted, phone number revealed | ⬜ |
| MATCH-013 | Unlock contact (insufficient credits) | 1. Have 0 credits<br>2. Tap "Unlock Contact" | Show "Buy credits to unlock" prompt | ⬜ |
| MATCH-014 | View unlocked contact | 1. After unlock<br>2. View match details | Show: Phone number, "Call" button, "WhatsApp" button | ⬜ |
| MATCH-015 | Call traveler from app | 1. After unlock<br>2. Tap "Call" | Opens phone dialer with number pre-filled | ⬜ |
| MATCH-016 | WhatsApp traveler from app | 1. Tap "WhatsApp" | Opens WhatsApp with pre-filled message | ⬜ |
| MATCH-017 | Unlock multiple contacts | 1. Unlock 3 different travelers | Each deducts 1 credit, balance: -3 credits | ⬜ |
| MATCH-018 | Re-view unlocked contact (no charge) | 1. View previously unlocked contact | Show contact info, no additional charge | ⬜ |
| MATCH-019 | Unlock contact - credit transaction logged | 1. After unlock<br>2. Check Transactions | Transaction logged: "-1 credit, Unlock John Doe" | ⬜ |
| MATCH-020 | Prevent double charge | 1. Unlock contact<br>2. Immediately tap again<br>3. Check balance | Only charged once, balance correct | ⬜ |

---

## 6. Chat & Communication (12 Test Cases)

### 6.1 In-App Messaging

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| CHAT-001 | Send first message | 1. After match created<br>2. Type message<br>3. Send | Message sent, appears in chat | ⬜ |
| CHAT-002 | Receive message (real-time) | 1. Other user sends message | Message appears instantly (Supabase Realtime) | ⬜ |
| CHAT-003 | Send photo in chat | 1. Tap camera icon<br>2. Select photo<br>3. Send | Photo uploaded, thumbnail shown in chat | ⬜ |
| CHAT-004 | Chat history persists | 1. Close app<br>2. Reopen<br>3. View chat | All previous messages visible | ⬜ |
| CHAT-005 | Unread message badge | 1. Receive new message while on different screen | Badge shows unread count on Matches tab | ⬜ |
| CHAT-006 | Mark messages as read | 1. Open chat with unread messages | Badge clears, messages marked as read | ⬜ |
| CHAT-007 | Chat timestamps | 1. View message history | Show timestamps: "2:30 PM", "Yesterday", etc. | ⬜ |

### 6.2 Chat Auto-Lock (Post-Flight)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| CHAT-008 | Chat active before flight | 1. Flight date: Tomorrow<br>2. Send messages | Chat fully functional | ⬜ |
| CHAT-009 | Chat locked 24h post-flight | 1. Flight date: Yesterday<br>2. Try sending message | Show "Chat locked - delivery completed" | ⬜ |
| CHAT-010 | View locked chat history | 1. After chat locked | Can view old messages, cannot send new | ⬜ |
| CHAT-011 | Unlock contact persists | 1. After chat locked<br>2. View match details | Contact info still visible (already paid) | ⬜ |
| CHAT-012 | Push notification for message | 1. Receive message while app closed | Push notification appears with preview | ⬜ |

---

## 7. Handover & Inspection (CRITICAL - 16 Test Cases)

### 7.1 Package Inspection (Mandatory)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| INSP-001 | Upload inspection photos (3) | 1. Tap "Inspect Package"<br>2. Take 3 photos (front, side, top)<br>3. Submit | Photos uploaded to `inspection-media` bucket | ⬜ |
| INSP-002 | Upload inspection video (optional) | 1. Tap "Record Video"<br>2. Record 15s video<br>3. Submit | Video uploaded, thumbnail shown | ⬜ |
| INSP-003 | Add inspection notes | 1. Write notes: "Box intact, no damage"<br>2. Submit | Notes saved with timestamp | ⬜ |
| INSP-004 | Cannot skip inspection | 1. Try to proceed without inspection | Show "Inspection mandatory" error | ⬜ |
| INSP-005 | Inspection approval (sender) | 1. Sender views inspection evidence<br>2. Approve<br>3. Confirm | Status: Inspection Approved | ⬜ |
| INSP-006 | Inspection rejection (sender) | 1. Sender views evidence<br>2. Reject with reason "Package damaged"<br>3. Cancel match | Match cancelled, credits refunded | ⬜ |
| INSP-007 | View inspection history | 1. Go to Match → Inspection tab | Show all uploaded evidence with timestamps | ⬜ |

### 7.2 In-Flight Update

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| INSP-008 | Upload boarding pass (manual PNR) | 1. After inspection approved<br>2. Upload boarding pass photo<br>3. Submit | Uploaded to `boarding-passes` bucket | ⬜ |
| INSP-009 | Manual PNR verification (admin) | 1. Admin views boarding pass<br>2. Verify flight number, date, traveler name<br>3. Approve | Status: PNR Verified, trip marked In Transit | ⬜ |
| INSP-010 | PNR rejection (admin) | 1. Admin finds mismatch in details<br>2. Reject with reason | Traveler notified, must resubmit | ⬜ |
| INSP-011 | Track in-flight status | 1. View match after PNR verified | Show "In Transit" badge, estimated arrival | ⬜ |

### 7.3 Real-Time Updates

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| INSP-012 | Traveler updates status manually | 1. Tap "Update Status"<br>2. Select "Boarded"<br>3. Confirm | Sender notified: "Traveler boarded flight" | ⬜ |
| INSP-013 | Traveler landed notification | 1. Traveler updates: "Landed"<br>2. Confirm | Sender notified: "Package arrived", QR code generated | ⬜ |
| INSP-014 | Push notification for status change | 1. Status updated by traveler | Sender receives push notification | ⬜ |
| INSP-015 | View delivery timeline | 1. Go to Match → Timeline | Show all events: Created → Inspected → In Transit → Landed | ⬜ |
| INSP-016 | Add delivery notes | 1. Traveler adds note: "Will be at airport 2-4 PM" | Sender notified, note visible in match details | ⬜ |

---

## 8. Delivery & QR Code (CRITICAL - 12 Test Cases)

### 8.1 QR Code Generation

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| DEL-001 | Generate unique QR code | 1. After traveler lands<br>2. Tap "Ready for Delivery" | QR code generated, unique to this match | ⬜ |
| DEL-002 | Display QR code (sender) | 1. Sender views match<br>2. Go to Delivery tab | QR code displayed, instructions shown | ⬜ |
| DEL-003 | QR code contains match ID | 1. Decode QR code data | Contains: match_id, sender_id, traveler_id | ⬜ |
| DEL-004 | QR code not generated prematurely | 1. Before traveler lands<br>2. Try to view QR | Show "QR code will be available after landing" | ⬜ |

### 8.2 QR Code Scanning (Delivery Confirmation)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| DEL-005 | Traveler scans correct QR code | 1. Traveler taps "Scan QR"<br>2. Scan sender's QR code<br>3. Confirm delivery | Match status: Completed, QR verified ✅ | ⬜ |
| DEL-006 | Traveler scans wrong QR code | 1. Scan QR from different match | Show "Invalid QR code for this delivery" error | ⬜ |
| DEL-007 | QR scan updates status | 1. After successful scan | Both users notified: "Delivery completed" | ⬜ |
| DEL-008 | Manual verification fallback | 1. Camera not working<br>2. Tap "Enter code manually"<br>3. Type 6-digit code | Match verified if code matches | ⬜ |
| DEL-009 | QR code expires after use | 1. After successful scan<br>2. Try scanning again | Show "Delivery already confirmed" | ⬜ |

### 8.3 Post-Delivery

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| DEL-010 | Trigger review prompt | 1. After delivery confirmed<br>2. Wait 5 seconds | Show "Rate your experience" popup | ⬜ |
| DEL-011 | Update trust scores | 1. After delivery completed | Both users: +100 trust score, +1 delivery count | ⬜ |
| DEL-012 | View completed delivery | 1. Go to History<br>2. View completed match | Show full timeline, inspection evidence, QR scan time | ⬜ |

---

## 9. Reviews & Ratings (10 Test Cases)

### 9.1 Submit Review

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REV-001 | Rate traveler (5 stars) | 1. After delivery<br>2. Rate 5 stars<br>3. Write review: "Excellent service!"<br>4. Submit | Review saved, traveler's average rating updated | ⬜ |
| REV-002 | Rate traveler (1 star) | 1. Rate 1 star<br>2. Write review with issues<br>3. Submit | Review saved, traveler rating decreases | ⬜ |
| REV-003 | Submit review without text | 1. Select 4 stars<br>2. Skip text<br>3. Submit | Review saved (text optional) | ⬜ |
| REV-004 | Cannot review twice | 1. Submit review<br>2. Try submitting again | Show "Already reviewed" message | ⬜ |
| REV-005 | Review reminder notification | 1. 24h after delivery, no review submitted | Push notification: "Rate your experience" | ⬜ |

### 9.2 View Reviews

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REV-006 | View all reviews (profile) | 1. Go to user profile<br>2. Tap "Reviews" | Show list of all reviews with ratings | ⬜ |
| REV-007 | Filter reviews by rating | 1. Select "5 stars only" | Show only 5-star reviews | ⬜ |
| REV-008 | Sort reviews (newest first) | 1. Select sort: "Newest" | Reviews sorted by date (descending) | ⬜ |
| REV-009 | Average rating calculation | 1. User has 3 reviews: 5, 4, 5<br>2. View profile | Display: "4.67 average rating" | ⬜ |
| REV-010 | Report inappropriate review | 1. View offensive review<br>2. Tap "Report"<br>3. Submit reason | Review flagged for admin moderation | ⬜ |

---

## 10. Payment Flows (CRITICAL - 14 Test Cases)

### 10.1 Stripe Integration

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PAY-001 | Credit purchase - Card payment (success) | 1. Buy 5 credits (₹249)<br>2. Enter card: 4242 4242 4242 4242<br>3. Complete | Payment success, credits added instantly | ⬜ |
| PAY-002 | Credit purchase - Card declined | 1. Enter card: 4000 0000 0000 0002 | Payment fails, show error, credits not added | ⬜ |
| PAY-003 | Credit purchase - UPI | 1. Select UPI payment<br>2. Enter VPA: test@paytm<br>3. Complete | Payment success (test mode), credits added | ⬜ |
| PAY-004 | Credit purchase - Netbanking | 1. Select Netbanking<br>2. Choose test bank<br>3. Complete | Payment success, credits added | ⬜ |
| PAY-005 | Credit purchase - 3DS authentication | 1. Enter card: 4000 0025 0000 3155<br>2. Complete 3DS challenge | Payment success after authentication | ⬜ |
| PAY-006 | Payment timeout | 1. Start payment<br>2. Wait 10 minutes without completing | Payment cancelled, show timeout message | ⬜ |
| PAY-007 | Payment webhook received | 1. Complete payment<br>2. Stripe sends webhook to backend | Backend updates credits in database | ⬜ |

### 10.2 Transaction Tracking

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PAY-008 | View transaction history | 1. Go to Profile → Transactions | Show all: Credit purchases, Unlocks | ⬜ |
| PAY-009 | Transaction includes receipt | 1. View completed transaction<br>2. Tap "View Receipt" | Show Stripe receipt with invoice details | ⬜ |
| PAY-010 | Credit balance accuracy | 1. Buy 10 credits<br>2. Unlock 3 contacts<br>3. Check balance | Balance: 10 - 3 = 7 credits | ⬜ |
| PAY-011 | Prevent negative balance | 1. Have 0 credits<br>2. Try unlocking contact | Show "Insufficient credits" error | ⬜ |

### 10.3 Refunds (Post-MVP)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PAY-012 | Credit refund on match cancellation | 1. Unlock contact (1 credit used)<br>2. Sender cancels match before inspection | 1 credit refunded to sender | ⬜ |
| PAY-013 | No refund after inspection | 1. After inspection approved<br>2. Sender cancels | No refund (service rendered) | ⬜ |
| PAY-014 | View refund in transactions | 1. After refund processed | Transaction shows: "+1 credit (Refund)" | ⬜ |

---

## 11. Notifications (10 Test Cases)

### 11.1 Push Notifications (Firebase FCM)

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| NOTIF-001 | New match notification | 1. Traveler accepts sender's request | Sender receives: "Traveler accepted your request!" | ⬜ |
| NOTIF-002 | Contact unlocked notification | 1. Sender unlocks traveler contact | Traveler receives: "Sender unlocked your contact" | ⬜ |
| NOTIF-003 | Message notification | 1. Receive new chat message while app closed | Notification: "John: Hey, when can we meet?" | ⬜ |
| NOTIF-004 | Inspection approved notification | 1. Sender approves inspection | Traveler receives: "Inspection approved" | ⬜ |
| NOTIF-005 | Delivery reminder | 1. Traveler lands, no delivery for 6 hours | Both users: "Don't forget to complete delivery" | ⬜ |
| NOTIF-006 | Review reminder | 1. 24h after delivery, no review | Notification: "Rate your experience" | ⬜ |

### 11.2 In-App Notifications

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| NOTIF-007 | Notification bell badge | 1. Receive 3 notifications | Bell icon shows "3" badge | ⬜ |
| NOTIF-008 | View notification center | 1. Tap bell icon | Show list of all notifications (latest first) | ⬜ |
| NOTIF-009 | Mark notification as read | 1. Tap on notification | Badge count decreases, notification marked read | ⬜ |
| NOTIF-010 | Clear all notifications | 1. Tap "Clear All" | All notifications removed, badge cleared | ⬜ |

---

## 12. Trust & Safety (8 Test Cases)

### 12.1 Trust Score System

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TRUST-001 | New user trust score | 1. Create new account | Initial trust score: 0 | ⬜ |
| TRUST-002 | ID verification bonus | 1. Complete ID verification | Trust score: +300 | ⬜ |
| TRUST-003 | First delivery bonus | 1. Complete first delivery | Trust score: +100 | ⬜ |
| TRUST-004 | Good rating bonus | 1. Receive 5-star review | Trust score: +50 | ⬜ |
| TRUST-005 | Bad rating penalty | 1. Receive 1-star review | Trust score: -50 | ⬜ |
| TRUST-006 | Trust score decay (inactive) | 1. No activity for 90 days | Trust score decreases by 10% | ⬜ |

### 12.2 Safety Features

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TRUST-007 | Report user | 1. View user profile<br>2. Tap "Report"<br>3. Select reason: "Inappropriate behavior"<br>4. Submit | Report flagged for admin review | ⬜ |
| TRUST-008 | Block user | 1. Go to Match<br>2. Tap "Block User"<br>3. Confirm | User blocked, cannot contact you, hidden from search | ⬜ |

---

## Critical Test Scenarios (End-to-End)

These 8 scenarios cover the most important user journeys and must pass before MVP launch.

### Scenario 1: Happy Path - Complete Delivery Journey

**Goal**: Test entire flow from trip posting to delivery completion.

**Steps**:
1. **Traveler** creates trip: DEL→BLR, 2024-03-15, 5kg, ₹100/kg
2. **Sender** creates request: DEL→BLR, 2024-03-15, Documents, 0.5kg
3. **Traveler** searches requests, finds sender's request, initiates match
4. **Sender** receives notification, views traveler profile (verified, 4.8★, 50 deliveries)
5. **Sender** buys 5 credits (₹249 via Stripe test card: 4242...)
6. **Sender** unlocks traveler's contact (1 credit deducted, balance: 4)
7. **Sender** and traveler chat to arrange handover
8. **Traveler** meets sender, performs package inspection (3 photos + notes)
9. **Sender** approves inspection
10. **Traveler** uploads boarding pass (manual PNR verification by admin)
11. **Admin** verifies PNR, marks trip as "In Transit"
12. **Traveler** lands in BLR, updates status: "Landed"
13. **System** generates unique QR code for this match
14. **Traveler** and recipient meet, traveler scans recipient's QR code
15. **System** confirms delivery, updates statuses
16. Both users receive "Delivery completed" notification
17. **Sender** rates traveler 5★: "Excellent service!"
18. **Traveler** rates sender 5★: "Easy handover"
19. Trust scores updated: Both +100 points

**Expected Result**: ✅ All steps complete without errors, payment processed, delivery confirmed, reviews submitted.

**Failure Scenarios to Test**:
- Payment fails at step 5 → Sender cannot unlock contact
- Inspection rejected at step 9 → Match cancelled, credit refunded
- QR code scan fails at step 14 → Manual verification fallback works

---

### Scenario 2: Payment Flow - Credit Purchase

**Goal**: Test all payment methods and failure cases.

**Steps**:
1. User has 0 credits, tries to unlock contact → Blocked
2. User taps "Buy Credits", selects Starter Pack (₹249, 5 credits)
3. User tries card ending in 0002 → Payment declined
4. User tries card 4242 4242 4242 4242 → Payment success
5. Credits added instantly (balance: 5)
6. Transaction logged in history
7. Stripe webhook received by backend
8. User unlocks contact → 1 credit deducted
9. User checks balance → 4 credits remaining

**Expected Result**: ✅ Payment processed, credits added, transaction logged, webhook handled.

---

### Scenario 3: Multi-Match - One Traveler, Multiple Requests

**Goal**: Test traveler accepting multiple requests on same trip.

**Steps**:
1. **Traveler** posts trip: MUM→NYC, 10kg capacity
2. **Sender A** posts request: 2kg laptop
3. **Sender B** posts request: 3kg books
4. **Sender C** posts request: 4kg gifts
5. **Traveler** accepts all 3 requests (total: 9kg < 10kg capacity)
6. All 3 senders unlock contact (3 separate transactions)
7. **Traveler** inspects all 3 packages separately
8. All 3 senders approve inspections
9. **Traveler** uploads one boarding pass (PNR verified)
10. After landing, 3 separate QR codes generated
11. **Traveler** completes 3 deliveries separately
12. **Traveler** receives 3 reviews

**Expected Result**: ✅ All 3 matches handled independently, correct credits deducted, all deliveries confirmed.

---

### Scenario 4: Cancellation & Refund

**Goal**: Test cancellation at different stages and refund logic.

**Test Case A**: Cancellation before unlock
1. Match created
2. Sender cancels before unlocking contact
3. No credits involved → No refund needed
4. Match status: Cancelled

**Test Case B**: Cancellation after unlock, before inspection
1. Sender unlocks contact (1 credit deducted)
2. Sender cancels match
3. Credit refunded (balance: +1)
4. Traveler notified

**Test Case C**: Cancellation after inspection approved
1. Inspection completed and approved
2. Sender tries to cancel
3. System blocks cancellation: "Cannot cancel after inspection"

**Expected Result**: ✅ Refunds processed correctly based on stage.

---

### Scenario 5: Edge Case - Expired Trip

**Goal**: Test behavior when trip date passes without completion.

**Steps**:
1. Trip created: DEL→BLR, departure: 2024-03-15
2. Match created, contact unlocked
3. Inspection completed
4. Flight date passes (2024-03-16)
5. No delivery completed
6. System auto-locks chat after 24h (2024-03-17)
7. User tries to send message → Blocked
8. Match status remains: "In Transit" (manual resolution needed)

**Expected Result**: ✅ Chat locked, contact info still visible, manual admin intervention required for resolution.

---

### Scenario 6: Trust Score Accuracy

**Goal**: Verify trust score calculation.

**Steps**:
1. New user: Trust score = 0
2. Completes ID verification: +300 → Score: 300
3. Completes first delivery: +100 → Score: 400
4. Receives 5★ review: +50 → Score: 450
5. Completes 2nd delivery: +100 → Score: 550
6. Receives 3★ review: +10 → Score: 560
7. Receives 1★ review: -50 → Score: 510

**Expected Result**: ✅ Score calculated correctly at each step.

---

### Scenario 7: Inspection Rejection Flow

**Goal**: Test package inspection rejection and match cancellation.

**Steps**:
1. Match created, contact unlocked (1 credit used)
2. Traveler inspects package, uploads photos
3. Photos show: Package damaged, tape torn open
4. Sender views inspection evidence
5. Sender rejects inspection: "Package damaged, not as described"
6. System cancels match
7. Credit refunded to sender (balance: +1)
8. Both users notified
9. Traveler can dispute (admin review)

**Expected Result**: ✅ Match cancelled, credit refunded, dispute option available.

---

### Scenario 8: QR Code Verification Failure

**Goal**: Test QR scan failures and manual fallback.

**Steps**:
1. Delivery ready, QR code generated
2. Traveler scans QR code → Camera permission denied
3. Traveler selects "Enter code manually"
4. System shows 6-digit code: "AB12CD"
5. Traveler types wrong code: "AB12CE" → Error
6. Traveler types correct code: "AB12CD" → Success
7. Delivery confirmed

**Expected Result**: ✅ Manual verification works when QR scan fails.

---

## Testing Tools & Resources

### Stripe Test Cards

| Scenario | Card Number | CVC | Expiry | Result |
|----------|-------------|-----|--------|--------|
| Success | 4242 4242 4242 4242 | Any | Any future | Payment succeeds |
| Decline (generic) | 4000 0000 0000 0002 | Any | Any future | Payment declined |
| Insufficient funds | 4000 0000 0000 9995 | Any | Any future | Card declined - insufficient funds |
| Requires authentication | 4000 0025 0000 3155 | Any | Any future | 3D Secure authentication required |
| India-specific | 4000 0035 6000 0008 | Any | Any future | Success with Indian regulations |

### Test User Accounts

Create these accounts in Supabase Dashboard:

```sql
-- Traveler 1 (Verified, High Trust Score)
INSERT INTO profiles (id, email, full_name, trust_score, verified, average_rating, total_deliveries)
VALUES ('uuid-1', 'traveler1@test.com', 'John Traveler', 850, true, 4.8, 50);

-- Sender 1 (Verified, Has Credits)
INSERT INTO profiles (id, email, full_name, trust_score, verified, credit_balance)
VALUES ('uuid-2', 'sender1@test.com', 'Alice Sender', 600, true, 10);

-- New User (Unverified)
INSERT INTO profiles (id, email, full_name, trust_score, verified)
VALUES ('uuid-3', 'newuser@test.com', 'Bob Newbie', 0, false);
```

### Test Trip Data

```sql
INSERT INTO trips (traveler_id, origin_city, destination_city, departure_date, available_weight_kg, price_per_kg, status)
VALUES
  ('uuid-1', 'Delhi', 'Bangalore', '2024-03-15', 5.00, 100.00, 'active'),
  ('uuid-1', 'Mumbai', 'New York', '2024-04-20', 10.00, 500.00, 'active');
```

---

## Bug Reporting Template

When reporting bugs during testing, use this format:

```markdown
### Bug ID: BUG-XXX

**Title**: Brief description of bug

**Priority**: Critical / High / Medium / Low

**Component**: Authentication / Payments / Chat / etc.

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen

**Actual Result**: What actually happened

**Screenshots**: [Attach if applicable]

**Device Info**:
- Platform: iOS / Android
- Version: 16.2 / 13.0
- Device: iPhone 14 Pro / Pixel 6

**Logs**: [Paste relevant console logs]

**Impact**: How many users affected / Revenue impact

**Workaround**: Temporary fix (if available)
```

**Example**:

```markdown
### Bug ID: BUG-012

**Title**: Payment success but credits not added

**Priority**: CRITICAL

**Component**: Payments / Stripe Integration

**Steps to Reproduce**:
1. Go to Buy Credits
2. Select Starter Pack (₹249)
3. Complete payment with test card 4242...
4. Payment succeeds in Stripe Dashboard
5. Check credit balance in app

**Expected Result**: Balance increases by 5 credits

**Actual Result**: Balance remains 0, payment charged but credits not added

**Device Info**: iOS 16.2, iPhone 14 Pro

**Impact**: Users charged but no credits → Revenue loss + user complaints

**Workaround**: Manual credit addition by admin
```

---

## Post-MVP Testing Roadmap

### Phase 1: Unit Testing (Month 4-5)

**Backend (Python/FastAPI)**:
- [ ] Test authentication functions (JWT validation, password hashing)
- [ ] Test Stripe webhook handler
- [ ] Test credit balance calculations
- [ ] Test trust score calculations
- [ ] Test QR code generation/verification
- Target: 80% code coverage

**Mobile (React Native)**:
- [ ] Test Zustand stores (authStore, creditStore)
- [ ] Test utility functions (date formatting, validation)
- [ ] Test API client (axios interceptors)
- Target: 70% code coverage

**Tools**: pytest (Python), Jest (JavaScript)

---

### Phase 2: Integration Testing (Month 5-6)

**API Integration**:
- [ ] Test API endpoints with database (Supabase)
- [ ] Test Stripe integration (test mode)
- [ ] Test Firebase FCM integration
- [ ] Test file uploads (Supabase Storage)

**Tools**: pytest, Postman/Newman

---

### Phase 3: End-to-End Testing (Month 6-7)

**Critical User Journeys**:
- [ ] Signup → Create Trip → Match → Unlock → Delivery
- [ ] Credit purchase flow (all payment methods)
- [ ] Inspection → PNR verification → QR scan

**Tools**: Detox (React Native), Maestro

---

### Phase 4: Performance Testing (Month 7-8)

**Load Testing**:
- [ ] API endpoints (100 req/s)
- [ ] Database queries (optimize slow queries)
- [ ] Real-time chat (100 concurrent users)
- [ ] File uploads (concurrent uploads)

**Tools**: Locust, k6, Artillery

---

### Phase 5: Security Testing (Month 8-9)

**Penetration Testing**:
- [ ] SQL injection attempts
- [ ] JWT token manipulation
- [ ] Rate limiting bypass
- [ ] File upload vulnerabilities
- [ ] Payment tampering

**Tools**: OWASP ZAP, Burp Suite

---

## Success Criteria for MVP Launch

### Must Pass (100% Required)

- [ ] All 8 critical end-to-end scenarios pass
- [ ] Payment flow works with 99.9% success rate
- [ ] QR code verification has 95%+ success rate
- [ ] Chat messages delivered in <2 seconds
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] App crashes <0.1% of sessions (Sentry monitoring)
- [ ] All critical bugs (CRITICAL/HIGH) fixed

### Should Pass (80% Required)

- [ ] All manual test cases completed (250+ tests)
- [ ] Average API response time <500ms
- [ ] App load time <3 seconds
- [ ] No major UI bugs on iOS/Android
- [ ] Push notifications delivered in <10 seconds

### Nice to Have

- [ ] Automated test coverage >50%
- [ ] Performance testing completed
- [ ] Security audit passed

---

## Continuous Testing During Development

### Daily Testing (Developer)

- [ ] Test feature you just built (smoke test)
- [ ] Check Sentry for new errors
- [ ] Review Stripe Dashboard for payment issues

### Weekly Testing (End of Week)

- [ ] Run 8 critical scenarios end-to-end
- [ ] Test on both iOS and Android
- [ ] Check all new features added this week

### Pre-Release Testing (Week 12)

- [ ] Full manual test suite (all 250+ tests)
- [ ] Invite 5 beta testers (real users)
- [ ] Monitor beta testing for 1 week
- [ ] Fix all critical bugs
- [ ] Final security review

---

## Helpful Testing Commands

### Backend Testing

```bash
# Run backend locally
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","full_name":"Test User"}'

# Test Stripe webhook (simulate)
stripe trigger payment_intent.succeeded
```

### Mobile Testing

```bash
# Start Expo
cd mobile
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Clear cache
npx expo start --clear
```

### Database Testing

```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"

# Query profiles table
curl "https://your-project.supabase.co/rest/v1/profiles?select=*" \
  -H "apikey: your-anon-key"
```

---

## Resources

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing-with-jest/)
- [Supabase Auth Testing](https://supabase.com/docs/guides/auth/testing)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Last Updated**: February 16, 2026
**Maintained By**: Deepak Panwar

**Remember**: Testing is not a phase, it's a continuous process. Test early, test often, test thoroughly! 🧪
