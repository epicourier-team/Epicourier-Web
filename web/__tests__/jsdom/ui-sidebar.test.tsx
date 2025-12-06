/**
 * @jest-environment jsdom
 */
import {
  Sidebar,
  SidebarContent,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { fireEvent, render, screen } from "@testing-library/react";

import { useIsMobile } from "@/hooks/use-mobile";
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}));

describe("Sidebar Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset cookies
    document.cookie = "";
  });

  test("SidebarProvider toggles open state and stores cookie", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    expect(document.cookie).toContain("sidebar_state");
  });

  // 🧱 2. useSidebar outside provider throws error
  test("useSidebar throws error when used outside provider", () => {
    const Broken = () => {
      useSidebar();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/useSidebar must be used/);
  });

  // 🧱 3. Keyboard shortcut (Ctrl+B)
  test("Keyboard shortcut toggles sidebar", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(document.cookie).toContain("sidebar_state");
  });

  // 🧱 5. SidebarMenuButton without tooltip
  test("SidebarMenuButton without tooltip renders as plain button", () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton isActive>Plain</SidebarMenuButton>
      </SidebarProvider>
    );
    expect(screen.getByRole("button", { name: /plain/i })).toHaveAttribute("data-active", "true");
  });

  // 🧱 6. SidebarMenuAction showOnHover true
  test("SidebarMenuAction applies hover class when showOnHover", () => {
    render(
      <SidebarProvider>
        <SidebarMenuAction showOnHover title="hover test" />
      </SidebarProvider>
    );
    const btn = screen.getByTitle("hover test");
    expect(btn.className).toContain("opacity");
  });

  // 🧱 7. SidebarMenuSubButton with various props
  test("SidebarMenuSubButton renders for size=sm, md and isActive", () => {
    const { rerender } = render(
      <SidebarProvider>
        <SidebarMenuSubButton size="sm" isActive>
          SubSm
        </SidebarMenuSubButton>
      </SidebarProvider>
    );
    expect(screen.getByText("SubSm")).toHaveAttribute("data-size", "sm");

    rerender(
      <SidebarProvider>
        <SidebarMenuSubButton size="md" isActive={false}>
          SubMd
        </SidebarMenuSubButton>
      </SidebarProvider>
    );
    expect(screen.getByText("SubMd")).toHaveAttribute("data-size", "md");
  });

  test("SidebarRail click toggles sidebar", () => {
    render(
      <SidebarProvider>
        <SidebarRail />
      </SidebarProvider>
    );
    const rail = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(rail);
    expect(document.cookie).toContain("sidebar_state");
  });

  // 🧱 9. SidebarMenuBadge displays child text
  test("SidebarMenuBadge renders text", () => {
    render(
      <SidebarProvider>
        <SidebarMenuBadge>3</SidebarMenuBadge>
      </SidebarProvider>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("SidebarTrigger toggles sidebar in mobile mode (no dynamic import)", () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);

    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);
    expect(document.cookie).toContain("sidebar_state");
  });

  // Line 75: Test internal _setOpen when no setOpenProp provided
  test("SidebarProvider uses internal state when no onOpenChange prop", () => {
    // When no onOpenChange is provided, line 75 _setOpen is used
    render(
      <SidebarProvider defaultOpen={true}>
        <SidebarTrigger />
        <Sidebar>
          <SidebarContent data-testid="sidebar-content">Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    // Initial state should be open
    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });

    // Toggle to close - this uses the internal _setOpen (line 75)
    fireEvent.click(trigger);
    expect(document.cookie).toContain("sidebar_state=false");
  });

  // Line 404: SidebarGroupAction with asChild prop
  test("SidebarGroupAction renders as Slot when asChild is true", () => {
    render(
      <SidebarProvider>
        <SidebarGroupAction asChild>
          <a href="#test">Link Action</a>
        </SidebarGroupAction>
      </SidebarProvider>
    );
    const link = screen.getByText("Link Action");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "#test");
  });

  test("SidebarGroupAction renders as button when asChild is false", () => {
    render(
      <SidebarProvider>
        <SidebarGroupAction>Button Action</SidebarGroupAction>
      </SidebarProvider>
    );
    const button = screen.getByText("Button Action");
    expect(button.tagName).toBe("BUTTON");
  });

  // Line 586-587: SidebarMenuSkeleton with showIcon prop
  test("SidebarMenuSkeleton renders with icon when showIcon is true", () => {
    render(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon data-testid="skeleton" />
      </SidebarProvider>
    );
    const skeleton = screen.getByTestId("skeleton");
    const iconSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-icon"]');
    expect(iconSkeleton).toBeInTheDocument();
  });

  test("SidebarMenuSkeleton renders without icon when showIcon is false", () => {
    render(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon={false} data-testid="skeleton" />
      </SidebarProvider>
    );
    const skeleton = screen.getByTestId("skeleton");
    const iconSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-icon"]');
    expect(iconSkeleton).not.toBeInTheDocument();
  });

  // Line 383: SidebarGroupLabel with asChild prop
  test("SidebarGroupLabel renders as Slot when asChild is true", () => {
    render(
      <SidebarProvider>
        <SidebarGroupLabel asChild>
          <span data-testid="label-slot">Custom Label</span>
        </SidebarGroupLabel>
      </SidebarProvider>
    );
    const label = screen.getByTestId("label-slot");
    expect(label.tagName).toBe("SPAN");
    expect(label).toHaveTextContent("Custom Label");
  });

  test("SidebarGroupLabel renders as div when asChild is false", () => {
    render(
      <SidebarProvider>
        <SidebarGroupLabel data-testid="label-div">Default Label</SidebarGroupLabel>
      </SidebarProvider>
    );
    const label = screen.getByTestId("label-div");
    expect(label.tagName).toBe("DIV");
  });

  // Line 508-509: SidebarMenuButton with string tooltip
  test("SidebarMenuButton with string tooltip wraps in Tooltip", () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton tooltip="My Tooltip">With Tooltip</SidebarMenuButton>
      </SidebarProvider>
    );
    // Button should render
    expect(screen.getByRole("button", { name: /with tooltip/i })).toBeInTheDocument();
  });

  // Line 508-509: SidebarMenuButton with object tooltip
  test("SidebarMenuButton with object tooltip wraps in Tooltip", () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton tooltip={{ children: "Object Tooltip" }}>
          With Object Tooltip
        </SidebarMenuButton>
      </SidebarProvider>
    );
    expect(screen.getByRole("button", { name: /with object tooltip/i })).toBeInTheDocument();
  });
});
