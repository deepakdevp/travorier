# Travorier — All Pages & Features

**App:** Crowdsourced logistics platform connecting travelers with package senders.
**Users:** Two roles — Traveler (carries packages) and Sender (ships packages).

---

## Navigation Structure

The app has a bottom tab bar with 4 tabs:
- **Home** — Dashboard
- **Trips** — Browse/manage trips
- **Requests** — Package requests
- **Profile** — User account

Plus stack screens (no tab bar):
- Trip Detail
- Request to Carry (form)
- Match Confirmation (success)
- Post Request (form)
- Request Detail
- Chat

---

## Page 1: Login Screen

**Route:** `/(auth)/login`

### Elements & What They Do
- **App logo/icon** — Identifies the brand
- **App name "Travorier"** — Brand name
- **Tagline** — "Connect Travelers with Package Senders" — explains the product in one line
- **"Sign in with Google" button** — Triggers Google OAuth flow; opens Google account chooser in browser; on success, user is redirected into the app
- **Loading indicator** — Shown while OAuth is in progress
- **Terms of Service link** — Tappable; will open terms page (placeholder for now)
- **Privacy Policy link** — Tappable; will open privacy page (placeholder for now)
- **Version text** — Shows app version at the bottom

---

## Page 2: Splash / Loading Screen

**Route:** `/` (index)

### Elements & What They Do
- **App name** — Shown while the app checks if the user is already logged in
- **Subtitle** — "Crowdsourced Logistics"
- **Loading spinner** — Indicates auth state is being determined
- **Auto-redirect logic** — If user is logged in → goes to Home tab; if not → goes to Login screen

---

## Page 3: Home (Dashboard)

**Route:** `/(tabs)/` (Tab 1)

### Elements & What They Do
- **Welcome greeting** — Shows "Welcome back, [Name]!" using the logged-in user's name
- **Trust Score stat** — Shows user's trust score (number); trust is earned through verified deliveries
- **Trips stat** — Count of trips the user has posted
- **Deliveries stat** — Count of completed deliveries
- **"Browse Trips" action card** — Describes the traveler discovery flow; tapping "Browse" navigates to the Trips tab
- **"Post Request" action card** — Describes the package request flow; tapping "Post" navigates to the Requests tab
- **"How Travorier Works" explainer** — 3-step guide explaining the platform: (1) travelers post trips, (2) senders request delivery on matching routes, (3) connect and complete delivery

---

## Page 4: Trips (Browse & Search)

**Route:** `/(tabs)/trips` (Tab 2)

### Elements & What They Do
- **Search bar** — Text input that filters the trip list by city or country name in real time
- **"Verified Only" filter chip** — Toggle; when active, shows only trips from ID-verified travelers
- **"Clear Filters" chip** — Appears when any filter is active; resets search and filters
- **Results count** — Shows "X trips found" based on current filters
- **"Featured trips shown first" note** — Appears when boosted trips are present in results
- **Trip list (FlatList)** — Scrollable list of TripCard components
- **Pull-to-refresh** — Swipe down on list to reload trips from server
- **Empty state** — Shown when no trips match filters; suggests adjusting filters or checking back later

### TripCard (list item)
- **"Featured" badge** — Shown on boosted/promoted trips
- **Origin city + country** — Where the traveler is flying from
- **Destination city + country** — Where the traveler is flying to
- **Departure date** — Formatted date of the flight
- **Airline + flight number** — Shown if provided by traveler
- **"PNR Verified" badge** — Shown if traveler's booking reference has been verified
- **Traveler avatar** — Profile photo or initials
- **Traveler name** — Full name of the traveler
- **"Verified" checkmark** — Shown if traveler is ID-verified
- **Trust score** — Numeric score representing traveler's reliability
- **Available weight** — How many kg the traveler can carry
- **Price per kg** — Traveler's rate in Indian Rupees (₹)
- **Tap anywhere on card** — Opens Trip Detail screen for that trip

---

## Page 5: Trip Detail

**Route:** `/trip-detail`

