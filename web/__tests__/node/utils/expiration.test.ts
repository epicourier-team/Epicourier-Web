import {
  getDaysUntilExpiration,
  getExpirationStatus,
  getExpirationStatusLabel,
  getExpirationStatusColor,
  formatExpirationDate,
  sortByExpiration,
  getExpiringItems,
  getExpiredItems,
} from "@/utils/inventory/expiration";

// Helper to create dates relative to today
const addDays = (days: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const subDays = (days: number): Date => addDays(-days);

const formatDateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

describe("getDaysUntilExpiration", () => {
  it("returns null for null date", () => {
    expect(getDaysUntilExpiration(null)).toBeNull();
  });

  it("returns null for undefined date", () => {
    expect(getDaysUntilExpiration(undefined)).toBeNull();
  });

  it("returns null for invalid date string", () => {
    expect(getDaysUntilExpiration("invalid-date")).toBeNull();
  });

  it("returns 0 for today", () => {
    const today = new Date();
    expect(getDaysUntilExpiration(today)).toBe(0);
  });

  it("returns positive number for future dates", () => {
    const futureDate = addDays(5);
    expect(getDaysUntilExpiration(futureDate)).toBe(5);
  });

  it("returns negative number for past dates", () => {
    const pastDate = subDays(3);
    expect(getDaysUntilExpiration(pastDate)).toBe(-3);
  });

  it("works with string date format (YYYY-MM-DD)", () => {
    const tomorrow = addDays(1);
    const dateString = formatDateString(tomorrow);
    expect(getDaysUntilExpiration(dateString)).toBe(1);
  });

  it("works with ISO string format", () => {
    const futureDate = addDays(10);
    expect(getDaysUntilExpiration(futureDate.toISOString())).toBe(10);
  });
});

describe("getExpirationStatus", () => {
  it("returns expired for past dates", () => {
    expect(getExpirationStatus(subDays(1))).toBe("expired");
    expect(getExpirationStatus(subDays(30))).toBe("expired");
  });

  it("returns critical for 0-2 days", () => {
    const today = new Date();
    expect(getExpirationStatus(today)).toBe("critical");
    expect(getExpirationStatus(addDays(1))).toBe("critical");
    expect(getExpirationStatus(addDays(2))).toBe("critical");
  });

  it("returns warning for 3-7 days", () => {
    expect(getExpirationStatus(addDays(3))).toBe("warning");
    expect(getExpirationStatus(addDays(5))).toBe("warning");
    expect(getExpirationStatus(addDays(7))).toBe("warning");
  });

  it("returns good for >7 days", () => {
    expect(getExpirationStatus(addDays(8))).toBe("good");
    expect(getExpirationStatus(addDays(14))).toBe("good");
    expect(getExpirationStatus(addDays(30))).toBe("good");
  });

  it("returns unknown for null date", () => {
    expect(getExpirationStatus(null)).toBe("unknown");
  });

  it("returns unknown for undefined date", () => {
    expect(getExpirationStatus(undefined)).toBe("unknown");
  });

  it("returns unknown for invalid date", () => {
    expect(getExpirationStatus("not-a-date")).toBe("unknown");
  });
});

describe("getExpirationStatusLabel", () => {
  it("returns correct labels for each status", () => {
    expect(getExpirationStatusLabel("expired")).toBe("Expired");
    expect(getExpirationStatusLabel("critical")).toBe("Expiring Soon");
    expect(getExpirationStatusLabel("warning")).toBe("Use Soon");
    expect(getExpirationStatusLabel("good")).toBe("Fresh");
    expect(getExpirationStatusLabel("unknown")).toBe("No Date");
  });

  it("returns Unknown for invalid status", () => {
    // @ts-expect-error Testing invalid input
    expect(getExpirationStatusLabel("invalid")).toBe("Unknown");
  });
});

describe("getExpirationStatusColor", () => {
  it("returns correct colors for each status", () => {
    expect(getExpirationStatusColor("expired")).toBe("red");
    expect(getExpirationStatusColor("critical")).toBe("orange");
    expect(getExpirationStatusColor("warning")).toBe("yellow");
    expect(getExpirationStatusColor("good")).toBe("green");
    expect(getExpirationStatusColor("unknown")).toBe("gray");
  });

  it("returns gray for invalid status", () => {
    // @ts-expect-error Testing invalid input
    expect(getExpirationStatusColor("invalid")).toBe("gray");
  });
});

describe("formatExpirationDate", () => {
  it("returns 'No expiration date' for null", () => {
    expect(formatExpirationDate(null)).toBe("No expiration date");
  });

  it("returns 'No expiration date' for undefined", () => {
    expect(formatExpirationDate(undefined)).toBe("No expiration date");
  });

  it("returns 'Invalid date' for invalid date string", () => {
    expect(formatExpirationDate("not-a-date")).toBe("Invalid date");
  });

  it("returns 'Expires today' for today", () => {
    const today = new Date();
    expect(formatExpirationDate(today)).toBe("Expires today");
  });

  it("returns 'Expires tomorrow' for tomorrow", () => {
    expect(formatExpirationDate(addDays(1))).toBe("Expires tomorrow");
  });

  it("returns 'Expires in X days' for future dates", () => {
    expect(formatExpirationDate(addDays(5))).toBe("Expires in 5 days");
    expect(formatExpirationDate(addDays(14))).toBe("Expires in 14 days");
  });

  it("returns 'Expired X day(s) ago' for past dates", () => {
    expect(formatExpirationDate(subDays(1))).toBe("Expired 1 day ago");
    expect(formatExpirationDate(subDays(5))).toBe("Expired 5 days ago");
  });
});

describe("sortByExpiration", () => {
  it("sorts items by expiration date (soonest first)", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(10)) },
      { id: 2, expiration_date: formatDateString(addDays(2)) },
      { id: 3, expiration_date: formatDateString(addDays(5)) },
    ];

    const sorted = sortByExpiration(items);

    expect(sorted[0].id).toBe(2); // 2 days
    expect(sorted[1].id).toBe(3); // 5 days
    expect(sorted[2].id).toBe(1); // 10 days
  });

  it("puts expired items first", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(5)) },
      { id: 2, expiration_date: formatDateString(subDays(2)) },
      { id: 3, expiration_date: formatDateString(addDays(1)) },
    ];

    const sorted = sortByExpiration(items);

    expect(sorted[0].id).toBe(2); // expired
    expect(sorted[1].id).toBe(3); // 1 day
    expect(sorted[2].id).toBe(1); // 5 days
  });

  it("puts items without expiration dates at the end", () => {
    const items = [
      { id: 1, expiration_date: null },
      { id: 2, expiration_date: formatDateString(addDays(3)) },
      { id: 3, expiration_date: null },
    ];

    const sorted = sortByExpiration(items);

    expect(sorted[0].id).toBe(2); // has date
    expect(sorted[1].expiration_date).toBeNull();
    expect(sorted[2].expiration_date).toBeNull();
  });

  it("handles empty array", () => {
    const items: { id: number; expiration_date: string | null }[] = [];
    const sorted = sortByExpiration(items);
    expect(sorted).toEqual([]);
  });

  it("handles array with only null dates", () => {
    const items = [
      { id: 1, expiration_date: null },
      { id: 2, expiration_date: null },
    ];

    const sorted = sortByExpiration(items);
    expect(sorted.length).toBe(2);
  });

  it("does not mutate original array", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(10)) },
      { id: 2, expiration_date: formatDateString(addDays(2)) },
    ];

    const originalFirstId = items[0].id;
    sortByExpiration(items);

    expect(items[0].id).toBe(originalFirstId);
  });
});

