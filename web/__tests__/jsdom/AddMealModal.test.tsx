/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddMealModal from "@/components/ui/AddMealModal";

describe("AddMealModal", () => {
  const mockClose = jest.fn();
  const mockSuccess = jest.fn();

  const recipe = { id: 1, name: "Pasta" };

  beforeEach(() => {
    jest.clearAllMocks();
    // mock alert
    global.alert = jest.fn();
  });

  test("renders correctly when open", () => {
    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    expect(screen.getByText(/Select Date for Pasta/)).toBeInTheDocument();
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

  test("shows alert if date not selected", async () => {
    render(
      <AddMealModal recipe={recipe} isOpen={true} onClose={mockClose} onSuccess={mockSuccess} />
    );

    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    expect(global.alert).toHaveBeenCalledWith("Please select a date");
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
      expect(global.alert).toHaveBeenCalledWith("✅ Added to Calendar!");
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
      expect(global.alert).toHaveBeenCalledWith("❌ Failed to add: Server error");
    });
  });
});
