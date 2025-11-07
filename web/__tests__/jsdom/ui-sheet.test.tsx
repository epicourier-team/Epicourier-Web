/**
 * @jest-environment jsdom
 */
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// Simple mock for className joiner
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));
jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="lucide-x" />,
}));

describe("Sheet components (Radix Dialog wrapper)", () => {
  /**
   * Helper: render an already open sheet.
   * We pass `open` prop directly so the content mounts immediately.
   */
  function renderOpenSheet(children?: React.ReactNode) {
    return render(
      <Sheet open onOpenChange={() => {}}>
        <SheetContent side="right">{children}</SheetContent>
      </Sheet>
    );
  }

  it("renders overlay, header, footer, title, and description", () => {
    renderOpenSheet(
      <>
        <SheetOverlay data-testid="overlay" />
        <SheetHeader data-testid="header" />
        <SheetFooter data-testid="footer" />
        <SheetTitle>My Title</SheetTitle>
        <SheetDescription>My Description</SheetDescription>
        <button>Inner Button</button>
      </>
    );

    // Core elements are present
    expect(screen.getByTestId("overlay")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Description")).toBeInTheDocument();
    expect(screen.getByText("Inner Button")).toBeInTheDocument();

    // Close button (the "X") should render too
    const closeBtn = screen.getByRole("button", { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it("applies variant classes for each side", () => {
    const sides = ["top", "bottom", "left", "right"] as const;
    for (const side of sides) {
      const { unmount } = render(
        <Sheet open>
          <SheetContent side={side}>Side: {side}</SheetContent>
        </Sheet>
      );
      const text = screen.getByText(`Side: ${side}`);
      const container = text.closest("div");
      expect(container?.className).toContain(side);
      unmount();
    }
  });

  it("renders overlay with custom class", () => {
    renderOpenSheet(<SheetOverlay className="custom-overlay" />);
    expect(document.querySelector(".custom-overlay")).toBeInTheDocument();
  });

  it("closes when clicking close button", () => {
    const handleChange = jest.fn();
    render(
      <Sheet open onOpenChange={handleChange}>
        <SheetContent>
          <button>Dummy</button>
        </SheetContent>
      </Sheet>
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    // onOpenChange should be called with false
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("renders SheetTitle and SheetDescription correctly", () => {
    // Must be wrapped in <Sheet open> for Radix context
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle className="title">Title</SheetTitle>
          <SheetDescription className="desc">Desc</SheetDescription>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText("Title")).toHaveClass("title");
    expect(screen.getByText("Desc")).toHaveClass("desc");
  });
  it("renders the Close button with icon and sr-only text", () => {
    render(
      <Sheet open>
        <SheetContent>
          <span>Content</span>
        </SheetContent>
      </Sheet>
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    // the icon (svg from lucide-react) should exist
    const icon = closeBtn.querySelector("svg");
    expect(icon).toBeInTheDocument();

    // the sr-only span text should also be present
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByTestId("lucide-x")).toBeInTheDocument();
  });
});
