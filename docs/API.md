# Travorier API Documentation

**Version**: v1.0
**Base URL (Production)**: `https://api.travorier.com/api/v1`
**Base URL (Development)**: `http://localhost:8000/api/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Request/Response Format](#requestresponse-format)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [Code Examples](#code-examples)

---

## Authentication

### JWT Token Format

All authenticated requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Lifecycle

- **Access Token**: 1 hour expiry
- **Refresh Token**: 7 days expiry
- **Storage**: Secure storage (iOS Keychain, Android Keystore)

### Getting Tokens

Tokens are obtained via Supabase Auth through:
- Google OAuth: Returns JWT automatically after successful authentication
- Phone OTP: Returns JWT after OTP verification

---

## Endpoints

### Authentication Endpoints

#### POST /auth/signup

Create a new user account with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-02-16T10:30:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_string",
    "expires_in": 3600,
    "expires_at": "2026-02-16T11:30:00Z"
  }
}
```

**Validation Rules**:
- `email`: Valid email format, unique in system
- `password`: Min 8 characters, must include uppercase, lowercase, number
- `full_name`: Min 2 characters, max 100 characters

**Errors**:
- `400 Bad Request`: Email already exists
- `422 Unprocessable Entity`: Validation failed

---

#### POST /auth/login

Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_verified": true,
    "id_verified": false
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_string",
    "expires_in": 3600
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `422 Unprocessable Entity`: Validation failed

---

#### POST /auth/google

Google OAuth callback (handled by Supabase Auth).

**Request**: Redirect to Supabase OAuth endpoint
**Response**: JWT token in URL parameters or session cookie

---

#### POST /auth/otp/send

Send OTP to phone number for verification.

**Request Body**:
```json
{
  "phone": "+919876543210"
}
```

**Response** (200 OK):
```json
{
  "message": "OTP sent successfully",
  "phone": "+919876543210",
  "expires_in": 300
}
```

**Validation Rules**:
- `phone`: Valid format (+91 or +971), 10-13 digits

**Errors**:
- `400 Bad Request`: Invalid phone format
- `429 Too Many Requests`: Rate limit exceeded (max 3 OTPs per hour per phone)

---

#### POST /auth/otp/verify

Verify OTP code.

**Request Body**:
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "verified": true,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_string",
    "expires_in": 3600
  }
}
```

**Validation Rules**:
- `otp`: 6-digit numeric code
- Must be verified within 5 minutes of sending

**Errors**:
- `400 Bad Request`: Invalid or expired OTP
- `401 Unauthorized`: OTP verification failed

---

#### GET /auth/me

Get current authenticated user information.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "phone": "+919876543210",
  "full_name": "John Doe",
  "avatar_url": "https://storage.supabase.co/avatars/user.jpg",
  "email_verified": true,
  "phone_verified": true,
  "id_verified": false,
  "id_verification_status": "pending",
  "trust_score": 75,
  "total_deliveries": 12,
  "successful_deliveries": 11,
  "average_rating": 4.6,
  "frequent_flyer": true,
  "credit_balance": 5,
  "user_types": ["traveler", "sender"],
  "created_at": "2026-01-15T08:00:00Z"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

### User Endpoints

#### GET /users/{id}

Get user profile by ID.

**Authentication**: Optional (public profiles)

**Path Parameters**:
- `id` (UUID): User ID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "avatar_url": "https://storage.supabase.co/avatars/user.jpg",
  "trust_score": 85,
  "average_rating": 4.7,
  "total_deliveries": 23,
  "successful_deliveries": 22,
  "frequent_flyer": true,
  "verified_badges": {
    "email_verified": true,
    "phone_verified": true,
    "id_verified": true
  },
  "member_since": "2025-11-01T00:00:00Z"
}
```

**Errors**:
- `404 Not Found`: User does not exist

---

#### PATCH /users/{id}

Update user profile.

**Authentication**: Required (can only update own profile)

**Path Parameters**:
- `id` (UUID): User ID (must match authenticated user)

