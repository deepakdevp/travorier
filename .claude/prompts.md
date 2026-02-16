# Travorier - Claude Prompts Library

Reusable prompt templates to accelerate development with Claude Code.

**Purpose**: Standardize common requests to get consistent, high-quality code from Claude.

**Last Updated**: February 16, 2026

---

## How to Use This Library

1. **Find the prompt** that matches your task (Development, Database, Testing, Documentation)
2. **Copy the template** and replace placeholders with your specific values
3. **Include context files** mentioned in "Required Context"
4. **Paste to Claude** and get consistent, quality results

**Tip**: Reference this file with Claude: "Use the prompt from `.claude/prompts.md` for creating an API endpoint"

---

## Development Prompts

### 1. Create New API Endpoint

**Purpose**: Generate a complete FastAPI endpoint with validation, error handling, and documentation.

**Template**:
```
Create a new API endpoint for [FEATURE_NAME]:

Endpoint: [METHOD] /api/v1/[RESOURCE]/[ACTION]
Purpose: [DESCRIBE WHAT IT DOES]

Request Schema:
[PROVIDE JSON EXAMPLE OR PYDANTIC MODEL]

Response Schema:
[PROVIDE JSON EXAMPLE OR PYDANTIC MODEL]

Business Logic:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Error Cases:
- [ERROR CONDITION 1] → HTTP 4XX [ERROR MESSAGE]
- [ERROR CONDITION 2] → HTTP 5XX [ERROR MESSAGE]

Security:
- Authentication: [Required / Optional / None]
- Authorization: [RLS POLICY / Custom logic]

Required Context:
- Read backend/app/api/v1/[similar_endpoint].py for reference
- Read backend/app/schemas/[resource].py for existing models
- Read docs/API.md for API conventions
```

**Example**:
```
Create a new API endpoint for trip boosting:

Endpoint: POST /api/v1/trips/{trip_id}/boost
Purpose: Allow travelers to boost their trip for ₹199, making it featured for 7 days

Request Schema:
{
  "payment_method_id": "pm_xxxx"  # Stripe payment method
}

Response Schema:
{
  "trip_id": "uuid",
  "boosted_until": "2024-03-22T10:30:00Z",
  "payment_id": "pi_xxxx",
  "amount_charged": 199
}

Business Logic:
1. Verify trip belongs to authenticated user
2. Check if trip is already boosted (error if yes)
3. Create Stripe payment intent for ₹199
4. If payment succeeds, update trip.boosted_until = now() + 7 days
5. Log transaction in transactions table
6. Return success response

Error Cases:
- Trip not found → HTTP 404 "Trip not found"
- Trip already boosted → HTTP 400 "Trip is already boosted until {date}"
- Payment failed → HTTP 402 "Payment failed: {stripe_error}"
- Unauthorized (not trip owner) → HTTP 403 "Not authorized"

Security:
- Authentication: Required (JWT)
- Authorization: RLS policy (user must own trip)

Required Context:
- Read backend/app/api/v1/payments.py for Stripe integration reference
- Read backend/app/schemas/trips.py for trip models
- Read docs/API.md for payment endpoint conventions
```

---

### 2. Create New React Native Screen

**Purpose**: Generate a complete mobile screen with navigation, API calls, state management, and error handling.

**Template**:
```
Create a new React Native screen for [SCREEN_NAME]:

Screen: app/[ROUTE_PATH].tsx
Purpose: [DESCRIBE WHAT USER DOES ON THIS SCREEN]

UI Components:
- [LIST UI ELEMENTS: Input fields, buttons, lists, etc.]

Data:
- API Endpoint: [GET/POST/etc.] /api/v1/[endpoint]
- State Management: [Zustand store / Local state]

User Actions:
1. [ACTION 1] → [RESULT]
2. [ACTION 2] → [RESULT]

Navigation:
- Comes from: [PREVIOUS SCREEN]
- Goes to: [NEXT SCREEN(S)]

Error Handling:
- [ERROR SCENARIO 1] → [SHOW ERROR MESSAGE]
- [ERROR SCENARIO 2] → [SHOW ERROR MESSAGE]

Required Context:
- Read mobile/app/[similar_screen].tsx for UI patterns
- Read mobile/services/api.ts for API client usage
- Read mobile/stores/[store].ts for state management pattern
```

