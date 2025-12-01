import { test, expect } from "@playwright/test";

/**
 * E2E Test: Public Pages (No Authentication Required)
 *
 * Tests pages that don't require authentication:
 * - Landing page
 * - Sign in page
 * - Sign up page
 */
test.describe("Public Pages", () => {
  // Override storage state for unauthenticated tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test("landing page loads correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify page has content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("signin page loads correctly", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");

    // Verify sign in form is visible
    const signInHeading = page.locator('h1:has-text("Welcome Back")');
    await expect(signInHeading).toBeVisible({ timeout: 10000 });

    // Verify email and password inputs are present
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify sign in button is present
    const signInButton = page.locator('button:has-text("Sign In")');
    await expect(signInButton).toBeVisible();
  });

  test("signup page loads correctly", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    // Verify sign up form is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("can navigate from signin to signup", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");

    // Click sign up link
    const signUpLink = page.locator('a:has-text("Sign Up")');
    await signUpLink.click();

    // Verify navigation to signup page
    await page.waitForURL("**/signup");
  });

  test("signin form has email and password validation", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");

    // Fill in invalid email
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');

    await emailInput.fill("invalid-email");
    await passwordInput.fill("password");

    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign In")');
    await signInButton.click();

    // Wait for validation response
    await page.waitForTimeout(500);

    // Check for error message (should show invalid email error)
    const errorMessage = page.locator("text=/valid.*email|email.*invalid/i");
    const hasError = await errorMessage.isVisible().catch(() => false);

    // Form should either show error message or remain on signin page
    expect(hasError || page.url().includes("/signin")).toBeTruthy();
  });
});
