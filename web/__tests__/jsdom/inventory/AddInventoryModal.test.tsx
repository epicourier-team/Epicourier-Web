import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";

// Mock useToast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("AddInventoryModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock for ingredient search and inventory API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ingredients: [
                { id: 1, name: "Rice", unit: "kg", created_at: "2024-01-01" },
                { id: 2, name: "Milk", unit: "L", created_at: "2024-01-01" },
              ],
            }),
        });
      }
      if (url === "/api/inventory") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "new-item-1" }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when isOpen is false", () => {
    render(<AddInventoryModal isOpen={false} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal when isOpen is true", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("displays Add to Inventory title", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByRole("heading", { name: /add to inventory/i })).toBeInTheDocument();
  });

  it("displays ingredient search input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByPlaceholderText(/search for an ingredient/i)).toBeInTheDocument();
  });

  it("displays quantity input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    // There are two spinbuttons: quantity and min_quantity
    const spinbuttons = screen.getAllByRole("spinbutton");
    expect(spinbuttons.length).toBeGreaterThanOrEqual(1);
  });

  it("displays location buttons", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText("Pantry")).toBeInTheDocument();
    expect(screen.getByText("Fridge")).toBeInTheDocument();
    expect(screen.getByText("Freezer")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const mockOnClose = jest.fn();
    render(<AddInventoryModal isOpen={true} onClose={mockOnClose} onSuccess={() => {}} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows validation error when adding without selecting ingredient", async () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    // The add button should be disabled when no ingredient is selected
    const addButton = screen.getByRole("button", { name: /add to inventory/i });
    expect(addButton).toBeDisabled();
  });

  it("searches for ingredients when typing", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search for an ingredient/i);
    await user.type(searchInput, "Rice");

    // Advance past debounce time (300ms)
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/ingredients"));
    });
  });

  it("shows search results dropdown", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search for an ingredient/i);
    await user.type(searchInput, "Rice");

    // Advance past debounce time
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Rice")).toBeInTheDocument();
    });
  });

  it("allows selecting an ingredient from search results", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search for an ingredient/i);
    await user.type(searchInput, "Ri");

    // Advance past debounce time
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Rice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Rice"));

    await waitFor(() => {
      // After selection, the selected ingredient confirmation should be visible
      expect(screen.getByText(/selected: rice/i)).toBeInTheDocument();
    });
  });

  it("changes location when location button is clicked", async () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);

    const pantryButton = screen.getByText("Pantry").closest("button");
    const fridgeButton = screen.getByText("Fridge").closest("button");

    // Fridge should be selected by default
    expect(fridgeButton).toHaveClass("border-black");

    // Click pantry
    fireEvent.click(pantryButton!);

    // After click, pantry should be selected
    expect(pantryButton).toHaveClass("border-black");
  });

  it("submits form successfully", async () => {
    const mockOnSuccess = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSuccess={mockOnSuccess} />);

    // Search and select ingredient
    const searchInput = screen.getByPlaceholderText(/search for an ingredient/i);
    await user.type(searchInput, "Ri");

    // Advance past debounce time
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Rice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Rice"));

    // Enter quantity - first spinbutton is quantity
    const spinbuttons = screen.getAllByRole("spinbutton");
    await user.clear(spinbuttons[0]);
    await user.type(spinbuttons[0], "5");

    // Click add button
    const addButton = screen.getByRole("button", { name: /add to inventory/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/inventory",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
