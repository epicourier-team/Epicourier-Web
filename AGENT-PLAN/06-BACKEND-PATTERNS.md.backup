# Backend Patterns

## Project Structure (Actual Implementation)

```
backend/
├── src/
│   └── eatsential/
│       ├── __init__.py
│       ├── index.py           # FastAPI app entry point
│       ├── db/
│       │   └── database.py    # Database configuration
│       ├── models/
│       │   └── models.py      # SQLAlchemy models
│       ├── schemas/
│       │   └── schemas.py     # Pydantic schemas
│       ├── services/
│       │   ├── __init__.py
│       │   ├── auth_service.py # Authentication business logic
│       │   ├── user_service.py # User business logic
│       │   ├── health_service.py # Health profile business logic
│       │   ├── emailer.py     # Email service abstraction
│       │   └── emailer_ses.py # AWS SES implementation
│       ├── utils/
│       │   └── auth_util.py   # Authentication utilities
│       ├── middleware/
│       │   ├── __init__.py
│       │   └── rate_limit.py  # Rate limiting middleware
│       └── routers/
│           ├── __init__.py
│           ├── auth.py        # Authentication endpoints
│           ├── users.py       # User endpoints
│           └── health.py      # Health profile endpoints
├── alembic/                   # Database migrations
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_index.py
│   ├── test_verification.py
│   └── health/
│       ├── conftest.py
│       ├── test_allergies.py
│       ├── test_dietary_preferences.py
│       └── test_profile.py
├── pyproject.toml             # Project dependencies
└── README.md
```

## API Endpoint Pattern

```python
# From health.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..db.database import get_db
from ..schemas.schemas import HealthProfileResponse, HealthProfileCreate
from ..services.health_service import HealthProfileService
from ..services.auth_service import get_current_user
from ..models.models import UserDB

router = APIRouter(prefix="/health", tags=["health"])

SessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[UserDB, Depends(get_current_user)]

@router.post("/profile", response_model=HealthProfileResponse, status_code=201)
async def create_health_profile(
    profile_data: HealthProfileCreate,
    current_user: CurrentUserDep,
    db: SessionDep,
):
    """Create a new health profile for the current user."""
    try:
        service = HealthProfileService(db)
        health_profile = service.create_health_profile(current_user.id, profile_data)
        return health_profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        print(f"Error creating health profile: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the health profile",
        ) from e
```

## Pydantic Schemas

```python
# From schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

from ..models.models import (
    ActivityLevel,
    AllergySeverity,
    PreferenceReason,
    PreferenceType,
)

class HealthProfileCreate(BaseModel):
    """Schema for creating a health profile"""

    height_cm: Optional[Annotated[float, Field(gt=0, lt=300)]] = None
    weight_kg: Optional[Annotated[float, Field(gt=0, lt=500)]] = None
    activity_level: Optional[ActivityLevel] = None
    metabolic_rate: Optional[int] = None


class HealthProfileUpdate(BaseModel):
    """Schema for updating a health profile"""

    height_cm: Optional[Annotated[float, Field(gt=0, lt=300)]] = None
    weight_kg: Optional[Annotated[float, Field(gt=0, lt=500)]] = None
    activity_level: Optional[ActivityLevel] = None
    metabolic_rate: Optional[int] = None


class HealthProfileResponse(BaseModel):
    """Schema for health profile response"""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    metabolic_rate: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    allergies: list[UserAllergyResponse] = []
    dietary_preferences: list[DietaryPreferenceResponse] = []
```

## Service Layer Pattern (Actual Implementation)

```python
# From health_service.py
from typing import Optional
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..models.models import (
    AllergenDB,
    DietaryPreferenceDB,
    HealthProfileDB,
    UserAllergyDB,
)
from ..schemas.schemas import (
    DietaryPreferenceCreate,
    DietaryPreferenceUpdate,
    HealthProfileCreate,
    HealthProfileUpdate,
    UserAllergyCreate,
    UserAllergyUpdate,
)

class HealthProfileService:
    """Service class for health profile operations"""

    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db

    def create_health_profile(
        self, user_id: str, profile_data: HealthProfileCreate
    ) -> HealthProfileDB:
        """Create a new health profile for a user."""
        existing = self.get_health_profile(user_id)
        if existing:
            raise ValueError("Health profile already exists for this user")

        health_profile = HealthProfileDB(
            id=str(uuid4()),
            user_id=user_id,
            **profile_data.dict(),
        )

        self.db.add(health_profile)
        self.db.commit()
        self.db.refresh(health_profile)

        return health_profile
```

## Database Models (Actual Implementation)

```python
# From models.py
from sqlalchemy import Boolean, Column, DateTime, String, Enum, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base
import uuid
from datetime import datetime, timezone

def utcnow():
    """Return current UTC time as naive datetime (UTC)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class HealthProfileDB(Base):
    """SQLAlchemy model for health profile table"""

    __tablename__ = "health_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Biometric Data
    height_cm: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    activity_level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    metabolic_rate: Mapped[Optional[int]] = mapped_column(String, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    # Relationships
    user: Mapped["UserDB"] = relationship("UserDB", back_populates="health_profile")
    allergies: Mapped[list["UserAllergyDB"]] = relationship(
        "UserAllergyDB", back_populates="health_profile", cascade="all, delete-orphan"
    )
    dietary_preferences: Mapped[list["DietaryPreferenceDB"]] = relationship(
        "DietaryPreferenceDB",
        back_populates="health_profile",
        cascade="all, delete-orphan",
    )
```

## Testing Patterns

```python
# tests/health/test_profile.py
from fastapi.testclient import TestClient

def test_create_health_profile(client: TestClient, auth_headers: dict[str, str]):
    """Test creating a new health profile."""
    response = client.post(
        "/api/health/profile",
        headers=auth_headers,
        json={"height_cm": 180, "weight_kg": 75, "activity_level": "moderate"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["height_cm"] == 180
    assert data["weight_kg"] == 75
    assert data["activity_level"] == "moderate"
```
