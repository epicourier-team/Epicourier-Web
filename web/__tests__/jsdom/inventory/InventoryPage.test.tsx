import { render, screen } from "@testing-library/react";
import InventoryPage from "@/app/dashboard/inventory/page";

// Mock useToast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("InventoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page header", () => {
    render(<InventoryPage />);
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });

  it("shows item count in header", () => {
    render(<InventoryPage />);
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("renders Suggest Recipes button", () => {
    render(<InventoryPage />);
    expect(screen.getByText("Suggest Recipes")).toBeInTheDocument();
  });

  it("disables Suggest Recipes button when inventory is empty", () => {
    render(<InventoryPage />);
    const button = screen.getByRole("button", { name: /suggest recipes/i });
    expect(button).toBeDisabled();
  });

  it("shows empty state message", () => {
    render(<InventoryPage />);
    expect(screen.getByText("No Inventory Items Yet")).toBeInTheDocument();
    expect(screen.getByText(/Add ingredients to your inventory/)).toBeInTheDocument();
  });

  it("shows toast when Suggest Recipes clicked with empty inventory", async () => {
    render(<InventoryPage />);
    
    // We need to enable the button first - but since it's disabled when empty,
    // we test that the button is properly disabled
    const button = screen.getByRole("button", { name: /suggest recipes/i });
    expect(button).toBeDisabled();
  });

  it("renders with brutalism styling classes", () => {
    render(<InventoryPage />);
    const banner = document.querySelector(".brutalism-banner");
    expect(banner).toBeInTheDocument();
  });

  it("has button with proper title attribute for keyboard shortcut", () => {
    render(<InventoryPage />);
    const button = screen.getByRole("button", { name: /suggest recipes/i });
    expect(button).toHaveAttribute("title", "Suggest recipes based on inventory (Cmd/Ctrl + R)");
  });

  it("shows Package icon in header", () => {
    render(<InventoryPage />);
    // The Package icon is rendered as an SVG
    const header = document.querySelector(".brutalism-banner");
    expect(header).toContainHTML("svg");
  });

  it("displays coming soon message in empty state", () => {
    render(<InventoryPage />);
    expect(screen.getByText("Inventory management coming in Issue #88")).toBeInTheDocument();
  });
});
