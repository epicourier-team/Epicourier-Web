import FilterPanel from "@/components/ui/filterpanel";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockIngredients = [
  { id: 1, name: "Tomato" },
  { id: 2, name: "Cheese" },
  { id: 3, name: "Basil" },
];

const mockTags = [
  { id: 1, name: "Italian" },
  { id: 2, name: "Quick" },
];

global.fetch = jest.fn();

describe("FilterPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockIngredients }),
        });
      }
      if (url.includes("/api/tags")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockTags }),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  it("shows loading state initially", () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);
    expect(screen.getByText(/loading filters/i)).toBeInTheDocument();
  });

  it("fetches and displays ingredients and tags", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
      expect(screen.getByText("Cheese")).toBeInTheDocument();
      expect(screen.getByText("Basil")).toBeInTheDocument();
      expect(screen.getByText("Italian")).toBeInTheDocument();
      expect(screen.getByText("Quick")).toBeInTheDocument();
    });
  });

  it("calls onFilterChange when ingredient is selected", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Tomato"));

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ingredientIds: [1],
      tagIds: [],
    });
  });

  it("calls onFilterChange when tag is selected", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Italian")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Italian"));

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ingredientIds: [],
      tagIds: [1],
    });
  });

  it("toggles ingredient selection on and off", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Cheese")).toBeInTheDocument();
    });

    const cheeseButton = screen.getByText("Cheese");

    fireEvent.click(cheeseButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ingredientIds: [2],
      tagIds: [],
    });

    fireEvent.click(cheeseButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ingredientIds: [],
      tagIds: [],
    });
  });

  it("allows multiple ingredient selections", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Tomato"));
    fireEvent.click(screen.getByText("Cheese"));

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      ingredientIds: [1, 2],
      tagIds: [],
    });
  });

  it("allows multiple tag selections", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Italian")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Italian"));
    fireEvent.click(screen.getByText("Quick"));

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      ingredientIds: [],
      tagIds: [1, 2],
    });
  });

  it("renders pagination controls for ingredients", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    const ingredientPrevButtons = screen.getAllByText("Prev");
    const ingredientNextButtons = screen.getAllByText("Next");

    expect(ingredientPrevButtons.length).toBeGreaterThan(0);
    expect(ingredientNextButtons.length).toBeGreaterThan(0);
  });

  it("disables ingredient Prev button on first page", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    const prevButtons = screen.getAllByText("Prev");
    const ingredientPrevButton = prevButtons[0];

    expect(ingredientPrevButton).toBeDisabled();
  });

  it("changes ingredient page when Next is clicked", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    const nextButtons = screen.getAllByText("Next");
    const ingredientNextButton = nextButtons[0];

    fireEvent.click(ingredientNextButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2")
      );
    });
  });

  it("handles fetch errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading filters/i)).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("applies active styles to selected ingredients", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Tomato")).toBeInTheDocument();
    });

    const tomatoButton = screen.getByText("Tomato");
    fireEvent.click(tomatoButton);

    expect(tomatoButton).toHaveClass("border-green-500", "bg-green-200");
  });

  it("applies active styles to selected tags", async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);

    await waitFor(() => {
      expect(screen.getByText("Italian")).toBeInTheDocument();
    });

    const italianButton = screen.getByText("Italian");
    fireEvent.click(italianButton);

    expect(italianButton).toHaveClass("border-blue-500", "bg-blue-200");
  });
});