import { render, screen, fireEvent } from "@testing-library/react";
import { LowStockBanner } from "@/components/inventory/LowStockBanner";

describe("LowStockBanner", () => {
  it("renders nothing when lowStockCount is 0", () => {
    const { container } = render(<LowStockBanner lowStockCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders banner when lowStockCount is greater than 0", () => {
    render(<LowStockBanner lowStockCount={5} />);
    expect(screen.getByTestId("low-stock-banner")).toBeInTheDocument();
  });

  it("shows 'Low Stock Warning' title when no critical items", () => {
    render(<LowStockBanner lowStockCount={3} />);
    expect(screen.getByTestId("low-stock-title")).toHaveTextContent("Low Stock Warning");
  });

  it("shows 'Stock Alert!' title when there are critical items", () => {
    render(<LowStockBanner lowStockCount={5} criticalCount={2} />);
    expect(screen.getByTestId("low-stock-title")).toHaveTextContent("Stock Alert!");
  });

  it("shows correct message for single item", () => {
    render(<LowStockBanner lowStockCount={1} />);
    expect(screen.getByTestId("low-stock-message")).toHaveTextContent("1 item is running low");
  });

  it("shows correct message for multiple items", () => {
    render(<LowStockBanner lowStockCount={5} />);
    expect(screen.getByTestId("low-stock-message")).toHaveTextContent("5 items are running low");
  });

  it("shows critical message for single out of stock item", () => {
    render(<LowStockBanner lowStockCount={1} criticalCount={1} />);
    expect(screen.getByTestId("low-stock-message")).toHaveTextContent("1 item is out of stock");
  });

  it("shows critical message for multiple out of stock items", () => {
    render(<LowStockBanner lowStockCount={3} criticalCount={3} />);
    expect(screen.getByTestId("low-stock-message")).toHaveTextContent("3 items are out of stock");
  });

  it("shows View Items button when onViewItems is provided", () => {
    render(<LowStockBanner lowStockCount={3} onViewItems={() => {}} />);
    expect(screen.getByTestId("view-low-stock-button")).toBeInTheDocument();
  });

  it("hides View Items button when onViewItems is not provided", () => {
    render(<LowStockBanner lowStockCount={3} />);
    expect(screen.queryByTestId("view-low-stock-button")).not.toBeInTheDocument();
  });

  it("calls onViewItems when button is clicked", () => {
    const mockOnViewItems = jest.fn();
    render(<LowStockBanner lowStockCount={3} onViewItems={mockOnViewItems} />);
    
    fireEvent.click(screen.getByTestId("view-low-stock-button"));
    expect(mockOnViewItems).toHaveBeenCalledTimes(1);
  });

  it("has yellow styling when no critical items", () => {
    render(<LowStockBanner lowStockCount={3} />);
    const banner = screen.getByTestId("low-stock-banner");
    expect(banner.className).toContain("bg-yellow");
  });

  it("has red styling when there are critical items", () => {
    render(<LowStockBanner lowStockCount={3} criticalCount={1} />);
    const banner = screen.getByTestId("low-stock-banner");
    expect(banner.className).toContain("bg-red");
  });

  it("applies custom className", () => {
    render(<LowStockBanner lowStockCount={3} className="custom-class" />);
    expect(screen.getByTestId("low-stock-banner")).toHaveClass("custom-class");
  });

  it("defaults criticalCount to 0 when not provided", () => {
    render(<LowStockBanner lowStockCount={3} />);
    // Should not show critical styling or message
    expect(screen.getByTestId("low-stock-title")).toHaveTextContent("Low Stock Warning");
    expect(screen.getByTestId("low-stock-banner").className).toContain("bg-yellow");
  });
});