**Example**:
```
Create a new React Native screen for credit purchase:

Screen: app/(tabs)/profile/buy-credits.tsx
Purpose: Allow users to buy credit packs via Stripe

UI Components:
- Screen header: "Buy Credits"
- 3 credit pack cards (Starter, Value, Pro)
- Each card shows: Name, credits, price, discount badge
- "Buy Now" button on each card
- Loading spinner during payment
- Success modal after purchase

Data:
- API Endpoint: POST /api/v1/payments/create-intent
- State Management: creditStore (Zustand) - update balance after purchase

User Actions:
1. User taps "Buy Now" on a pack → Show Stripe payment sheet
2. User completes payment → Update credit balance, show success modal
3. User taps "Done" on success modal → Navigate back to profile

Navigation:
- Comes from: Profile screen (tap "Buy Credits" button)
- Goes to: Profile screen (after successful purchase)

Error Handling:
- Payment declined → Show alert "Payment failed: {error message}"
- Network error → Show alert "Connection error, please try again"
- User cancels payment → Return to credit pack selection

Required Context:
- Read mobile/app/(tabs)/profile/index.tsx for navigation setup
- Read mobile/services/api.ts for Stripe integration
- Read mobile/stores/creditStore.ts for balance update
```

---

### 3. Implement Service Function

**Purpose**: Create a reusable service function (backend or mobile).

**Template**:
```
Implement a service function for [SERVICE_NAME]:

Function: [FUNCTION_NAME]
Location: [FILE_PATH]
Purpose: [WHAT IT DOES]

Parameters:
- [PARAM1]: [TYPE] - [DESCRIPTION]
- [PARAM2]: [TYPE] - [DESCRIPTION]

Returns: [RETURN_TYPE] - [DESCRIPTION]

Logic:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Error Handling:
- [ERROR CASE 1] → [THROW/RETURN ERROR]
- [ERROR CASE 2] → [THROW/RETURN ERROR]

Dependencies:
- [LIBRARY 1]: [USAGE]
- [LIBRARY 2]: [USAGE]

Required Context:
- Read [RELATED_FILE] for similar functions
```

**Example**:
```
Implement a service function for QR code generation:

Function: generate_delivery_qr
Location: backend/app/services/qr_service.py
Purpose: Generate unique QR code for delivery confirmation

Parameters:
- match_id: UUID - Match identifier
- sender_id: UUID - Sender user ID
- traveler_id: UUID - Traveler user ID

Returns: str - Base64-encoded QR code image

Logic:
1. Generate unique 6-digit alphanumeric code (e.g., "AB12CD")
2. Create JSON payload: {"match_id": str(match_id), "code": code}
3. Generate QR code image using qrcode library (200x200px)
4. Convert image to base64 string
5. Store code in matches table: UPDATE matches SET qr_code = code WHERE id = match_id
6. Return base64 string

Error Handling:
- QR generation fails → Raise ValueError("Failed to generate QR code")
- Database update fails → Raise DatabaseError

Dependencies:
- qrcode: Generate QR code image
- Pillow (PIL): Image processing
- base64: Encode image

Required Context:
- Read backend/app/services/supabase.py for database client usage
```

---

### 4. Add Form Validation

**Purpose**: Add comprehensive validation to a form (mobile or backend).

