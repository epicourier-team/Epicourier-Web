import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";

describe("InputGroup Components", () => {
  describe("InputGroup", () => {
    it("renders with correct data-slot and role", () => {
      render(<InputGroup data-testid="input-group">Content</InputGroup>);
      const group = screen.getByTestId("input-group");
      expect(group).toHaveAttribute("data-slot", "input-group");
      expect(group).toHaveAttribute("role", "group");
    });

    it("applies custom className", () => {
      render(<InputGroup className="custom-group">Content</InputGroup>);
      expect(screen.getByText("Content")).toHaveClass("custom-group");
    });
  });

  describe("InputGroupAddon", () => {
    it("renders with default inline-start alignment", () => {
      render(<InputGroupAddon data-testid="addon">$</InputGroupAddon>);
      const addon = screen.getByTestId("addon");
      expect(addon).toHaveAttribute("data-slot", "input-group-addon");
      expect(addon).toHaveAttribute("data-align", "inline-start");
    });

    it("renders with inline-end alignment", () => {
      render(
        <InputGroupAddon align="inline-end" data-testid="addon">
          .00
        </InputGroupAddon>
      );
      expect(screen.getByTestId("addon")).toHaveAttribute("data-align", "inline-end");
    });

    it("renders with block-start alignment", () => {
      render(
        <InputGroupAddon align="block-start" data-testid="addon">
          Header
        </InputGroupAddon>
      );
      expect(screen.getByTestId("addon")).toHaveAttribute("data-align", "block-start");
    });

    it("renders with block-end alignment", () => {
      render(
        <InputGroupAddon align="block-end" data-testid="addon">
          Footer
        </InputGroupAddon>
      );
      expect(screen.getByTestId("addon")).toHaveAttribute("data-align", "block-end");
    });

    it("focuses input when addon is clicked (not on button)", () => {
      const focusMock = jest.fn();
      render(
        <InputGroup>
          <InputGroupAddon data-testid="addon">$</InputGroupAddon>
          <input onFocus={focusMock} />
        </InputGroup>
      );

      fireEvent.click(screen.getByTestId("addon"));
      expect(focusMock).toHaveBeenCalled();
    });

    it("does not focus input when button inside addon is clicked", () => {
      const focusMock = jest.fn();
      render(
        <InputGroup>
          <InputGroupAddon data-testid="addon">
            <button>Click me</button>
          </InputGroupAddon>
          <input onFocus={focusMock} />
        </InputGroup>
      );

      fireEvent.click(screen.getByText("Click me"));
      expect(focusMock).not.toHaveBeenCalled();
    });

    it("applies custom className", () => {
      render(<InputGroupAddon className="custom-addon">Content</InputGroupAddon>);
      expect(screen.getByText("Content")).toHaveClass("custom-addon");
    });
  });

  describe("InputGroupButton", () => {
    it("renders button with default size xs", () => {
      render(<InputGroupButton>Click</InputGroupButton>);
      const button = screen.getByText("Click");
      expect(button).toHaveAttribute("data-size", "xs");
      expect(button).toHaveAttribute("type", "button");
    });

    it("renders with size sm", () => {
      render(<InputGroupButton size="sm">Small</InputGroupButton>);
      expect(screen.getByText("Small")).toHaveAttribute("data-size", "sm");
    });

    it("renders with icon-xs size", () => {
      render(<InputGroupButton size="icon-xs">Icon</InputGroupButton>);
      expect(screen.getByText("Icon")).toHaveAttribute("data-size", "icon-xs");
    });

    it("renders with icon-sm size", () => {
      render(<InputGroupButton size="icon-sm">Icon</InputGroupButton>);
      expect(screen.getByText("Icon")).toHaveAttribute("data-size", "icon-sm");
    });

    it("applies custom className", () => {
      render(<InputGroupButton className="custom-button">Button</InputGroupButton>);
      expect(screen.getByText("Button")).toHaveClass("custom-button");
    });

    it("passes variant prop to Button", () => {
      render(<InputGroupButton variant="outline">Outline</InputGroupButton>);
      expect(screen.getByText("Outline")).toBeInTheDocument();
    });
  });

  describe("InputGroupText", () => {
    it("renders span element", () => {
      render(<InputGroupText>Text</InputGroupText>);
      const text = screen.getByText("Text");
      expect(text.tagName).toBe("SPAN");
    });

    it("applies custom className", () => {
      render(<InputGroupText className="custom-text">Text</InputGroupText>);
      expect(screen.getByText("Text")).toHaveClass("custom-text");
    });
  });

  describe("InputGroupInput", () => {
    it("renders input with correct data-slot", () => {
      render(<InputGroupInput data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveAttribute("data-slot", "input-group-control");
    });

    it("applies custom className", () => {
      render(<InputGroupInput className="custom-input" data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveClass("custom-input");
    });

    it("passes through input props", () => {
      render(<InputGroupInput placeholder="Enter value" type="email" />);
      const input = screen.getByPlaceholderText("Enter value");
      expect(input).toHaveAttribute("type", "email");
    });
  });

  describe("InputGroupTextarea", () => {
    it("renders textarea with correct data-slot", () => {
      render(<InputGroupTextarea data-testid="textarea" />);
      expect(screen.getByTestId("textarea")).toHaveAttribute("data-slot", "input-group-control");
    });

    it("applies custom className", () => {
      render(<InputGroupTextarea className="custom-textarea" data-testid="textarea" />);
      expect(screen.getByTestId("textarea")).toHaveClass("custom-textarea");
    });

    it("passes through textarea props", () => {
      render(<InputGroupTextarea placeholder="Enter text" rows={5} />);
      const textarea = screen.getByPlaceholderText("Enter text");
      expect(textarea).toHaveAttribute("rows", "5");
    });
  });

  describe("Integration", () => {
    it("renders complete input group with prefix addon", () => {
      render(
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput placeholder="Amount" />
        </InputGroup>
      );

      expect(screen.getByText("$")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
    });

    it("renders complete input group with suffix addon", () => {
      render(
        <InputGroup>
          <InputGroupInput placeholder="Website" />
          <InputGroupAddon align="inline-end">.com</InputGroupAddon>
        </InputGroup>
      );

      expect(screen.getByText(".com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Website")).toBeInTheDocument();
    });

    it("renders input group with button", () => {
      render(
        <InputGroup>
          <InputGroupInput placeholder="Search" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Search</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      );

      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("renders input group with text and icon", () => {
      render(
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="Username" />
        </InputGroup>
      );

      expect(screen.getByText("@")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    });

    it("renders input group with textarea", () => {
      render(
        <InputGroup>
          <InputGroupAddon align="block-start">Description</InputGroupAddon>
          <InputGroupTextarea placeholder="Enter description" />
        </InputGroup>
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter description")).toBeInTheDocument();
    });
  });
});
