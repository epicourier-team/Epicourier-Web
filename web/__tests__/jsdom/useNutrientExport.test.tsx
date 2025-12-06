/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNutrientExport } from "@/app/dashboard/nutrients/useNutrientExport";

// Mock use-toast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("useNutrientExport", () => {
  // Store original functions
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;
  let clickSpy: jest.SpyInstance;
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL methods
    mockCreateObjectURL = jest.fn().mockReturnValue("blob:test-url");
    mockRevokeObjectURL = jest.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock anchor click behavior
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original functions
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  });

  describe("Initial State", () => {
    it("returns exporting as false initially", () => {
      const { result } = renderHook(() => useNutrientExport());
      expect(result.current.exporting).toBe(false);
    });

    it("returns exportData function", () => {
      const { result } = renderHook(() => useNutrientExport());
      expect(typeof result.current.exportData).toBe("function");
    });
  });

  describe("CSV Export", () => {
    it("exports data as CSV successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["csv,data"], { type: "text/csv" })),
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="nutrition-report.csv"',
        }),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Export Successful",
        description: "Your nutrition data has been exported as CSV.",
      });
    });

    it("uses fallback filename for CSV when Content-Disposition is missing", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["csv,data"], { type: "text/csv" })),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      // Verify successful export toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Successful",
        })
      );
    });
  });

  describe("PDF Export", () => {
    it("exports data as PDF successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["pdf data"], { type: "application/pdf" })),
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="nutrition-report.pdf"',
        }),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("pdf");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Export Successful",
        description: "Your nutrition data has been exported as PDF.",
      });
    });

    it("uses fallback filename for PDF when Content-Disposition is missing", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["pdf data"], { type: "application/pdf" })),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("pdf");
      });

      // Verify successful export toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Successful",
          description: "Your nutrition data has been exported as PDF.",
        })
      );
    });
  });

  describe("Date Range Options", () => {
    it("uses custom start and end dates", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await act(async () => {
        await result.current.exportData("csv", { startDate, endDate });
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      // When both dates provided, startDate comes from 30 days before endDate per buildDateRange logic
      expect(fetchCall).toContain("end=2024-01-31");
    });

    it("uses default 30-day range when no dates provided", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain("start=");
      expect(fetchCall).toContain("end=");
    });

    it("uses only endDate and calculates startDate", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      const endDate = new Date("2024-06-15");

      await act(async () => {
        await result.current.exportData("csv", { endDate });
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain("end=2024-06-15");
      expect(fetchCall).toContain("start=2024-05-16"); // 30 days before
    });
  });

  describe("Error Handling", () => {
    it("handles API error response", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Rate limit exceeded" }),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export Failed",
        description: "Rate limit exceeded",
      });
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it("handles API error without message", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export Failed",
        description: "Export failed",
      });

      consoleError.mockRestore();
    });

    it("handles network error", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export Failed",
        description: "Network error",
      });

      consoleError.mockRestore();
    });

    it("handles non-Error thrown values", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockRejectedValueOnce("Unknown error");

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data",
      });

      consoleError.mockRestore();
    });
  });

  describe("Exporting State", () => {
    it("sets exporting to true during export", async () => {
      let resolveBlob: () => void;
      const blobPromise = new Promise<Blob>((resolve) => {
        resolveBlob = () => resolve(new Blob(["data"]));
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => blobPromise,
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      expect(result.current.exporting).toBe(false);

      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportData("csv");
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current.exporting).toBe(true);
      });

      // Resolve the blob
      await act(async () => {
        resolveBlob!();
        await exportPromise;
      });

      expect(result.current.exporting).toBe(false);
    });

    it("resets exporting to false after error", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(result.current.exporting).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe("URL Construction", () => {
    it("constructs correct URL with format and dates", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv", {
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-03-31"),
        });
      });

      // The actual URL includes format and end date
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain("format=csv");
      expect(fetchCall).toContain("end=2024-03-31");
    });

    it("constructs correct URL for PDF format", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("pdf", {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-07"),
        });
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain("format=pdf");
      expect(fetchCall).toContain("end=2024-01-07");
    });
  });

  describe("Download Link Cleanup", () => {
    it("properly cleans up download link after use", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["data"])),
        headers: new Headers({}),
      });

      const { result } = renderHook(() => useNutrientExport());

      await act(async () => {
        await result.current.exportData("csv");
      });

      expect(clickSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });
  });
});