**Template**:
```
Add form validation to [FORM_NAME]:

Form Fields:
- [FIELD1]: [TYPE] - [VALIDATION RULES]
- [FIELD2]: [TYPE] - [VALIDATION RULES]

Validation Library: [Yup / Zod / Pydantic]

Error Messages:
- [FIELD1] [ERROR_TYPE]: "[USER-FRIENDLY MESSAGE]"
- [FIELD2] [ERROR_TYPE]: "[USER-FRIENDLY MESSAGE]"

Required Context:
- Read [SIMILAR_FORM] for validation patterns
```

**Example**:
```
Add form validation to trip creation form:

Form Fields:
- origin_city: string - Required, min 2 chars, max 50 chars
- destination_city: string - Required, min 2 chars, max 50 chars, cannot equal origin_city
- departure_date: date - Required, must be future date
- available_weight_kg: number - Required, > 0, max 50
- price_per_kg: number - Required, >= 0, max 10000

Validation Library: Yup (mobile) / Pydantic (backend)

Error Messages:
- origin_city required: "Please enter origin city"
- origin_city min length: "City name must be at least 2 characters"
- destination_city same as origin: "Destination cannot be same as origin"
- departure_date past: "Departure date must be in the future"
- available_weight_kg zero: "Weight must be greater than 0 kg"
- price_per_kg negative: "Price cannot be negative"

Required Context:
- Read mobile/app/(tabs)/trips/create.tsx for form setup
- Read backend/app/schemas/trips.py for Pydantic model
```

---

## Database Prompts

### 5. Write Database Migration

**Purpose**: Create a new Supabase migration file.

**Template**:
```
Write a database migration for [FEATURE_NAME]:

Migration Name: [YYYYMMDDHHMMSS]_[snake_case_description].sql
Location: supabase/migrations/

Changes:
- [CHANGE 1: Add table / Add column / Add index / etc.]
- [CHANGE 2]
- [CHANGE 3]

Tables Affected:
- [TABLE1]: [CHANGES]
- [TABLE2]: [CHANGES]

RLS Policies:
- [POLICY1]: [DESCRIPTION]
- [POLICY2]: [DESCRIPTION]

Indexes:
- [INDEX1]: [COLUMNS] - [PURPOSE]

Required Context:
- Read supabase/migrations/20260215000001_initial_schema.sql for conventions
- Read docs/ARCHITECTURE.md for table relationships
```

**Example**:
```
Write a database migration for trip boosting feature:

Migration Name: 20260220000001_add_trip_boosting.sql
Location: supabase/migrations/

Changes:
- Add boosted_until column to trips table
- Add boost_transaction_id column to trips table
- Create index on boosted_until for fast featured trip queries
- Add RLS policy for boost endpoint

Tables Affected:
- trips: Add boosted_until TIMESTAMPTZ, boost_transaction_id UUID

RLS Policies:
- "Users can boost their own trips": Allow UPDATE on trips.boosted_until where auth.uid() = traveler_id

Indexes:
- idx_trips_boosted: (boosted_until DESC) WHERE boosted_until > NOW() - For fast featured trip queries

Required Context:
- Read supabase/migrations/20260215000001_initial_schema.sql for table structure
- Read docs/ARCHITECTURE.md for trips table schema
```

---

### 6. Add RLS Policy

**Purpose**: Add a Row-Level Security policy to a table.

**Template**:
```
Add RLS policy to [TABLE_NAME]:

Policy Name: [descriptive_name]
Operation: SELECT / INSERT / UPDATE / DELETE
Rule: [WHO CAN DO WHAT]

SQL Expression: USING ([CONDITION])

Test Case:
- User A (id: uuid-1) [CAN / CANNOT] [OPERATION] [DESCRIPTION]
- User B (id: uuid-2) [CAN / CANNOT] [OPERATION] [DESCRIPTION]

Required Context:
- Read supabase/migrations/[latest]_initial_schema.sql for existing policies
- Read docs/ARCHITECTURE.md for authorization rules
```