**Request Body** (all fields optional):
```json
{
  "full_name": "John Updated Doe",
  "avatar_url": "https://storage.supabase.co/avatars/new.jpg"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Updated Doe",
  "avatar_url": "https://storage.supabase.co/avatars/new.jpg",
  "updated_at": "2026-02-16T10:30:00Z"
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Cannot update another user's profile
- `422 Unprocessable Entity`: Validation failed

---

#### POST /users/verification/id

Submit ID document for manual verification.

**Authentication**: Required

**Request Body** (multipart/form-data):
```
id_document: <file> (JPEG/PNG, max 5MB)
selfie: <file> (JPEG/PNG, max 5MB)
```

**Response** (201 Created):
```json
{
  "verification_id": "verification-uuid",
  "status": "pending",
  "message": "ID verification submitted. Will be reviewed within 24-48 hours.",
  "submitted_at": "2026-02-16T10:30:00Z"
}
```

**Errors**:
- `400 Bad Request`: File too large or invalid format
- `409 Conflict`: Verification already pending or approved

---

#### GET /users/{id}/reviews

Get reviews for a user.

**Authentication**: Optional

**Path Parameters**:
- `id` (UUID): User ID

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 50)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "review-uuid",
      "reviewer": {
        "id": "reviewer-uuid",
        "full_name": "Jane Smith",
        "avatar_url": "https://..."
      },
      "rating": 5,
      "review_text": "Excellent service! Very professional and punctual.",
      "reviewer_role": "sender",
      "pnr_verified_trip": true,
      "created_at": "2026-02-10T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

#### GET /users/{id}/stats

Get user statistics (trust score, deliveries, etc.).

**Authentication**: Optional

**Response** (200 OK):
```json
{
  "trust_score": 85,
  "total_deliveries": 23,
  "successful_deliveries": 22,
  "completion_rate": 95.7,
  "average_rating": 4.7,
  "frequent_flyer": true,
  "verified_trips": 18,
  "ratings_breakdown": {
    "5_star": 18,
    "4_star": 3,
    "3_star": 1,
    "2_star": 0,
    "1_star": 1
  }
}
```

---

### Trip Endpoints

#### POST /trips

Create a new trip listing.

**Authentication**: Required (phone verified)

**Request Body**:
```json
{
  "origin_city": "Mumbai",
  "origin_country": "India",
  "destination_city": "Dubai",
  "destination_country": "UAE",
  "departure_date": "2026-03-15",
  "departure_time": "14:30:00",
  "arrival_date": "2026-03-15",
  "arrival_time": "17:00:00",
  "flight_number": "AI995",
  "airline": "Air India",
  "available_weight_kg": 15.5,
  "price_per_kg": 600.00,
  "notes": "Can deliver in Dubai Marina area within 2 hours of landing"
}
```

**Response** (201 Created):
```json
{
  "id": "trip-uuid",
  "traveler_id": "user-uuid",
  "status": "draft",
  "origin_city": "Mumbai",
  "destination_city": "Dubai",
  "departure_date": "2026-03-15",
  "departure_time": "14:30:00",
  "available_weight_kg": 15.5,
  "price_per_kg": 600.00,
  "pnr_verified": false,
  "created_at": "2026-02-16T10:30:00Z"
}
```

**Validation Rules**:
- `available_weight_kg`: 0.1 - 30.0
- `price_per_kg`: 100 - 5000
- `departure_date`: Must be future date
- `origin_city` & `destination_city`: Must be different

**Errors**:
- `403 Forbidden`: Phone not verified
- `422 Unprocessable Entity`: Validation failed

---

#### GET /trips

Search trips with filters.

**Authentication**: Optional

**Query Parameters**:
- `origin_city` (string): Filter by origin
- `destination_city` (string): Filter by destination
- `departure_date_gte` (date): Min departure date
- `departure_date_lte` (date): Max departure date
- `price_max` (decimal): Max price per kg
- `weight_min` (decimal): Min available weight
- `verified_only` (boolean): PNR verified trips only
- `sort` (string): Sort field (`-created_at`, `departure_date`, `price_per_kg`, `-trust_score`)
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 50)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "trip-uuid",
      "traveler": {
        "id": "user-uuid",
        "full_name": "Rajesh Kumar",
        "avatar_url": "https://...",
        "trust_score": 90,
        "frequent_flyer": true,
        "verified_badges": {
          "id_verified": true,
          "pnr_verified": true
        }
      },
      "origin_city": "Mumbai",
      "destination_city": "Dubai",
      "departure_date": "2026-03-15",
      "departure_time": "14:30:00",
      "airline": "Air India",
      "available_weight_kg": 15.5,
      "price_per_kg": 600.00,
      "pnr_verified": true,
      "is_boosted": false,
      "created_at": "2026-02-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 87,
    "total_pages": 5
  }
}
```

