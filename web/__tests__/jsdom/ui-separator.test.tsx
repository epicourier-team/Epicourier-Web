/**
 * @jest-environment jsdom
 */
import { Separator } from "@/components/ui/separator";
import { render } from "@testing-library/react";

// mock cn to simplify class joining
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("Separator component", () => {
  it("renders a horizontal separator by default", () => {
    const { container } = render(<Separator />);
    const sep = container.querySelector("div");
    expect(sep).toBeInTheDocument();
    expect(sep).toHaveClass("bg-border", "shrink-0");
    expect(sep).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders a vertical separator when orientation='vertical'", () => {
    const { container } = render(<Separator orientation="vertical" className="extra" />);
    const sep = container.querySelector("div");
    expect(sep).toHaveClass("bg-border", "shrink-0", "extra");
    expect(sep).toHaveAttribute("data-orientation", "vertical");
  });
});