describe("getExpiringItems", () => {
  it("returns items expiring within default 7 days", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(3)) },
      { id: 2, expiration_date: formatDateString(addDays(10)) },
      { id: 3, expiration_date: formatDateString(addDays(5)) },
      { id: 4, expiration_date: null },
    ];

    const expiring = getExpiringItems(items);

    expect(expiring.length).toBe(2);
    expect(expiring.map((i) => i.id).sort()).toEqual([1, 3]);
  });

  it("returns items expiring within custom days", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(3)) },
      { id: 2, expiration_date: formatDateString(addDays(10)) },
      { id: 3, expiration_date: formatDateString(addDays(5)) },
    ];

    const expiring = getExpiringItems(items, 3);

    expect(expiring.length).toBe(1);
    expect(expiring[0].id).toBe(1);
  });

  it("excludes expired items", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(subDays(2)) }, // expired
      { id: 2, expiration_date: formatDateString(addDays(3)) }, // expiring
    ];

    const expiring = getExpiringItems(items);

    expect(expiring.length).toBe(1);
    expect(expiring[0].id).toBe(2);
  });

  it("returns empty array when no items are expiring", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(30)) },
      { id: 2, expiration_date: null },
    ];

    const expiring = getExpiringItems(items);
    expect(expiring).toEqual([]);
  });

  it("includes items expiring today (0 days)", () => {
    const items = [{ id: 1, expiration_date: formatDateString(new Date()) }];

    const expiring = getExpiringItems(items);
    expect(expiring.length).toBe(1);
  });
});

describe("getExpiredItems", () => {
  it("returns only expired items", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(subDays(1)) }, // expired
      { id: 2, expiration_date: formatDateString(addDays(3)) }, // not expired
      { id: 3, expiration_date: formatDateString(subDays(5)) }, // expired
      { id: 4, expiration_date: null }, // no date
    ];

    const expired = getExpiredItems(items);

    expect(expired.length).toBe(2);
    expect(expired.map((i) => i.id).sort()).toEqual([1, 3]);
  });

  it("returns empty array when nothing is expired", () => {
    const items = [
      { id: 1, expiration_date: formatDateString(addDays(5)) },
      { id: 2, expiration_date: null },
    ];

    const expired = getExpiredItems(items);
    expect(expired).toEqual([]);
  });

  it("excludes items expiring today", () => {
    const items = [{ id: 1, expiration_date: formatDateString(new Date()) }];

    const expired = getExpiredItems(items);
    expect(expired).toEqual([]);
  });
});