**Example**:
```
Add RLS policy to inspections table:

Policy Name: "Traveler can insert their own inspections"
Operation: INSERT
Rule: Only the traveler involved in a match can upload inspection evidence

SQL Expression:
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = inspections.match_id
    AND matches.traveler_id = auth.uid()
  )
)

Test Case:
- User A (traveler in match-1) CAN insert inspection for match-1
- User B (sender in match-1) CANNOT insert inspection for match-1 (only traveler can inspect)
- User C (unrelated) CANNOT insert inspection for match-1

Required Context:
- Read supabase/migrations/20260215000001_initial_schema.sql for matches and inspections tables
- Read docs/ARCHITECTURE.md for inspection workflow
```

---

### 7. Create Database Trigger

**Purpose**: Create a PostgreSQL trigger for automatic updates.

**Template**:
```
Create database trigger for [FEATURE_NAME]:

Trigger Name: [name]_trigger
Table: [TABLE_NAME]
Event: BEFORE / AFTER [INSERT / UPDATE / DELETE]

Trigger Function:
Function Name: [function_name]()
Logic:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Use Case: [WHY THIS TRIGGER IS NEEDED]

Required Context:
- Read supabase/migrations/[latest].sql for existing triggers
```

**Example**:
```
Create database trigger for auto-updating average rating:

Trigger Name: update_average_rating_trigger
Table: reviews
Event: AFTER INSERT

Trigger Function:
Function Name: update_user_average_rating()
Logic:
1. Get reviewed_user_id from NEW.reviewed_user_id
2. Calculate AVG(rating) from reviews WHERE reviewed_user_id = NEW.reviewed_user_id
3. UPDATE profiles SET average_rating = [calculated_avg] WHERE id = NEW.reviewed_user_id
4. RETURN NEW

Use Case: Automatically update user's average rating when a new review is submitted

Required Context:
- Read supabase/migrations/20260215000001_initial_schema.sql for reviews table structure
- Read docs/ARCHITECTURE.md for review system logic
```

---

### 8. Optimize Query Performance

**Purpose**: Optimize a slow database query.

**Template**:
```
Optimize this slow query:

Current Query:
[PASTE SQL QUERY]

Performance Issue:
- Execution time: [TIME]
- Explain Analyze output: [PASTE IF AVAILABLE]
- Bottleneck: [DESCRIBE ISSUE]

Optimization Goal:
- Target execution time: < [TIME]

Constraints:
- [ANY CONSTRAINTS, e.g., "Cannot change table structure"]

Required Context:
- Read docs/ARCHITECTURE.md for table indexes
- Run EXPLAIN ANALYZE [QUERY] in Supabase SQL Editor
```

**Example**:
```
Optimize this slow query:

Current Query:
SELECT * FROM trips
WHERE origin_city = 'Delhi' AND destination_city = 'Bangalore'
AND departure_date > NOW()
ORDER BY created_at DESC
LIMIT 20;

Performance Issue:
- Execution time: 2.5 seconds (too slow for search)
- Explain Analyze: Sequential scan on trips table (45,000 rows)
- Bottleneck: No index on (origin_city, destination_city)

Optimization Goal:
- Target execution time: < 100ms

Constraints:
- Cannot change API response format

Required Context:
- Read docs/ARCHITECTURE.md for trips table schema
- Read supabase/migrations/20260215000001_initial_schema.sql for existing indexes
```

---

## Testing Prompts

### 9. Write Unit Tests for Service Function

**Purpose**: Generate unit tests for a backend service function.

**Template**:
```
Write unit tests for [FUNCTION_NAME]:

Function Location: [FILE_PATH]
Testing Framework: pytest (Python) / Jest (JavaScript)

Test Cases:
1. [TEST_CASE_1] - [EXPECTED_BEHAVIOR]
2. [TEST_CASE_2] - [EXPECTED_BEHAVIOR]
3. [ERROR_CASE_1] - [EXPECTED_ERROR]

Mocking:
- [DEPENDENCY1]: [MOCK_BEHAVIOR]
- [DEPENDENCY2]: [MOCK_BEHAVIOR]

Required Context:
- Read [FUNCTION_FILE] to understand implementation
- Read [EXISTING_TEST_FILE] for testing patterns
```

