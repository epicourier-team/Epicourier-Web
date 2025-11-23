# Database Design

**⚠️ Note**: This is a quick reference for AI agents. For detailed database schema and design decisions, see:

- **Comprehensive Database Docs**: `/docs/2-DESIGN/database-design.md`
- **Actual Schema**: `/backend/src/eatsential/models/models.py`
- **Migrations**: `/backend/alembic/versions/`

---

## Current Schema (Implemented)

### Database Configuration

- **Development**: SQLite (`development.db`)
- **Production**: PostgreSQL (configured via `DATABASE_URL`)
- **ORM**: SQLAlchemy 2.0.36
- **Migrations**: Alembic

### Core Tables

#### ✅ users

- `id` (UUID string, PK)
- `username` (VARCHAR(20), unique, indexed)
- `email` (VARCHAR(255), unique, indexed, case-insensitive)
- `password_hash` (VARCHAR, bcrypt)
- `account_status` (ENUM: pending/verified/suspended)
- `email_verified` (BOOLEAN)
- `verification_token` (UUID, indexed)
- `verification_token_expires` (TIMESTAMP)
- `role` (ENUM: user/admin, indexed)
- `created_at`, `updated_at` (TIMESTAMP)

#### ✅ health_profiles

- `id` (UUID string, PK)
- `user_id` (FK → users.id, unique, CASCADE delete)
- `height_cm` (NUMERIC(5,2))
- `weight_kg` (NUMERIC(5,2))
- `activity_level` (ENUM: sedentary/light/moderate/active/very_active)
- `metabolic_rate` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

**Relationship**: One-to-one with users

#### ✅ allergen_database

Master allergen list:

- `id` (UUID string, PK)
- `name` (VARCHAR(100), unique)
- `category` (VARCHAR(50))
- `is_major_allergen` (BOOLEAN)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

#### ✅ user_allergies

- `id` (UUID string, PK)
- `health_profile_id` (FK → health_profiles.id, CASCADE delete)
- `allergen_id` (FK → allergen_database.id)
- `severity` (ENUM: mild/moderate/severe/life_threatening)
- `diagnosed_date` (DATE)
- `reaction_type` (VARCHAR(50))
- `notes` (TEXT)
- `is_verified` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**Relationship**: Many-to-many between health_profiles and allergen_database

#### ✅ dietary_preferences

- `id` (UUID string, PK)
- `health_profile_id` (FK → health_profiles.id, CASCADE delete)
- `preference_type` (ENUM: diet/cuisine/ingredient/preparation)
- `preference_name` (VARCHAR(100))
- `is_strict` (BOOLEAN)
- `reason` (VARCHAR(50))
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

---

## Quick Reference

### Common Queries

```python
# Get user with health profile
user = db.query(UserDB).filter(UserDB.id == user_id).first()
health_profile = user.health_profile  # Relationship loaded

# Get health profile with allergies and preferences
profile = db.query(HealthProfileDB)\
    .options(joinedload(HealthProfileDB.allergies))\
    .options(joinedload(HealthProfileDB.dietary_preferences))\
    .filter(HealthProfileDB.user_id == user_id)\
    .first()

# Find allergen by name
allergen = db.query(AllergenDB)\
    .filter(AllergenDB.name.ilike(allergen_name))\
    .first()
```

### Running Migrations

```bash
# Apply all migrations
cd backend
source .venv/bin/activate
arch -x86_64 python -m alembic upgrade head

# Create new migration
arch -x86_64 python -m alembic revision --autogenerate -m "description"
```

```bash
# Create a new migration
cd backend
alembic revision --autogenerate -m "Add users table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Future Tables (Planned)

#### health_profiles

- User health information
- Linked to users table via foreign key

#### user_allergies

- Many-to-many relationship
- Severity levels: MILD, MODERATE, SEVERE, LIFE_THREATENING

#### dietary_restrictions

- User dietary preferences
- Categories: vegetarian, vegan, kosher, halal, etc.

#### restaurants

- Restaurant information
- Location data

#### menu_items

- Restaurant menu items
- Ingredient lists

#### recommendations

- AI-generated meal suggestions
- Safety scores based on user allergies

---

**See actual implementation**:

- Models: `backend/src/eatsential/models.py`
- Database config: `backend/src/eatsential/database.py`
- Migrations: `backend/alembic/versions/`
