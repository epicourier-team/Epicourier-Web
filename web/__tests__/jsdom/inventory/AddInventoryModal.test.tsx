import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";
import { Ingredient } from "@/types/data";

const mockIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Rice",
    unit: "kg",
    created_at: "2024-01-01",
    calories_kcal: null,
    protein_g: null,
    carbs_g: null,
    agg_fats_g: null,
    agg_minerals_mg: null,
    agg_vit_b_mg: null,
    cholesterol_mg: null,
    sugars_g: null,
    vit_a_microg: null,
    vit_c_mg: null,
    vit_d_microg: null,
    vit_e_mg: null,
    vit_k_microg: null,
  },
  {
    id: 2,
    name: "Milk",
    unit: "L",
    created_at: "2024-01-01",
    calories_kcal: null,
    protein_g: null,
    carbs_g: null,
    agg_fats_g: null,
    agg_minerals_mg: null,
    agg_vit_b_mg: null,
    cholesterol_mg: null,
    sugars_g: null,
    vit_a_microg: null,
    vit_c_mg: null,
    vit_d_microg: null,
    vit_e_mg: null,
    vit_k_microg: null,
  },
  {
    id: 3,
    name: "Milk Powder",
    unit: "g",
    created_at: "2024-01-01",
    calories_kcal: null,
    protein_g: null,
    carbs_g: null,
    agg_fats_g: null,
    agg_minerals_mg: null,
    agg_vit_b_mg: null,
    cholesterol_mg: null,
    sugars_g: null,
    vit_a_microg: null,
    vit_c_mg: null,
    vit_d_microg: null,
    vit_e_mg: null,
    vit_k_microg: null,
  },
];