**Example**:
```
Write unit tests for generate_delivery_qr function:

Function Location: backend/app/services/qr_service.py
Testing Framework: pytest

Test Cases:
1. test_generate_qr_success - Generates valid base64 QR code
2. test_generate_qr_unique_codes - Each call generates unique code
3. test_generate_qr_saves_to_database - Updates matches table with qr_code
4. test_generate_qr_invalid_match_id - Raises ValueError for non-existent match

Mocking:
- Supabase client: Mock database UPDATE call
- qrcode library: Mock QR generation (return dummy image)

Required Context:
- Read backend/app/services/qr_service.py for implementation
- Read backend/tests/test_stripe_service.py for pytest patterns
```

---

### 10. Create Integration Test

**Purpose**: Write integration test for API endpoint.

**Template**:
```
Write integration test for [ENDPOINT]:

Endpoint: [METHOD] /api/v1/[path]
Testing Framework: pytest + TestClient (FastAPI)

Setup:
- Test database: [CREATE TEST DATA]
- Test user: [AUTHENTICATION SETUP]

Test Cases:
1. test_[endpoint]_success - [HAPPY PATH]
2. test_[endpoint]_validation_error - [INVALID INPUT]
3. test_[endpoint]_unauthorized - [NO AUTH TOKEN]
4. test_[endpoint]_forbidden - [WRONG USER]

Assertions:
- Status code: [EXPECTED_CODE]
- Response body: [EXPECTED_JSON]
- Database state: [VERIFY DATABASE CHANGES]

Required Context:
- Read backend/app/api/v1/[endpoint].py for implementation
- Read backend/tests/test_[similar]_endpoint.py for patterns
```

**Example**:
```
Write integration test for trip creation endpoint:

Endpoint: POST /api/v1/trips
Testing Framework: pytest + TestClient

Setup:
- Test database: Create test user (id: test-uuid-1)
- Test user: Generate JWT token for test user

Test Cases:
1. test_create_trip_success - Valid trip data returns 201 with trip object
2. test_create_trip_past_date - departure_date in past returns 400
3. test_create_trip_negative_weight - available_weight_kg < 0 returns 422
4. test_create_trip_unauthorized - No auth token returns 401

Assertions:
- Success: status_code == 201, response["id"] exists, database has new trip
- Past date: status_code == 400, error message contains "future"
- Negative weight: status_code == 422, validation error
- Unauthorized: status_code == 401

Required Context:
- Read backend/app/api/v1/trips.py for endpoint implementation
- Read backend/tests/test_auth_endpoints.py for auth setup patterns
```

---

### 11. Write E2E Test Scenario

**Purpose**: Create end-to-end test for critical user journey.

**Template**:
```
Write E2E test for [USER_JOURNEY]:

Journey: [DESCRIPTION]
Testing Framework: Detox (React Native) / Playwright (Web)

Steps:
1. [USER_ACTION_1] → [EXPECTED_UI_CHANGE]
2. [USER_ACTION_2] → [EXPECTED_UI_CHANGE]
3. [USER_ACTION_3] → [EXPECTED_RESULT]

Assertions:
- [STEP1]: [UI_ELEMENT] is visible with text "[TEXT]"
- [STEP2]: [API_CALL] was made successfully
- [STEP3]: [FINAL_STATE] is achieved

Setup:
- Test data: [CREATE TEST TRIPS, USERS, etc.]
- Mock services: [STRIPE MOCK, etc.]

Required Context:
- Read docs/TESTING.md for E2E test scenarios
- Read mobile/e2e/[similar_test].spec.ts for Detox patterns
```

