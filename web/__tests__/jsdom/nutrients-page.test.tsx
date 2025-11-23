/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

describe("NutrientsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<NutrientsPage />);

    expect(screen.getByText(/Loading Nutrient Data/i)).toBeInTheDocument();
  });

  it("renders error state when API fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/API Error/i)).toBeInTheDocument();
  });

  it("renders error state when response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch nutrient data/i)).toBeInTheDocument();
  });

  it("renders nutrient data successfully", async () => {
    const mockData = {
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

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    });

    // Check macronutrients display
    await waitFor(() => {
      expect(screen.getByText(/2000/)).toBeInTheDocument(); // Calories
    });
    expect(screen.getByText(/75\.0/)).toBeInTheDocument(); // Protein
    expect(screen.getByText(/250\.0/)).toBeInTheDocument(); // Carbs
    expect(screen.getByText(/65\.0/)).toBeInTheDocument(); // Fats

    // Check additional nutrients
    expect(screen.getByText(/50\.0.*g/)).toBeInTheDocument(); // Sugars
    expect(screen.getByText(/30\.0.*g/)).toBeInTheDocument(); // Fiber
    expect(screen.getByText(/2300\.0.*mg/)).toBeInTheDocument(); // Sodium

    // Check meal count
    expect(screen.getByText("Meals logged today")).toBeInTheDocument();
  });

  it("renders zero values when no data is available", async () => {
    const mockData = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    });

    // Check that zeros are rendered
    const zeroValues = screen.getAllByText("0");
    expect(zeroValues.length).toBeGreaterThan(0);
  });

  it("calls API with correct endpoint", async () => {
    const mockData = {
      daily: {
        date: "2025-11-22",
        calories_kcal: 1500,
        protein_g: 60,
        carbs_g: 180,
        fats_g: 50,
        meal_count: 2,
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
      expect(global.fetch).toHaveBeenCalledWith("/api/nutrients/daily?period=day");
    });
  });

  it("renders page header correctly", async () => {
    const mockData = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    });

    expect(screen.getByText(/Monitor your daily nutritional intake/i)).toBeInTheDocument();
  });

  it("renders section headers", async () => {
    const mockData = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Macronutrients")).toBeInTheDocument();
    });

    expect(screen.getByText("Additional Nutrients")).toBeInTheDocument();
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("renders coming soon features", async () => {
    const mockData = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Weekly Trends/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Monthly Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Goal Tracking/i)).toBeInTheDocument();
  });

  it("renders info footer", async () => {
    const mockData = {
      daily: null,
      weekly: [],
      monthly: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your nutrient data is calculated from the meals/i)).toBeInTheDocument();
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

    expect(screen.getByText("Export PDF")).toBeInTheDocument();
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

  it("calls export API when PDF button is clicked", async () => {
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
      expect(screen.getByText("Export PDF")).toBeInTheDocument();
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

    const pdfButton = screen.getByText("Export PDF");
    fireEvent.click(pdfButton);

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

    let resolveExport: (value: unknown) => void;
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
