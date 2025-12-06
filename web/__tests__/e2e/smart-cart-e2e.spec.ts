/**
 * Smart Cart E2E Tests
 * 
 * Comprehensive end-to-end tests for the entire Smart Cart workflow
 * Tests complete user journeys from inventory management through recipe recommendations
 * 
 * Coverage:
 * - User authentication and dashboard access
 * - Inventory CRUD operations
 * - Shopping list management
 * - Expiration alerts
 * - Recipe recommendations
 * - Cart transfer workflow
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'e2e-test@example.com'
const TEST_PASSWORD = 'TestPassword123!'

/**
 * Helper: Login user
 */
async function loginUser(page) {
  await page.goto(`${BASE_URL}/signin`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Sign In")')
  await page.waitForNavigation()
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
}

/**
 * Helper: Navigate to section
 */
async function navigateTo(page, section: 'inventory' | 'shopping' | 'recommender') {
  const paths = {
    inventory: '/dashboard/inventory',
    shopping: '/dashboard/shopping',
    recommender: '/dashboard/recommender'
  }
  await page.goto(`${BASE_URL}${paths[section]}`)
}

/**
 * Test Suite: Dashboard Access
 */
test.describe('Smart Cart Dashboard Access', () => {
  test('should load dashboard with all widgets', async ({ page }) => {
    await loginUser(page)

    // Check for main widget elements
    await expect(page.locator('text=Smart Cart Dashboard')).toBeVisible()
    await expect(page.locator('text=Inventory Items')).toBeVisible()
    await expect(page.locator('text=Expiring Soon')).toBeVisible()
    await expect(page.locator('text=Low Stock')).toBeVisible()
    await expect(page.locator('text=Shopping Lists')).toBeVisible()
  })

  test('should navigate to sub-sections', async ({ page }) => {
    await loginUser(page)

    // Click Inventory button
    await page.click('button:has-text("Manage Inventory")')
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/inventory`)

    // Click Shopping Lists button
    await page.goto(`${BASE_URL}/dashboard`)
    await page.click('button:has-text("Shopping Lists")')
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/shopping`)
  })
})

/**
 * Test Suite: Inventory Management
 */
test.describe('Inventory Management Workflow', () => {
  test('should add new inventory item', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Click add button
    const addButton = page.locator('button:has-text("Add Item")')
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Fill form
    await page.fill('input[placeholder="Item name"]', 'Chicken Breast')
    await page.fill('input[placeholder="Quantity"]', '500')
    await page.selectOption('select', 'g') // grams
    await page.selectOption('select', 'Fridge') // location

    // Submit
    await page.click('button:has-text("Save")')

    // Verify item added
    await expect(page.locator('text=Chicken Breast')).toBeVisible()
  })

  test('should edit inventory item', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Find and click edit button for first item
    const firstItem = page.locator('[data-testid="inventory-item"]').first()
    await firstItem.hover()
    await firstItem.locator('button:has-text("Edit")').click()

    // Change quantity
    const quantityInput = page.locator('input[placeholder="Quantity"]')
    await quantityInput.clear()
    await quantityInput.fill('600')

    // Submit
    await page.click('button:has-text("Save")')

    // Verify updated
    await expect(page.locator('text=600')).toBeVisible()
  })

  test('should delete inventory item', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Get initial count
    const itemsBefore = await page.locator('[data-testid="inventory-item"]').count()

    // Find and click delete button
    const firstItem = page.locator('[data-testid="inventory-item"]').first()
    await firstItem.hover()
    await firstItem.locator('button:has-text("Delete")').click()

    // Confirm deletion
    await page.click('button:has-text("Confirm")')

    // Verify count decreased
    await page.waitForTimeout(500)
    const itemsAfter = await page.locator('[data-testid="inventory-item"]').count()
    expect(itemsAfter).toBe(itemsBefore - 1)
  })

  test('should filter by location', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Select Fridge filter
    await page.selectOption('select[aria-label="Filter by location"]', 'Fridge')

    // Verify only fridge items shown
    const items = page.locator('[data-testid="inventory-item"]')
    const count = await items.count()

    for (let i = 0; i < count; i++) {
      const item = items.nth(i)
      await expect(item.locator('text=Fridge')).toBeVisible()
    }
  })

  test('should show expiration warnings', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Look for expiration warning colors
    const warningItems = page.locator('[data-expiry-urgency="warning"]')
    const criticalItems = page.locator('[data-expiry-urgency="critical"]')

    // Should have visual indicators
    if (await warningItems.count() > 0) {
      await expect(warningItems.first()).toHaveClass(/bg-yellow/)
    }

    if (await criticalItems.count() > 0) {
      await expect(criticalItems.first()).toHaveClass(/bg-red/)
    }
  })
})

/**
 * Test Suite: Shopping List Management
 */