**Example**:
```
Write E2E test for complete delivery journey:

Journey: Traveler posts trip → Sender unlocks contact → QR scan delivery
Testing Framework: Detox

Steps:
1. Traveler creates trip (DEL→BLR, 2024-03-15) → Trip appears in "My Trips"
2. Sender searches trips → Finds traveler's trip, taps "Request Delivery"
3. Sender buys credits (₹249) → Balance shows 5 credits
4. Sender unlocks contact → Traveler's phone number revealed
5. Traveler scans sender's QR code → Match status: "Completed"

Assertions:
- Step 1: "My Trips" screen shows new trip with status "Active"
- Step 3: Profile screen shows "5 credits"
- Step 4: Match details show phone number and "Call" button
- Step 5: Match status updates to "Completed", review prompt appears

Setup:
- Test data: Create 2 test users (traveler1@test.com, sender1@test.com)
- Mock services: Mock Stripe payment (auto-success)
- QR code: Generate test QR with known match_id

Required Context:
- Read docs/TESTING.md Scenario 1 (Happy Path) for test flow
- Read mobile/e2e/auth.spec.ts for Detox setup patterns
```

---

### 12. Generate Test Data

**Purpose**: Create realistic test data for manual/automated testing.

**Template**:
```
Generate test data for [ENTITY]:

Entity: [TABLE_NAME]
Quantity: [NUMBER]
Format: SQL INSERT statements / JSON / TypeScript factory

Requirements:
- [REQUIREMENT1: e.g., "Realistic Indian city names"]
- [REQUIREMENT2: e.g., "Future dates only"]
- [REQUIREMENT3: e.g., "Valid phone numbers"]

Relationships:
- [RELATED_TABLE1]: [HOW THEY RELATE]
- [RELATED_TABLE2]: [HOW THEY RELATE]

Required Context:
- Read docs/ARCHITECTURE.md for schema
- Read supabase/migrations/[latest].sql for constraints
```

**Example**:
```
Generate test data for trips table:

Entity: trips
Quantity: 50
Format: SQL INSERT statements

Requirements:
- Origin/destination: Top 10 Indian cities (Delhi, Mumbai, Bangalore, etc.)
- Departure dates: Next 30 days (spread evenly)
- Available weight: 1-15 kg (random)
- Price per kg: ₹50-500 (realistic range)
- Status: 80% active, 10% completed, 10% cancelled
- Traveler IDs: Reference existing test users

Relationships:
- traveler_id: Must reference profiles.id (create 10 test travelers first)

Required Context:
- Read docs/ARCHITECTURE.md for trips table schema
- Read supabase/migrations/20260215000001_initial_schema.sql for CHECK constraints
```

---

## Documentation Prompts

### 13. Document API Endpoint

**Purpose**: Add complete API endpoint documentation to docs/API.md.

**Template**:
```
Document this API endpoint:

Endpoint: [METHOD] /api/v1/[path]
Purpose: [WHAT IT DOES]

Follow the format in docs/API.md:
- Request schema (with example JSON)
- Response schema (with example JSON)
- Query parameters (if any)
- Error codes
- Code example (TypeScript + Python)

Required Context:
- Read docs/API.md for documentation format
- Read backend/app/api/v1/[endpoint].py for implementation details
```

**Example**:
```
Document this API endpoint:

Endpoint: POST /api/v1/matches/{match_id}/unlock
Purpose: Unlock traveler's contact information for ₹99 (1 credit)

Follow the format in docs/API.md:
- Request schema: { "confirm": true }
- Response schema: { "contact_unlocked": true, "phone": "+91xxxxxxxxxx", "credits_remaining": 4 }
- Error codes: 400 (insufficient credits), 404 (match not found), 403 (not authorized)
- Code examples in TypeScript and Python

Required Context:
- Read docs/API.md for existing endpoint documentation format
- Read backend/app/api/v1/matches.py for unlock implementation
```

