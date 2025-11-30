import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditInventoryModal from "@/components/inventory/EditInventoryModal";
import type { InventoryItemWithDetails, Ingredient } from "@/types/data";

describe("EditInventoryModal", () => {
  const mockIngredient: Ingredient = {
    id: 1,
    name: "Chicken Breast",
    unit: "kg",
    calories_kcal: 165,
    protein_g: 31,
    carbs_g: 0,
    sugars_g: 0,
    agg_fats_g: 3.6,
    cholesterol_mg: 85,
    agg_minerals_mg: 0,
    vit_a_microg: 0,
    agg_vit_b_mg: 0,
    vit_c_mg: 0,
    vit_d_microg: 0,
    vit_e_mg: 0,
    vit_k_microg: 0,
    created_at: "2025-01-01T00:00:00Z",
  };

  const mockItem: InventoryItemWithDetails = {
    id: "test-id-123",
    user_id: "user-123",
    ingredient_id: 1,
    quantity: 5,
    unit: "kg",
    location: "fridge",
    expiration_date: "2025-12-25",
    min_quantity: 2,
    notes: "Test notes",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ingredient: mockIngredient,
    expiration_status: "good",
    days_until_expiration: 25,
    is_low_stock: false,
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(true);
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByTestId("edit-inventory-modal")).not.toBeInTheDocument();
  });

  it("renders nothing when item is null", () => {
    render(
      <EditInventoryModal item={null} isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.queryByTestId("edit-inventory-modal")).not.toBeInTheDocument();
  });

  it("renders modal when isOpen is true and item is provided", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("edit-inventory-modal")).toBeInTheDocument();
    expect(screen.getByText("Edit Inventory Item")).toBeInTheDocument();
  });

  it("displays ingredient name as read-only", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("Chicken Breast")).toBeInTheDocument();
  });

  it("populates form with item data", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("quantity-input")).toHaveValue(5);
    expect(screen.getByTestId("unit-input")).toHaveValue("kg");
    expect(screen.getByTestId("location-select")).toHaveValue("fridge");
    expect(screen.getByTestId("expiration-input")).toHaveValue("2025-12-25");
    expect(screen.getByTestId("min-quantity-input")).toHaveValue(2);
    expect(screen.getByTestId("notes-input")).toHaveValue("Test notes");
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("close-modal-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("validates quantity before submission", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const quantityInput = screen.getByTestId("quantity-input");
    // HTML5 validation: input has min="0.01" attribute
    expect(quantityInput).toHaveAttribute("min", "0.01");
    expect(quantityInput).toHaveAttribute("required");
  });

  it("calls onSubmit with correct data when form is submitted", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Update some fields
    const quantityInput = screen.getByTestId("quantity-input");
    fireEvent.change(quantityInput, { target: { value: "10" } });

    const locationSelect = screen.getByTestId("location-select");
    fireEvent.change(locationSelect, { target: { value: "pantry" } });

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("test-id-123", {
        quantity: 10,
        unit: "kg",
        location: "pantry",
        expiration_date: "2025-12-25",
        min_quantity: 2,
        notes: "Test notes",
      });
    });
  });

  it("closes modal on successful submission", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error message when submission fails", async () => {
    mockOnSubmit.mockResolvedValueOnce(false);

    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent(
        "Failed to update item. Please try again."
      );
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("shows loading state when submitting", async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    expect(screen.getByText("Saving...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("updates form when item prop changes", () => {
    const { rerender } = render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("quantity-input")).toHaveValue(5);

    const updatedItem: InventoryItemWithDetails = {
      ...mockItem,
      quantity: 15,
      location: "freezer",
    };

    rerender(
      <EditInventoryModal
        item={updatedItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("quantity-input")).toHaveValue(15);
    expect(screen.getByTestId("location-select")).toHaveValue("freezer");
  });

  it("clears optional fields correctly", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Clear expiration date
    const expirationInput = screen.getByTestId("expiration-input");
    fireEvent.change(expirationInput, { target: { value: "" } });

    // Clear min quantity
    const minQuantityInput = screen.getByTestId("min-quantity-input");
    fireEvent.change(minQuantityInput, { target: { value: "" } });

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "test-id-123",
        expect.objectContaining({
          expiration_date: null,
          min_quantity: null,
        })
      );
    });
  });
});
