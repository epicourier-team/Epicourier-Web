/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MealDetailModal from "@/components/ui/MealDetailModal";

describe("MealDetailModal (client component)", () => {
  const mockReload = jest.fn();
  const mockUpdate = jest.fn();
  const mockClose = jest.fn();

  const mockEntries = [
    {
      id: 1,
      date: "2025-11-06",
      meal_type: "lunch",
      status: false,
      Recipe: { id: 11, name: "Pasta", description: "Creamy pasta" },
    },
    {
      id: 2,
      date: "2025-11-06",
      meal_type: "dinner",
      status: false,
      Recipe: { id: 12, name: "Salad", description: "Fresh veggies" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the first meal's details", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={mockEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText(/lunch on/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as completed/i })).toBeInTheDocument();
  });

  test("calls onUpdateStatus when clicking Mark as Completed", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={mockEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    const completeBtn = screen.getByRole("button", {
      name: /mark as completed/i,
    });
    fireEvent.click(completeBtn);

    expect(mockUpdate).toHaveBeenCalledWith(1, true);
  });

  test("navigates to next meal when clicking right arrow", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={mockEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    // 初始應顯示 Pasta
    expect(screen.getByText("Pasta")).toBeInTheDocument();

    const nextBtn = screen.getByLabelText("Next meal");
    fireEvent.click(nextBtn);

    // 切換後顯示 Salad
    expect(screen.getByText("Salad")).toBeInTheDocument();
  });

  test("calls onClose when Close button clicked", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={mockEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    expect(mockClose).toHaveBeenCalled();
  });
});