### Elements & What They Do
- **Origin city + country** — Full route header showing departure location
- **Destination city + country** — Full route header showing arrival location
- **"Featured Trip" badge** — Shown if the trip is boosted/promoted
- **Departure date** — Full formatted date (e.g., Monday, 15 March 2026)
- **Departure time** — Shown if provided
- **Airline + flight number** — Flight identification
- **"PNR Verified" badge** — Confirms the booking is real
- **Traveler avatar** — Profile photo or initials
- **Traveler name** — With verified checkmark if ID-verified
- **Trust score** — With star icon
- **"ID Verified" badge** — Confirms traveler's identity was verified
- **Available weight (kg)** — Total capacity the traveler offers
- **Price per kg (₹)** — Rate shown prominently
- **Pricing examples** — Auto-calculated costs for 2 kg, 5 kg, and 10 kg to help sender estimate
- **"Unlock contact costs ₹99" note** — Informs sender of the credit cost before they commit
- **"Delivery fee negotiated with traveler" note** — Sets expectation that final price is agreed directly
- **"Package inspection required" note** — Informs both parties of the inspection requirement
- **"Request to Carry Package" button (fixed at bottom)** — Primary CTA; opens the Request to Carry form for this trip

---

## Page 6: Request to Carry (Form)

**Route:** `/request-to-carry`

### Elements & What They Do
- **Trip summary banner** — Shows origin city → destination city, traveler name, departure date; read-only context for what the sender is requesting
- **Package weight field (required)** — Numeric input; validated against traveler's available capacity; shows helper text with available kg
- **Package description field (required)** — Multi-line text; minimum 10 characters; describes what is being sent (e.g. books, clothes)
- **Package value field (optional)** — Numeric input in ₹; helps traveler understand insurance needs
- **Additional notes field (optional)** — Free text for special instructions or delivery preferences
- **Estimated cost card** — Auto-calculated (weight × price/kg); appears once valid weight is entered; shows breakdown and disclaimer that final price is negotiated
- **"Next Steps" info card** — 3 steps: (1) request sent to traveler, (2) unlock contact for ₹99 after confirmation, (3) coordinate handover
- **"Submit Request" button (fixed at bottom)** — Disabled until all required fields are valid; shows confirmation dialog before submitting; on confirm, navigates to Match Confirmation screen

---

## Page 7: Match Confirmation (Success)

**Route:** `/match-confirmation`

### Elements & What They Do
- **Success icon** — Large green checkmark confirming the action succeeded
- **Success title** — "Request Sent Successfully!"
- **Success subtitle** — Confirms request has been sent to the traveler
- **Trip summary card** — Shows origin → destination, traveler name, departure date; read-only recap
- **"What Happens Next?" steps** — 4-step flow: (1) traveler reviews request, (2) sender gets notified when traveler responds, (3) unlock contact for ₹99 credit, (4) coordinate handover and delivery
- **"Browse More Trips" button** — Returns to the Trips tab
- **"Go to Homepage" button** — Returns to the Home tab
- **Info note** — Reminds user they can view matches in the Profile tab

---

## Page 8: Requests (My Package Requests)

**Route:** `/(tabs)/requests` (Tab 3)

### Elements & What They Do
- **Request list (FlatList)** — Scrollable list of the user's own package requests
- **Pull-to-refresh** — Swipe down to reload requests
- **Empty state** — Shown when user has no requests; prompts them to post their first one
- **"Post Request" FAB (floating action button)** — Fixed button; opens the Post Request form

### RequestCard (list item)
- **Origin city → destination city** — Route shown as "City A → City B"
- **Status chip** — Color-coded badge: Open (green), Matched (blue), Completed (grey)
- **Package weight** — Shows weight in kg
- **Needed by date** — Deadline for delivery
- **Package description** — First 2 lines of the description; truncated
- **Tap anywhere on card** — Opens Request Detail screen for that request

---

## Page 9: Post Request (Form)

**Route:** `/post-request`

### Elements & What They Do
- **Origin city field (required)** — Where the package is currently located
- **Origin country field (required)** — Country of origin
- **Destination city field (required)** — Where the package needs to go
- **Destination country field (required)** — Country of destination
- **Needed by date field (required)** — Deadline date input (YYYY-MM-DD format)
- **Package weight field (required)** — Numeric; how heavy the package is in kg
- **Package description field (required)** — Multi-line; minimum 10 characters; what is in the package
- **Estimated value field (optional)** — Approximate monetary value in ₹; helps travelers assess insurance risk
- **Special instructions field (optional)** — Fragile, handle with care, etc.
- **Info notes** — Reminds user: matching travelers will be notified, contact unlock costs ₹99
- **"Post Request" button (fixed at bottom)** — Disabled until all required fields are valid; shows confirmation dialog; on confirm, adds to request list and navigates back to Requests tab

