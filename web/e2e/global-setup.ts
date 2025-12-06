import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load e2e specific environment variables (for local development)
// In CI, environment variables are set directly via GitHub Secrets
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Global setup for E2E tests
 * Handles authentication before running tests
 *
 * This setup will:
 * 1. Launch a browser
 * 2. Navigate to the signin page
 * 3. Login with test credentials
 * 4. Save the authentication state to a file
 * 5. All tests will reuse this authentication state
 */

// Path to store authentication state
export const STORAGE_STATE = path.join(__dirname, ".auth/user.json");

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Ensure .auth directory exists
  const authDir = path.dirname(STORAGE_STATE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Check if E2E test credentials are configured
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    console.log("\n⚠️  E2E test credentials not configured.");
    console.log("   Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables.");
    console.log("   Tests requiring authentication may fail.\n");

    // Create empty storage state so Playwright doesn't fail
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  console.log("\n🔐 Setting up authentication for E2E tests...\n");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to signin page
    await page.goto(`${baseURL}/signin`);
    await page.waitForLoadState("networkidle");

    console.log(`   Email: ${testEmail}`);
    console.log(`   Attempting to sign in...`);

    // Fill in credentials
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard (redirects to /dashboard/recipes after login)
    await page.waitForURL("**/dashboard/**", { timeout: 15000 });

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Redirected to: ${currentUrl}`);

    console.log("✅ Authentication successful!\n");

    // Save authentication state
    await context.storageState({ path: STORAGE_STATE });
  } catch (error) {
    // Take a screenshot for debugging on failure
    await page.screenshot({ path: path.join(__dirname, ".auth/login-debug.png") });
    console.log(`   Screenshot saved to e2e/.auth/login-debug.png`);

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check for error message on signin page
    if (currentUrl.includes("/signin")) {
      const errorElement = page.locator('[class*="border-red"], [class*="text-red"]');
      const hasError = await errorElement
        .first()
        .isVisible()
        .catch(() => false);
      if (hasError) {
        const errorText = await errorElement
          .first()
          .textContent()
          .catch(() => "Unknown error");
        console.log(`   Login error: ${errorText}`);
      }
    }

    console.error("❌ Authentication failed:", error);
    console.log("   Tests requiring authentication will fail.\n");

    // Create empty storage state so Playwright doesn't fail
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await browser.close();
  }
}

export default globalSetup;
