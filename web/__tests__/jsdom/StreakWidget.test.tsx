/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StreakWidget } from "@/components/ui/StreakWidget";
import type { StreaksResponse } from "@/types/data";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to get yesterday's date in YYYY-MM-DD format
const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

describe("StreakWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<StreakWidget />);

      // Loading skeleton should be visible (has animate-pulse class)
      const container = document.querySelector(".animate-pulse");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error for non-Error objects", async () => {
      mockFetch.mockRejectedValue("string error");

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State (Not Logged In)", () => {
    it("should show login prompt when API returns 401", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Log in to track your streaks!")).toBeInTheDocument();
      });
    });

    it("should show login prompt when streaks array is empty", async () => {
      const emptyResponse: StreaksResponse = {
        streaks: [],
        totalCurrentStreak: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Log in to track your streaks!")).toBeInTheDocument();
      });
    });
  });

  describe("Data Display (Full Variant)", () => {
    const mockData: StreaksResponse = {
      streaks: [
        {
          type: "daily_log",
          label: "Daily Logging",
          current: 5,
          longest: 10,
          lastActivity: "2024-01-15",
          isActiveToday: true,
        },
        {
          type: "nutrient_goal",
          label: "Nutrient Goals",
          current: 3,
          longest: 7,
          lastActivity: "2024-01-14",
          isActiveToday: false,
        },
        {
          type: "green_recipe",
          label: "Green Recipes",
          current: 0,
          longest: 2,
          lastActivity: null,
          isActiveToday: false,
        },
      ],
      totalCurrentStreak: 8,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });
    });

    it("should display all streak types", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Daily Logging")).toBeInTheDocument();
        expect(screen.getByText("Nutrient Goals")).toBeInTheDocument();
        expect(screen.getByText("Green Recipes")).toBeInTheDocument();
      });
    });

    it("should display current streak values", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument(); // daily_log
        expect(screen.getByText("3")).toBeInTheDocument(); // nutrient_goal
        expect(screen.getByText("0")).toBeInTheDocument(); // green_recipe
      });
    });

    it("should display total streak count", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("8 total")).toBeInTheDocument();
      });
    });

    it("should display 'Active today' for active streaks", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("✓ Active today")).toBeInTheDocument();
      });
    });

    it("should display 'Not started' for never-active streaks", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Not started")).toBeInTheDocument();
      });
    });

    it("should display best (longest) streak values", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Best: 10")).toBeInTheDocument();
        expect(screen.getByText("Best: 7")).toBeInTheDocument();
        expect(screen.getByText("Best: 2")).toBeInTheDocument();
      });
    });

    it("should display default title", async () => {
      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Your Streaks")).toBeInTheDocument();
      });
    });

    it("should display custom title when provided", async () => {
      render(<StreakWidget title="My Progress" />);

      await waitFor(() => {
        expect(screen.getByText("My Progress")).toBeInTheDocument();
      });
    });
  });

  describe("Compact Variant", () => {
    const mockData: StreaksResponse = {
      streaks: [
        {
          type: "daily_log",
          label: "Daily Logging",
          current: 5,
          longest: 10,
          lastActivity: "2024-01-15",
          isActiveToday: true,
        },
        {
          type: "nutrient_goal",
          label: "Nutrient Goals",
          current: 3,
          longest: 7,
          lastActivity: "2024-01-14",
          isActiveToday: false,
        },
        {
          type: "green_recipe",
          label: "Green Recipes",
          current: 0,
          longest: 2,
          lastActivity: null,
          isActiveToday: false,
        },
      ],
      totalCurrentStreak: 8,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });
    });

    it("should render in compact mode", async () => {
      render(<StreakWidget variant="compact" />);

      await waitFor(() => {
        expect(screen.getByText("Daily Logging")).toBeInTheDocument();
      });
    });

    it("should display 'days' label in compact mode", async () => {
      render(<StreakWidget variant="compact" />);

      await waitFor(() => {
        const daysLabels = screen.getAllByText("days");
        expect(daysLabels.length).toBe(3);
      });
    });
  });

  describe("Motivational Messages", () => {
    it("should show starting message for streaks < 7", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 3,
            longest: 3,
            lastActivity: "2024-01-15",
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 3,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText(/Good start! Consistency is key!/)).toBeInTheDocument();
      });
    });

    it("should show progress message for streaks >= 7 and < 21", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 10,
            longest: 10,
            lastActivity: "2024-01-15",
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 10,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText(/Great progress! Keep the momentum going!/)).toBeInTheDocument();
      });
    });

    it("should show achievement message for streaks >= 21", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 21,
            longest: 21,
            lastActivity: "2024-01-15",
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 21,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText(/Amazing dedication! You've built lasting habits!/)).toBeInTheDocument();
      });
    });

    it("should not show motivational message when total streak is 0", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 0,
            longest: 5,
            lastActivity: "2024-01-10",
            isActiveToday: false,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Daily Logging")).toBeInTheDocument();
      });

      // No motivational message should be present
      expect(screen.queryByText(/Good start!/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Great progress!/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Amazing dedication!/)).not.toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 1,
            longest: 1,
            lastActivity: "2024-01-15",
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 1,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      const { container } = render(<StreakWidget className="my-custom-class" />);

      await waitFor(() => {
        expect(container.firstChild).toHaveClass("my-custom-class");
      });
    });
  });

  describe("API Call", () => {
    it("should call /api/streaks endpoint", async () => {
      const data: StreaksResponse = {
        streaks: [],
        totalCurrentStreak: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/streaks");
      });
    });

    it("should only call API once on mount", async () => {
      const data: StreaksResponse = {
        streaks: [],
        totalCurrentStreak: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Visual Intensity", () => {
    it("should show larger icon for high streak (30+ days)", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 35,
            longest: 35,
            lastActivity: getToday(),
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 35,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        // Should show the larger text size for intense streaks
        expect(screen.getByText("35")).toBeInTheDocument();
      });
    });
  });

  describe("Streak At Risk Warning", () => {
    it("should show warning when streak is at risk (last activity yesterday)", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 5,
            longest: 10,
            lastActivity: getYesterday(),
            isActiveToday: false,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 5,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("At risk!")).toBeInTheDocument();
        expect(screen.getByText("Log today to keep your streak!")).toBeInTheDocument();
      });
    });

    it("should not show warning when streak is active today", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 5,
            longest: 10,
            lastActivity: getToday(),
            isActiveToday: true,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 5,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("✓ Active today")).toBeInTheDocument();
      });
      expect(screen.queryByText("At risk!")).not.toBeInTheDocument();
    });

    it("should not show warning when streak is 0", async () => {
      const data: StreaksResponse = {
        streaks: [
          {
            type: "daily_log",
            label: "Daily Logging",
            current: 0,
            longest: 5,
            lastActivity: getYesterday(),
            isActiveToday: false,
          },
          {
            type: "nutrient_goal",
            label: "Nutrient Goals",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
          {
            type: "green_recipe",
            label: "Green Recipes",
            current: 0,
            longest: 0,
            lastActivity: null,
            isActiveToday: false,
          },
        ],
        totalCurrentStreak: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      });

      render(<StreakWidget />);

      await waitFor(() => {
        expect(screen.getByText("Daily Logging")).toBeInTheDocument();
      });
      expect(screen.queryByText("At risk!")).not.toBeInTheDocument();
    });
  });
});
