import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import InventoryPage from "@/app/dashboard/inventory/page";

// Mock useToast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock confirm dialog
const mockConfirm = jest.fn(() => true);
global.confirm = mockConfirm;

describe("InventoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: empty inventory
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/inventory") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [],
              summary: {
                total_items: 0,
                expiring_soon: 0,
                expired: 0,
                low_stock: 0,
                by_location: { pantry: 0, fridge: 0, freezer: 0, other: 0 },
              },
            }),
        });
      }
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders loading state initially", () => {
    render(<InventoryPage />);
    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
  });

  it("renders the page header after loading", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Inventory")).toBeInTheDocument();
    });
  });

  it("shows item count in header", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });
  });

  it("renders Suggest Recipes button", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Suggest Recipes")).toBeInTheDocument();
    });
  });

  it("renders Add Item button", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });
  });

  it("disables Suggest Recipes button when inventory is empty", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /suggest recipes/i });
      expect(button).toBeDisabled();
    });
  });

  it("shows empty state message", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("No Inventory Items Yet")).toBeInTheDocument();
      expect(screen.getByText(/Add ingredients to your inventory/)).toBeInTheDocument();
    });
  });

  it("renders with brutalism styling classes", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      const banner = document.querySelector(".brutalism-banner");
      expect(banner).toBeInTheDocument();
    });
  });

  it("has button with proper title attribute", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /suggest recipes/i });
      expect(button).toHaveAttribute("title", "Suggest recipes based on inventory");
    });
  });

  it("shows Package icon in header", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      const header = document.querySelector(".brutalism-banner");
      expect(header).toContainHTML("svg");
    });
  });

  it("shows Add First Item button in empty state", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Add First Item")).toBeInTheDocument();
    });
  });

  it("opens add modal when Add Item button is clicked", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Item"));

    await waitFor(() => {
      expect(screen.getByText("Add Inventory Item")).toBeInTheDocument();
    });
  });

  it("shows toast when fetch fails", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(<InventoryPage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "❌ Error",
          description: "Failed to load inventory",
          variant: "destructive",
        })
      );
    });
  });

  it("shows authentication toast when unauthorized", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    );

    render(<InventoryPage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "⚠️ Authentication Required",
          description: "Please sign in to view your inventory",
          variant: "destructive",
        })
      );
    });
  });

  it("renders inventory items when available", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/inventory") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "1",
                  user_id: "user-1",
                  ingredient_id: 1,
                  quantity: 2,
                  unit: "kg",
                  location: "fridge",
                  expiration_date: "2025-12-15",
                  min_quantity: 1,
                  notes: null,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                  ingredient: { id: 1, name: "Chicken Breast", unit: "kg" },
                  expiration_status: "good",
                  days_until_expiration: 15,
                  is_low_stock: false,
                },
              ],
              summary: {
                total_items: 1,
                expiring_soon: 0,
                expired: 0,
                low_stock: 0,
                by_location: { pantry: 0, fridge: 1, freezer: 0, other: 0 },
              },
            }),
        });
      }
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText("1 item")).toBeInTheDocument();
      expect(screen.getByText("Chicken Breast")).toBeInTheDocument();
    });
  });

  it("shows location filter buttons with counts", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/inventory") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "1",
                  user_id: "user-1",
                  ingredient_id: 1,
                  quantity: 2,
                  unit: "kg",
                  location: "fridge",
                  expiration_date: null,
                  min_quantity: null,
                  notes: null,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                  ingredient: { id: 1, name: "Milk", unit: "L" },
                  expiration_status: "unknown",
                  days_until_expiration: null,
                  is_low_stock: false,
                },
              ],
              summary: {
                total_items: 1,
                expiring_soon: 0,
                expired: 0,
                low_stock: 0,
                by_location: { pantry: 0, fridge: 1, freezer: 0, other: 0 },
              },
            }),
        });
      }
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<InventoryPage />);

    await waitFor(() => {
      // Check that location summary is shown
      expect(screen.getByText("fridge")).toBeInTheDocument();
      expect(screen.getByText("pantry")).toBeInTheDocument();
    });
  });

  it("filters items by search query", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/inventory") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "1",
                  user_id: "user-1",
                  ingredient_id: 1,
                  quantity: 2,
                  unit: "kg",
                  location: "fridge",
                  expiration_date: null,
                  min_quantity: null,
                  notes: null,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                  ingredient: { id: 1, name: "Chicken", unit: "kg" },
                  expiration_status: "unknown",
                  days_until_expiration: null,
                  is_low_stock: false,
                },
                {
                  id: "2",
                  user_id: "user-1",
                  ingredient_id: 2,
                  quantity: 1,
                  unit: "L",
                  location: "fridge",
                  expiration_date: null,
                  min_quantity: null,
                  notes: null,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                  ingredient: { id: 2, name: "Milk", unit: "L" },
                  expiration_status: "unknown",
                  days_until_expiration: null,
                  is_low_stock: false,
                },
              ],
              summary: {
                total_items: 2,
                expiring_soon: 0,
                expired: 0,
                low_stock: 0,
                by_location: { pantry: 0, fridge: 2, freezer: 0, other: 0 },
              },
            }),
        });
      }
      if (url.includes("/api/ingredients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText("Chicken")).toBeInTheDocument();
      expect(screen.getByText("Milk")).toBeInTheDocument();
    });

    // Search for "Chicken"
    const searchInput = screen.getByPlaceholderText("Search ingredients...");
    fireEvent.change(searchInput, { target: { value: "Chicken" } });

    await waitFor(() => {
      expect(screen.getByText("Chicken")).toBeInTheDocument();
      expect(screen.queryByText("Milk")).not.toBeInTheDocument();
    });
  });
});