---

### 14. Write Inline Code Comments

**Purpose**: Add helpful comments to complex code.

**Template**:
```
Add inline comments to this code:

Code Location: [FILE_PATH]
Code Section: [FUNCTION/CLASS NAME]

Comment Guidelines:
- Explain "why" not "what" (code should be self-explanatory)
- Add comments for complex logic only
- Use docstrings for functions (Google style for Python, JSDoc for TypeScript)

Required Context:
- Read the code at [FILE_PATH]
- Understand the business logic from docs/ARCHITECTURE.md
```

**Example**:
```
Add inline comments to QR verification code:

Code Location: backend/app/api/v1/matches.py
Code Section: scan_qr() function

Comment Guidelines:
- Explain why we validate QR code format (security)
- Explain why we check match status (prevent double-scanning)
- Document error cases

Required Context:
- Read backend/app/api/v1/matches.py
- Read docs/ARCHITECTURE.md for QR code delivery flow
```

---

### 15. Update Architecture Docs

**Purpose**: Update docs/ARCHITECTURE.md after significant changes.

**Template**:
```
Update docs/ARCHITECTURE.md for [FEATURE]:

Changes:
- [SECTION1]: [WHAT CHANGED]
- [SECTION2]: [WHAT CHANGED]

New Content:
- [DIAGRAM / TABLE / SECTION] - [DESCRIPTION]

Affected Sections:
- Database Schema: [CHANGES]
- API Endpoints: [NEW ENDPOINTS]
- Business Logic: [FLOW CHANGES]

Required Context:
- Read docs/ARCHITECTURE.md to understand current state
- Read implementation files for accurate details
```

**Example**:
```
Update docs/ARCHITECTURE.md for trip boosting feature:

Changes:
- Database Schema: Add boosted_until column to trips table
- API Endpoints: Add POST /api/v1/trips/{id}/boost
- Business Logic: Featured trips appear at top of search results

New Content:
- Section: "Trip Boosting" under Business Logic
  - Explain ₹199 fee for 7-day featured placement
  - Diagram showing boost flow: Payment → Update boosted_until → Featured in search

Affected Sections:
- Table "trips" schema: Add boosted_until TIMESTAMPTZ
- API Endpoints: Add boost endpoint spec
- Search algorithm: Explain ORDER BY boosted_until DESC NULLS LAST

Required Context:
- Read docs/ARCHITECTURE.md Section: Database Schema → trips table
- Read backend/app/api/v1/trips.py for boost implementation
```

---

### 16. Create User Guide Section

**Purpose**: Write user-facing documentation.

**Template**:
```
Write user guide for [FEATURE]:

Audience: [Travelers / Senders / Both]
Format: Step-by-step with screenshots (describe screenshot content)

Sections:
1. [SECTION1] - [WHAT IT COVERS]
2. [SECTION2] - [WHAT IT COVERS]
3. [TROUBLESHOOTING] - [COMMON ISSUES]

Tone: Friendly, simple language (no jargon)

Required Context:
- Use the mobile app to understand user flow
- Read docs/PRD.md for user stories
```

**Example**:
```
Write user guide for unlocking traveler contact:

Audience: Senders (people sending packages)
Format: Step-by-step with screenshots

Sections:
1. Finding a Traveler - How to search and view trips
2. Unlocking Contact - Steps to pay ₹99 and see phone number
3. Contacting Traveler - Using call/WhatsApp buttons
4. Troubleshooting - What if I don't have credits? What if payment fails?

Tone: Friendly ("Let's find a traveler for your package!")

Required Context:
- Use mobile app to go through the unlock flow
- Read docs/PRD.md User Story S-003 (Sender unlocks traveler contact)
```

---

## Advanced Prompts

### 17. Refactor Complex Function

**Purpose**: Simplify and improve code quality.

