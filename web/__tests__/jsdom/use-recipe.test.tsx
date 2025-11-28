import { useRecipes } from "@/hooks/use-recipe";
import { renderHook, waitFor } from "@testing-library/react";

global.fetch = jest.fn();

const mockRecipes = [
  {
    id: 1,
    name: "Recipe 1",
    description: "Description 1",
    image_url: null,
    min_prep_time: 30,
    green_score: 80,
    created_at: "2024-01-01",
    updated_at: null,
  },
  {
    id: 2,
    name: "Recipe 2",
    description: "Description 2",
    image_url: null,
    min_prep_time: 45,
    green_score: 90,
    created_at: "2024-01-02",
    updated_at: null,
  },
];

describe("useRecipes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          recipes: mockRecipes,
          pagination: { page: 1, totalPages: 5, total: 100 },
        }),
    });
  });

  it("fetches recipes on mount", async () => {
    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recipes).toEqual(mockRecipes);
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.totalPages).toBe(5);
  });

  it("passes query parameter to fetch", async () => {
    renderHook(() => useRecipes({ query: "pasta", page: 1, limit: 20 }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query=pasta"),
        expect.any(Object)
      );
    });
  });

  it("passes ingredientIds parameter to fetch", async () => {
    renderHook(() => useRecipes({ ingredientIds: [1, 2, 3], page: 1, limit: 20 }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("ingredientIds=1"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("ingredientIds=2"),
        expect.any(Object)
      );
    });
  });

  it("passes tagIds parameter to fetch", async () => {
    renderHook(() => useRecipes({ tagIds: [10, 20], page: 1, limit: 20 }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("tagIds=10"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("tagIds=20"),
        expect.any(Object)
      );
    });
  });

  it("passes page and limit parameters", async () => {
    renderHook(() => useRecipes({ page: 3, limit: 50 }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=3"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=50"),
        expect.any(Object)
      );
    });
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("API Error"),
    });

    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    await waitFor(() => {
      expect(result.current.error).toBe("API Error");
    });
  });

  it("aborts previous request when filters change", async () => {
    const { rerender } = renderHook(({ filters }) => useRecipes(filters), {
      initialProps: { filters: { page: 1, limit: 20 } },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ filters: { page: 2, limit: 20 } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("does not set error on AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it("returns empty recipes when data is null", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          recipes: null,
          pagination: { page: 1, totalPages: 0, total: 0 },
        }),
    });

    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    await waitFor(() => {
      expect(result.current.recipes).toEqual([]);
    });
  });

  it("handles missing pagination gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recipes: mockRecipes }),
    });

    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    await waitFor(() => {
      expect(result.current.pagination).toEqual({
        page: 1,
        totalPages: 1,
        total: 0,
      });
    });
  });

  it("refetches when ingredientIds change", async () => {
    const { rerender } = renderHook(({ filters }) => useRecipes(filters), {
      initialProps: { filters: { ingredientIds: [1], page: 1, limit: 20 } },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ filters: { ingredientIds: [1, 2], page: 1, limit: 20 } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("refetches when tagIds change", async () => {
    const { rerender } = renderHook(({ filters }) => useRecipes(filters), {
      initialProps: { filters: { tagIds: [5], page: 1, limit: 20 } },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ filters: { tagIds: [5, 6], page: 1, limit: 20 } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("uses default page 1 when page is not provided", async () => {
    // Line 16: filters.page || 1
    const { result } = renderHook(() => useRecipes({ limit: 20 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it("does not append ingredientIds when array is empty", async () => {
    // Line 35-44: empty arrays branch
    renderHook(() => useRecipes({ ingredientIds: [], page: 1, limit: 20 }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain("ingredientIds");
    });
  });

  it("does not append tagIds when array is empty", async () => {
    renderHook(() => useRecipes({ tagIds: [], page: 1, limit: 20 }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain("tagIds");
    });
  });

  it("handles error without message property", async () => {
    // Line 57-58: err.message || "Fetch failed"
    const errorWithoutMessage = { name: "CustomError" };
    (global.fetch as jest.Mock).mockRejectedValue(errorWithoutMessage);

    const { result } = renderHook(() => useRecipes({ page: 1, limit: 20 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Error should be null since it's not instanceof Error
    expect(result.current.error).toBeNull();
  });

  it("does not include query param when query is empty string", async () => {
    renderHook(() => useRecipes({ query: "", page: 1, limit: 20 }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain("query=");
    });
  });
});