---

#### GET /trips/{id}

Get trip details by ID.

**Authentication**: Optional

**Response** (200 OK):
```json
{
  "id": "trip-uuid",
  "traveler": {
    "id": "user-uuid",
    "full_name": "Rajesh Kumar",
    "avatar_url": "https://...",
    "trust_score": 90,
    "average_rating": 4.8,
    "total_deliveries": 45,
    "frequent_flyer": true
  },
  "origin_city": "Mumbai",
  "origin_country": "India",
  "destination_city": "Dubai",
  "destination_country": "UAE",
  "departure_date": "2026-03-15",
  "departure_time": "14:30:00",
  "arrival_date": "2026-03-15",
  "arrival_time": "17:00:00",
  "flight_number": "AI995",
  "airline": "Air India",
  "available_weight_kg": 15.5,
  "price_per_kg": 600.00,
  "notes": "Can deliver in Dubai Marina area",
  "status": "active",
  "pnr_verified": true,
  "is_boosted": false,
  "created_at": "2026-02-10T08:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Trip does not exist

---

#### PATCH /trips/{id}

Update trip details.

**Authentication**: Required (trip owner only)

**Request Body** (all fields optional):
```json
{
  "available_weight_kg": 12.0,
  "price_per_kg": 550.00,
  "notes": "Updated: Can deliver in Dubai Marina or JLT"
}
```

**Response** (200 OK):
```json
{
  "id": "trip-uuid",
  "available_weight_kg": 12.0,
  "price_per_kg": 550.00,
  "notes": "Updated: Can deliver in Dubai Marina or JLT",
  "updated_at": "2026-02-16T10:30:00Z"
}
```

**Errors**:
- `403 Forbidden`: Not trip owner
- `404 Not Found`: Trip does not exist

---

#### DELETE /trips/{id}

Cancel a trip (soft delete).

**Authentication**: Required (trip owner only)

**Response** (204 No Content)

**Errors**:
- `403 Forbidden`: Not trip owner or trip has active matches
- `404 Not Found`: Trip does not exist

---

#### POST /trips/{id}/verify-pnr

Upload boarding pass for PNR verification.

**Authentication**: Required (trip owner only)

**Request Body** (multipart/form-data):
```
boarding_pass: <file> (JPEG/PNG/PDF, max 5MB)
pnr_code: "ABC123" (string, optional)
```

**Response** (200 OK):
```json
{
  "trip_id": "trip-uuid",
  "pnr_verification_status": "pending",
  "boarding_pass_url": "https://storage.supabase.co/boarding-passes/...",
  "message": "PNR verification submitted. Will be reviewed within 24 hours."
}
```

---

### Match Endpoints

#### POST /matches

Create a match between sender and trip.

**Authentication**: Required

**Request Body**:
```json
{
  "trip_id": "trip-uuid",
  "request_id": "request-uuid" // optional
}
```

**Response** (201 Created):
```json
{
  "id": "match-uuid",
  "trip_id": "trip-uuid",
  "request_id": "request-uuid",
  "traveler_id": "traveler-uuid",
  "sender_id": "sender-uuid",
  "status": "initiated",
  "contact_unlocked": false,
  "created_at": "2026-02-16T10:30:00Z"
}
```

---

#### GET /matches

List user's matches.

**Authentication**: Required

**Query Parameters**:
- `status` (string): Filter by status
- `page` (int): Page number
- `per_page` (int): Items per page

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "match-uuid",
      "trip": {
        "origin_city": "Mumbai",
        "destination_city": "Dubai",
        "departure_date": "2026-03-15"
      },
      "traveler": {
        "id": "user-uuid",
        "full_name": "Rajesh Kumar",
        "avatar_url": "https://..."
      },
      "sender": {
        "id": "user-uuid",
        "full_name": "Priya Sharma"
      },
      "status": "agreed",
      "contact_unlocked": true,
      "created_at": "2026-02-14T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

#### POST /matches/{id}/unlock

Pay ₹99 (or use 1 credit) to unlock contact.

**Authentication**: Required (sender only)

**Request Body**:
```json
{
  "payment_method": "credit" // or "stripe"
}
```

**Response** (200 OK):
```json
{
  "match_id": "match-uuid",
  "contact_unlocked": true,
  "traveler_contact": {
    "phone": "+971501234567",
    "email": "traveler@example.com"
  },
  "transaction_id": "transaction-uuid",
  "credits_remaining": 4
}
```

**Errors**:
- `400 Bad Request`: Insufficient credits
- `409 Conflict`: Contact already unlocked

---

#### POST /matches/{id}/qr

Generate delivery QR code.

**Authentication**: Required (traveler only, after inspection approved)

**Response** (200 OK):
```json
{
  "match_id": "match-uuid",
  "qr_code": "TRVR-ABC123-XYZ789",
  "qr_code_url": "https://api.travorier.com/qr/TRVR-ABC123-XYZ789.png",
  "expires_at": null
}
```

---

#### POST /matches/{id}/scan-qr

Scan QR code to complete delivery.

**Authentication**: Required (traveler only)

**Request Body**:
```json
{
  "qr_code": "TRVR-ABC123-XYZ789"
}
```

**Response** (200 OK):
```json
{
  "match_id": "match-uuid",
  "status": "delivered",
  "delivered_at": "2026-03-15T18:30:00Z",
  "message": "Delivery confirmed successfully!"
}
```

**Errors**:
- `400 Bad Request`: Invalid QR code
- `409 Conflict`: QR already scanned

---

### Payment Endpoints

#### POST /payments/create-intent

Create Stripe payment intent.

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 99.00,
  "currency": "INR",
  "type": "contact_unlock", // or "credit_purchase", "listing_fee"
  "metadata": {
    "match_id": "match-uuid"
  }
}
```

