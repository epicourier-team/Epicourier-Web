# Architecture Overview

## Current System Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                     Users (Web Browser)                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    Frontend (React SPA)                      │
│               Development: Vite Dev Server                   │
│               Production: Static Hosting                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                  FastAPI Monolithic Backend                  │
│                         /api/*                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routers: auth.py, users.py                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Services: user_service.py                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Middleware: rate_limit.py, CORS                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Models: SQLAlchemy ORM                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   PostgreSQL       │
                    │  (Production DB)    │
                    │    or SQLite       │
                    │  (Development)     │
                    └────────────────────┘
```

## Future Architecture (Planned)

The system is designed to evolve into a microservices architecture as it scales:

- Separate services for Auth, User, Health, AI
- Redis caching layer
- API Gateway for routing
- Container orchestration with Kubernetes

## Current Implementation

### Frontend Application

- **Technology**: React + TypeScript + Vite
- **Development**: Vite dev server on port 5173
- **Key Components**:
  - `SignupField.tsx` - User registration form with validation
  - `VerifyEmail.tsx` - Email verification flow
  - `Dashboard.tsx` - User dashboard
- **State Management**: React hooks (useState, useEffect)
- **Form Handling**: React Hook Form + Zod validation
- **API Communication**: Fetch API with `/api` proxy

### Backend Application (Monolithic)

- **Technology**: FastAPI + Python 3.11+

- **Development**: Uvicorn server on port 8000

- **Application Structure**:

#### Core Layer

- **`core/config.py`** - Application-wide configurations

- **`core/dependencies.py`** - Dependency injection for database sessions, etc.

#### Data Layer

- **`db/database.py`** - Database connection and session management

- **`models/models.py`** - SQLAlchemy ORM models

- **`schemas/schemas.py`** - Pydantic schemas for validation

#### Service Layer

- **`services/auth_service.py`** - Business logic for authentication

- **`services/user_service.py`** - Business logic for user operations

- **`services/emailer.py`** - Email sending service abstraction

- **`services/emailer_ses.py`** - AWS SES implementation for email sending

#### Utility Layer

- **`utils/auth_util.py`** - Authentication-related utilities (password hashing, token generation)

#### Routers Layer

- **`/api/auth/*`** - Authentication endpoints
  - `POST /api/auth/register` - User registration

  - `GET /api/auth/verify-email/{token}` - Email verification

  - `POST /api/auth/resend-verification` - Resend verification email

#### Middleware

- **Rate Limiting** - 100 requests/minute per IP

- **CORS** - Configured for frontend origins

### Database

- **Development**: SQLite (file-based)
- **Production**: PostgreSQL
- **Migrations**: Alembic
- **Current Tables**:
  ```sql
  users
  ├── id (UUID, PK)
  ├── username (String, unique)
  ├── email (String, unique)
  ├── password_hash (String)
  ├── is_email_verified (Boolean)
  ├── verification_token (String)
  ├── verification_token_expires (DateTime)
  ├── created_at (DateTime)
  └── updated_at (DateTime)
  ```

### Planned Services (Not Yet Implemented)

- **Health Profile Service** - User health data management
- **AI Recommendation Service** - LLM-powered meal suggestions
- **Restaurant Service** - Restaurant and menu data

## Data Flow (Current Implementation)

### User Registration Flow

```
1. User fills form → Frontend validates with Zod
2. Frontend → POST /api/auth/register
3. FastAPI → Validate with Pydantic schemas
4. user_service → Check if email/username exists
5. user_service → Hash password with bcrypt
6. user_service → Generate verification token
7. user_service → Save user to database
8. user_service → Send verification email
9. FastAPI → Return UserResponse
10. Frontend → Navigate to verification page
```

### Email Verification Flow

```
1. User clicks verification link in email
2. Frontend → Navigate to /verify-email?token=xxx
3. VerifyEmail component → GET /api/auth/verify-email/{token}
4. FastAPI → Extract token from URL
5. user_service → Find user by token
6. user_service → Check token expiry
7. user_service → Update is_email_verified = True
8. user_service → Clear verification token
9. FastAPI → Return success message
10. Frontend → Show success and redirect to dashboard
```

### Future Flows (Not Yet Implemented)

- Health Profile Creation
- AI-Powered Recommendations
- Restaurant Discovery
- Meal Planning

## Security Implementation (Current)

### Authentication Method

- **Current**: Email verification tokens (no JWT yet)
- **Password Security**: bcrypt hashing with salt
- **Session Management**: TBD (JWT planned)

### Security Measures

1. **Application Layer**:
   - Password complexity validation (8+ chars, upper/lower/number/special)
   - Rate limiting (100 requests/minute per IP)
   - CORS configured for frontend origin
   - Input sanitization via Pydantic

2. **Data Security**:
   - Passwords hashed with bcrypt
   - Verification tokens expire after 24 hours
   - Sensitive data excluded from API responses

### Planned Security Enhancements

- JWT token authentication
- OAuth2 integration
- Two-factor authentication
- API key management for external integrations

## Database Schema

### Current Tables

**users** table:

- `id` - UUID primary key
- `username` - Unique, 3-20 characters
- `email` - Unique, valid email format
- `password_hash` - Bcrypt hashed password
- `is_email_verified` - Boolean, default False
- `verification_token` - String, nullable
- `verification_token_expires` - DateTime, nullable
- `created_at` - DateTime, auto-generated
- `updated_at` - DateTime, auto-updated

### Planned Tables (Not Yet Implemented)

- `health_profiles` - User health data
- `user_allergies` - Allergen information
- `dietary_restrictions` - Diet preferences
- `restaurants` - Restaurant data
- `menu_items` - Restaurant menus
- `recommendations` - AI-generated suggestions

## Development Setup

### Local Development

```
Local Machine
├── Frontend (http://localhost:5173)
│   └── Vite Dev Server
├── Backend (http://localhost:8000)
│   └── Uvicorn Server
└── Database
    └── SQLite (development.db)
```

### Development Commands

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
uv run fastapi dev src/eatsential/index.py

# Database Migrations
cd backend
alembic upgrade head
```

### Future Production Deployment

- Frontend: Static hosting (Vercel/Netlify/S3+CloudFront)
- Backend: Container deployment (AWS ECS/Google Cloud Run)
- Database: Managed PostgreSQL (AWS RDS/Supabase)

## Current Development Tools

### Testing

- **Frontend**: Vitest + React Testing Library
- **Backend**: Pytest + pytest-asyncio
- **API Testing**: FastAPI TestClient

### Code Quality

- **Linting**: ESLint (frontend), Ruff (backend)
- **Formatting**: Prettier (frontend), Black (backend)
- **Type Checking**: TypeScript (frontend), mypy (backend)

### CI/CD (GitHub Actions)

- **On Push**: Linting, formatting checks
- **On PR**: Full test suite, coverage reports
- **On Merge**: Deploy to staging (planned)

## Environment Variables

### Backend (.env)

```
DATABASE_URL=sqlite:///./development.db
SECRET_KEY=your-secret-key
EMAIL_PROVIDER=console  # or smtp/ses
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
```

### RTO/RPO Targets

- **RTO**: 2 hours (system recovery)
- **RPO**: 1 hour (data loss tolerance)

---

**Key Decisions**:

1. Microservices for scalability
2. PostgreSQL for ACID compliance
3. Redis for performance
4. RAG for accurate AI recommendations
5. AWS for managed infrastructure
