/**
 * @jest-environment jsdom
 */
import { Skeleton } from "@/components/ui/skeleton";
import { render } from "@testing-library/react";

// mock cn util for deterministic output
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("Skeleton component", () => {
  it("renders a div with default skeleton classes", () => {
    const { container } = render(<Skeleton />);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass("bg-muted", "animate-pulse", "rounded-md");
  });

  it("applies additional className properly", () => {
    const { container } = render(<Skeleton className="extra" />);
    const div = container.querySelector("div");
    expect(div).toHaveClass("extra");
  });
});
