/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NutrientsPage from "../../src/app/dashboard/nutrients/page";

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock toast hook
jest.mock("../../src/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const stringifyUrl = (input: RequestInfo | URL) =>
  typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

const buildMockResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);

const mockDaily = {
  daily: {
    date: "2025-11-22",
    calories_kcal: 2000,
    protein_g: 75,
    carbs_g: 250,
    fats_g: 65,
    sugar_g: 50,
    fiber_g: 30,
    sodium_mg: 2300,
    meal_count: 3,
    user_id: "123",
  },
  weekly: [],
  monthly: [],
};

const mockWeekly = {
  daily: null,
  weekly: [
    {
      week_start: "2025-11-17",
      week_end: "2025-11-23",
      calories_kcal: 14000,
      protein_g: 525,
      carbs_g: 1750,
      fats_g: 455,
      sugar_g: 350,
      fiber_g: 210,
      sodium_mg: 16100,
      days_tracked: 6,
    },
  ],
  monthly: [],
};

const mockMonthly = {
  daily: null,
  weekly: [],
  monthly: [
    {
      month: "2025-11",
      calories_kcal: 60000,
      protein_g: 2100,
      carbs_g: 7000,
      fats_g: 1950,
      sugar_g: 1400,
      fiber_g: 900,
      sodium_mg: 70000,
      days_tracked: 22,
    },
  ],
};

const mockGoal = { goal: null };

const setupSuccessfulFetches = () => {
  (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
    const url = stringifyUrl(input);

    if (url.includes("/api/nutrients/goals")) {
      return buildMockResponse(mockGoal);
    }

    const params = new URL(url, "http://localhost").searchParams;
    const period = params.get("period");

    if (period === "day") return buildMockResponse(mockDaily);
    if (period === "week") return buildMockResponse(mockWeekly);
    if (period === "month") return buildMockResponse(mockMonthly);

    return Promise.reject(new Error(`Unhandled request: ${url}`));
  });
};

