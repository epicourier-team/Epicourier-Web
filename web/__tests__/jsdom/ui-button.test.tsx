import { Button, buttonVariants } from "@/components/ui/button";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

describe("Button", () => {
  it("renders a basic button", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-background");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button")).toHaveClass("text-primary");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button")).toHaveClass("size-9");
  });

  it("renders as a child component when asChild is true", () => {
    // Line 47: asChild = true uses Slot instead of button
    render(
      <Button asChild>
        <a href="/test">Link as button</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Link as button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("passes through additional props", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("exports buttonVariants for external use", () => {
    expect(buttonVariants).toBeDefined();
    expect(typeof buttonVariants).toBe("function");

    const classes = buttonVariants({ variant: "default", size: "default" });
    expect(classes).toContain("bg-primary");
  });
});
