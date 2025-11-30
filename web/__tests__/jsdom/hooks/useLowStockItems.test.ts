import { renderHook, waitFor, act } from "@testing-library/react";
import { useLowStockItems } from "@/hooks/useLowStockItems";

// Mock global fetch
global.fetch = jest.fn();

const createMockItem = (
  id: string,
  name: string,
  quantity: number,
  minQuantity: number | null
) => ({
  id,
  user_id: "user-1",
  ingredient_id: parseInt(id),
  quantity,
  unit: "kg",
  location: "pantry",
  expiration_date: "2024-12-31",
  min_quantity: minQuantity,
  notes: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  ingredient: { id: parseInt(id), name, unit: "kg", created_at: "2024-01-01" },
  expiration_status: "good",
  days_until_expiration: 30,
  is_low_stock: quantity <= (minQuantity ?? 0),
});

describe("useLowStockItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches inventory on mount when autoFetch is true", async () => {
    const mockItems = [createMockItem("1", "Rice", 10, 5), createMockItem("2", "Milk", 1, 5)];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/inventory");
  });

  it("does not fetch on mount when autoFetch is false", async () => {
    const { result } = renderHook(() => useLowStockItems({ autoFetch: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.lowStockItems).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns only low stock items", async () => {
    const mockItems = [
      createMockItem("1", "Rice", 10, 5), // adequate
      createMockItem("2", "Milk", 1, 5), // low
      createMockItem("3", "Bread", 5, 5), // at threshold (low)
      createMockItem("4", "Eggs", 20, null), // no threshold
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lowStockItems.length).toBe(2);
    expect(result.current.lowStockItems.map((i) => i.id).sort()).toEqual(["2", "3"]);
  });

  it("returns correct summary counts", async () => {
    const mockItems = [
      createMockItem("1", "Rice", 0, 5), // critical
      createMockItem("2", "Milk", 3, 5), // low
      createMockItem("3", "Bread", 10, 5), // adequate
      createMockItem("4", "Eggs", 20, null), // unknown
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary).toEqual({
      criticalCount: 1,
      lowCount: 1,
      adequateCount: 1,
      unknownCount: 1,
      totalLow: 2,
    });
  });

  it("sorts low stock items by status (critical first)", async () => {
    const mockItems = [
      createMockItem("1", "Rice", 3, 5), // low
      createMockItem("2", "Milk", 0, 5), // critical
      createMockItem("3", "Bread", 2, 5), // low
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lowStockItems[0].id).toBe("2"); // critical first
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("API Error"),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.error).toBe("API Error");
    });

    expect(result.current.lowStockItems).toEqual([]);
  });

  it("provides refresh function", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("handles empty response data", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lowStockItems).toEqual([]);
    expect(result.current.summary).toEqual({
      criticalCount: 0,
      lowCount: 0,
      adequateCount: 0,
      unknownCount: 0,
      totalLow: 0,
    });
  });

  it("handles items without min_quantity threshold", async () => {
    const mockItems = [createMockItem("1", "Rice", 5, null), createMockItem("2", "Milk", 10, null)];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lowStockItems.length).toBe(0);
    expect(result.current.summary.unknownCount).toBe(2);
  });

  it("correctly identifies out of stock (quantity 0) items", async () => {
    const mockItems = [createMockItem("1", "Rice", 0, 5), createMockItem("2", "Milk", 0, 10)];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useLowStockItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lowStockItems.length).toBe(2);
    expect(result.current.summary.criticalCount).toBe(2);
  });
});
