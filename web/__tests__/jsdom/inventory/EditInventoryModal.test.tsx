import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditInventoryModal from "@/components/inventory/EditInventoryModal";
import type { InventoryItemWithDetails, Ingredient } from "@/types/data";

// Mock useToast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

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
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it("renders nothing when item is null", () => {
    const { container } = render(
      <EditInventoryModal
        item={null}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders modal when isOpen is true and item is provided", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole("heading", { name: /edit item/i })).toBeInTheDocument();
    expect(screen.getByText("Chicken Breast")).toBeInTheDocument();
  });

  it("displays ingredient name in the description", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
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
        onSuccess={mockOnSuccess}
      />
    );

    // Check quantity input - first spinbutton in the form
    const spinbuttons = screen.getAllByRole("spinbutton");
    expect(spinbuttons[0]).toHaveValue(5);

    // Check unit input
    const unitInput = screen.getByPlaceholderText(/g, ml, pcs/i);
    expect(unitInput).toHaveValue("kg");

    // Check location is selected (fridge button should be active)
    const fridgeButton = screen.getByRole("button", { name: /fridge/i });
    expect(fridgeButton).toHaveClass("bg-black");

    // Check notes
    const notesInput = screen.getByPlaceholderText(/optional notes/i);
    expect(notesInput).toHaveValue("Test notes");
  });

  it("calls onClose when cancel button is clicked", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("validates quantity before submission", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear quantity - first spinbutton is the quantity input
    const spinbuttons = screen.getAllByRole("spinbutton");
    fireEvent.change(spinbuttons[0], { target: { value: "" } });

    // Submit form
    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "⚠️ Invalid Quantity",
          variant: "destructive",
        })
      );
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls API with correct data when form is submitted", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Update quantity - first spinbutton is the quantity input
    const spinbuttons = screen.getAllByRole("spinbutton");
    fireEvent.change(spinbuttons[0], { target: { value: "10" } });

    // Change location to pantry
    const pantryButton = screen.getByRole("button", { name: /pantry/i });
    fireEvent.click(pantryButton);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/inventory/${mockItem.id}`,
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"quantity":10'),
        })
      );
    });
  });

  it("calls onSuccess after successful submission", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "✅ Updated",
      })
    );
  });

  it("shows error toast when API call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "❌ Error",
          variant: "destructive",
        })
      );
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("shows loading state when submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockImplementationOnce(() => pendingPromise);

    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("updates form when item prop changes", () => {
    const { rerender } = render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // First spinbutton is quantity input
    const spinbuttons = screen.getAllByRole("spinbutton");
    expect(spinbuttons[0]).toHaveValue(5);

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
        onSuccess={mockOnSuccess}
      />
    );

    expect(spinbuttons[0]).toHaveValue(15);
  });

  it("allows changing storage location", () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Initially fridge is selected
    const fridgeButton = screen.getByRole("button", { name: /fridge/i });
    expect(fridgeButton).toHaveClass("bg-black");

    // Click freezer
    const freezerButton = screen.getByRole("button", { name: /freezer/i });
    fireEvent.click(freezerButton);

    // Now freezer should be selected
    expect(freezerButton).toHaveClass("bg-black");
    expect(fridgeButton).not.toHaveClass("bg-black");
  });

  it("handles item without ingredient name gracefully", () => {
    // Test edge case where ingredient might be missing (using type assertion)
    const itemWithoutIngredient = {
      ...mockItem,
      ingredient: undefined,
    } as unknown as InventoryItemWithDetails;

    render(
      <EditInventoryModal
        item={itemWithoutIngredient}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/ingredient #1/i)).toBeInTheDocument();
  });

  it("clears optional fields correctly when submitting", async () => {
    render(
      <EditInventoryModal
        item={mockItem}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear notes
    const notesInput = screen.getByPlaceholderText(/optional notes/i);
    fireEvent.change(notesInput, { target: { value: "" } });

    // Submit form
    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.notes).toBeNull();
  });
});