**Template**:
```
Refactor this function:

Function Location: [FILE_PATH]
Current Issues:
- [ISSUE1: e.g., "Too long (200 lines)"]
- [ISSUE2: e.g., "Nested if statements"]
- [ISSUE3: e.g., "Duplicated logic"]

Refactoring Goals:
- Break into smaller functions
- Improve readability
- Maintain existing behavior (no functional changes)

Testing:
- [EXISTING_TESTS] must still pass after refactoring

Required Context:
- Read [FILE_PATH] to understand current implementation
- Read [TEST_FILE] to understand expected behavior
```

---

### 18. Optimize Bundle Size

**Purpose**: Reduce mobile app bundle size.

**Template**:
```
Optimize mobile app bundle size:

Current Size: [SIZE in MB]
Target Size: [SIZE in MB]

Analysis:
- Run `npx react-native-bundle-visualizer` and paste output
- Identify largest dependencies

Optimization Strategies:
- Tree-shaking: Remove unused imports
- Lazy loading: Code-split heavy screens
- Asset optimization: Compress images
- Dependency audit: Replace heavy libraries

Required Context:
- Read mobile/package.json for dependencies
- Analyze bundle with visualizer tool
```

---

### 19. Debug Production Issue

**Purpose**: Investigate and fix production bugs.

**Template**:
```
Debug this production issue:

Issue: [DESCRIPTION]
Frequency: [HOW OFTEN IT OCCURS]
Affected Users: [PERCENTAGE OR COUNT]

Symptoms:
- [SYMPTOM1]
- [SYMPTOM2]

Error Logs:
[PASTE SENTRY / VERCEL LOGS]

Reproduction Steps:
1. [STEP1]
2. [STEP2]
3. [BUG OCCURS]

Hypotheses:
- [HYPOTHESIS1]
- [HYPOTHESIS2]

Required Context:
- Check Sentry dashboard for error details
- Read implementation of [AFFECTED_COMPONENT]
```

---

### 20. Performance Optimization

**Purpose**: Improve app performance.

**Template**:
```
Optimize performance for [SCREEN/ENDPOINT]:

Current Performance:
- Load time: [TIME]
- API response time: [TIME]
- User complaint: "[FEEDBACK]"

Profiling:
- [TOOL USED: React DevTools / Chrome DevTools / cProfile]
- Bottleneck: [IDENTIFIED ISSUE]

Optimization Targets:
- Load time: < [TARGET TIME]
- API response: < [TARGET TIME]

Constraints:
- [CONSTRAINT1: e.g., "Cannot cache user-specific data"]

Required Context:
- Profile the app/endpoint first
- Read [IMPLEMENTATION_FILE] to understand current approach
```

---

## Prompt Best Practices

### Do's ✅

1. **Be Specific**: Provide exact file paths, function names, error messages
2. **Include Context**: Reference relevant files with "Read [file] for..."
3. **Show Examples**: Provide sample input/output
4. **State Constraints**: Mention budget, timeline, tech stack limitations
5. **Request Testing**: Ask for test cases or error handling
6. **Follow Conventions**: Reference existing code for patterns

### Don'ts ❌

1. **Vague Requests**: "Make the app better" → Too broad
2. **No Context**: Claude doesn't know your codebase without context
3. **Skip Error Handling**: Always request error cases
4. **Ignore Standards**: Always ask to follow project conventions
5. **No Testing**: Always request tests or manual test steps

---

## Updating This Library

As you discover effective prompts:

1. Add them to the appropriate category
2. Follow the template structure (Purpose, Template, Example)
3. Include "Required Context" section
4. Commit with: `git commit -m "docs: add [PROMPT_NAME] to prompts library"`

---

**Last Updated**: February 16, 2026
**Prompt Count**: 20
**Next Review**: Month 3 (expand with 10 more prompts)

**Tip**: Bookmark this file in your editor. Use Cmd+F to quickly find prompts by keyword.
