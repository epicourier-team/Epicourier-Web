/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NutrientsPage from "../../src/app/dashboard/nutrients/page";

// Mock fetch
global.fetch = jest.fn();

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

const enqueueSuccessResponses = () => {
  const queue = [
    buildMockResponse(mockDaily),
    ...Array.from({ length: 7 }, () => buildMockResponse(mockDaily)),
    ...Array.from({ length: 4 }, () => buildMockResponse(mockWeekly)),
    ...Array.from({ length: 4 }, () => buildMockResponse(mockMonthly)),
  ];

  (global.fetch as jest.Mock).mockImplementation(() => {
    const next = queue.shift();
    if (!next) return Promise.reject(new Error("No more responses"));
    return next;
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

  it("renders loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<NutrientsPage />);

    expect(screen.getByText(/Loading Nutrient Data/i)).toBeInTheDocument();
  });

  it("renders error state when API rejects", async () => {
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

  it("renders nutrient data and charts", async () => {
    enqueueSuccessResponses();

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    });

    expect(screen.getByText(/2000/)).toBeInTheDocument(); // calories
    expect(screen.getByText(/75\.0/)).toBeInTheDocument(); // protein
    expect(screen.getByText(/250\.0/)).toBeInTheDocument(); // carbs
    expect(screen.getByText(/65\.0/)).toBeInTheDocument(); // fats
    expect(screen.getByTestId("daily-pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-line-chart")).toBeInTheDocument();
  });

  it("calls API with expected day/week/month endpoints for today and history", async () => {
    enqueueSuccessResponses();

    render(<NutrientsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nutrient Tracking")).toBeInTheDocument();
    });

    const calls = (global.fetch as jest.Mock).mock.calls.map((c) => c[0]);
    expect(calls.length).toBe(16);
    expect(calls[0]).toBe("/api/nutrients/daily?period=day&date=2025-11-22");
    expect(calls.some((c) => c.includes("period=week"))).toBe(true);
    expect(calls.some((c) => c.includes("period=month"))).toBe(true);
  });
});
