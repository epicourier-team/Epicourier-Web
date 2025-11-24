/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  RECOMMENDED_GOALS,
  useNutrientDashboard,
} from "@/app/dashboard/nutrients/useNutrientDashboard";

global.fetch = jest.fn();

const stringifyUrl = (input: RequestInfo | URL) =>
  typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

const buildMockResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);

const buildSummaryForPeriod = (period: string, goals = RECOMMENDED_GOALS) => {
  if (period === "day") {
    return {
      daily: {
        date: "2025-11-22",
        calories_kcal: goals.calories_kcal,
        protein_g: goals.protein_g,
        carbs_g: goals.carbs_g,
        fats_g: goals.fats_g,
        sugar_g: 10,
        fiber_g: goals.fiber_g,
        sodium_mg: goals.sodium_mg,
        meal_count: 3,
        user_id: "123",
      },
      weekly: [],
      monthly: [],
    };
  }

  if (period === "week") {
    return {
      daily: null,
      weekly: [
        {
          week_start: "2025-11-17",
          week_end: "2025-11-23",
          calories_kcal: goals.calories_kcal * 7,
          protein_g: goals.protein_g * 7,
          carbs_g: goals.carbs_g * 7,
          fats_g: goals.fats_g * 7,
          sugar_g: 50,
          fiber_g: goals.fiber_g * 7,
          sodium_mg: goals.sodium_mg * 7,
          days_tracked: 7,
        },
      ],
      monthly: [],
    };
  }

  return {
    daily: null,
    weekly: [],
    monthly: [
      {
        month: "2025-11",
        calories_kcal: goals.calories_kcal * 30,
        protein_g: goals.protein_g * 30,
        carbs_g: goals.carbs_g * 30,
        fats_g: goals.fats_g * 30,
        sugar_g: 200,
        fiber_g: goals.fiber_g * 30,
        sodium_mg: goals.sodium_mg * 30,
        days_tracked: 30,
      },
    ],
  };
};

describe("useNutrientDashboard", () => {
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

  it("normalizes trend data against stored goals and formats tooltip labels", async () => {
    const savedGoals = {
      calories_kcal: 1800,
      protein_g: 110,
      carbs_g: 220,
      fats_g: 60,
      sodium_mg: 1500,
      fiber_g: 28,
    };

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = stringifyUrl(input);
      if (url.includes("/api/nutrients/goals")) {
        return buildMockResponse({ goal: savedGoals });
      }

      const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
      return buildMockResponse(buildSummaryForPeriod(period, savedGoals));
    });

    const { result } = renderHook(() => useNutrientDashboard());

    await waitFor(() => expect(result.current.weeklyTrendNormalized.length).toBeGreaterThan(0));

    expect(result.current.pastSevenNormalized[0].calories).toBeCloseTo(100);
    expect(result.current.weeklyTrendNormalized[0].protein).toBeCloseTo(100);
    expect(result.current.monthlyTrendNormalized[0].fats).toBeCloseTo(100);

    const tooltipPayload: ReadonlyArray<Payload<ValueType, NameType>> = [
      { payload: { rangeLabel: "range label" } } as Payload<ValueType, NameType>,
    ];
    expect(result.current.formatTooltipLabel("label", tooltipPayload)).toBe("range label");
  });

  it("falls back to recommended goals when user goal is missing", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = stringifyUrl(input);
      if (url.includes("/api/nutrients/goals")) {
        return buildMockResponse({ goal: null });
      }
      const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
      return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
    });

    const { result } = renderHook(() => useNutrientDashboard());

    await waitFor(() => expect(result.current.dailyPieData[0].value).toBeGreaterThan(0));

    expect(result.current.goal).toBeNull();
    expect(result.current.pastSevenNormalized.every((p) => p.calories >= 0)).toBe(true);
    expect(result.current.dailyPieData.map((slice) => slice.value)).toEqual([
      RECOMMENDED_GOALS.protein_g,
      RECOMMENDED_GOALS.carbs_g,
      RECOMMENDED_GOALS.fats_g,
    ]);
  });
});
