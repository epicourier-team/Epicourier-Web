/**
 * @jest-environment jsdom
 */
import {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
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
});