**Response** (200 OK):
```json
{
  "client_secret": "pi_..._secret_...",
  "payment_intent_id": "pi_...",
  "amount": 99.00,
  "currency": "INR"
}
```

---

#### POST /payments/webhook

Stripe webhook handler (called by Stripe).

**Headers**:
```
Stripe-Signature: stripe_signature_here
```

**Request Body**: Stripe event object

**Response** (200 OK):
```json
{
  "received": true
}
```

---

#### GET /payments/credits

Get user's credit balance.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total_credits": 8,
  "credits": [
    {
      "id": "credit-uuid",
      "credits_remaining": 5,
      "credits_original": 5,
      "purchased_at": "2026-01-15T10:00:00Z",
      "expires_at": "2027-01-15T10:00:00Z",
      "expired": false
    },
    {
      "id": "credit-uuid-2",
      "credits_remaining": 3,
      "credits_original": 10,
      "purchased_at": "2026-02-01T12:00:00Z",
      "expires_at": "2027-02-01T12:00:00Z",
      "expired": false
    }
  ]
}
```

---

#### POST /payments/buy-credits

Purchase credit pack.

**Authentication**: Required

**Request Body**:
```json
{
  "pack_size": 5, // 1, 5, or 10
  "payment_method_id": "pm_..." // Stripe payment method ID
}
```

**Response** (200 OK):
```json
{
  "transaction_id": "transaction-uuid",
  "credits_purchased": 5,
  "amount_paid": 445.00,
  "discount_percentage": 10,
  "expires_at": "2027-02-16T10:30:00Z",
  "new_balance": 13
}
```

---

#### GET /payments/transactions

Get transaction history.

**Authentication**: Required

**Query Parameters**:
- `type` (string): Filter by transaction type
- `page` (int): Page number
- `per_page` (int): Items per page

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "transaction_type": "contact_unlock",
      "amount": 99.00,
      "currency": "INR",
      "payment_status": "succeeded",
      "created_at": "2026-02-16T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

## Request/Response Format

### Standard Response Envelope

All successful responses follow this format:

```json
{
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-02-16T10:30:00Z",
    "request_id": "req-550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Pagination

List endpoints return paginated results:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Query Parameters for Filtering

- Equality: `?field=value`
- Greater than: `?field_gte=value`
- Less than: `?field_lte=value`
- In list: `?field_in=val1,val2`
- Sort ascending: `?sort=field`
- Sort descending: `?sort=-field`

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request format/data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate, state mismatch) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance mode |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "price_per_kg",
        "message": "Must be between 100 and 5000"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-16T10:30:00Z",
    "request_id": "req-uuid"
  }
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `INSUFFICIENT_CREDITS` | 400 | Not enough credits for operation |
| `PAYMENT_FAILED` | 400 | Stripe payment failed |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `PHONE_NOT_VERIFIED` | 403 | Phone verification required |
| `ID_NOT_VERIFIED` | 403 | ID verification required |
| `CONTACT_ALREADY_UNLOCKED` | 409 | Contact already unlocked |
| `INVALID_QR_CODE` | 400 | QR code invalid or expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

