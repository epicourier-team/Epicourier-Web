import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenu Components", () => {
  describe("DropdownMenu", () => {
    it("renders dropdown menu with trigger and content", async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText("Open Menu");
      expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger");

      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
      });
    });
  });

  describe("DropdownMenuTrigger", () => {
    it("renders with correct data-slot", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByText("Trigger")).toHaveAttribute("data-slot", "dropdown-menu-trigger");
    });
  });

  describe("DropdownMenuContent", () => {
    it("renders content when menu is open", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content here</DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Content here")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-content"
        );
      });
    });

    it("applies custom className", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">Content</DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Content")).toHaveClass("custom-content");
      });
    });
  });

  describe("DropdownMenuItem", () => {
    it("renders with default variant", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Default Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        const item = screen.getByText("Default Item");
        expect(item).toHaveAttribute("data-slot", "dropdown-menu-item");
        expect(item).toHaveAttribute("data-variant", "default");
      });
    });

    it("renders with destructive variant", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Delete")).toHaveAttribute("data-variant", "destructive");
      });
    });

    it("renders with inset", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Inset Item")).toHaveAttribute("data-inset", "true");
      });
    });

    it("applies custom className", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Item")).toHaveClass("custom-item");
      });
    });
  });

  describe("DropdownMenuCheckboxItem", () => {
    it("renders checkbox item", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Checked Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Checked Item")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-checkbox-item"
        );
      });
    });

    it("renders unchecked state", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>Unchecked</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Unchecked")).toBeInTheDocument();
      });
    });
  });

  describe("DropdownMenuRadioGroup and DropdownMenuRadioItem", () => {
    it("renders radio group with items", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-radio-item"
        );
        expect(screen.getByText("Option 2")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-radio-item"
        );
      });
    });
  });

  describe("DropdownMenuLabel", () => {
    it("renders label with correct data-slot", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Menu Label")).toHaveAttribute("data-slot", "dropdown-menu-label");
      });
    });

    it("renders with inset", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Inset Label")).toHaveAttribute("data-inset", "true");
      });
    });
  });

  describe("DropdownMenuSeparator", () => {
    it("renders separator with correct data-slot", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Before</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>After</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByTestId("separator")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-separator"
        );
      });
    });
  });

  describe("DropdownMenuShortcut", () => {
    it("renders shortcut text", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("⌘S")).toHaveAttribute("data-slot", "dropdown-menu-shortcut");
      });
    });
  });

  describe("DropdownMenuGroup", () => {
    it("renders group with correct data-slot", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup data-testid="group">
              <DropdownMenuItem>Group Item</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "dropdown-menu-group");
      });
    });
  });

  describe("DropdownMenuSub", () => {
    it("renders submenu with trigger and content", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("More Options")).toHaveAttribute(
          "data-slot",
          "dropdown-menu-sub-trigger"
        );
      });
    });

    it("renders sub trigger with inset", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Inset Sub</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Inset Sub")).toHaveAttribute("data-inset", "true");
      });
    });
  });

  describe("DropdownMenuPortal", () => {
    it("renders portal component", () => {
      // Portal is used internally by DropdownMenuContent
      // Just verify it can be used without errors
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      );

      // Should render without errors
      expect(screen.getByText("Open")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete dropdown menu", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("My Account")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("⇧⌘P")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.getByText("Log out")).toBeInTheDocument();
      });
    });
  });
});