---

## Page 10: Request Detail

**Route:** `/request-detail`

### Elements & What They Do
- **Origin city + country** — Where the package needs to be picked up
- **Destination city + country** — Where it needs to be delivered
- **Weight chip** — Package weight in kg
- **Needed by date chip** — Deadline
- **Status chip** — Open / Matched / Completed
- **Package description** — Full description text
- **"X Matching Travelers" heading** — Count of travelers whose trips match this request's route
- **Match list** — List of MatchCards (see below)
- **Empty match state** — Shown when no travelers have matched yet; says system will notify when one matches

### MatchCard (match list item)
- **Traveler avatar** — Photo or initials
- **Traveler name** — With verified checkmark if ID-verified
- **Trust score** — Numeric score with star icon
- **Flight info** — Airline, flight number, departure date
- **"Accept & Chat" button** — Opens the Unlock Contact modal

### Unlock Contact Modal (overlay)
- **Lock icon** — Visual indicator for the unlock action
- **Title** — "Unlock Contact"
- **Description** — "Use 1 credit (₹99) to unlock [Traveler Name]'s contact details and start chatting"
- **User's credit balance** — Shows how many credits they currently have
- **"Cancel" button** — Dismisses modal, no action taken
- **"Unlock (1 credit)" button** — Deducts 1 credit, marks contact as unlocked, navigates to Chat screen

---

## Page 11: Chat

**Route:** `/chat`

### Elements & What They Do
- **Chat header** — Shows traveler's avatar, name, and the route (origin → destination); verified checkmark if applicable
- **Chat availability banner** — Yellow info bar showing until when the chat is available (24 hours after the flight date)
- **Chat locked banner** — Grey bar with lock icon; replaces availability banner after the 24h window has passed; input is disabled
- **Message history** — Chronological list of all messages; auto-scrolls to bottom on load and when new messages arrive
- **Message bubbles** — Sender's messages appear on the right (blue); traveler's messages appear on the left (white); each shows timestamp
- **Empty chat state** — Shown when no messages exist yet; prompts user to say hi
- **Loading state** — Shown while fetching message history from database
- **Error state** — Shown if message history fails to load; includes "Tap to retry" action
- **Message text input** — Disabled when chat is locked; placeholder text changes accordingly
- **Send button** — Inside the text input on the right; disabled when input is empty, sending, or chat is locked; pressing sends message to Supabase and updates the chat in real time for both participants

---

## Page 12: Profile

**Route:** `/(tabs)/profile` (Tab 4)

### Elements & What They Do
- **Avatar** — User's Google profile photo; falls back to initials if no photo
- **Full name** — User's display name from Google
- **Email address** — User's email
- **Verification status badge** — Shows "Not Verified" or "Verified" based on ID verification status
- **Trust Score stat** — User's earned trust score
- **Trips Posted stat** — How many trips the user has posted
- **Deliveries stat** — How many packages delivered
- **Rating stat** — Average star rating from reviews

### Account Settings section
- **"Edit Profile" row** — Opens profile editing (name, bio, avatar upload) — planned feature
- **"Verification" row** — Opens identity verification flow — planned feature
- **"Payment Methods" row** — Manage credits and Stripe payment options — planned feature
- **"Notifications" row** — Manage push notification preferences — planned feature

### App Info section
- **"Help & Support" row** — Opens support resources — planned feature
- **"Terms & Privacy" row** — Opens legal documents — planned feature
- **"About Travorier" row** — Shows app version and description

- **"Sign Out" button** — Shows confirmation dialog; on confirm, signs user out and redirects to Login screen

---

## Data Flows Summary

| Action | What Happens |
|--------|-------------|
| Google Sign In | Supabase OAuth → session stored → redirect to Home |
| Browse Trips | Load from tripsStore (mock) → filter/search client-side |
| View Trip Detail | Read selectedTrip from store |
| Request to Carry | Form submit → navigate to Match Confirmation |
| Browse My Requests | Load from requestsStore (mock) |
| Post Request | Form submit → add to requestsStore → back to Requests tab |
| View Request Detail | Read selectedRequest + its matches from store |
| Accept Match | Show Unlock Modal → deduct credit → navigate to Chat |
| Chat | Load history from Supabase `messages` table → subscribe to real-time inserts → send inserts to `messages` table |
| Sign Out | Supabase signOut → clear session → redirect to Login |
