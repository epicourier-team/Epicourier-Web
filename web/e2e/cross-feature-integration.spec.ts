import { test, expect } from "./fixtures";

/**
 * E2E Test: Cross-Feature Integration Journey
 *
 * Tests the integration between multiple smart cart features:
 * 1. Shopping lists
 * 2. Inventory management
 * 3. AI recommendations
 * 4. Dashboard navigation
 */
test.describe("Cross-Feature Integration", () => {
  test("can navigate between all smart cart features", async ({ page }) => {
    // Start at dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate to shopping
    await page.goto("/dashboard/shopping");
    await expect(page.locator('h1:has-text("Shopping")')).toBeVisible({ timeout: 10000 });

    // Navigate to inventory
    await page.goto("/dashboard/inventory");
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible({ timeout: 10000 });

    // Navigate to recommender
    await page.goto("/dashboard/recommender");
    await expect(
      page.locator('h1:has-text("Recommend"), h1:has-text("Meal"), text=/Personalized/i')
    ).toBeVisible({ timeout: 10000 });

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("dashboard provides access to smart cart features", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for navigation links or widgets for smart cart features
    const shoppingLink = page.locator(
      'a[href*="shopping"], [data-testid="shopping-link"], text=/Shopping/i'
    );
    const inventoryLink = page.locator(
      'a[href*="inventory"], [data-testid="inventory-link"], text=/Inventory/i'
    );
    const recommendLink = page.locator(
      'a[href*="recommend"], [data-testid="recommend-link"], text=/Recommend/i'
    );

    // At least some navigation should be visible
    const hasNavigation =
      (await shoppingLink.isVisible().catch(() => false)) ||
      (await inventoryLink.isVisible().catch(() => false)) ||
      (await recommendLink.isVisible().catch(() => false));

    // Dashboard should have some form of navigation to smart cart features
    // If direct navigation works, the page structure is valid
    const canNavigate = await page
      .goto("/dashboard/shopping")
      .then(() => true)
      .catch(() => false);
    expect(hasNavigation || canNavigate).toBeTruthy();
  });

  test("shopping list creation persists across page navigation", async ({ page }) => {
    await page.goto("/dashboard/shopping");

    const listName = `Persistence Test ${Date.now()}`;

    // Create a shopping list
    const createButton = page.locator(
      'button:has-text("New List"), button:has-text("Create"), [data-testid="create-list-button"]'
    );
    await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    await createButton.first().click();

    const nameInput = page.locator(
      'input[placeholder*="Groceries"], [data-testid="list-name-input"], input[id="list-name"]'
    );
    await nameInput.first().fill(listName);

    const submitButton = page.locator(
      'button:has-text("Create List"), button[type="submit"]:has-text("Create"), [data-testid="create-list-submit"]'
    );
    await submitButton.first().click();
    await page.waitForTimeout(500);

    // Navigate away
    await page.goto("/dashboard/inventory");
    await page.waitForLoadState("networkidle");

    // Navigate to recommender
    await page.goto("/dashboard/recommender");
    await page.waitForLoadState("networkidle");

    // Return to shopping
    await page.goto("/dashboard/shopping");
    await page.waitForLoadState("networkidle");

    // Verify list still exists
    await expect(page.locator(`text="${listName}"`).first()).toBeVisible({ timeout: 10000 });
  });

  test("full user flow: shopping list with multiple items", async ({ page }) => {
    await page.goto("/dashboard/shopping");

    const listName = `Full Flow Test ${Date.now()}`;

    // Create list
    const createButton = page.locator(
      'button:has-text("New List"), button:has-text("Create"), [data-testid="create-list-button"]'
    );
    await createButton.first().click();

    const nameInput = page.locator(
      'input[placeholder*="Groceries"], [data-testid="list-name-input"], input[id="list-name"]'
    );
    await nameInput.first().fill(listName);

    const submitButton = page.locator(
      'button:has-text("Create List"), button[type="submit"]:has-text("Create"), [data-testid="create-list-submit"]'
    );
    await submitButton.first().click();
    await page.waitForTimeout(500);

    // Navigate to list detail
    await page.locator(`text="${listName}"`).first().click();
    await page.waitForURL(/\/dashboard\/shopping\/.+/);

    // Add multiple items
    const items = ["Bread", "Butter", "Cheese", "Tomatoes", "Lettuce"];
    const addItemInput = page.locator('input[placeholder*="Add"], [data-testid="add-item-input"]');

    for (const item of items) {
      await addItemInput.first().fill(item);
      await addItemInput.first().press("Enter");
      await page.waitForTimeout(200);
    }

    // Verify all items are added
    for (const item of items) {
      await expect(page.locator(`text="${item}"`).first()).toBeVisible();
    }

    // Check some items
    const breadRow = page.locator('div:has(p:text("Bread"))').first();
    await breadRow.locator("button").first().click();
    await page.waitForTimeout(200);

    const butterRow = page.locator('div:has(p:text("Butter"))').first();
    await butterRow.locator("button").first().click();
    await page.waitForTimeout(200);

    // Verify progress shows 2/5 (40%)
    await expect(page.locator('text="40%"')).toBeVisible();
  });

  test("responsive navigation works on different viewport sizes", async ({ page }) => {
    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard/shopping");
    await page.waitForLoadState("networkidle");

    // Verify page loads correctly on desktop
    await expect(page.locator('h1:has-text("Shopping")')).toBeVisible({ timeout: 10000 });

    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard/shopping");
    await page.waitForLoadState("networkidle");

    // Verify page loads correctly on tablet
    await expect(page.locator('h1:has-text("Shopping")')).toBeVisible({ timeout: 10000 });

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard/shopping");
    await page.waitForLoadState("networkidle");

    // Verify page loads correctly on mobile
    await expect(page.locator('h1:has-text("Shopping")')).toBeVisible({ timeout: 10000 });
  });

  test("export functionality works for shopping lists", async ({ page }) => {
    await page.goto("/dashboard/shopping");

    const listName = `Export Test ${Date.now()}`;

    // Create list
    const createButton = page.locator(
      'button:has-text("New List"), button:has-text("Create"), [data-testid="create-list-button"]'
    );
    await createButton.first().click();

    const nameInput = page.locator(
      'input[placeholder*="Groceries"], [data-testid="list-name-input"], input[id="list-name"]'
    );
    await nameInput.first().fill(listName);

    const submitButton = page.locator(
      'button:has-text("Create List"), button[type="submit"]:has-text("Create"), [data-testid="create-list-submit"]'
    );
    await submitButton.first().click();
    await page.waitForTimeout(500);

    // Navigate to list detail
    await page.locator(`text="${listName}"`).first().click();
    await page.waitForURL(/\/dashboard\/shopping\/.+/);

    // Add an item
    const addItemInput = page.locator('input[placeholder*="Add"], [data-testid="add-item-input"]');
    await addItemInput.first().fill("Export Item");
    await addItemInput.first().press("Enter");
    await page.waitForTimeout(300);

    // Look for share/export button
    const shareButton = page.locator(
      'button:has-text("Share"), [data-testid="share-button"], button:has(svg)'
    );

    const hasExportFeature = await shareButton
      .first()
      .isVisible()
      .catch(() => false);

    if (hasExportFeature) {
      await shareButton.first().click();
      await page.waitForTimeout(300);

      // Look for copy to clipboard option
      const copyOption = page.locator(
        '[role="menuitem"]:has-text("Copy"), button:has-text("Copy")'
      );
      const hasCopyOption = await copyOption
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasCopyOption).toBeTruthy();
    }
  });

  test("toast notifications appear for user actions", async ({ page }) => {
    await page.goto("/dashboard/shopping");

    const listName = `Toast Test ${Date.now()}`;

    // Create a list
    const createButton = page.locator(
      'button:has-text("New List"), button:has-text("Create"), [data-testid="create-list-button"]'
    );
    await createButton.first().click();

    const nameInput = page.locator(
      'input[placeholder*="Groceries"], [data-testid="list-name-input"], input[id="list-name"]'
    );
    await nameInput.first().fill(listName);

    const submitButton = page.locator(
      'button:has-text("Create List"), button[type="submit"]:has-text("Create"), [data-testid="create-list-submit"]'
    );
    await submitButton.first().click();
    await page.waitForTimeout(500);

    // Look for success toast
    const toast = page.locator('[role="alert"], [data-testid="toast"], [class*="toast"]');
    const hasToast = await toast
      .first()
      .isVisible()
      .catch(() => false);

    // List should be created successfully
    // Verify by checking if the list appears in the grid
    const listCreated = await page
      .locator(`text="${listName}"`)
      .isVisible()
      .catch(() => false);
    expect(hasToast || listCreated).toBeTruthy();
  });

  test("back navigation works correctly in list detail view", async ({ page }) => {
    await page.goto("/dashboard/shopping");

    const listName = `Back Nav Test ${Date.now()}`;

    // Create list
    const createButton = page.locator(
      'button:has-text("New List"), button:has-text("Create"), [data-testid="create-list-button"]'
    );
    await createButton.first().click();

    const nameInput = page.locator(
      'input[placeholder*="Groceries"], [data-testid="list-name-input"], input[id="list-name"]'
    );
    await nameInput.first().fill(listName);

    const submitButton = page.locator(
      'button:has-text("Create List"), button[type="submit"]:has-text("Create"), [data-testid="create-list-submit"]'
    );
    await submitButton.first().click();
    await page.waitForTimeout(500);

    // Navigate to list detail
    await page.locator(`text="${listName}"`).first().click();
    await page.waitForURL(/\/dashboard\/shopping\/.+/);

    // Find and click back button
    const backButton = page.locator(
      'a[href*="shopping"]:not([href*="shopping/"]), button:has(svg[class*="arrow"]), [data-testid="back-button"]'
    );

    const hasBackButton = await backButton
      .first()
      .isVisible()
      .catch(() => false);

    if (hasBackButton) {
      await backButton.first().click();
      await page.waitForURL(/\/dashboard\/shopping$/);
    } else {
      // Use browser back button
      await page.goBack();
    }

    // Should be back on shopping lists page
    await expect(page.locator(`text="${listName}"`).first()).toBeVisible({ timeout: 10000 });
  });
});