describe("NutrientsPage", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-11-22T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows updating badge while summary is loading", () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = stringifyUrl(input);
      if (url.includes("/api/nutrients/goals")) {
        return buildMockResponse(mockGoal);
      }
      return new Promise(() => {});
    });

    render(<NutrientsPage />);

    expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    expect(screen.getByText(/Updating data/i)).toBeInTheDocument();
  });

  it("renders error banner when summary request fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = stringifyUrl(input);
      if (url.includes("/api/nutrients/goals")) {
        return buildMockResponse(mockGoal);
      }
      return Promise.reject(new Error("API Error"));
    });

    render(<NutrientsPage />);

    expect(await screen.findByText(/Error Loading Data/i)).toBeInTheDocument();
    expect(screen.getByText(/API Error/i)).toBeInTheDocument();
  });

  it("renders nutrient data, goal status, and charts after success", async () => {
    setupSuccessfulFetches();

    render(<NutrientsPage />);

    await waitFor(() => expect(screen.queryByText(/Updating data/i)).not.toBeInTheDocument());

    expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();
    expect(screen.getByText("75.0")).toBeInTheDocument();
    expect(screen.getByText("250.0")).toBeInTheDocument();
    expect(screen.getByText("65.0")).toBeInTheDocument();
    expect(screen.getByTestId("daily-pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-line-chart")).toBeInTheDocument();
  });

  it("re-fetches when refreshing or changing the month range", async () => {
    setupSuccessfulFetches();

    render(<NutrientsPage />);
    await waitFor(() => expect(screen.getByText("2000")).toBeInTheDocument());

    const initialMonthRequests = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
      stringifyUrl(url).includes("period=month")
    ).length;

    fireEvent.click(screen.getByTestId("refresh-button"));
    await waitFor(() =>
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialMonthRequests)
    );

    const monthCallsBeforeRangeChange = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
      stringifyUrl(url).includes("period=month")
    ).length;

    fireEvent.click(screen.getByRole("button", { name: "6m" }));

    await waitFor(() => {
      const monthCallsAfterRangeChange = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
        stringifyUrl(url).includes("period=month")
      ).length;
      expect(monthCallsAfterRangeChange).toBeGreaterThan(monthCallsBeforeRangeChange);
    });
  });

  it("renders export buttons", async () => {
    const mockData = {
      daily: {
        date: "2025-11-22",
        calories_kcal: 2000,
        protein_g: 75,
        carbs_g: 250,
        fats_g: 65,
        meal_count: 3,
        user_id: "123",
      },
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });

    expect(screen.getByText("Export Report")).toBeInTheDocument();
  });

  it("calls export API when CSV button is clicked", async () => {
    const mockData = {
      daily: {
        date: "2025-11-22",
        calories_kcal: 2000,
        protein_g: 75,
        carbs_g: 250,
        fats_g: 65,
        meal_count: 3,
        user_id: "123",
      },
      weekly: [],
      monthly: [],
    };

    const mockBlob = new Blob(["test,csv,data"], { type: "text/csv" });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="nutrition-export.csv"',
        }),
      });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });

    // Mock document methods after render
    const mockLink = {
      href: "",
      download: "",
      click: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, "createElement");
    const appendChildSpy = jest.spyOn(document.body, "appendChild");
    const removeChildSpy = jest.spyOn(document.body, "removeChild");

    createElementSpy.mockReturnValue(mockLink as unknown as HTMLElement);
    appendChildSpy.mockImplementation(() => mockLink as unknown as Node);
    removeChildSpy.mockImplementation(() => mockLink as unknown as Node);

    const csvButton = screen.getByText("Export CSV");
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/nutrients/export?format=csv")
      );
    });

    // Clean up spies
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("calls export API when Report button is clicked", async () => {
    const mockData = {
      daily: {
        date: "2025-11-22",
        calories_kcal: 2000,
        protein_g: 75,
        carbs_g: 250,
        fats_g: 65,
        meal_count: 3,
        user_id: "123",
      },
      weekly: [],
      monthly: [],
    };

    const mockBlob = new Blob(["test pdf data"], { type: "text/plain" });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="nutrition-export.txt"',
        }),
      });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Export Report")).toBeInTheDocument();
    });

    // Mock document methods after render
    const mockLink = {
      href: "",
      download: "",
      click: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, "createElement");
    const appendChildSpy = jest.spyOn(document.body, "appendChild");
    const removeChildSpy = jest.spyOn(document.body, "removeChild");

    createElementSpy.mockReturnValue(mockLink as unknown as HTMLElement);
    appendChildSpy.mockImplementation(() => mockLink as unknown as Node);
    removeChildSpy.mockImplementation(() => mockLink as unknown as Node);

    const reportButton = screen.getByText("Export Report");
    fireEvent.click(reportButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/nutrients/export?format=pdf")
      );
    });

    // Clean up spies
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("disables export buttons while exporting", async () => {
    const mockData = {
      daily: {
        date: "2025-11-22",
        calories_kcal: 2000,
        protein_g: 75,
        carbs_g: 250,
        fats_g: 65,
        meal_count: 3,
        user_id: "123",
      },
      weekly: [],
      monthly: [],
    };

    let resolveExport!: (value: unknown) => void;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })
      .mockReturnValueOnce(exportPromise);

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });

    const csvButton = screen.getByText("Export CSV");
    fireEvent.click(csvButton);

    await waitFor(() => {
      const exportingButtons = screen.getAllByText("Exporting...");
      expect(exportingButtons.length).toBeGreaterThan(0);
    });

    // Resolve the export
    const mockBlob = new Blob(["test"], { type: "text/csv" });
    resolveExport({
      ok: true,
      blob: async () => mockBlob,
      headers: new Headers(),
    });

    await waitFor(() => {
      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });
  });
});
