/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  RECOMMENDED_GOALS,
  useNutrientDashboard,
} from "@/app/dashboard/nutrients/useNutrientDashboard";

global.fetch = jest.fn();

// Mock toast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

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

    // Wait for all loading to complete to avoid act() warnings
    await waitFor(() => expect(result.current.summaryLoading).toBe(false));
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

    // Wait for all loading to complete to avoid act() warnings
    await waitFor(() => expect(result.current.summaryLoading).toBe(false));
    await waitFor(() => expect(result.current.dailyPieData[0].value).toBeGreaterThan(0));

    expect(result.current.goal).toBeNull();
    expect(result.current.pastSevenNormalized.every((p) => p.calories >= 0)).toBe(true);
    expect(result.current.dailyPieData.map((slice) => slice.value)).toEqual([
      RECOMMENDED_GOALS.protein_g,
      RECOMMENDED_GOALS.carbs_g,
      RECOMMENDED_GOALS.fats_g,
    ]);
  });

  describe("numericField schema preprocessing", () => {
    it("handles empty string as 0", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("calories_kcal", "" as unknown as number);
      });

      await act(async () => {
        await result.current.goalForm.trigger("calories_kcal");
      });

      // Empty string preprocessed to 0, which is valid
      expect(result.current.goalForm.formState.errors.calories_kcal).toBeUndefined();
    });

    it("handles null as 0", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("protein_g", null as unknown as number);
      });

      await act(async () => {
        await result.current.goalForm.trigger("protein_g");
      });

      expect(result.current.goalForm.formState.errors.protein_g).toBeUndefined();
    });

    it("handles undefined as 0", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("carbs_g", undefined as unknown as number);
      });

      await act(async () => {
        await result.current.goalForm.trigger("carbs_g");
      });

      expect(result.current.goalForm.formState.errors.carbs_g).toBeUndefined();
    });

    it("converts string number to number", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("fats_g", "100" as unknown as number);
      });

      await act(async () => {
        await result.current.goalForm.trigger("fats_g");
      });

      expect(result.current.goalForm.formState.errors.fats_g).toBeUndefined();
    });

    it("rejects NaN input", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("fiber_g", "not-a-number" as unknown as number);
      });

      await act(async () => {
        await result.current.goalForm.trigger("fiber_g");
      });

      expect(result.current.goalForm.formState.errors.fiber_g).toBeDefined();
    });

    it("rejects negative numbers", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.goalForm.setValue("sodium_mg", -100);
      });

      await act(async () => {
        await result.current.goalForm.trigger("sodium_mg");
      });

      expect(result.current.goalForm.formState.errors.sodium_mg).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("handles fetch error and sets error state", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Server error" }),
        } as Response);
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.error).toBe("Failed to fetch nutrient data");

      (console.error as jest.Mock).mockRestore();
    });

    it("handles non-Error exception in fetchNutrientData", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        return Promise.reject("String error");
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.error).toBe("Unknown error");

      (console.error as jest.Mock).mockRestore();
    });

    it("handles goal fetch error", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: "Unauthorized" }),
          } as Response);
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.goalError).toBe("Failed to fetch nutrient goal");

      (console.error as jest.Mock).mockRestore();
    });

    it("handles non-Error exception in fetchGoal", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return Promise.reject("String error");
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.goalError).toBe("Unknown error");

      (console.error as jest.Mock).mockRestore();
    });
  });

  describe("goal modal and submission", () => {
    it("opens goal modal", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.goalModalOpen).toBe(false);

      act(() => {
        result.current.handleOpenGoalModal();
      });

      expect(result.current.goalModalOpen).toBe(true);
    });

    it("resets form when modal opens with existing goal", async () => {
      const existingGoal = {
        id: "1",
        user_id: "user-1",
        calories_kcal: 2500,
        protein_g: 150,
        carbs_g: 300,
        fats_g: 80,
        sodium_mg: 2300,
        fiber_g: 35,
      };

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: existingGoal });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.setGoalModalOpen(true);
      });

      await waitFor(() => {
        expect(result.current.goalForm.getValues("calories_kcal")).toBe(2500);
      });
    });

    it("resets form when modal opens with no goal (uses 0)", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.setGoalModalOpen(true);
      });

      await waitFor(() => {
        expect(result.current.goalForm.getValues("calories_kcal")).toBe(0);
      });
    });

    it("saves goal successfully and shows toast", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          if (init?.method === "PUT") {
            return buildMockResponse({
              goal: { ...RECOMMENDED_GOALS, calories_kcal: 3000 },
            });
          }
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      act(() => {
        result.current.setGoalModalOpen(true);
      });

      await act(async () => {
        result.current.goalForm.setValue("calories_kcal", 3000);
        await result.current.onSubmitGoal();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Goal saved",
        description: "Daily nutrient target updated",
      });
      expect(result.current.goalModalOpen).toBe(false);
    });

    it("handles save error and shows error toast", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          if (init?.method === "PUT") {
            return Promise.resolve({
              ok: false,
              json: async () => ({ error: "Validation failed" }),
            } as Response);
          }
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      await act(async () => {
        await result.current.onSubmitGoal();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Save failed",
        description: "Validation failed",
        variant: "destructive",
      });

      (console.error as jest.Mock).mockRestore();
    });

    it("handles non-Error exception in save", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          if (init?.method === "PUT") {
            return Promise.reject("Network error");
          }
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      // Wait for both loading states to complete to avoid act() warnings
      await waitFor(() => expect(result.current.goalLoading).toBe(false));
      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      await act(async () => {
        await result.current.onSubmitGoal();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Save failed",
        description: "Unknown error",
        variant: "destructive",
      });

      (console.error as jest.Mock).mockRestore();
    });

    it("handles save response with null goal", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          if (init?.method === "PUT") {
            return buildMockResponse({ goal: null });
          }
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.goalLoading).toBe(false));

      await act(async () => {
        await result.current.onSubmitGoal();
      });

      expect(result.current.goal).toBe(null);
    });
  });

  describe("monthRange changes", () => {
    it("refetches data when monthRange changes", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      const initialFetchCount = (global.fetch as jest.Mock).mock.calls.length;

      act(() => {
        result.current.setMonthRange(6);
      });

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialFetchCount);
      });

      expect(result.current.monthRange).toBe(6);
    });
  });

  describe("formatTooltipLabel edge cases", () => {
    it("returns label when payload has no rangeLabel", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      const payloadWithoutRange: ReadonlyArray<Payload<ValueType, NameType>> = [
        { payload: {} } as Payload<ValueType, NameType>,
      ];
      const formatted = result.current.formatTooltipLabel("2025-11-22", payloadWithoutRange);

      expect(formatted).toBe("2025-11-22");
    });

    it("returns label when payload is empty", async () => {
      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      const formatted = result.current.formatTooltipLabel("2025-11-22", []);

      expect(formatted).toBe("2025-11-22");
    });
  });

  describe("getMonthDaysFromLabel", () => {
    it("handles invalid month label format", async () => {
      const mockMonthlyInvalid = {
        daily: null,
        weekly: [],
        monthly: [
          {
            month: "invalid",
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

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: RECOMMENDED_GOALS });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        if (period === "month") {
          return buildMockResponse(mockMonthlyInvalid);
        }
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      // Should handle invalid month label gracefully
      expect(result.current.monthlyTrendNormalized).toBeDefined();
    });
  });

  describe("daily data fallback", () => {
    it("uses emptyDaily when daily is null", async () => {
      const nullDaily = {
        daily: null,
        weekly: [],
        monthly: [],
      };

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: null });
        }
        return buildMockResponse(nullDaily);
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      expect(result.current.dailyData.date).toBe("N/A");
      expect(result.current.dailyData.calories_kcal).toBe(0);
    });
  });

  describe("percentOfGoal edge cases", () => {
    it("handles zero goal value", async () => {
      const zeroGoal = {
        calories_kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        fats_g: 0,
        sodium_mg: 0,
        fiber_g: 0,
      };

      (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
        const url = stringifyUrl(input);
        if (url.includes("/api/nutrients/goals")) {
          return buildMockResponse({ goal: zeroGoal });
        }
        const period = new URL(url, "http://localhost").searchParams.get("period") ?? "day";
        return buildMockResponse(buildSummaryForPeriod(period, RECOMMENDED_GOALS));
      });

      const { result } = renderHook(() => useNutrientDashboard());

      await waitFor(() => expect(result.current.summaryLoading).toBe(false));

      // Should handle division by zero gracefully (returns 0)
      expect(result.current.pastSevenNormalized).toBeDefined();
      result.current.pastSevenNormalized.forEach((p) => {
        expect(p.calories).toBe(0);
        expect(p.protein).toBe(0);
      });
    });
  });
});
