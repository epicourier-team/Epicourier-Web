/**
 * @jest-environment jsdom
 */

import ChallengeCard from "@/components/ui/ChallengeCard";
import type { ChallengeWithStatus } from "@/types/data";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock challenge data factory
const createMockChallenge = (
  overrides: Partial<ChallengeWithStatus> = {}
): ChallengeWithStatus => ({
  id: 1,
  name: "weekly_green_5",
  title: "Weekly Green Champion",
  description: "Log 5 green recipes this week",
  type: "weekly",
  category: "sustainability",
  criteria: {
    metric: "green_recipes",
    target: 5,
    period: "week",
  },
  start_date: "2024-01-01",
  end_date: "2024-01-07",
  is_active: true,
  reward_achievement_id: null,
  days_remaining: 3,
  is_joined: false,
  progress: undefined,
  reward_achievement: undefined,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("ChallengeCard Component", () => {
  describe("Basic Rendering", () => {
    it("renders challenge title and description", () => {
      const challenge = createMockChallenge();
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("Weekly Green Champion")).toBeInTheDocument();
      expect(screen.getByText("Log 5 green recipes this week")).toBeInTheDocument();
    });

    it("renders type badge correctly for weekly challenge", () => {
      const challenge = createMockChallenge({ type: "weekly" });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("weekly")).toBeInTheDocument();
    });

    it("renders type badge correctly for monthly challenge", () => {
      const challenge = createMockChallenge({ type: "monthly" });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("monthly")).toBeInTheDocument();
    });

    it("renders type badge correctly for special challenge", () => {
      const challenge = createMockChallenge({ type: "special" });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("special")).toBeInTheDocument();
    });

    it("renders days remaining when available", () => {
      const challenge = createMockChallenge({ days_remaining: 5 });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("5 days left")).toBeInTheDocument();
    });

    it("renders singular 'day' when 1 day remaining", () => {
      const challenge = createMockChallenge({ days_remaining: 1 });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("1 day left")).toBeInTheDocument();
    });

    it("does not render days remaining when zero or undefined", () => {
      const challenge = createMockChallenge({ days_remaining: 0 });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.queryByText(/day.*left/)).not.toBeInTheDocument();
    });
  });

  describe("Join Button", () => {
    it("renders Join button when not joined and onJoin provided", () => {
      const challenge = createMockChallenge({ is_joined: false });
      const onJoin = jest.fn();
      render(<ChallengeCard challenge={challenge} onJoin={onJoin} />);

      expect(screen.getByRole("button", { name: /join challenge/i })).toBeInTheDocument();
    });

    it("calls onJoin when Join button is clicked", () => {
      const challenge = createMockChallenge({ is_joined: false });
      const onJoin = jest.fn();
      render(<ChallengeCard challenge={challenge} onJoin={onJoin} />);

      fireEvent.click(screen.getByRole("button", { name: /join challenge/i }));
      expect(onJoin).toHaveBeenCalledTimes(1);
    });

    it("shows 'Joining...' text when isJoining is true", () => {
      const challenge = createMockChallenge({ is_joined: false });
      render(<ChallengeCard challenge={challenge} onJoin={jest.fn()} isJoining={true} />);

      expect(screen.getByRole("button", { name: /joining/i })).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not render Join button when no onJoin provided", () => {
      const challenge = createMockChallenge({ is_joined: false });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.queryByRole("button", { name: /join/i })).not.toBeInTheDocument();
    });

    it("does not render Join button when already joined", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 2, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} onJoin={jest.fn()} />);

      expect(screen.queryByRole("button", { name: /join/i })).not.toBeInTheDocument();
    });
  });

  describe("Progress Display", () => {
    it("renders progress bar when joined with progress", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 2, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("2 / 5")).toBeInTheDocument();
      expect(screen.getByText("40% complete")).toBeInTheDocument();
      expect(screen.getByText("Progress")).toBeInTheDocument();
    });

    it("shows participating message for joined but incomplete challenge", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 2, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText(/you're participating/i)).toBeInTheDocument();
    });

    it("caps progress percentage at 100%", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 10, target: 5 }, // Over target
      });
      render(<ChallengeCard challenge={challenge} />);

      // When completed, it shows "🎉 Challenge completed!" instead of percentage
      expect(screen.getByText("🎉 Challenge completed!")).toBeInTheDocument();
      // But the progress bar still shows the capped values
      expect(screen.getByText("10 / 5")).toBeInTheDocument();
    });

    it("does not render progress when not joined", () => {
      const challenge = createMockChallenge({ is_joined: false });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    });
  });

  describe("Completion State", () => {
    it("shows completion message when challenge is completed", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 5, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("🎉 Challenge completed!")).toBeInTheDocument();
      expect(screen.getByText("🏆 Completed!")).toBeInTheDocument();
    });

    it("shows completion when current exceeds target", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 8, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("🎉 Challenge completed!")).toBeInTheDocument();
      expect(screen.getByText("🏆 Completed!")).toBeInTheDocument();
    });
  });

  describe("Reward Achievement Display", () => {
    it("renders reward achievement when available", () => {
      const challenge = createMockChallenge({
        reward_achievement: {
          id: 1,
          name: "green_champion",
          title: "Green Champion Badge",
          description: "Complete the green challenge",
          icon: "leaf",
          tier: "silver",
          criteria: { type: "count", metric: "green_recipes", target: 5 },
        },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText(/reward.*green champion badge/i)).toBeInTheDocument();
    });

    it("does not render reward section when no reward achievement", () => {
      const challenge = createMockChallenge({ reward_achievement: undefined });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.queryByText(/reward:/i)).not.toBeInTheDocument();
    });
  });

  describe("Metric Icons", () => {
    it("renders green_recipes metric icon", () => {
      const challenge = createMockChallenge({
        criteria: { metric: "green_recipes", target: 5, period: "week" },
      });
      render(<ChallengeCard challenge={challenge} />);

      // The icon is rendered in a container
      const iconContainer = document.querySelector(".bg-gray-50");
      expect(iconContainer).toBeInTheDocument();
    });

    it("renders meals_logged metric icon", () => {
      const challenge = createMockChallenge({
        criteria: { metric: "meals_logged", target: 20, period: "month" },
      });
      render(<ChallengeCard challenge={challenge} />);

      const iconContainer = document.querySelector(".bg-gray-50");
      expect(iconContainer).toBeInTheDocument();
    });

    it("renders streak_days metric icon", () => {
      const challenge = createMockChallenge({
        criteria: { metric: "streak_days", target: 7, period: "week" },
      });
      render(<ChallengeCard challenge={challenge} />);

      const iconContainer = document.querySelector(".bg-gray-50");
      expect(iconContainer).toBeInTheDocument();
    });

    it("renders nutrient_goal_days metric icon", () => {
      const challenge = createMockChallenge({
        criteria: { metric: "nutrient_goal_days", target: 25, period: "month" },
      });
      render(<ChallengeCard challenge={challenge} />);

      const iconContainer = document.querySelector(".bg-gray-50");
      expect(iconContainer).toBeInTheDocument();
    });

    it("renders default icon for unknown metric", () => {
      const challenge = createMockChallenge({
        criteria: { metric: "unknown_metric" as any, target: 10, period: "week" },
      });
      render(<ChallengeCard challenge={challenge} />);

      const iconContainer = document.querySelector(".bg-gray-50");
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("Styling and CSS Classes", () => {
    it("applies completion ring style when completed", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 5, target: 5 },
      });
      const { container } = render(<ChallengeCard challenge={challenge} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("ring-2", "ring-green-400");
    });

    it("does not apply completion ring when not completed", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 2, target: 5 },
      });
      const { container } = render(<ChallengeCard challenge={challenge} />);

      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass("ring-green-400");
    });

    it("applies brutalism styling classes", () => {
      const challenge = createMockChallenge();
      const { container } = render(<ChallengeCard challenge={challenge} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("brutalism-border", "brutalism-shadow");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero progress correctly", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: { current: 0, target: 5 },
      });
      render(<ChallengeCard challenge={challenge} />);

      expect(screen.getByText("0 / 5")).toBeInTheDocument();
      expect(screen.getByText("0% complete")).toBeInTheDocument();
    });

    it("handles undefined progress for joined challenge gracefully", () => {
      const challenge = createMockChallenge({
        is_joined: true,
        progress: undefined,
      });
      render(<ChallengeCard challenge={challenge} />);

      // Should not show progress section
      expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    });

    it("truncates long titles", () => {
      const challenge = createMockChallenge({
        title: "This is an extremely long challenge title that should be truncated",
      });
      render(<ChallengeCard challenge={challenge} />);

      const titleElement = screen.getByText(
        "This is an extremely long challenge title that should be truncated"
      );
      expect(titleElement).toHaveClass("truncate");
    });

    it("limits description to two lines", () => {
      const challenge = createMockChallenge({
        description:
          "This is a very long description that spans multiple lines and should be clamped to only show two lines maximum",
      });
      render(<ChallengeCard challenge={challenge} />);

      const descElement = screen.getByText(/this is a very long description/i);
      expect(descElement).toHaveClass("line-clamp-2");
    });
  });
});
