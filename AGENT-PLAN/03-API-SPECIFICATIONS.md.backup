# API Specifications

**⚠️ Note**: This is a quick reference for AI agents. For detailed API documentation, see:

- **Comprehensive API Docs**: `/docs/2-DESIGN/api-design.md`
- **Implementation Status**: `/docs/3-IMPLEMENTATION/implementation-status.md`

---

## Base URL

```
Development: http://localhost:8000/api
Production: https://api.eatsential.com/api
```

## ✅ Implemented Endpoints

### Health Check

```
GET /api
```

### Authentication

- `POST /api/auth/register` - ✅ Create new user account
- `POST /api/auth/login` - ✅ User login with JWT token
- `GET /api/auth/verify-email/{token}` - ✅ Verify email address
- `POST /api/auth/resend-verification` - ✅ Resend verification email

### User Management

- `GET /api/users/me` - ✅ Get current user profile

### Health Profile

- `POST /api/health/profile` - ✅ Create health profile
- `GET /api/health/profile` - ✅ Get user's health profile
- `PUT /api/health/profile` - ✅ Update health profile
- `DELETE /api/health/profile` - ✅ Delete health profile

### Allergy Management

- `GET /api/health/allergens` - ✅ List all available allergens
- `GET /api/health/allergies` - ✅ Get user's allergies
- `POST /api/health/allergies` - ✅ Add allergy
- `PUT /api/health/allergies/{id}` - ✅ Update allergy
- `DELETE /api/health/allergies/{id}` - ✅ Remove allergy

### Dietary Preferences

- `GET /api/health/dietary-preferences` - ✅ Get user's preferences
- `POST /api/health/dietary-preferences` - ✅ Add preference
- `PUT /api/health/dietary-preferences/{id}` - ✅ Update preference
- `DELETE /api/health/dietary-preferences/{id}` - ✅ Remove preference

---

## ❌ Not Yet Implemented

### Authentication

- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout and invalidate token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### User Management

- `PUT /api/users/me` - Update user profile
- `DELETE /api/users/me` - Delete user account

### Meal Recommendations

- `GET /api/recommendations` - Get AI-powered meal recommendations
- `POST /api/recommendations/feedback` - Submit feedback

---

## Quick Examples

### Register + Login Flow

```bash
# 1. Register
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# 2. Verify email (check inbox for token)
GET /api/auth/verify-email/{token}

# 3. Login
POST /api/auth/login
{
  "username_or_email": "johndoe",
  "password": "SecurePass123!"
}
# Returns: { "access_token": "eyJ...", "has_completed_wizard": false }

# 4. Use token in headers
Authorization: Bearer eyJ...
```

### Create Health Profile

```bash
# Create profile
POST /api/health/profile
Authorization: Bearer {token}
{
  "height_cm": 175.5,
  "weight_kg": 70.0,
  "activity_level": "moderate"
}

# Add allergy
POST /api/health/allergies
Authorization: Bearer {token}
{
  "allergen_name": "Peanuts",
  "severity": "severe",
  "notes": "Anaphylaxis risk"
}

# Add dietary preference
POST /api/health/dietary-preferences
Authorization: Bearer {token}
{
  "preference_type": "diet",
  "preference_name": "vegetarian",
  "is_strict": true
}
```
