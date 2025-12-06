import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer } from "@/hooks/use-toast";

// Mock timers for testing timeouts
jest.useFakeTimers();

describe("use-toast", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe("reducer", () => {
    const initialState = { toasts: [] };

    it("should handle ADD_TOAST action", () => {
      const newToast = {
        id: "1",
        title: "Test Toast",
        description: "Test description",
        open: true,
      };

      const result = reducer(initialState, {
        type: "ADD_TOAST",
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it("should limit toasts to TOAST_LIMIT (1)", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      const toast2 = { id: "2", title: "Toast 2", open: true };

      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });
      state = reducer(state, { type: "ADD_TOAST", toast: toast2 });

      // TOAST_LIMIT is 1, so only the newest toast should remain
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe("2");
    });

    it("should handle UPDATE_TOAST action", () => {
      const toast1 = { id: "1", title: "Original", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(state.toasts[0].title).toBe("Updated");
      expect(state.toasts[0].open).toBe(true);
    });

    it("should not update non-existent toast", () => {
      const toast1 = { id: "1", title: "Original", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "non-existent", title: "Updated" },
      });

      expect(state.toasts[0].title).toBe("Original");
    });

    it("should handle DISMISS_TOAST action with specific id", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });

      expect(state.toasts[0].open).toBe(false);
    });

    it("should handle DISMISS_TOAST action without id (dismiss all)", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, { type: "DISMISS_TOAST" });

      expect(state.toasts[0].open).toBe(false);
    });

    it("should handle REMOVE_TOAST action with specific id", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });

      expect(state.toasts).toHaveLength(0);
    });

    it("should handle REMOVE_TOAST action without id (remove all)", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, { type: "REMOVE_TOAST" });

      expect(state.toasts).toHaveLength(0);
    });

    it("should not remove toast with non-matching id", () => {
      const toast1 = { id: "1", title: "Toast 1", open: true };
      let state = reducer(initialState, { type: "ADD_TOAST", toast: toast1 });

      state = reducer(state, { type: "REMOVE_TOAST", toastId: "non-existent" });

      expect(state.toasts).toHaveLength(1);
    });
  });

  describe("toast function", () => {
    it("should create a toast with generated id", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Toast" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Test Toast");
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it("should return toast controls (id, dismiss, update)", () => {
      let toastControls: ReturnType<typeof toast>;

      act(() => {
        toastControls = toast({ title: "Test Toast" });
      });

      expect(toastControls!.id).toBeDefined();
      expect(typeof toastControls!.dismiss).toBe("function");
      expect(typeof toastControls!.update).toBe("function");
    });

    it("should create toast with description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: "Test Title",
          description: "Test Description",
        });
      });

      expect(result.current.toasts[0].description).toBe("Test Description");
    });

    it("should create toast with variant", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: "Error Toast",
          variant: "destructive",
        });
      });

      expect(result.current.toasts[0].variant).toBe("destructive");
    });

    it("should dismiss toast using returned dismiss function", () => {
      const { result } = renderHook(() => useToast());
      let toastControls: ReturnType<typeof toast>;

      act(() => {
        toastControls = toast({ title: "Test Toast" });
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        toastControls!.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should update toast using returned update function", () => {
      const { result } = renderHook(() => useToast());
      let toastControls: ReturnType<typeof toast>;

      act(() => {
        toastControls = toast({ title: "Original Title" });
      });

      act(() => {
        toastControls!.update({ title: "Updated Title", id: toastControls!.id });
      });

      expect(result.current.toasts[0].title).toBe("Updated Title");
    });

    it("should generate unique ids for each toast", () => {
      const ids: string[] = [];

      act(() => {
        ids.push(toast({ title: "Toast 1" }).id);
        ids.push(toast({ title: "Toast 2" }).id);
        ids.push(toast({ title: "Toast 3" }).id);
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it("should call onOpenChange when toast is dismissed", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Toast" });
      });

      const toastInstance = result.current.toasts[0];
      expect(toastInstance.onOpenChange).toBeDefined();

      // Simulate closing the toast via onOpenChange
      act(() => {
        toastInstance.onOpenChange?.(false);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe("useToast hook", () => {
    it("should return initial empty state", () => {
      // Clear any existing toasts first
      const { result: clearResult } = renderHook(() => useToast());
      act(() => {
        clearResult.current.toasts.forEach((t) => clearResult.current.dismiss(t.id));
      });

      // Run timers to complete removals
      act(() => {
        jest.runAllTimers();
      });

      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it("should provide toast function", () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.toast).toBe("function");
    });

    it("should provide dismiss function", () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.dismiss).toBe("function");
    });

    it("should update state when toast is added", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "New Toast" });
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it("should dismiss specific toast by id", () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ title: "Test Toast" }).id;
      });

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should dismiss all toasts when no id provided", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should sync state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: "Shared Toast" });
      });

      // Both hooks should see the same toast
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0].title).toBe("Shared Toast");
      expect(result2.current.toasts[0].title).toBe("Shared Toast");
    });

    it("should clean up listener on unmount", () => {
      const { unmount } = renderHook(() => useToast());

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("toast timeout behavior", () => {
    it("should add toast to remove queue after dismiss", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Toast" });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast should still exist but be closed
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should not add duplicate timeouts for same toast", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Toast" });
      });

      const toastId = result.current.toasts[0].id;

      // Dismiss twice - should not cause issues
      act(() => {
        result.current.dismiss(toastId);
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should remove toast after TOAST_REMOVE_DELAY", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test Toast" });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismiss(toastId);
      });

      // Before timeout, toast should still exist
      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward past TOAST_REMOVE_DELAY (1000000ms)
      act(() => {
        jest.advanceTimersByTime(1000001);
      });

      // After timeout, toast should be removed
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid toast creation", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 10; i++) {
          toast({ title: `Toast ${i}` });
        }
      });

      // Only TOAST_LIMIT (1) toast should remain
      expect(result.current.toasts).toHaveLength(1);
    });

    it("should handle toast with all optional props", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: "Full Toast",
          description: "Description",
          variant: "destructive",
          duration: 5000,
        });
      });

      const t = result.current.toasts[0];
      expect(t.title).toBe("Full Toast");
      expect(t.description).toBe("Description");
      expect(t.variant).toBe("destructive");
    });

    it("should handle toast with only title", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Simple Toast" });
      });

      expect(result.current.toasts[0].title).toBe("Simple Toast");
      expect(result.current.toasts[0].description).toBeUndefined();
    });

    it("should handle empty toast props", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({});
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBeDefined();
    });
  });
});