test.describe('Shopping List Workflow', () => {
  test('should create shopping list', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'shopping')

    // Click create button
    await page.click('button:has-text("New List")')

    // Fill form
    await page.fill('input[placeholder="List name"]', 'Weekly Groceries')
    await page.fill('textarea[placeholder="Notes"]', 'For meal prep')

    // Submit
    await page.click('button:has-text("Create")')

    // Verify created
    await expect(page.locator('text=Weekly Groceries')).toBeVisible()
  })

  test('should add items to shopping list', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'shopping')

    // Click first list
    await page.locator('[data-testid="shopping-list"]').first().click()

    // Click add item
    await page.click('button:has-text("Add Item")')

    // Fill item details
    await page.fill('input[placeholder="Item name"]', 'Milk')
    await page.fill('input[placeholder="Quantity"]', '2')
    await page.selectOption('select', 'L') // liters

    // Submit
    await page.click('button:has-text("Add")')

    // Verify added
    await expect(page.locator('text=Milk')).toBeVisible()
  })

  test('should check off items', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'shopping')

    // Open list
    await page.locator('[data-testid="shopping-list"]').first().click()

    // Check first item
    const firstItem = page.locator('[data-testid="shopping-item"]').first()
    const checkbox = firstItem.locator('input[type="checkbox"]')

    await checkbox.check()

    // Verify checked state
    await expect(checkbox).toBeChecked()
    await expect(firstItem).toHaveClass(/line-through/)
  })

  test('should transfer checked items to inventory', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'shopping')

    // Open list
    await page.locator('[data-testid="shopping-list"]').first().click()

    // Check items
    const items = page.locator('[data-testid="shopping-item"]')
    const count = Math.min(await items.count(), 2)

    for (let i = 0; i < count; i++) {
      await items.nth(i).locator('input[type="checkbox"]').check()
    }

    // Click transfer button
    await page.click('button:has-text("Transfer to Inventory")')

    // Confirm transfer
    await page.click('button:has-text("Confirm")')

    // Verify success message
    await expect(page.locator('text=successfully transferred')).toBeVisible({ timeout: 5000 })

    // Navigate to inventory to verify
    await navigateTo(page, 'inventory')
    await page.waitForTimeout(1000)

    // Check that items are now in inventory
    const inventoryItems = page.locator('[data-testid="inventory-item"]')
    expect(await inventoryItems.count()).toBeGreaterThan(0)
  })
})

/**
 * Test Suite: Expiration Alerts
 */
test.describe('Expiration Alerts System', () => {
  test('should show expiring items widget', async ({ page }) => {
    await loginUser(page)

    // Check dashboard for expiring items section
    const expiringSection = page.locator('text=Expiring Items')
    await expect(expiringSection).toBeVisible()
  })

  test('should highlight critical expiration items', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Look for critical (red) items
    const criticalItems = page.locator('[data-expiry-urgency="critical"]')

    if (await criticalItems.count() > 0) {
      const firstCritical = criticalItems.first()

      // Should display "TODAY" or "TOMORROW" for critical items
      const urgencyText = await firstCritical.locator('[data-urgency-text]').textContent()
      expect(urgencyText).toMatch(/TODAY|TOMORROW|1D/)
    }
  })

  test('should filter expired items', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Apply expiring filter
    await page.click('button:has-text("Expiring Soon")')

    // Should show only expiring items (with days <= 3)
    const items = page.locator('[data-testid="inventory-item"]')

    if (await items.count() > 0) {
      const firstItem = items.first()
      const expiryText = await firstItem.textContent()
      expect(expiryText).toContain(/DAY|TODAY|TOMORROW/)
    }
  })
})

/**
 * Test Suite: Recipe Recommendations
 */
test.describe('Recipe Recommendation System', () => {
  test('should show recipe recommendations button', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Look for recommendation button
    const recommendButton = page.locator('button:has-text("Get Recipes")')
    await expect(recommendButton).toBeVisible()
  })

  test('should open recommendations modal', async ({ page }) => {
    await loginUser(page)

    // Click Get Recipes button
    await page.click('button:has-text("Get Recipes")')

    // Wait for modal
    await page.waitForTimeout(1000)

    // Verify modal content
    await expect(page.locator('text=Recommended Recipes')).toBeVisible({ timeout: 10000 })
  })

  test('should add recommended recipe to shopping list', async ({ page }) => {
    await loginUser(page)

    // Open recommendations
    await page.click('button:has-text("Get Recipes")')

    // Wait for recommendations to load
    await page.waitForTimeout(2000)

    // Find and click first "Add to Shopping" button if available
    const addButton = page.locator('button:has-text("Add to Shopping")').first()

    if (await addButton.isVisible()) {
      await addButton.click()

      // Verify success message
      await expect(
        page.locator('text=Added to shopping list')
      ).toBeVisible({ timeout: 5000 })
    }
  })
})

/**
 * Test Suite: Performance
 */
test.describe('Performance Metrics', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    await loginUser(page)
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test('should load inventory page within 2 seconds', async ({ page }) => {
    await loginUser(page)

    const startTime = Date.now()
    await navigateTo(page, 'inventory')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(2000)
  })

  test('should handle large inventory lists (100+ items)', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Check if virtualization is working
    const visibleItems = page.locator('[data-testid="inventory-item"]:visible')
    const totalItems = page.locator('[data-testid="inventory-item"]')

    const visibleCount = await visibleItems.count()
    const totalCount = await totalItems.count()

    // Visible items should be much less than total for large lists
    if (totalCount > 50) {
      expect(visibleCount).toBeLessThan(totalCount)
    }
  })
})

/**
 * Test Suite: Data Persistence
 */
test.describe('Data Persistence', () => {
  test('should persist inventory across page reloads', async ({ page }) => {
    await loginUser(page)
    await navigateTo(page, 'inventory')

    // Get first item name
    const firstName = await page
      .locator('[data-testid="inventory-item"]')
      .first()
      .locator('[data-name]')
      .textContent()

    // Reload page
    await page.reload()

    // Verify item still exists
    await expect(page.locator(`text=${firstName}`)).toBeVisible()
  })

  test('should persist shopping lists across sessions', async ({ page, context }) => {
    await loginUser(page)
    await navigateTo(page, 'shopping')

    // Get list count
    const listsBefore = await page.locator('[data-testid="shopping-list"]').count()

    // Open new tab and navigate
    const newPage = await context.newPage()
    await loginUser(newPage)
    await navigateTo(newPage, 'shopping')

    // Verify same lists exist
    const listsAfter = await newPage.locator('[data-testid="shopping-list"]').count()
    expect(listsAfter).toBe(listsBefore)

    await newPage.close()
  })
})
