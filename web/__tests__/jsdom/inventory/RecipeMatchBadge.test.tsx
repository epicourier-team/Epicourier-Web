import { render, screen } from "@testing-library/react";
import { RecipeMatchBadge } from "@/components/inventory/RecipeMatchBadge";

describe("RecipeMatchBadge", () => {
  it("renders with data-testid", () => {
    render(<RecipeMatchBadge matchPercentage={50} />);
    expect(screen.getByTestId("recipe-match-badge")).toBeInTheDocument();
  });

  it("displays percentage", () => {
    render(<RecipeMatchBadge matchPercentage={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("sets data-percentage attribute", () => {
    render(<RecipeMatchBadge matchPercentage={80} />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveAttribute("data-percentage", "80");
  });

  it("has green styling for 100%", () => {
    render(<RecipeMatchBadge matchPercentage={100} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("bg-green");
  });

  it("has yellow styling for 75-99%", () => {
    render(<RecipeMatchBadge matchPercentage={85} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("bg-yellow");
  });

  it("has orange styling for 50-74%", () => {
    render(<RecipeMatchBadge matchPercentage={60} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("bg-orange");
  });

  it("has red styling for 0-49%", () => {
    render(<RecipeMatchBadge matchPercentage={30} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("bg-red");
  });

  it("shows icon by default", () => {
    render(<RecipeMatchBadge matchPercentage={50} />);
    const badge = screen.getByTestId("recipe-match-badge");
    // Icon is an SVG, badge should have multiple children
    expect(badge.children.length).toBeGreaterThan(1);
  });

  it("hides icon when showIcon is false", () => {
    render(<RecipeMatchBadge matchPercentage={50} showIcon={false} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.children.length).toBe(1);
  });

  it("shows fraction when showFraction is true and counts are provided", () => {
    render(
      <RecipeMatchBadge
        matchPercentage={60}
        availableCount={3}
        totalCount={5}
        showFraction
      />
    );
    expect(screen.getByText("(3/5)")).toBeInTheDocument();
  });

  it("does not show fraction when showFraction is false", () => {
    render(
      <RecipeMatchBadge
        matchPercentage={60}
        availableCount={3}
        totalCount={5}
        showFraction={false}
      />
    );
    expect(screen.queryByText("(3/5)")).not.toBeInTheDocument();
  });

  it("does not show fraction when counts are not provided", () => {
    render(<RecipeMatchBadge matchPercentage={60} showFraction />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it("applies small size styling", () => {
    render(<RecipeMatchBadge matchPercentage={50} size="sm" />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("text-xs");
  });

  it("applies medium size styling by default", () => {
    render(<RecipeMatchBadge matchPercentage={50} />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("text-sm");
  });

  it("applies large size styling", () => {
    render(<RecipeMatchBadge matchPercentage={50} size="lg" />);
    const badge = screen.getByTestId("recipe-match-badge");
    expect(badge.className).toContain("text-base");
  });

  it("applies custom className", () => {
    render(<RecipeMatchBadge matchPercentage={50} className="custom-class" />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveClass("custom-class");
  });

  it("has correct title attribute", () => {
    render(<RecipeMatchBadge matchPercentage={100} />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveAttribute(
      "title",
      "All ingredients available"
    );
  });

  it("shows correct title for partial match", () => {
    render(<RecipeMatchBadge matchPercentage={60} />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveAttribute(
      "title",
      "Half ingredients available"
    );
  });

  it("shows correct title for few ingredients", () => {
    render(<RecipeMatchBadge matchPercentage={25} />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveAttribute(
      "title",
      "Few ingredients available"
    );
  });

  it("shows correct title for no ingredients", () => {
    render(<RecipeMatchBadge matchPercentage={0} />);
    expect(screen.getByTestId("recipe-match-badge")).toHaveAttribute(
      "title",
      "No ingredients available"
    );
  });
});
