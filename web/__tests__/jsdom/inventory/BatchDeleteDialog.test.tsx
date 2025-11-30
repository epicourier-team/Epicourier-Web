import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BatchDeleteDialog from "@/components/inventory/BatchDeleteDialog";
import type { InventoryItemWithDetails, ExpirationStatus, Ingredient } from "@/types/data";

// Mock useToast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a minimal mock ingredient
const createMockIngredient = (id: number, name: string): Ingredient =>
  ({
    id,
    name,
    unit: "pcs",
    created_at: new Date().toISOString(),
    agg_fats_g: null,
    agg_minerals_mg: null,
    agg_vit_b_mg: null,
    calories_kcal: null,
    carbs_g: null,
    cholesterol_mg: null,
    protein_g: null,
    sugars_g: null,
    vit_a_microg: null,
    vit_c_mg: null,
    vit_d_microg: null,
    vit_e_mg: null,
    vit_k_microg: null,
  }) as Ingredient;

const createMockItem = (
  id: string,
  name: string,
  expirationStatus: ExpirationStatus = "good"
): InventoryItemWithDetails => ({
  id,
  user_id: "user-1",
  ingredient_id: 1,
  quantity: 2,
  unit: "pcs",
  location: "fridge",
  expiration_date: null,
  min_quantity: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ingredient: createMockIngredient(1, name),
  expiration_status: expirationStatus,
  days_until_expiration: null,
  is_low_stock: false,
});

describe("BatchDeleteDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <BatchDeleteDialog
        isOpen={false}
        items={[createMockItem("1", "Apples")]}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("renders dialog with item count when open", () => {
    const items = [createMockItem("1", "Apples"), createMockItem("2", "Oranges")];

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(screen.getByText("Delete 2 Items?")).toBeInTheDocument();
    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Oranges")).toBeInTheDocument();
  });

  it("shows correct singular text for one item", () => {
    const items = [createMockItem("1", "Milk")];

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(screen.getByText("Delete 1 Item?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete 1 Item/i })).toBeInTheDocument();
  });

  it("shows expiration status badges", () => {
    const items = [
      createMockItem("1", "Expired Milk", "expired"),
      createMockItem("2", "Almost Bad Eggs", "critical"),
      createMockItem("3", "Fresh Apples", "good"),
    ];

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(screen.getByText("1 expired")).toBeInTheDocument();
    expect(screen.getByText("1 expiring soon")).toBeInTheDocument();
  });

  it("shows truncated list for more than 10 items", () => {
    const items = Array.from({ length: 15 }, (_, i) => createMockItem(`${i}`, `Item ${i + 1}`));

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 10")).toBeInTheDocument();
    expect(screen.getByText("...and 5 more items")).toBeInTheDocument();
    expect(screen.queryByText("Item 11")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const mockOnClose = jest.fn();
    const items = [createMockItem("1", "Apples")];

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={mockOnClose} onSuccess={jest.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls API and onSuccess when delete is confirmed", async () => {
    const mockOnSuccess = jest.fn();
    const items = [createMockItem("1", "Apples"), createMockItem("2", "Oranges")];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, deleted_count: 2 }),
    });

    render(
      <BatchDeleteDialog
        isOpen={true}
        items={items}
        onClose={jest.fn()}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete 2 Items/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/inventory/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["1", "2"] }),
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Items Deleted",
      description: "Successfully deleted 2 items from inventory",
    });
  });

  it("shows error toast when delete fails", async () => {
    const mockOnSuccess = jest.fn();
    const items = [createMockItem("1", "Apples")];

    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    render(
      <BatchDeleteDialog
        isOpen={true}
        items={items}
        onClose={jest.fn()}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete 1 Item/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to delete items. Please try again.",
        variant: "destructive",
      });
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("shows loading state while deleting", async () => {
    const items = [createMockItem("1", "Apples")];

    // Create a promise that we can resolve manually
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(fetchPromise);

    render(
      <BatchDeleteDialog isOpen={true} items={items} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete 1 Item/i }));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });

    // Buttons should be disabled
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true, deleted_count: 1 }),
    });
  });

  it("does not call API when items array is empty", async () => {
    render(
      <BatchDeleteDialog isOpen={true} items={[]} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    const deleteButton = screen.getByRole("button", { name: /Delete 0 Items/i });
    fireEvent.click(deleteButton);

    // Wait a bit to make sure fetch wasn't called
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
