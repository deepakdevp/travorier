# Travorier Backend API

FastAPI backend for the Travorier platform.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload
```

API will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/          # API endpoints
│   ├── core/            # Config, security, dependencies
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── main.py          # FastAPI app
├── tests/               # Tests
├── requirements.txt     # Python dependencies
└── vercel.json         # Vercel deployment config
```

## API Endpoints

See `/docs` for interactive API documentation (Swagger UI).

### Authentication
- `POST /api/v1/auth/signup` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/otp/send` - Send OTP
- `POST /api/v1/auth/otp/verify` - Verify OTP
- `GET /api/v1/auth/me` - Current user

## Deployment

### Vercel

```bash
vercel login
vercel
```

### Manual

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Testing

```bash
pytest
```

## Code Quality

```bash
# Format code
black .

# Lint
flake8 .

# Type check
mypy .
```
