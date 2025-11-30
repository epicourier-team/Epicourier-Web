import { ExpirationStatus } from "@/types/data";

/**
 * Calculate days until expiration from a given date
 * @param expirationDate - The expiration date (string in YYYY-MM-DD format, Date object, or null)
 * @returns Number of days until expiration (negative if expired), or null if no date provided
 */
export function getDaysUntilExpiration(
  expirationDate: string | Date | null | undefined
): number | null {
  if (!expirationDate) {
    return null;
  }

  const expDate = typeof expirationDate === "string" ? new Date(expirationDate) : expirationDate;

  // Check for invalid date
  if (isNaN(expDate.getTime())) {
    return null;
  }

  const today = new Date();
  // Reset time to start of day for accurate day comparison
  today.setHours(0, 0, 0, 0);
  const expDateNormalized = new Date(expDate);
  expDateNormalized.setHours(0, 0, 0, 0);

  const diffTime = expDateNormalized.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get expiration status based on days until expiration
 * @param expirationDate - The expiration date (string, Date, or null)
 * @returns ExpirationStatus: 'expired' | 'critical' | 'warning' | 'good' | 'unknown'
 */
export function getExpirationStatus(
  expirationDate: string | Date | null | undefined
): ExpirationStatus {
  const daysUntil = getDaysUntilExpiration(expirationDate);

  if (daysUntil === null) {
    return "unknown";
  }

  if (daysUntil < 0) {
    return "expired";
  }

  if (daysUntil <= 2) {
    return "critical"; // 0-2 days
  }

  if (daysUntil <= 7) {
    return "warning"; // 3-7 days
  }

  return "good"; // > 7 days
}

/**
 * Get a human-readable label for expiration status
 * @param status - The expiration status
 * @returns Human-readable string describing the status
 */
export function getExpirationStatusLabel(status: ExpirationStatus): string {
  switch (status) {
    case "expired":
      return "Expired";
    case "critical":
      return "Expiring Soon";
    case "warning":
      return "Use Soon";
    case "good":
      return "Fresh";
    case "unknown":
      return "No Date";
    default:
      return "Unknown";
  }
}

/**
 * Get CSS class/color for expiration status (for UI styling)
 * @param status - The expiration status
 * @returns Color key for styling
 */
export function getExpirationStatusColor(
  status: ExpirationStatus
): "red" | "orange" | "yellow" | "green" | "gray" {
  switch (status) {
    case "expired":
      return "red";
    case "critical":
      return "orange";
    case "warning":
      return "yellow";
    case "good":
      return "green";
    case "unknown":
    default:
      return "gray";
  }
}

/**
 * Format expiration date for display
 * @param expirationDate - The expiration date
 * @returns Formatted string or appropriate message
 */
export function formatExpirationDate(expirationDate: string | Date | null | undefined): string {
  if (!expirationDate) {
    return "No expiration date";
  }

  const date = typeof expirationDate === "string" ? new Date(expirationDate) : expirationDate;

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const days = getDaysUntilExpiration(expirationDate);

  if (days === null) {
    return "No expiration date";
  }

  if (days < 0) {
    return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  if (days === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${days} days`;
}

/**
 * Sort items by expiration date (expired/expiring first)
 * @param items - Array of items with expiration_date property
 * @returns Sorted array (mutates original)
 */
export function sortByExpiration<T extends { expiration_date: string | null }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const daysA = getDaysUntilExpiration(a.expiration_date);
    const daysB = getDaysUntilExpiration(b.expiration_date);

    // Items without expiration dates go to the end
    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;

    return daysA - daysB;
  });
}

/**
 * Filter items that are expiring within a certain number of days
 * @param items - Array of items with expiration_date property
 * @param days - Number of days to consider (default: 7)
 * @returns Filtered array of items expiring within the specified days
 */
export function getExpiringItems<T extends { expiration_date: string | null }>(
  items: T[],
  days: number = 7
): T[] {
  return items.filter((item) => {
    const daysUntil = getDaysUntilExpiration(item.expiration_date);
    return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
  });
}

/**
 * Get items that have already expired
 * @param items - Array of items with expiration_date property
 * @returns Filtered array of expired items
 */
export function getExpiredItems<T extends { expiration_date: string | null }>(items: T[]): T[] {
  return items.filter((item) => {
    const daysUntil = getDaysUntilExpiration(item.expiration_date);
    return daysUntil !== null && daysUntil < 0;
  });
}
