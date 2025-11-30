import { render, screen, fireEvent } from "@testing-library/react";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryItemWithDetails } from "@/types/data";

// Helper to create dates relative to today
const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const createMockItem = (overrides: Partial<InventoryItemWithDetails> = {}): InventoryItemWithDetails => ({
  id: "1",
  user_id: "user-1",
  ingredient_id: 1,
  quantity: 5,
  unit: "kg",
  location: "pantry",
  expiration_date: addDays(14),
  min_quantity: 2,
  notes: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  ingredient: {
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
  expiration_status: "good",
  days_until_expiration: 14,
  is_low_stock: false,
  ...overrides,
});

// Type reference for proper typing
type MockItemType = ReturnType<typeof createMockItem>;

describe("InventoryCard", () => {
  it("renders with data-testid", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.getByTestId("inventory-card")).toBeInTheDocument();
  });

  it("displays item name", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.getByTestId("item-name")).toHaveTextContent("Rice");
  });

  it("displays fallback name when ingredient name is not available", () => {
    const item = createMockItem({ ingredient: undefined as unknown as MockItemType["ingredient"] });
    render(<InventoryCard item={item} />);
    expect(screen.getByTestId("item-name")).toHaveTextContent("Item #1");
  });

  it("displays quantity and unit", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.getByTestId("item-quantity")).toHaveTextContent("5 kg");
  });

  it("displays quantity without unit when unit is null", () => {
    const item = createMockItem({ unit: null });
    render(<InventoryCard item={item} />);
    expect(screen.getByTestId("item-quantity")).toHaveTextContent("5");
  });

  it("displays location badge", () => {
    render(<InventoryCard item={createMockItem({ location: "fridge" })} />);
    expect(screen.getByTestId("item-location")).toHaveTextContent("Fridge");
  });

  it("displays location badge for pantry", () => {
    render(<InventoryCard item={createMockItem({ location: "pantry" })} />);
    expect(screen.getByTestId("item-location")).toHaveTextContent("Pantry");
  });

  it("displays location badge for freezer", () => {
    render(<InventoryCard item={createMockItem({ location: "freezer" })} />);
    expect(screen.getByTestId("item-location")).toHaveTextContent("Freezer");
  });

  it("displays min quantity when set", () => {
    render(<InventoryCard item={createMockItem({ min_quantity: 3 })} />);
    expect(screen.getByTestId("item-min-quantity")).toHaveTextContent("3 kg");
  });

  it("does not display min quantity when null", () => {
    render(<InventoryCard item={createMockItem({ min_quantity: null })} />);
    expect(screen.queryByTestId("item-min-quantity")).not.toBeInTheDocument();
  });

  it("displays stock status when min_quantity is set", () => {
    render(<InventoryCard item={createMockItem({ quantity: 10, min_quantity: 5 })} />);
    expect(screen.getByTestId("stock-status")).toHaveTextContent("In Stock");
  });

  it("displays Low Stock status when quantity is at or below min", () => {
    render(<InventoryCard item={createMockItem({ quantity: 2, min_quantity: 5 })} />);
    expect(screen.getByTestId("stock-status")).toHaveTextContent("Low Stock");
  });

  it("displays Out of Stock status when quantity is 0", () => {
    render(<InventoryCard item={createMockItem({ quantity: 0, min_quantity: 5 })} />);
    expect(screen.getByTestId("stock-status")).toHaveTextContent("Out of Stock");
  });

  it("does not display stock status when min_quantity is null", () => {
    render(<InventoryCard item={createMockItem({ min_quantity: null })} />);
    expect(screen.queryByTestId("stock-status")).not.toBeInTheDocument();
  });

  it("displays expiration badge", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.getByTestId("expiration-badge")).toBeInTheDocument();
  });

  it("displays notes when available", () => {
    render(<InventoryCard item={createMockItem({ notes: "Check freshness" })} />);
    expect(screen.getByText("Check freshness")).toBeInTheDocument();
  });

  it("does not display notes when null", () => {
    render(<InventoryCard item={createMockItem({ notes: null })} />);
    expect(screen.queryByText("Check freshness")).not.toBeInTheDocument();
  });

  it("shows edit button when onEdit is provided", () => {
    render(<InventoryCard item={createMockItem()} onEdit={() => {}} />);
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
  });

  it("hides edit button when onEdit is not provided", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const mockOnEdit = jest.fn();
    const item = createMockItem();
    render(<InventoryCard item={item} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByTestId("edit-button"));
    expect(mockOnEdit).toHaveBeenCalledWith(item);
  });

  it("shows delete button when onDelete is provided", () => {
    render(<InventoryCard item={createMockItem()} onDelete={() => {}} />);
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
  });

  it("hides delete button when onDelete is not provided", () => {
    render(<InventoryCard item={createMockItem()} />);
    expect(screen.queryByTestId("delete-button")).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    const mockOnDelete = jest.fn();
    const item = createMockItem();
    render(<InventoryCard item={item} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByTestId("delete-button"));
    expect(mockOnDelete).toHaveBeenCalledWith(item);
  });

  it("sets data-item-id attribute", () => {
    render(<InventoryCard item={createMockItem({ id: "test-123" })} />);
    expect(screen.getByTestId("inventory-card")).toHaveAttribute("data-item-id", "test-123");
  });

  it("applies custom className", () => {
    render(<InventoryCard item={createMockItem()} className="custom-class" />);
    expect(screen.getByTestId("inventory-card")).toHaveClass("custom-class");
  });

  it("has border styling based on stock status - adequate", () => {
    render(<InventoryCard item={createMockItem({ quantity: 10, min_quantity: 5 })} />);
    const card = screen.getByTestId("inventory-card");
    expect(card.className).toContain("border-l-green");
  });

  it("has border styling based on stock status - low", () => {
    render(<InventoryCard item={createMockItem({ quantity: 3, min_quantity: 5 })} />);
    const card = screen.getByTestId("inventory-card");
    expect(card.className).toContain("border-l-orange");
  });

  it("has border styling based on stock status - critical", () => {
    render(<InventoryCard item={createMockItem({ quantity: 0, min_quantity: 5 })} />);
    const card = screen.getByTestId("inventory-card");
    expect(card.className).toContain("border-l-red");
  });
});
