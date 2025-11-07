/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CalendarPage from "@/app/dashboard/calendar/page";
import { EventClickArg } from "@fullcalendar/core";

// ------------------------------
// Type Definitions
// ------------------------------
interface CalendarApiResponse {
  id: number;
  date: string;
  meal_type: string;
  status: boolean | null;
  Recipe: { name: string };
}

interface MockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MockCalendarProps {
  events: unknown[];
  eventClick: (arg: EventClickArg) => void;
}

// ------------------------------
// Mock dependencies
// ------------------------------
jest.mock("@/utils/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { email: "test@example.com" } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({
          data: { fullname: "Test User", username: "testuser" },
        })
      ),
    })),
  })),
}));

jest.mock("@/components/ui/AddMealModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: MockModalProps) =>
    isOpen ? (
      <div data-testid="AddMealModal">
        <button onClick={onClose}>Close AddMealModal</button>
      </div>
    ) : null,
}));

jest.mock("@/components/ui/MealDetailModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: MockModalProps) =>
    isOpen ? (
      <div data-testid="MealDetailModal">
        <button onClick={onClose}>Close MealDetailModal</button>
      </div>
    ) : null,
}));

jest.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: ({ events, eventClick }: MockCalendarProps) => (
    <div data-testid="MockCalendar">
      <button
        onClick={() => {
          const fakeEvent: EventClickArg = {
            event: {
              extendedProps: {
                calendarData: [
                  {
                    id: 1,
                    date: "2025-11-06",
                    meal_type: "lunch",
                    status: false,
                    Recipe: { name: "Pasta" },
                  } as CalendarApiResponse,
                ],
                isPast: false,
              },
            },
          } as unknown as EventClickArg;
          eventClick(fakeEvent);
        }}
      >
        Mock Event
      </button>
      <span>Events count: {events?.length ?? 0}</span>
    </div>
  ),
}));

// ------------------------------
// Global mocks
// ------------------------------
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// ------------------------------
// TEST SUITE
// ------------------------------
describe("CalendarPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header and fetches user info", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    render(<CalendarPage />);

    // 初始狀態
    expect(screen.getByText(/Loading Calendar/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Test User's Calendar/i)).toBeInTheDocument();
    });
  });

  test("clicking Get Recommendations fetches data and displays items", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "Recipe A",
            description: "Yummy",
            min_prep_time: 10,
            green_score: 90,
          },
        ],
      });

    render(<CalendarPage />);

    const button = screen.getByRole("button", { name: /Get Recommendations/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Recipe A")).toBeInTheDocument();
    });
  });

  test("clicking + Add to Calendar opens AddMealModal", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 2,
            name: "Recipe B",
            description: "Delicious",
            min_prep_time: 15,
          },
        ],
      });

    render(<CalendarPage />);

    const getRecBtn = await screen.findByRole("button", { name: /Get Recommendations/i });
    fireEvent.click(getRecBtn);

    await waitFor(() => {
      expect(screen.getByText("Recipe B")).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /\+ Add to Calendar/i });
    fireEvent.click(addBtn);

    expect(await screen.findByTestId("AddMealModal")).toBeInTheDocument();

    // 關閉 modal
    const closeAddModal = screen.getByText(/Close AddMealModal/i);
    fireEvent.click(closeAddModal);
    expect(screen.queryByTestId("AddMealModal")).not.toBeInTheDocument();
  });

  test("clicking an event opens MealDetailModal", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<CalendarPage />);

    const mockEvent = await screen.findByText("Mock Event");
    fireEvent.click(mockEvent);

    await waitFor(() => {
      expect(screen.getByTestId("MealDetailModal")).toBeInTheDocument();
    });

    const closeBtn = screen.getByText(/Close MealDetailModal/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("MealDetailModal")).not.toBeInTheDocument();
  });
});
