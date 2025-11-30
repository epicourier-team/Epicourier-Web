import { render, screen } from "@testing-library/react";
import { ExpirationBadge } from "@/components/inventory/ExpirationBadge";

// Helper to create dates relative to today
const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const subDays = (days: number): string => addDays(-days);

describe("ExpirationBadge", () => {
  it("renders with data-testid", () => {
    render(<ExpirationBadge expirationDate={null} />);
    expect(screen.getByTestId("expiration-badge")).toBeInTheDocument();
  });

  it("displays 'No Date' for null expiration date", () => {
    render(<ExpirationBadge expirationDate={null} />);
    expect(screen.getByText("No Date")).toBeInTheDocument();
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("data-status", "unknown");
  });

  it("displays 'Fresh' for dates more than 7 days away", () => {
    render(<ExpirationBadge expirationDate={addDays(14)} />);
    expect(screen.getByText("Fresh")).toBeInTheDocument();
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("data-status", "good");
  });

  it("displays 'Use Soon' for dates 3-7 days away", () => {
    render(<ExpirationBadge expirationDate={addDays(5)} />);
    expect(screen.getByText("Use Soon")).toBeInTheDocument();
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("data-status", "warning");
  });

  it("displays 'Expiring Soon' for dates 0-2 days away", () => {
    render(<ExpirationBadge expirationDate={addDays(1)} />);
    expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("data-status", "critical");
  });

  it("displays 'Expired' for past dates", () => {
    render(<ExpirationBadge expirationDate={subDays(5)} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("data-status", "expired");
  });

  it("shows icon by default", () => {
    render(<ExpirationBadge expirationDate={addDays(5)} />);
    // The icon is an SVG element, we can check if there are 2 children (icon + text)
    const badge = screen.getByTestId("expiration-badge");
    expect(badge.children.length).toBe(2);
  });

  it("hides icon when showIcon is false", () => {
    render(<ExpirationBadge expirationDate={addDays(5)} showIcon={false} />);
    const badge = screen.getByTestId("expiration-badge");
    expect(badge.children.length).toBe(1);
  });

  it("shows detailed text when showDetails is true", () => {
    render(<ExpirationBadge expirationDate={addDays(5)} showDetails />);
    expect(screen.getByText("Expires in 5 days")).toBeInTheDocument();
  });

  it("shows 'Expires today' for today's date", () => {
    const today = new Date().toISOString().split("T")[0];
    render(<ExpirationBadge expirationDate={today} showDetails />);
    expect(screen.getByText("Expires today")).toBeInTheDocument();
  });

  it("shows 'Expires tomorrow' for tomorrow's date", () => {
    render(<ExpirationBadge expirationDate={addDays(1)} showDetails />);
    expect(screen.getByText("Expires tomorrow")).toBeInTheDocument();
  });

  it("shows expired days ago for past dates when showDetails is true", () => {
    render(<ExpirationBadge expirationDate={subDays(3)} showDetails />);
    expect(screen.getByText("Expired 3 days ago")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ExpirationBadge expirationDate={null} className="custom-class" />);
    expect(screen.getByTestId("expiration-badge")).toHaveClass("custom-class");
  });

  it("has correct title attribute with details", () => {
    render(<ExpirationBadge expirationDate={addDays(5)} />);
    expect(screen.getByTestId("expiration-badge")).toHaveAttribute("title", "Expires in 5 days");
  });

  it("has styling for expired status", () => {
    render(<ExpirationBadge expirationDate={subDays(1)} />);
    const badge = screen.getByTestId("expiration-badge");
    expect(badge.className).toContain("bg-red");
  });

  it("has styling for good status", () => {
    render(<ExpirationBadge expirationDate={addDays(14)} />);
    const badge = screen.getByTestId("expiration-badge");
    expect(badge.className).toContain("bg-green");
  });
});
