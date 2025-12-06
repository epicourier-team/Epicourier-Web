import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { AchievementToast } from "@/components/ui/AchievementToast";
import {
  AchievementNotificationProvider,
  useAchievementNotification,
} from "@/hooks/useAchievementNotification";
import { Achievement } from "@/types/data";

// Mock timers
jest.useFakeTimers();

// Sample achievement data
const mockAchievement: Achievement = {
  id: 1,
  name: "first_meal",
  title: "First Steps",
  description: "Log your first meal",
  icon: "utensils",
  tier: "bronze",
  criteria: {
    type: "count",
    metric: "meals_logged",
    target: 1,
  },
};

const mockGoldAchievement: Achievement = {
  id: 2,
  name: "meal_master",
  title: "Meal Master",
  description: "Log 100 meals",
  icon: "trophy",
  tier: "gold",
  criteria: {
    type: "count",
    metric: "meals_logged",
    target: 100,
  },
};

const mockPlatinumAchievement: Achievement = {
  id: 3,
  name: "legendary_chef",
  title: "Legendary Chef",
  description: "Complete all challenges",
  icon: "chef-hat",
  tier: "platinum",
  criteria: {
    type: "count",
    metric: "days_tracked",
    target: 50,
  },
};

describe("AchievementToast", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Rendering", () => {
    it("renders achievement title and description", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByText("First Steps")).toBeInTheDocument();
      expect(screen.getByText("Log your first meal")).toBeInTheDocument();
    });

    it('displays "Achievement Unlocked!" header', () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByText("Achievement Unlocked!")).toBeInTheDocument();
    });

    it("displays celebration emoji", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByText("🎉")).toBeInTheDocument();
    });

    it("displays tier badge", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByText("bronze")).toBeInTheDocument();
    });

    it("has close button", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });
  });

  describe("Tier Styling", () => {
    it("applies bronze styling for bronze tier", () => {
      const { container } = render(
        <AchievementToast achievement={mockAchievement} onClose={mockOnClose} />
      );

      expect(container.querySelector(".bg-amber-50")).toBeInTheDocument();
    });

    it("applies gold styling for gold tier", () => {
      const { container } = render(
        <AchievementToast achievement={mockGoldAchievement} onClose={mockOnClose} />
      );

      expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument();
    });

    it("applies platinum styling for platinum tier", () => {
      const { container } = render(
        <AchievementToast achievement={mockPlatinumAchievement} onClose={mockOnClose} />
      );

      expect(container.querySelector(".bg-cyan-50")).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      // Wait for exit animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("auto-dismisses after duration", () => {
      render(
        <AchievementToast achievement={mockAchievement} onClose={mockOnClose} duration={5000} />
      );

      // Should not close before duration
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Should close after duration + exit animation
      act(() => {
        jest.advanceTimersByTime(1300);
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("has alert role", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has polite aria-live", () => {
      render(<AchievementToast achievement={mockAchievement} onClose={mockOnClose} />);

      expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "polite");
    });
  });
});

describe("useAchievementNotification", () => {
  // Helper component to test hook
  function TestComponent() {
    const { showAchievement, showAchievements, dismissAll, notifications } =
      useAchievementNotification();

    return (
      <div>
        <button onClick={() => showAchievement(mockAchievement)}>Show Bronze</button>
        <button onClick={() => showAchievement(mockGoldAchievement)}>Show Gold</button>
        <button
          onClick={() =>
            showAchievements([mockAchievement, mockGoldAchievement, mockPlatinumAchievement])
          }
        >
          Show Multiple
        </button>
        <button onClick={dismissAll}>Dismiss All</button>
        <div data-testid="notification-count">{notifications.length}</div>
      </div>
    );
  }

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAchievementNotification must be used within an AchievementNotificationProvider");

    consoleSpy.mockRestore();
  });

  it("shows single achievement notification", async () => {
    render(
      <AchievementNotificationProvider>
        <TestComponent />
      </AchievementNotificationProvider>
    );

    fireEvent.click(screen.getByText("Show Bronze"));

    await waitFor(() => {
      expect(screen.getByText("First Steps")).toBeInTheDocument();
    });
  });

  it("shows multiple achievements sequentially", async () => {
    render(
      <AchievementNotificationProvider maxVisible={3} queueDelay={100}>
        <TestComponent />
      </AchievementNotificationProvider>
    );

    fireEvent.click(screen.getByText("Show Multiple"));

    // First should appear immediately
    await waitFor(() => {
      expect(screen.getByText("First Steps")).toBeInTheDocument();
    });

    // Process queue
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should have more notifications
    await waitFor(() => {
      expect(screen.getByTestId("notification-count").textContent).toBe("2");
    });
  });

  it("respects maxVisible limit", async () => {
    render(
      <AchievementNotificationProvider maxVisible={2}>
        <TestComponent />
      </AchievementNotificationProvider>
    );

    fireEvent.click(screen.getByText("Show Bronze"));
    fireEvent.click(screen.getByText("Show Gold"));

    await waitFor(() => {
      expect(screen.getByTestId("notification-count").textContent).toBe("2");
    });

    // Third one should be queued
    fireEvent.click(screen.getByText("Show Bronze"));

    // Still only 2 visible
    expect(screen.getByTestId("notification-count").textContent).toBe("2");
  });

  it("dismisses all notifications", async () => {
    render(
      <AchievementNotificationProvider>
        <TestComponent />
      </AchievementNotificationProvider>
    );

    fireEvent.click(screen.getByText("Show Bronze"));
    fireEvent.click(screen.getByText("Show Gold"));

    await waitFor(() => {
      expect(screen.getByTestId("notification-count").textContent).toBe("2");
    });

    fireEvent.click(screen.getByText("Dismiss All"));

    await waitFor(() => {
      expect(screen.getByTestId("notification-count").textContent).toBe("0");
    });
  });
});

describe("AchievementNotificationProvider", () => {
  it("renders children", () => {
    render(
      <AchievementNotificationProvider>
        <div data-testid="child">Child Content</div>
      </AchievementNotificationProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("uses default configuration values", () => {
    // Test that component renders without errors with default props
    expect(() => {
      render(
        <AchievementNotificationProvider>
          <div>Test</div>
        </AchievementNotificationProvider>
      );
    }).not.toThrow();
  });

  it("accepts custom configuration", () => {
    expect(() => {
      render(
        <AchievementNotificationProvider maxVisible={5} defaultDuration={3000} queueDelay={200}>
          <div>Test</div>
        </AchievementNotificationProvider>
      );
    }).not.toThrow();
  });
});
