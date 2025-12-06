import { renderHook, waitFor, act } from "@testing-library/react";
import { useInventory } from "@/hooks/useInventory";

// Mock global fetch
global.fetch = jest.fn();

const mockInventoryItems = [
  {
    id: "1",
    user_id: "user-1",
    ingredient_id: 1,
    quantity: 5,
    unit: "kg",
    location: "pantry",
    expiration_date: "2024-12-31",
    min_quantity: 2,
    notes: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    ingredient: { id: 1, name: "Rice", unit: "kg", created_at: "2024-01-01" },
    expiration_status: "good",
    days_until_expiration: 30,
    is_low_stock: false,
  },
  {
    id: "2",
    user_id: "user-1",
    ingredient_id: 2,
    quantity: 1,
    unit: "L",
    location: "fridge",
    expiration_date: "2024-01-10",
    min_quantity: 2,
    notes: "Check freshness",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    ingredient: { id: 2, name: "Milk", unit: "L", created_at: "2024-01-01" },
    expiration_status: "warning",
    days_until_expiration: 5,
    is_low_stock: true,
  },
];

const mockSummary = {
  total_items: 2,
  expiring_soon: 1,
  expired: 0,
  low_stock: 1,
  by_location: {
    pantry: 1,
    fridge: 1,
    freezer: 0,
    other: 0,
  },
};

describe("useInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: mockInventoryItems,
          summary: mockSummary,
        }),
    });
  });

  it("fetches inventory on mount when autoFetch is true", async () => {
    const { result } = renderHook(() => useInventory());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual(mockInventoryItems);
    expect(result.current.summary).toEqual(mockSummary);
    expect(global.fetch).toHaveBeenCalledWith("/api/inventory?");
  });

  it("does not fetch on mount when autoFetch is false", async () => {
    const { result } = renderHook(() => useInventory({ autoFetch: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("applies location filter to fetch URL", async () => {
    renderHook(() => useInventory({ location: "fridge" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/inventory?location=fridge");
    });
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("API Error"),
    });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.error).toBe("API Error");
    });

    expect(result.current.items).toEqual([]);
  });

  it("provides refresh function to refetch data", async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("can change location filter", async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setLocationFilter("freezer");
    });

    expect(result.current.locationFilter).toBe("freezer");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/inventory?location=freezer");
    });
  });

  it("addItem makes POST request and refreshes", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "3" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newItem = {
      ingredient_id: 3,
      quantity: 10,
      location: "pantry" as const,
    };

    let success: boolean = false;
    await act(async () => {
      success = await result.current.addItem(newItem);
    });

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
  });

  it("addItem handles errors", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Failed to add item"),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.addItem({ ingredient_id: 1, quantity: 5 });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to add item");
  });

  it("updateItem makes PATCH request and refreshes", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updates = { quantity: 10 };

    let success: boolean = false;
    await act(async () => {
      success = await result.current.updateItem("1", updates);
    });

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/inventory/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  });

  it("updateItem handles errors", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Update failed"),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.updateItem("1", { quantity: 10 });
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Update failed");
  });

  it("deleteItem makes DELETE request and refreshes", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], summary: mockSummary }),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deleteItem("1");
    });

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/inventory/1", {
      method: "DELETE",
    });
  });

  it("deleteItem handles errors", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockInventoryItems, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Delete failed"),
      });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.deleteItem("1");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Delete failed");
  });

  it("handles empty response data", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.summary).toBeNull();
  });

  it("refetches when setLocationFilter is called", async () => {
    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.setLocationFilter("pantry");
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(global.fetch).toHaveBeenLastCalledWith("/api/inventory?location=pantry");
  });
});
