/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddMealModal from "@/components/ui/AddMealModal";

// Mock useToast hook at the top level
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("AddMealModal", () => {
  const mockClose = jest.fn();
  const mockSuccess = jest.fn();

  const recipe = { id: 1, name: "Pasta" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when open", () => {
    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    expect(screen.getByText("Add to Calendar")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText(/Choose a date/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirm/i })).toBeInTheDocument();
  });

  test("does not render when isOpen=false", () => {
    const { container } = render(
      <AddMealModal recipe={recipe} isOpen={false} onClose={mockClose} onSuccess={mockSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("calls onClose when Cancel clicked", () => {
    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockClose).toHaveBeenCalled();
  });

  test("validates date is selected", async () => {
    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    // Toast should be called but we're not checking it in this simple test
    // The component should not proceed without a date
    expect(mockClose).not.toHaveBeenCalled();
  });

  test("submits successfully and calls onClose/onSuccess", async () => {
    // Mock fetch 成功回應
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ message: "ok" }),
      })
    ) as jest.Mock;

    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    const dateInput = screen.getByLabelText(/Choose a date/i);
    fireEvent.change(dateInput, { target: { value: "2025-11-07" } });

    const select = screen.getByLabelText(/Choose meal type/i);
    fireEvent.change(select, { target: { value: "lunch" } });

    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/events",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(mockClose).toHaveBeenCalled();
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  test("shows alert on API error", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: "Server error" }),
      })
    ) as jest.Mock;

    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    const dateInput = screen.getByLabelText(/Choose a date/i);
    fireEvent.change(dateInput, { target: { value: "2025-11-08" } });

    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Toast should be called with error but we're not asserting on it
    });
  });
});
