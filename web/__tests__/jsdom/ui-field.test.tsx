import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from "@/components/ui/field";

describe("Field Components", () => {
  describe("FieldSet", () => {
    it("renders fieldset element", () => {
      render(<FieldSet data-testid="fieldset">Content</FieldSet>);
      const fieldset = screen.getByTestId("fieldset");
      expect(fieldset.tagName).toBe("FIELDSET");
      expect(fieldset).toHaveAttribute("data-slot", "field-set");
    });

    it("applies custom className", () => {
      render(<FieldSet className="custom-class">Content</FieldSet>);
      expect(screen.getByText("Content")).toHaveClass("custom-class");
    });
  });

  describe("FieldLegend", () => {
    it("renders legend element with default variant", () => {
      render(<FieldLegend>Legend Text</FieldLegend>);
      const legend = screen.getByText("Legend Text");
      expect(legend.tagName).toBe("LEGEND");
      expect(legend).toHaveAttribute("data-slot", "field-legend");
      expect(legend).toHaveAttribute("data-variant", "legend");
    });

    it("renders with label variant", () => {
      render(<FieldLegend variant="label">Label Text</FieldLegend>);
      expect(screen.getByText("Label Text")).toHaveAttribute("data-variant", "label");
    });

    it("applies custom className", () => {
      render(<FieldLegend className="custom-legend">Legend</FieldLegend>);
      expect(screen.getByText("Legend")).toHaveClass("custom-legend");
    });
  });

  describe("FieldGroup", () => {
    it("renders div with correct data-slot", () => {
      render(<FieldGroup data-testid="field-group">Group Content</FieldGroup>);
      const group = screen.getByTestId("field-group");
      expect(group).toHaveAttribute("data-slot", "field-group");
    });

    it("applies custom className", () => {
      render(<FieldGroup className="custom-group">Content</FieldGroup>);
      expect(screen.getByText("Content")).toHaveClass("custom-group");
    });
  });

  describe("Field", () => {
    it("renders with default vertical orientation", () => {
      render(<Field data-testid="field">Field Content</Field>);
      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("role", "group");
      expect(field).toHaveAttribute("data-slot", "field");
      expect(field).toHaveAttribute("data-orientation", "vertical");
    });

    it("renders with horizontal orientation", () => {
      render(
        <Field orientation="horizontal" data-testid="field">
          Content
        </Field>
      );
      expect(screen.getByTestId("field")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders with responsive orientation", () => {
      render(
        <Field orientation="responsive" data-testid="field">
          Content
        </Field>
      );
      expect(screen.getByTestId("field")).toHaveAttribute("data-orientation", "responsive");
    });

    it("applies custom className", () => {
      render(<Field className="custom-field">Content</Field>);
      expect(screen.getByText("Content")).toHaveClass("custom-field");
    });
  });

  describe("FieldContent", () => {
    it("renders div with correct data-slot", () => {
      render(<FieldContent data-testid="content">Content</FieldContent>);
      expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "field-content");
    });

    it("applies custom className", () => {
      render(<FieldContent className="custom-content">Content</FieldContent>);
      expect(screen.getByText("Content")).toHaveClass("custom-content");
    });
  });

  describe("FieldLabel", () => {
    it("renders label with correct data-slot", () => {
      render(<FieldLabel>Label Text</FieldLabel>);
      expect(screen.getByText("Label Text")).toHaveAttribute("data-slot", "field-label");
    });

    it("applies custom className", () => {
      render(<FieldLabel className="custom-label">Label</FieldLabel>);
      expect(screen.getByText("Label")).toHaveClass("custom-label");
    });
  });

  describe("FieldTitle", () => {
    it("renders div with correct data-slot", () => {
      render(<FieldTitle>Title Text</FieldTitle>);
      expect(screen.getByText("Title Text")).toHaveAttribute("data-slot", "field-label");
    });

    it("applies custom className", () => {
      render(<FieldTitle className="custom-title">Title</FieldTitle>);
      expect(screen.getByText("Title")).toHaveClass("custom-title");
    });
  });

  describe("FieldDescription", () => {
    it("renders paragraph with correct data-slot", () => {
      render(<FieldDescription>Description text</FieldDescription>);
      const desc = screen.getByText("Description text");
      expect(desc.tagName).toBe("P");
      expect(desc).toHaveAttribute("data-slot", "field-description");
    });

    it("applies custom className", () => {
      render(<FieldDescription className="custom-desc">Description</FieldDescription>);
      expect(screen.getByText("Description")).toHaveClass("custom-desc");
    });
  });

  describe("FieldSeparator", () => {
    it("renders separator without content", () => {
      render(<FieldSeparator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-slot", "field-separator");
      expect(separator).toHaveAttribute("data-content", "false");
    });

    it("renders separator with content", () => {
      render(<FieldSeparator data-testid="separator">OR</FieldSeparator>);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-content", "true");
      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<FieldSeparator className="custom-sep" data-testid="separator" />);
      expect(screen.getByTestId("separator")).toHaveClass("custom-sep");
    });
  });

  describe("FieldError", () => {
    it("renders nothing when no errors or children", () => {
      const { container } = render(<FieldError data-testid="error" />);
      expect(container.querySelector('[data-testid="error"]')).toBeNull();
    });

    it("renders children when provided", () => {
      render(<FieldError>Error message</FieldError>);
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "field-error");
    });

    it("renders single error message from errors array", () => {
      render(<FieldError errors={[{ message: "Single error" }]} />);
      expect(screen.getByText("Single error")).toBeInTheDocument();
    });

    it("renders multiple error messages as list", () => {
      render(
        <FieldError
          errors={[{ message: "Error 1" }, { message: "Error 2" }, { message: "Error 3" }]}
        />
      );
      expect(screen.getByText("Error 1")).toBeInTheDocument();
      expect(screen.getByText("Error 2")).toBeInTheDocument();
      expect(screen.getByText("Error 3")).toBeInTheDocument();
    });

    it("filters out duplicate errors", () => {
      render(<FieldError errors={[{ message: "Same error" }, { message: "Same error" }]} />);
      // Should only render once since it's a single unique error
      expect(screen.getByText("Same error")).toBeInTheDocument();
    });

    it("handles errors with undefined messages", () => {
      render(<FieldError errors={[{ message: "Valid error" }, undefined]} />);
      expect(screen.getByText("Valid error")).toBeInTheDocument();
    });

    it("renders nothing when errors array is empty", () => {
      const { container } = render(<FieldError errors={[]} />);
      expect(container.querySelector('[data-slot="field-error"]')).toBeNull();
    });

    it("prefers children over errors prop", () => {
      render(<FieldError errors={[{ message: "From errors" }]}>From children</FieldError>);
      expect(screen.getByText("From children")).toBeInTheDocument();
      expect(screen.queryByText("From errors")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<FieldError className="custom-error">Error</FieldError>);
      expect(screen.getByText("Error")).toHaveClass("custom-error");
    });
  });

  describe("Integration", () => {
    it("renders complete field with all components", () => {
      render(
        <FieldSet>
          <FieldLegend>User Information</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <input type="text" />
                <FieldDescription>Enter your full name</FieldDescription>
              </FieldContent>
            </Field>
            <FieldSeparator />
            <Field>
              <FieldTitle>Email</FieldTitle>
              <FieldContent>
                <input type="email" />
                <FieldError errors={[{ message: "Invalid email" }]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      );

      expect(screen.getByText("User Information")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Enter your full name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
  });
});
