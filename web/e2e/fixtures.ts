/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixtures for Smart Cart E2E tests
 * Provides reusable helper functions for common operations
 *
 * Note: The `use` parameter is from Playwright fixtures, not a React Hook.
 * The eslint-disable comment above disables the React hooks rule for this file.
 */

export interface ShoppingListFixtures {
  /**
   * Create a new shopping list with items
   * @param name - List name
   * @param items - Array of item names to add
   */
  createShoppingList: (name: string, items?: string[]) => Promise<void>;

  /**
   * Navigate to the shopping lists page
   */
  goToShoppingLists: () => Promise<void>;

  /**
   * Add items to the current shopping list
   * @param items - Array of item names to add
   */
  addItemsToList: (items: string[]) => Promise<void>;

  /**
   * Delete the current shopping list
   */
  deleteCurrentList: () => Promise<void>;
}

export interface InventoryFixtures {
  /**
   * Navigate to the inventory page
   */
  goToInventory: () => Promise<void>;

  /**
   * Add an inventory item
   * @param name - Ingredient name
   * @param quantity - Quantity
   * @param expiration - Optional expiration date (YYYY-MM-DD)
   */
  addInventoryItem: (name: string, quantity: number, expiration?: string) => Promise<void>;
}

export interface AuthFixtures {
  /**
   * Sign in with test credentials (mocked for E2E)
   */
  signIn: () => Promise<void>;

  /**
   * Sign out current user
   */
  signOut: () => Promise<void>;
}

type SmartCartFixtures = ShoppingListFixtures & InventoryFixtures & AuthFixtures;

/**
 * Extended test with Smart Cart fixtures
 */
export const test = base.extend<SmartCartFixtures>({
  createShoppingList: async ({ page }, use) => {
    const createShoppingList = async (name: string, items: string[] = []) => {
      // Navigate to shopping page if not there
      if (!page.url().includes("/dashboard/shopping")) {
        await page.goto("/dashboard/shopping");
      }

      // Click create new list button
      await page.click('[data-testid="create-list-button"], button:has-text("New List")');

      // Wait for modal to appear
      await page.waitForSelector(
        '[data-testid="list-name-input"], input[placeholder*="Groceries"]'
      );

      // Fill in list name
      await page.fill('[data-testid="list-name-input"], input[placeholder*="Groceries"]', name);

      // Submit the form
      await page.click('[data-testid="create-list-submit"], button:has-text("Create List")');

      // Wait for list to be created and navigate to it
      await page.waitForTimeout(500);

      // Add items if provided
      if (items.length > 0) {
        // Click on the list card to navigate to it
        await page.click(`text="${name}"`);
        await page.waitForURL(/\/dashboard\/shopping\/.+/);

        for (const item of items) {
          await page.fill('[data-testid="add-item-input"], input[placeholder*="Add"]', item);
          await page.press('[data-testid="add-item-input"], input[placeholder*="Add"]', "Enter");
          await page.waitForTimeout(200);
        }
      }
    };

    await use(createShoppingList);
  },

  goToShoppingLists: async ({ page }, use) => {
    const goToShoppingLists = async () => {
      await page.goto("/dashboard/shopping");
      await page.waitForLoadState("networkidle");
    };

    await use(goToShoppingLists);
  },

  addItemsToList: async ({ page }, use) => {
    const addItemsToList = async (items: string[]) => {
      for (const item of items) {
        await page.fill('[data-testid="add-item-input"], input[placeholder*="Add"]', item);
        await page.press('[data-testid="add-item-input"], input[placeholder*="Add"]', "Enter");
        await page.waitForTimeout(200);
      }
    };

    await use(addItemsToList);
  },

  deleteCurrentList: async ({ page }, use) => {
    const deleteCurrentList = async () => {
      await page.click('[data-testid="list-menu"], button:has-text("Delete")');
      await page.click('[data-testid="delete-list"], [role="menuitem"]:has-text("Delete")');
      await page.click('[data-testid="confirm-delete"], button:has-text("Confirm")');
      await page.waitForTimeout(300);
    };

    await use(deleteCurrentList);
  },

  goToInventory: async ({ page }, use) => {
    const goToInventory = async () => {
      await page.goto("/dashboard/inventory");
      await page.waitForLoadState("networkidle");
    };

    await use(goToInventory);
  },

  addInventoryItem: async ({ page }, use) => {
    const addInventoryItem = async (name: string, quantity: number, expiration?: string) => {
      await page.click('[data-testid="add-inventory-button"], button:has-text("Add")');

      // Search for ingredient
      await page.fill('[data-testid="ingredient-search"], input[type="search"]', name);
      await page.waitForTimeout(300);

      // Select first option
      await page.click('[data-testid="ingredient-option-0"], [role="option"]:first-child');

      // Fill quantity
      await page.fill('[data-testid="quantity-input"], input[type="number"]', String(quantity));

      // Fill expiration if provided
      if (expiration) {
        await page.fill('[data-testid="expiration-input"], input[type="date"]', expiration);
      }

      // Submit
      await page.click('[data-testid="add-inventory-submit"], button:has-text("Add")');
      await page.waitForTimeout(300);
    };

    await use(addInventoryItem);
  },

  signIn: async ({ page }, use) => {
    const signIn = async () => {
      await page.goto("/signin");
      // For E2E tests, we'll mock authentication or use test credentials
      // This depends on the actual auth implementation
      await page.waitForLoadState("networkidle");
    };

    await use(signIn);
  },

  signOut: async ({ page }, use) => {
    const signOut = async () => {
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
      await page.click('[data-testid="sign-out"], button:has-text("Sign out")');
      await page.waitForLoadState("networkidle");
    };

    await use(signOut);
  },
});

export { expect };

/**
 * Generate a unique test list name
 */
export function generateTestListName(): string {
  return `Test List ${Date.now()}`;
}

/**
 * Generate a future date string in YYYY-MM-DD format
 * @param daysFromNow - Number of days from today
 */
export function generateFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}
