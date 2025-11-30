/**
 * Check if an item is low on stock
 * @param quantity - Current quantity
 * @param minQuantity - Minimum quantity threshold (null means no threshold)
 * @returns True if item is low on stock
 */
export function isLowStock(quantity: number, minQuantity: number | null): boolean {
  if (minQuantity === null) {
    return false;
  }
  return quantity <= minQuantity;
}

/**
 * Get low stock items from inventory
 * @param items - Array of inventory items
 * @returns Filtered array of low stock items
 */
export function getLowStockItems<
  T extends { quantity: number; min_quantity: number | null },
>(items: T[]): T[] {
  return items.filter((item) => isLowStock(item.quantity, item.min_quantity));
}

/**
 * Calculate stock percentage
 * @param quantity - Current quantity
 * @param minQuantity - Minimum quantity (used as reference)
 * @returns Percentage of stock remaining (100% = at minimum, >100% = above minimum)
 */
export function getStockPercentage(quantity: number, minQuantity: number | null): number | null {
  if (minQuantity === null || minQuantity === 0) {
    return null;
  }
  return Math.round((quantity / minQuantity) * 100);
}

/**
 * Get stock status based on quantity relative to minimum
 * @param quantity - Current quantity
 * @param minQuantity - Minimum quantity threshold
 * @returns Status string: 'critical' | 'low' | 'adequate' | 'unknown'
 */
export function getStockStatus(
  quantity: number,
  minQuantity: number | null
): "critical" | "low" | "adequate" | "unknown" {
  if (minQuantity === null) {
    return "unknown";
  }

  const percentage = getStockPercentage(quantity, minQuantity);

  if (percentage === null) {
    return "unknown";
  }

  if (quantity === 0) {
    return "critical";
  }

  if (percentage <= 100) {
    return "low";
  }

  return "adequate";
}

/**
 * Get human-readable label for stock status
 * @param status - Stock status
 * @returns Human-readable label
 */
export function getStockStatusLabel(status: "critical" | "low" | "adequate" | "unknown"): string {
  switch (status) {
    case "critical":
      return "Out of Stock";
    case "low":
      return "Low Stock";
    case "adequate":
      return "In Stock";
    case "unknown":
      return "No Threshold Set";
    default:
      return "Unknown";
  }
}

/**
 * Get color for stock status
 * @param status - Stock status
 * @returns Color key for styling
 */
export function getStockStatusColor(
  status: "critical" | "low" | "adequate" | "unknown"
): "red" | "orange" | "green" | "gray" {
  switch (status) {
    case "critical":
      return "red";
    case "low":
      return "orange";
    case "adequate":
      return "green";
    case "unknown":
    default:
      return "gray";
  }
}

/**
 * Sort items by stock status (critical and low first)
 * Returns a new sorted array without mutating the original.
 * @param items - Array of items with quantity and min_quantity
 * @returns New sorted array
 */
export function sortByStockStatus<
  T extends { quantity: number; min_quantity: number | null },
>(items: T[]): T[] {
  const statusOrder = { critical: 0, low: 1, adequate: 2, unknown: 3 };

  return [...items].sort((a, b) => {
    const statusA = getStockStatus(a.quantity, a.min_quantity);
    const statusB = getStockStatus(b.quantity, b.min_quantity);
    return statusOrder[statusA] - statusOrder[statusB];
  });
}

/**
 * Get summary of low stock items
 * @param items - Array of inventory items
 * @returns Summary object with counts
 */
export function getLowStockSummary<
  T extends { quantity: number; min_quantity: number | null },
>(
  items: T[]
): {
  criticalCount: number;
  lowCount: number;
  adequateCount: number;
  unknownCount: number;
  totalLow: number;
} {
  let criticalCount = 0;
  let lowCount = 0;
  let adequateCount = 0;
  let unknownCount = 0;

  for (const item of items) {
    const status = getStockStatus(item.quantity, item.min_quantity);
    switch (status) {
      case "critical":
        criticalCount++;
        break;
      case "low":
        lowCount++;
        break;
      case "adequate":
        adequateCount++;
        break;
      case "unknown":
        unknownCount++;
        break;
    }
  }

  return {
    criticalCount,
    lowCount,
    adequateCount,
    unknownCount,
    totalLow: criticalCount + lowCount,
  };
}
