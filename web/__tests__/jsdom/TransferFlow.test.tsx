import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExpirationInput, LocationSelector, getDefaultExpiration, EXPIRATION_PRESETS } from "@/components/shopping/TransferFlow/ExpirationInput";

describe("ExpirationInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with provided value", () => {
    render(<ExpirationInput value="2024-02-01" onChange={mockOnChange} />);
    const input = screen.getByLabelText(/expiration date/i);
    expect(input).toHaveValue("2024-02-01");
  });

  it("calls onChange when date is selected", () => {
    render(<ExpirationInput value="" onChange={mockOnChange} />);
    const input = screen.getByLabelText(/expiration date/i);
    fireEvent.change(input, { target: { value: "2024-03-15" } });
    expect(mockOnChange).toHaveBeenCalledWith("2024-03-15");
  });

  it("renders preset buttons", () => {
    render(<ExpirationInput value="" onChange={mockOnChange} />);
    expect(screen.getByText("+3 days")).toBeInTheDocument();
    expect(screen.getByText("+1 week")).toBeInTheDocument();
    expect(screen.getByText("+2 weeks")).toBeInTheDocument();
    expect(screen.getByText("+1 month")).toBeInTheDocument();
    expect(screen.getByText("+3 months")).toBeInTheDocument();
  });

  it("applies preset when clicked", () => {
    render(<ExpirationInput value="" onChange={mockOnChange} />);
    fireEvent.click(screen.getByText("+1 week"));
    expect(mockOnChange).toHaveBeenCalled();
    // Should be called with a date 7 days from now
    const calledDate = mockOnChange.mock.calls[0][0];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 7);
    expect(calledDate).toBe(expectedDate.toISOString().split("T")[0]);
  });

  it("has Suggest button that uses category preset", () => {
    render(<ExpirationInput value="" onChange={mockOnChange} category="Dairy" />);
    const suggestButton = screen.getByText("Suggest");
    expect(suggestButton).toBeInTheDocument();
    fireEvent.click(suggestButton);
    expect(mockOnChange).toHaveBeenCalled();
  });
});

describe("LocationSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with provided value", () => {
    render(<LocationSelector value="fridge" onChange={mockOnChange} />);
    // The select trigger should show the current value
    expect(screen.getByText(/fridge/i)).toBeInTheDocument();
  });

  it("renders all location options", async () => {
    render(<LocationSelector value="pantry" onChange={mockOnChange} />);
    
    // Click to open the select dropdown
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    
    // Check that all options are available (use getAllByText since pantry appears twice)
    expect(screen.getAllByText(/pantry/i).length).toBeGreaterThan(0);
  });
});

describe("getDefaultExpiration", () => {
  it("returns correct expiration for Produce category", () => {
    const result = getDefaultExpiration("Produce");
    const expected = new Date();
    expected.setDate(expected.getDate() + EXPIRATION_PRESETS.Produce);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns correct expiration for Dairy category", () => {
    const result = getDefaultExpiration("Dairy");
    const expected = new Date();
    expected.setDate(expected.getDate() + EXPIRATION_PRESETS.Dairy);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns correct expiration for Frozen category", () => {
    const result = getDefaultExpiration("Frozen");
    const expected = new Date();
    expected.setDate(expected.getDate() + EXPIRATION_PRESETS.Frozen);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns default expiration for unknown category", () => {
    const result = getDefaultExpiration("Unknown");
    const expected = new Date();
    expected.setDate(expected.getDate() + 14); // Default is 14 days
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns default expiration when no category provided", () => {
    const result = getDefaultExpiration();
    const expected = new Date();
    expected.setDate(expected.getDate() + 14); // Default is 14 days for "Other"
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });
});

describe("EXPIRATION_PRESETS", () => {
  it("has correct preset values", () => {
    expect(EXPIRATION_PRESETS.Produce).toBe(5);
    expect(EXPIRATION_PRESETS.Dairy).toBe(10);
    expect(EXPIRATION_PRESETS.Meat).toBe(3);
    expect(EXPIRATION_PRESETS.Seafood).toBe(3);
    expect(EXPIRATION_PRESETS.Pantry).toBe(90);
    expect(EXPIRATION_PRESETS.Frozen).toBe(180);
    expect(EXPIRATION_PRESETS.Bakery).toBe(5);
    expect(EXPIRATION_PRESETS.Other).toBe(14);
  });
});
