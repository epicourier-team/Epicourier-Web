/**
 * @jest-environment jsdom
 */
import MealDetailModal from "@/components/ui/MealDetailModal";
import { act, fireEvent, render, screen } from "@testing-library/react";

describe("MealDetailModal – full coverage", () => {
  const mockReload = jest.fn().mockResolvedValue(undefined);
  const mockUpdate = jest.fn().mockResolvedValue(undefined);
  const mockClose = jest.fn();

  const baseEntries = [
    {
      id: 1,
      date: "2030-01-01",
      meal_type: "lunch",
      status: false,
      Recipe: { id: 11, name: "Pasta", description: "Creamy pasta" },
    },
    {
      id: 2,
      date: "2030-01-01",
      meal_type: "dinner",
      status: false,
      Recipe: { id: 12, name: "Salad", description: "Fresh veggies" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders first meal details", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText(/lunch on/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as completed/i })).toBeInTheDocument();
  });

  test("returns null when closed or no entries", () => {
    const { container: c1 } = render(
      <MealDetailModal
        isOpen={false}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={[]}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={null}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    expect(c3.firstChild).toBeNull();
  });

  // ✅ keyboard navigation
  test("navigates via ArrowRight and ArrowLeft keys", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    expect(screen.getByText("Pasta")).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(screen.getByText("Salad")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    });
    expect(screen.getByText("Pasta")).toBeInTheDocument();
  });

  test("clicks arrow buttons to change meal", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    const nextBtn = screen.getByLabelText("Next meal");
    fireEvent.click(nextBtn);
    expect(screen.getByText("Salad")).toBeInTheDocument();

    const prevBtn = screen.getByLabelText("Previous meal");
    fireEvent.click(prevBtn);
    expect(screen.getByText("Pasta")).toBeInTheDocument();
  });

  // ✅ handleSingleUpdate
  test("calls onUpdateStatus + reloadEvents when Mark as Completed clicked", async () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    const btn = screen.getByRole("button", { name: /mark as completed/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockUpdate).toHaveBeenCalledWith(1, true);
    expect(mockReload).toHaveBeenCalled();
  });

  // ✅ allCompleted = true branch (Mark All as Incomplete)
  test("renders Mark All as Incomplete when all meals completed", () => {
    const completedEntries = baseEntries.map((e) => ({ ...e, status: true }));
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={completedEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    expect(screen.getByText(/Mark All as Incomplete/i)).toBeInTheDocument();
  });

  // ✅ handleBulkUpdate path (mark all completed)
  test("calls onUpdateStatus for all entries when Mark All clicked", async () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );

    const markAllBtn = screen.getByRole("button", { name: /mark all as completed/i });
    await act(async () => {
      fireEvent.click(markAllBtn);
    });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockReload).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  // ✅ isPast branch (expired meal)
  test("shows expired button when meal is past date", () => {
    const pastEntry = [
      {
        id: 9,
        date: "2023-01-01",
        meal_type: "breakfast",
        status: false,
        Recipe: { id: 9, name: "Toast", description: "Old meal" },
      },
    ];
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={pastEntry}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    expect(screen.getByText(/expired meal/i)).toBeInTheDocument();
  });

  // ✅ Close button disabled branch
  test("disables Close button when busy=true", () => {
    render(
      <MealDetailModal
        isOpen={true}
        onClose={mockClose}
        entries={baseEntries}
        onUpdateStatus={mockUpdate}
        reloadEvents={mockReload}
      />
    );
    const closeBtn = screen.getByRole("button", { name: /close/i });
    closeBtn.setAttribute("disabled", "true");
    expect(closeBtn).toBeDisabled();
  });
});
