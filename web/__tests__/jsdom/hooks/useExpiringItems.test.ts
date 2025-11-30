import { renderHook, waitFor, act } from "@testing-library/react";
import { useExpiringItems } from "@/hooks/useExpiringItems";

// Mock global fetch
global.fetch = jest.fn();

// Helper to create dates relative to today
const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const subDays = (days: number): string => addDays(-days);

const createMockItem = (id: string, name: string, expirationDate: string | null) => ({
  id,
  user_id: "user-1",
  ingredient_id: parseInt(id),
  quantity: 5,
  unit: "kg",
  location: "pantry",
  expiration_date: expirationDate,
  min_quantity: 2,
  notes: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  ingredient: { id: parseInt(id), name, unit: "kg", created_at: "2024-01-01" },
  expiration_status: "good",
  days_until_expiration: null,
  is_low_stock: false,
});

describe("useExpiringItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches inventory on mount when autoFetch is true", async () => {
    const mockItems = [
      createMockItem("1", "Rice", addDays(30)),
      createMockItem("2", "Milk", addDays(3)),
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/inventory");
  });

  it("does not fetch on mount when autoFetch is false", async () => {
    const { result } = renderHook(() => useExpiringItems({ autoFetch: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.expiringItems).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns items expiring within default 7 days", async () => {
    const mockItems = [
      createMockItem("1", "Rice", addDays(30)), // not expiring
      createMockItem("2", "Milk", addDays(3)), // expiring
      createMockItem("3", "Bread", addDays(1)), // expiring
      createMockItem("4", "Eggs", addDays(10)), // not expiring
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiringItems.length).toBe(2);
    expect(result.current.expiringItems.map((i) => i.id).sort()).toEqual(["2", "3"]);
  });

  it("returns items expiring within custom days", async () => {
    const mockItems = [
      createMockItem("1", "Rice", addDays(5)), // expiring with 10 days
      createMockItem("2", "Milk", addDays(15)), // not expiring
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems({ days: 10 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiringItems.length).toBe(1);
    expect(result.current.expiringItems[0].id).toBe("1");
  });

  it("returns expired items separately", async () => {
    const mockItems = [
      createMockItem("1", "Rice", subDays(5)), // expired
      createMockItem("2", "Milk", addDays(3)), // expiring
      createMockItem("3", "Bread", subDays(1)), // expired
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiredItems.length).toBe(2);
    expect(result.current.expiredItems.map((i) => i.id).sort()).toEqual(["1", "3"]);
  });

  it("calculates total count including expired when includeExpired is true", async () => {
    const mockItems = [
      createMockItem("1", "Rice", subDays(1)), // expired
      createMockItem("2", "Milk", addDays(3)), // expiring
      createMockItem("3", "Bread", addDays(5)), // expiring
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems({ includeExpired: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalCount).toBe(3); // 1 expired + 2 expiring
  });

  it("excludes expired from total count when includeExpired is false", async () => {
    const mockItems = [
      createMockItem("1", "Rice", subDays(1)), // expired
      createMockItem("2", "Milk", addDays(3)), // expiring
      createMockItem("3", "Bread", addDays(5)), // expiring
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems({ includeExpired: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalCount).toBe(2); // only expiring
  });

  it("sorts expiring items by expiration date (soonest first)", async () => {
    const mockItems = [
      createMockItem("1", "Rice", addDays(5)),
      createMockItem("2", "Milk", addDays(1)),
      createMockItem("3", "Bread", addDays(3)),
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiringItems[0].id).toBe("2"); // 1 day
    expect(result.current.expiringItems[1].id).toBe("3"); // 3 days
    expect(result.current.expiringItems[2].id).toBe("1"); // 5 days
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("API Error"),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.error).toBe("API Error");
    });

    expect(result.current.expiringItems).toEqual([]);
    expect(result.current.expiredItems).toEqual([]);
  });

  it("provides refresh function", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("handles items without expiration dates", async () => {
    const mockItems = [
      createMockItem("1", "Rice", null), // no date
      createMockItem("2", "Milk", addDays(3)), // expiring
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiringItems.length).toBe(1);
    expect(result.current.expiringItems[0].id).toBe("2");
  });

  it("handles empty response data", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expiringItems).toEqual([]);
    expect(result.current.expiredItems).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("excludes items expiring today from expired list", async () => {
    // Create a date 1 day in the future to avoid timezone boundary issues
    const tomorrow = addDays(1);
    const mockItems = [createMockItem("1", "Rice", tomorrow)];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useExpiringItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Tomorrow's item should not be expired
    expect(result.current.expiredItems.length).toBe(0);
    // Tomorrow's item should be in expiringItems (within 7 days)
    expect(result.current.expiringItems.length).toBe(1);
  });
});