---

## Rate Limiting

### Limits (MVP)

- **Authenticated users**: 100 requests per minute
- **Unauthenticated users**: 20 requests per minute
- **OTP sending**: 3 OTPs per hour per phone number

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1645012345
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retry_after": 30
  }
}
```

---

## Code Examples

### TypeScript/React Native

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.travorier.com/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Search trips
const searchTrips = async (origin: string, destination: string) => {
  const response = await api.get('/trips', {
    params: {
      origin_city: origin,
      destination_city: destination,
      departure_date_gte: '2026-03-01',
      verified_only: true,
      sort: 'departure_date'
    }
  });
  return response.data.data;
};

// Unlock contact
const unlockContact = async (matchId: string) => {
  const response = await api.post(`/matches/${matchId}/unlock`, {
    payment_method: 'credit'
  });
  return response.data;
};
```

### Python (Backend Testing)

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "user@example.com", "password": "password123"}
)
token = response.json()["session"]["access_token"]

headers = {"Authorization": f"Bearer {token}"}

# Create trip
trip_data = {
    "origin_city": "Mumbai",
    "destination_city": "Dubai",
    "departure_date": "2026-03-15",
    "departure_time": "14:30:00",
    "available_weight_kg": 15.5,
    "price_per_kg": 600.00
}

response = requests.post(
    f"{BASE_URL}/trips",
    json=trip_data,
    headers=headers
)

trip = response.json()
print(f"Trip created: {trip['id']}")
```

---

## Testing

### Test Environment

**Base URL**: `http://localhost:8000/api/v1`

### Test Credentials

**Email**: `test@travorier.com`
**Password**: `TestPassword123!`

### Stripe Test Cards

| Scenario | Card Number | Behavior |
|----------|-------------|----------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient Funds | 4000 0000 0000 9995 | Insufficient funds |

**Expiry**: Any future date (e.g., 12/28)
**CVC**: Any 3 digits (e.g., 123)

---

## Versioning

### Current Version

- **v1** (Current, stable)

### Version in URL

All endpoints prefixed with `/api/v1/`

### Breaking Changes Policy

- New versions released for breaking changes only
- Old versions supported for minimum 6 months
- Deprecation notices sent via response headers:

```http
X-API-Deprecated: true
X-API-Deprecation-Date: 2026-12-31
X-API-Sunset-Date: 2027-06-30
```

---

## Support

- **API Documentation**: https://docs.travorier.com
- **Status Page**: https://status.travorier.com
- **Developer Email**: dev@travorier.com
- **GitHub Issues**: https://github.com/deepakdevp/travorier/issues

---

**Last Updated**: February 16, 2026
**Maintained By**: Deepak Panwar
