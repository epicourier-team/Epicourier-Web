# Testing Strategy

## Test Pyramid

```
         /\
        /E2E\       5%  - Critical user flows
       /------\
      /  API   \    15% - Integration tests
     /----------\
    /   Unit     \  80% - Component/function tests
   /--------------\
```

## Coverage Requirements

- **Overall**: 80% minimum
- **Critical paths**: 95% (auth, allergen safety)
- **New code**: 90% minimum

## Frontend Testing

### Unit Tests (Vitest) - Current Implementation

```typescript
// From SignupField.test.tsx
describe('SignupField', () => {
  it('renders all form fields', () => {
    render(<SignupField />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    render(<SignupField />);

    const passwordInput = screen.getByLabelText(/password/i);

    // Test weak password
    await userEvent.type(passwordInput, 'weak');
    await userEvent.tab();

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows success message on successful registration', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        message: 'Success!'
      }),
    });

    render(<SignupField />);

    // Fill form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'TestPass123!');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
  });
});
```

### Integration Tests

```typescript
// API integration test
describe('User Registration Flow', () => {
  it('should register user and show email verification message', async () => {
    // Mock API
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(ctx.status(201), ctx.json({
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          message: 'Success! Please check your email for verification instructions.'
        }));
      })
    );

    // Test flow
    render(<App />);

    // Navigate to signup
    await userEvent.click(screen.getByText(/sign up/i));

    // Fill form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'TestPass123!');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Verify redirect to verification page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/verify-email');
    });
  });
});
```

### E2E Tests (Playwright) - Current Flows

```typescript
test('complete user registration and email verification', async ({ page }) => {
  // Register user
  await page.goto('/signup');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');

  // Should redirect to email verification page
  await expect(page).toHaveURL('/verify-email');
  await expect(page.locator('h1')).toContainText('Verify Your Email');

  // Simulate clicking verification link
  const verificationToken = 'test-token-123';
  await page.goto(`/verify-email?token=${verificationToken}`);

  // Should show success message
  await expect(page.locator('.success-message')).toContainText('Email verified successfully!');

  // Should redirect to dashboard after delay
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL('/dashboard');
});

// Future test: Health profile setup
test.skip('complete health profile setup', async ({ page }) => {
  // To be implemented when health profile feature is ready
  await page.click('button:has-text("Save Profile")');
  await expect(page).toHaveURL('/dashboard');
});
```

## Backend Testing

### Unit Tests (Pytest)

```python
def test_password_validation():
    """Test password meets requirements."""
    from app.schemas.user import UserCreate

    # Valid password
    user = UserCreate(
        email="test@example.com",
        username="testuser",
        password="TestPass123!"
    )
    assert user.password == "TestPass123!"

    # Invalid password (no special char)
    with pytest.raises(ValueError, match="must contain"):
        UserCreate(
            email="test@example.com",
            username="testuser",
            password="TestPass123"
        )

def test_allergen_validation():
    """Test allergen validation against approved list."""
    from app.services.health import validate_allergen

    # Valid allergen
    assert validate_allergen("Peanuts") == True

    # Invalid allergen
    with pytest.raises(ValueError, match="Invalid allergen"):
        validate_allergen("InvalidAllergen")
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_health_profile_creation(client: AsyncClient, auth_headers):
    """Test creating health profile with allergies."""
    response = await client.post(
        "/api/v1/users/me/health-profile",
        headers=auth_headers,
        json={
            "allergies": [
                {"name": "Peanuts", "severity": "SEVERE"},
                {"name": "Shellfish", "severity": "MODERATE"}
            ],
            "dietary_restrictions": ["Vegan"],
            "medical_conditions": ["Diabetes Type 2"]
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert len(data["allergies"]) == 2
    assert data["allergies"][0]["severity"] == "SEVERE"

@pytest.mark.asyncio
async def test_allergen_safety_check(client: AsyncClient, auth_headers):
    """Test that invalid allergens are rejected."""
    response = await client.post(
        "/api/v1/users/me/health-profile",
        headers=auth_headers,
        json={
            "allergies": [
                {"name": "InvalidAllergen", "severity": "MILD"}
            ]
        }
    )

    assert response.status_code == 400
    assert "Invalid allergen" in response.json()["detail"]
```

### Load Tests (Locust)

```python
from locust import HttpUser, task, between

class EatsentialUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login before running tasks."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123!"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_recommendations(self):
        """Most common operation."""
        self.client.get("/api/v1/recommendations", headers=self.headers)

    @task(1)
    def update_health_profile(self):
        """Less frequent operation."""
        self.client.put(
            "/api/v1/users/me/health-profile",
            headers=self.headers,
            json={"dietary_restrictions": ["Gluten-Free"]}
        )
```

## Test Data Management

### Fixtures

```python
# conftest.py
@pytest.fixture
def test_user():
    """Standard test user."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPass123!"
    }

@pytest.fixture
def allergen_test_data():
    """Approved allergen test data."""
    return [
        {"name": "Peanuts", "severity": "SEVERE"},
        {"name": "Tree Nuts", "severity": "MODERATE"},
        {"name": "Milk", "severity": "MILD"},
        {"name": "Eggs", "severity": "MILD"},
    ]

@pytest.fixture
async def authenticated_user(client: AsyncClient, test_user):
    """Create and authenticate a test user."""
    # Register
    await client.post("/api/v1/auth/register", json=test_user)

    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

## Critical Test Scenarios

### 1. Allergen Safety Tests (MANDATORY)

```python
# Must test ALL of these scenarios
- Reject invalid allergens
- Warn on severe allergies
- Prevent allergen in recommendations
- Cross-contamination warnings
- Multiple allergen combinations
```

### 2. Authentication Security

```python
# Test these attack vectors
- SQL injection in login
- XSS in user inputs
- JWT token manipulation
- Password brute force protection
- Session hijacking prevention
```

### 3. Data Integrity

```python
# Ensure data consistency
- Profile updates are atomic
- Concurrent update handling
- Cascade deletes work correctly
- No orphaned records
```

## Test Execution

### Local Development

```bash
# Frontend
npm test              # Run once
npm run test:watch   # Watch mode
npm run test:coverage # With coverage

# Backend
pytest                      # All tests
pytest -v                   # Verbose
pytest --cov=app           # Coverage
pytest -k "test_allergen"  # Specific tests
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
test:
  steps:
    - name: Frontend Tests
      run: |
        cd frontend
        npm ci
        npm run test:coverage

    - name: Backend Tests
      run: |
        cd backend
        uv sync
        uv run pytest --cov=app --cov-report=xml

    - name: E2E Tests
      run: |
        npm run test:e2e
```

## Test Reports

### Coverage Reports

- Frontend: `frontend/coverage/`
- Backend: `backend/htmlcov/`
- Combined: Uploaded to CodeCov

### Test Results

- JUnit XML format for CI
- HTML reports for developers
- Slack notifications for failures

---

**Remember**:

- Test the unhappy paths
- Test edge cases
- Test security vulnerabilities
- Never skip allergen safety tests