describe("AddInventoryModal", () => {
  it("renders nothing when isOpen is false", () => {
    render(<AddInventoryModal isOpen={false} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.queryByTestId("add-inventory-modal")).not.toBeInTheDocument();
  });

  it("renders modal when isOpen is true", () => {
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );
    expect(screen.getByTestId("add-inventory-modal")).toBeInTheDocument();
  });

  it("displays Add Inventory Item title", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByText("Add Inventory Item")).toBeInTheDocument();
  });

  it("displays ingredient autocomplete input", () => {
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );
    expect(screen.getByTestId("ingredient-input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search ingredients...")).toBeInTheDocument();
  });

  it("shows suggestions when typing in ingredient input", async () => {
    const user = userEvent.setup();
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Mil");

    await waitFor(() => {
      expect(screen.getByTestId("ingredient-suggestions")).toBeInTheDocument();
      expect(screen.getByText("Milk")).toBeInTheDocument();
      expect(screen.getByText("Milk Powder")).toBeInTheDocument();
    });
  });

  it("filters suggestions based on search query", async () => {
    const user = userEvent.setup();
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");

    await waitFor(() => {
      expect(screen.getByTestId("ingredient-suggestions")).toBeInTheDocument();
      expect(screen.getByText("Rice")).toBeInTheDocument();
      expect(screen.queryByText("Milk")).not.toBeInTheDocument();
    });
  });

  it("selects ingredient when clicking on suggestion", async () => {
    const user = userEvent.setup();
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");

    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("suggestion-1"));

    // Should show selected ingredient indicator
    expect(screen.getByText("✓ Rice")).toBeInTheDocument();
    // Unit should be auto-filled
    expect(screen.getByTestId("unit-input")).toHaveValue("kg");
  });

  it("displays quantity input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("quantity-input")).toBeInTheDocument();
  });

  it("displays unit input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("unit-input")).toBeInTheDocument();
  });

  it("displays location select with options", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    const locationSelect = screen.getByTestId("location-select");
    expect(locationSelect).toBeInTheDocument();
    expect(screen.getByText("Pantry")).toBeInTheDocument();
    expect(screen.getByText("Fridge")).toBeInTheDocument();
    expect(screen.getByText("Freezer")).toBeInTheDocument();
  });

  it("displays expiration date input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("expiration-input")).toBeInTheDocument();
  });

  it("displays min quantity input", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("min-quantity-input")).toBeInTheDocument();
  });

  it("displays notes textarea", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("notes-input")).toBeInTheDocument();
  });

  it("displays submit button", () => {
    render(<AddInventoryModal isOpen={true} onClose={() => {}} onSubmit={async () => true} />);
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(<AddInventoryModal isOpen={true} onClose={mockOnClose} onSubmit={async () => true} />);

    fireEvent.click(screen.getByTestId("close-modal-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows error when submitting without selecting ingredient", async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent("Please select an ingredient");
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("validates quantity is greater than 0", async () => {
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    // Check the HTML5 validation attributes on quantity input
    const quantityInput = screen.getByTestId("quantity-input");
    expect(quantityInput).toHaveAttribute("min", "0.01");
    expect(quantityInput).toHaveAttribute("required");
  });

  it("calls onSubmit with correct data when form is valid", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnClose = jest.fn();

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient via autocomplete
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    const quantityInput = screen.getByTestId("quantity-input");
    await user.clear(quantityInput);
    await user.type(quantityInput, "5");

    await user.selectOptions(screen.getByTestId("location-select"), "fridge");

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ingredient_id: 1,
        quantity: 5,
        unit: "kg",
        location: "fridge",
        expiration_date: undefined,
        min_quantity: undefined,
        notes: undefined,
      });
    });
  });

  it("closes modal after successful submission", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnClose = jest.fn();

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error when onSubmit returns false", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(false);

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent("Failed to add item");
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    // Create a promise that we control
    let resolveSubmit: (value: boolean) => void;
    const mockOnSubmit = jest.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Adding...")).toBeInTheDocument();
    });

    // Resolve the promise
    resolveSubmit!(true);
  });

  it("handles submission errors gracefully", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error("Network error"));

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent("An error occurred");
    });
  });

  it("includes optional fields when provided", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(true);

    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockOnSubmit}
        ingredients={mockIngredients}
      />
    );

    // Select ingredient
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("suggestion-1"));

    const quantityInput = screen.getByTestId("quantity-input");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");

    // Unit is auto-filled but we can change it
    const unitInput = screen.getByTestId("unit-input");
    await user.clear(unitInput);
    await user.type(unitInput, "bags");

    await user.selectOptions(screen.getByTestId("location-select"), "pantry");

    const expirationInput = screen.getByTestId("expiration-input");
    await user.type(expirationInput, "2024-12-31");

    const minQuantityInput = screen.getByTestId("min-quantity-input");
    await user.type(minQuantityInput, "3");

    await user.type(screen.getByTestId("notes-input"), "Test notes");

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ingredient_id: 1,
        quantity: 10,
        unit: "bags",
        location: "pantry",
        expiration_date: "2024-12-31",
        min_quantity: 3,
        notes: "Test notes",
      });
    });
  });

  it("resets form when closed and reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    // Fill some fields
    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Rice");
    await user.type(screen.getByTestId("notes-input"), "Test");

    // Close the modal
    fireEvent.click(screen.getByTestId("close-modal-button"));

    // Rerender as open
    rerender(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    // Form should be reset
    expect(screen.getByTestId("ingredient-input")).toHaveValue("");
    expect(screen.getByTestId("notes-input")).toHaveValue("");
  });

  it("supports keyboard navigation in suggestions", async () => {
    const user = userEvent.setup();
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "Mil");

    await waitFor(() => {
      expect(screen.getByTestId("ingredient-suggestions")).toBeInTheDocument();
    });

    // Press arrow down to highlight first item
    await user.keyboard("{ArrowDown}");
    // Press Enter to select
    await user.keyboard("{Enter}");

    // Should show selected ingredient
    expect(screen.getByText("✓ Milk")).toBeInTheDocument();
  });

  it("shows no results message when no ingredients match", async () => {
    const user = userEvent.setup();
    render(
      <AddInventoryModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={async () => true}
        ingredients={mockIngredients}
      />
    );

    const input = screen.getByTestId("ingredient-input");
    await user.type(input, "xyz123");

    await waitFor(() => {
      expect(screen.getByText("No ingredients found")).toBeInTheDocument();
    });
  });
});
