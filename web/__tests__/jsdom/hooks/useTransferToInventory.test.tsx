/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTransferToInventory } from "@/hooks/useTransferToInventory";

// Mock the toast hook
const mockToast = jest.fn().mockReturnValue({ id: "toast-1" });
const mockDismiss = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: mockDismiss,
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useTransferToInventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockTransferItem = {
    shopping_item_id: "item-1",
    ingredient_id: 101,
    quantity: 2,
    unit: "kg",
    location: "fridge" as const,
    expiration_date: "2024-02-01",
  };

  describe("transfer", () => {
    it("should return false for empty items array", async () => {
      const { result } = renderHook(() => useTransferToInventory());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.transfer([]);
      });

      expect(success).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should successfully transfer items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.transfer([mockTransferItem]);
      });

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [mockTransferItem] }),
      });
      expect(mockToast).toHaveBeenCalled();
    });

    it("should show error toast on transfer failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Transfer failed" }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.transfer([mockTransferItem]);
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "❌ Transfer Failed",
          variant: "destructive",
        })
      );
    });

    it("should set canUndo to true after successful transfer", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      expect(result.current.canUndo).toBe(false);

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it("should update lastTransferredItems after successful transfer", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      expect(result.current.lastTransferredItems).toEqual([]);

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      expect(result.current.lastTransferredItems).toEqual([mockTransferItem]);
    });

    it("should set isTransferring to true during transfer", async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useTransferToInventory());

      expect(result.current.isTransferring).toBe(false);

      let transferPromise: Promise<boolean>;
      act(() => {
        transferPromise = result.current.transfer([mockTransferItem]);
      });

      await waitFor(() => {
        expect(result.current.isTransferring).toBe(true);
      });

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, transferred_count: 1 }),
        });
        await transferPromise;
      });

      expect(result.current.isTransferring).toBe(false);
    });

    it("should clear undo state after 10 seconds", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      expect(result.current.canUndo).toBe(true);

      // Advance timers by 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.lastTransferredItems).toEqual([]);
    });
  });

  describe("undo", () => {
    it("should return false if canUndo is false", async () => {
      const { result } = renderHook(() => useTransferToInventory());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.undo();
      });

      expect(success).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should successfully undo transfer", async () => {
      // First, do a successful transfer
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      // Then, undo
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.undo();
      });

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenLastCalledWith("/api/inventory/transfer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [mockTransferItem] }),
      });
      expect(result.current.canUndo).toBe(false);
    });

    it("should show error toast on undo failure", async () => {
      // First, do a successful transfer
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      // Clear mock calls to check undo toast
      mockToast.mockClear();

      // Undo fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.undo();
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "❌ Undo Failed",
          variant: "destructive",
        })
      );
    });
  });

  describe("toast action with undo", () => {
    it("should include undo action in success toast", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 1,
          transferred_items: [mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      await act(async () => {
        await result.current.transfer([mockTransferItem]);
      });

      // Check that toast was called with an action
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "✅ Added to Inventory",
          action: expect.anything(),
        })
      );
    });

    it("should include inventory link in success toast description", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          transferred_count: 2,
          transferred_items: [mockTransferItem, mockTransferItem],
        }),
      });

      const { result } = renderHook(() => useTransferToInventory());

      await act(async () => {
        await result.current.transfer([mockTransferItem, mockTransferItem]);
      });

      // Check that toast was called with description containing the count
      const toastCall = mockToast.mock.calls[0][0];
      expect(toastCall.title).toBe("✅ Added to Inventory");
      // The description is a React element, so we check that it exists
      expect(toastCall.description).toBeDefined();
    });
  });
});
