import {
  isLowStock,
  getLowStockItems,
  getStockPercentage,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusColor,
  sortByStockStatus,
  getLowStockSummary,
} from "@/utils/inventory/lowStock";

describe("isLowStock", () => {
  it("returns true when quantity is at or below minimum", () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(3, 5)).toBe(true);
    expect(isLowStock(0, 5)).toBe(true);
  });

  it("returns false when quantity is above minimum", () => {
    expect(isLowStock(10, 5)).toBe(false);
    expect(isLowStock(6, 5)).toBe(false);
  });

  it("returns false when minQuantity is null", () => {
    expect(isLowStock(5, null)).toBe(false);
  });

  it("returns false when minQuantity is zero", () => {
    expect(isLowStock(0, 0)).toBe(true); // 0 <= 0
    expect(isLowStock(1, 0)).toBe(false);
  });
});

describe("getLowStockItems", () => {
  it("returns only items that are low on stock", () => {
    const items = [
      { id: 1, quantity: 2, min_quantity: 5 }, // low
      { id: 2, quantity: 10, min_quantity: 5 }, // adequate
      { id: 3, quantity: 5, min_quantity: 5 }, // at threshold (low)
      { id: 4, quantity: 10, min_quantity: null }, // no threshold
    ];

    const lowStock = getLowStockItems(items);

    expect(lowStock.length).toBe(2);
    expect(lowStock.map((i) => i.id).sort()).toEqual([1, 3]);
  });

  it("returns empty array when nothing is low", () => {
    const items = [
      { id: 1, quantity: 10, min_quantity: 5 },
      { id: 2, quantity: 20, min_quantity: null },
    ];

    expect(getLowStockItems(items)).toEqual([]);
  });

  it("handles empty array", () => {
    expect(getLowStockItems([])).toEqual([]);
  });
});

describe("getStockPercentage", () => {
  it("returns 100 when at minimum quantity", () => {
    expect(getStockPercentage(5, 5)).toBe(100);
  });

  it("returns percentage above 100 when well stocked", () => {
    expect(getStockPercentage(10, 5)).toBe(200);
    expect(getStockPercentage(15, 10)).toBe(150);
  });

  it("returns percentage below 100 when low", () => {
    expect(getStockPercentage(2, 10)).toBe(20);
    expect(getStockPercentage(5, 10)).toBe(50);
  });

  it("returns 0 when quantity is 0", () => {
    expect(getStockPercentage(0, 10)).toBe(0);
  });

  it("returns null when minQuantity is null", () => {
    expect(getStockPercentage(10, null)).toBeNull();
  });

  it("returns null when minQuantity is 0", () => {
    expect(getStockPercentage(10, 0)).toBeNull();
  });

  it("rounds to nearest integer", () => {
    expect(getStockPercentage(1, 3)).toBe(33);
  });
});

describe("getStockStatus", () => {
  it("returns critical when quantity is 0", () => {
    expect(getStockStatus(0, 5)).toBe("critical");
  });

  it("returns low when at or below minimum", () => {
    expect(getStockStatus(5, 5)).toBe("low");
    expect(getStockStatus(3, 5)).toBe("low");
  });

  it("returns adequate when above minimum", () => {
    expect(getStockStatus(10, 5)).toBe("adequate");
    expect(getStockStatus(6, 5)).toBe("adequate");
  });

  it("returns unknown when minQuantity is null", () => {
    expect(getStockStatus(10, null)).toBe("unknown");
  });
});

describe("getStockStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getStockStatusLabel("critical")).toBe("Out of Stock");
    expect(getStockStatusLabel("low")).toBe("Low Stock");
    expect(getStockStatusLabel("adequate")).toBe("In Stock");
    expect(getStockStatusLabel("unknown")).toBe("No Threshold Set");
  });

  it("returns Unknown for invalid status", () => {
    // @ts-expect-error Testing invalid input
    expect(getStockStatusLabel("invalid")).toBe("Unknown");
  });
});

describe("getStockStatusColor", () => {
  it("returns correct colors", () => {
    expect(getStockStatusColor("critical")).toBe("red");
    expect(getStockStatusColor("low")).toBe("orange");
    expect(getStockStatusColor("adequate")).toBe("green");
    expect(getStockStatusColor("unknown")).toBe("gray");
  });

  it("returns gray for invalid status", () => {
    // @ts-expect-error Testing invalid input
    expect(getStockStatusColor("invalid")).toBe("gray");
  });
});

describe("sortByStockStatus", () => {
  it("sorts critical first, then low, then adequate, then unknown", () => {
    const items = [
      { id: 1, quantity: 10, min_quantity: 5 }, // adequate
      { id: 2, quantity: 0, min_quantity: 5 }, // critical
      { id: 3, quantity: 5, min_quantity: null }, // unknown
      { id: 4, quantity: 3, min_quantity: 5 }, // low
    ];

    const sorted = sortByStockStatus(items);

    expect(sorted[0].id).toBe(2); // critical
    expect(sorted[1].id).toBe(4); // low
    expect(sorted[2].id).toBe(1); // adequate
    expect(sorted[3].id).toBe(3); // unknown
  });

  it("does not mutate original array", () => {
    const items = [
      { id: 1, quantity: 10, min_quantity: 5 },
      { id: 2, quantity: 0, min_quantity: 5 },
    ];

    const originalFirstId = items[0].id;
    sortByStockStatus(items);

    expect(items[0].id).toBe(originalFirstId);
  });

  it("handles empty array", () => {
    expect(sortByStockStatus([])).toEqual([]);
  });
});

describe("getLowStockSummary", () => {
  it("counts items by status correctly", () => {
    const items = [
      { id: 1, quantity: 0, min_quantity: 5 }, // critical
      { id: 2, quantity: 0, min_quantity: 10 }, // critical
      { id: 3, quantity: 3, min_quantity: 5 }, // low
      { id: 4, quantity: 10, min_quantity: 5 }, // adequate
      { id: 5, quantity: 15, min_quantity: 5 }, // adequate
      { id: 6, quantity: 10, min_quantity: null }, // unknown
    ];

    const summary = getLowStockSummary(items);

    expect(summary.criticalCount).toBe(2);
    expect(summary.lowCount).toBe(1);
    expect(summary.adequateCount).toBe(2);
    expect(summary.unknownCount).toBe(1);
    expect(summary.totalLow).toBe(3);
  });

  it("handles empty array", () => {
    const summary = getLowStockSummary([]);

    expect(summary.criticalCount).toBe(0);
    expect(summary.lowCount).toBe(0);
    expect(summary.adequateCount).toBe(0);
    expect(summary.unknownCount).toBe(0);
    expect(summary.totalLow).toBe(0);
  });

  it("handles all items having same status", () => {
    const items = [
      { id: 1, quantity: 10, min_quantity: 5 },
      { id: 2, quantity: 15, min_quantity: 5 },
    ];

    const summary = getLowStockSummary(items);

    expect(summary.adequateCount).toBe(2);
    expect(summary.totalLow).toBe(0);
  });
});
