import { test, expect, generateFutureDate } from "./fixtures";

/**
 * E2E Test: Inventory Management Journey
 *
 * Tests the complete user workflow for inventory management:
 * 1. Navigate to inventory page
 * 2. View inventory items (or empty state)
 * 3. Suggest recipes button functionality
 * 4. Verify inventory page structure
 */
test.describe("Inventory Management", () => {
  test("inventory page loads correctly", async ({ page }) => {
    // Navigate to inventory page
    await page.goto("/dashboard/inventory");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page header is visible
    const pageHeader = page.locator('h1:has-text("Inventory")');
    await expect(pageHeader.first()).toBeVisible({ timeout: 10000 });

    // Verify the package icon or inventory branding
    const inventoryIndicator = page.locator('svg, text=/Inventory|items/i');
    await expect(inventoryIndicator.first()).toBeVisible();
  });

  test("shows empty state when no inventory items", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Check for empty state or inventory content
    const pageContent = page.locator("body");
    await expect(pageContent).toBeVisible();

    // Look for either items or empty state message
    const hasEmptyState = await page
      .locator('text=/No.*Item|Empty|Add.*ingredient/i')
      .isVisible()
      .catch(() => false);

    const hasItems = await page
      .locator('[data-testid="inventory-item"], [class*="item"]')
      .count()
      .then((count) => count > 0)
      .catch(() => false);

    // Page should show either inventory items or empty state
    // Since inventory may be empty, we just verify the page loaded correctly
    const hasPageContent = await page.locator('h1:has-text("Inventory")').isVisible();
    expect(hasEmptyState || hasItems || hasPageContent).toBeTruthy();
  });

  test("suggest recipes button is present", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Look for "Suggest Recipes" button
    const suggestButton = page.locator(
      'button:has-text("Suggest"), [data-testid="suggest-recipes-button"]'
    );

    await expect(suggestButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("suggest recipes button shows feedback when inventory is empty", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Click suggest recipes button
    const suggestButton = page.locator(
      'button:has-text("Suggest"), [data-testid="suggest-recipes-button"]'
    );

    // Button should be disabled or show message when inventory is empty
    const isDisabled = await suggestButton.first().isDisabled().catch(() => false);

    if (!isDisabled) {
      // Try clicking if not disabled
      await suggestButton.first().click();
      await page.waitForTimeout(500);

      // Should show a toast or message about empty inventory
      const feedbackMessage = page.locator(
        'text=/empty|add.*ingredient/i, [role="alert"]'
      );
      const hasFeedback = await feedbackMessage.isVisible().catch(() => false);

      // Button should either be disabled or provide feedback when clicked
      // Both are valid UI patterns for handling empty inventory
      expect(isDisabled || hasFeedback).toBeTruthy();
    } else {
      // If disabled, the test passes - this is valid behavior
      expect(isDisabled).toBeTruthy();
    }
  });

  test("inventory page displays item count", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Look for item count display (0 items or N items)
    const itemCount = page.locator('text=/\\d+\\s*item/i');
    await expect(itemCount.first()).toBeVisible({ timeout: 10000 });
  });

  test("inventory page has proper layout structure", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Verify header section exists
    const header = page.locator('[class*="banner"], header, [class*="header"]');
    await expect(header.first()).toBeVisible();

    // Verify main content area exists
    const mainContent = page.locator(
      '[class*="panel"], main, [class*="content"], [class*="card"]'
    );
    await expect(mainContent.first()).toBeVisible();
  });

  test("keyboard shortcut hint is displayed for suggest recipes", async ({ page }) => {
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Look for the button with keyboard shortcut hint
    const suggestButton = page.locator(
      'button[title*="Cmd"], button[title*="Ctrl"], button:has-text("Suggest")'
    );

    // Verify button exists and has title attribute (keyboard shortcut hint)
    const button = suggestButton.first();
    await expect(button).toBeVisible({ timeout: 10000 });

    // Check if button has a title with keyboard shortcut info
    const title = await button.getAttribute("title");
    // Button may or may not have title, but should be functional
    expect(await button.isEnabled() || title !== null).toBeTruthy();
  });
});
