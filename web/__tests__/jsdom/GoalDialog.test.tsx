/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { GoalDialog } from "@/app/dashboard/nutrients/components/GoalDialog";
import type { GoalFormValues, GoalField } from "@/app/dashboard/nutrients/types";

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Target: () => <span data-testid="target-icon">Target</span>,
  Wand2: () => <span data-testid="wand-icon">Wand2</span>,
}));

// Mock dialog components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
  }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-header" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  ),
  DialogDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p data-testid="dialog-description" className={className}>
      {children}
    </p>
  ),
  DialogFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-footer" className={className}>
      {children}
    </div>
  ),
}));

// Mock field components
jest.mock("@/components/ui/field", () => ({
  Field: ({
    children,
    "data-invalid": dataInvalid,
  }: {
    children: React.ReactNode;
    "data-invalid"?: boolean;
  }) => (
    <div data-testid="field" data-invalid={dataInvalid}>
      {children}
    </div>
  ),
  FieldDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="field-description" className={className}>
      {children}
    </p>
  ),
  FieldError: ({ errors }: { errors?: unknown[] }) => (
    <span data-testid="field-error">{errors?.length ? "Error" : null}</span>
  ),
  FieldGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="field-group" className={className}>
      {children}
    </div>
  ),
  FieldLabel: ({
    children,
    htmlFor,
    className,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
    className?: string;
  }) => (
    <label data-testid="field-label" htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

// Mock input-group components
jest.mock("@/components/ui/input-group", () => ({
  InputGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="input-group">{children}</div>
  ),
  InputGroupAddon: ({
    children,
    align,
  }: {
    children: React.ReactNode;
    align?: string;
  }) => (
    <div data-testid="input-group-addon" data-align={align}>
      {children}
    </div>
  ),
  InputGroupInput: ({
    id,
    type,
    value,
    onChange,
    "aria-invalid": ariaInvalid,
    className,
    inputMode,
  }: {
    id?: string;
    type?: string;
    value?: number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    "aria-invalid"?: boolean;
    className?: string;
    inputMode?: "search" | "email" | "tel" | "text" | "url" | "none" | "numeric" | "decimal";
  }) => (
    <input
      data-testid={`input-${id}`}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      aria-invalid={ariaInvalid}
      className={className}
      inputMode={inputMode}
    />
  ),
  InputGroupText: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="input-group-text" className={className}>
      {children}
    </span>
  ),
}));

// Wrapper component to provide form context
const GoalDialogTestWrapper = ({
  open = true,
  onOpenChange = jest.fn(),
  goalError = null,
  goalSaving = false,
  onUseRecommended = jest.fn(),
  onSubmit = jest.fn(),
  defaultValues = {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
  },
  fields = [
    { key: "calories_kcal" as GoalField, label: "Calories", unit: "kcal" },
    { key: "protein_g" as GoalField, label: "Protein", unit: "g" },
    { key: "carbs_g" as GoalField, label: "Carbs", unit: "g" },
    { key: "fats_g" as GoalField, label: "Fat", unit: "g" },
  ],
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  goalError?: string | null;
  goalSaving?: boolean;
  onUseRecommended?: () => void;
  onSubmit?: () => void;
  defaultValues?: GoalFormValues;
  fields?: { key: GoalField; label: string; unit: string }[];
}) => {
  const goalForm = useForm<GoalFormValues>({
    defaultValues,
  });

  const handleSubmit = goalForm.handleSubmit(() => {
    onSubmit();
  });

  return (
    <GoalDialog
      open={open}
      onOpenChange={onOpenChange}
      goalForm={goalForm}
      goalError={goalError}
      goalSaving={goalSaving}
      onUseRecommended={onUseRecommended}
      onSubmit={handleSubmit}
      fields={fields}
    />
  );
};

describe("GoalDialog", () => {
  describe("Rendering", () => {
    it("renders when open is true", () => {
      render(<GoalDialogTestWrapper open={true} />);
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      render(<GoalDialogTestWrapper open={false} />);
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("renders dialog header with icon and title", () => {
      render(<GoalDialogTestWrapper />);
      expect(screen.getByTestId("target-icon")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
    });

    it("renders dialog description", () => {
      render(<GoalDialogTestWrapper />);
      expect(screen.getByTestId("dialog-description")).toHaveTextContent(
        "Define how many calories and macros you aim for each day."
      );
    });

    it("displays 'Set Daily Goals' when calories is 0", () => {
      render(
        <GoalDialogTestWrapper
          defaultValues={{ calories_kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, fiber_g: 0 }}
        />
      );
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Set Daily Goals");
    });

    it("displays 'Edit Daily Goals' when calories has value", () => {
      render(
        <GoalDialogTestWrapper
          defaultValues={{ calories_kcal: 2000, protein_g: 50, carbs_g: 100, fats_g: 50, sodium_mg: 2000, fiber_g: 25 }}
        />
      );
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edit Daily Goals");
    });

    it("renders all field inputs", () => {
      render(<GoalDialogTestWrapper />);
      expect(screen.getByTestId("input-goal-calories_kcal")).toBeInTheDocument();
      expect(screen.getByTestId("input-goal-protein_g")).toBeInTheDocument();
      expect(screen.getByTestId("input-goal-carbs_g")).toBeInTheDocument();
      expect(screen.getByTestId("input-goal-fats_g")).toBeInTheDocument();
    });

    it("renders 'Use Recommended' button", () => {
      render(<GoalDialogTestWrapper />);
      expect(screen.getByText("Use Recommended")).toBeInTheDocument();
    });
  });

  describe("Buttons", () => {
    it("renders Cancel button", () => {
      render(<GoalDialogTestWrapper />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("renders 'Save Goal' button when calories is 0", () => {
      render(
        <GoalDialogTestWrapper
          defaultValues={{ calories_kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, fiber_g: 0 }}
        />
      );
      expect(screen.getByText("Save Goal")).toBeInTheDocument();
    });

    it("renders 'Update Goal' button when calories has value", () => {
      render(
        <GoalDialogTestWrapper
          defaultValues={{ calories_kcal: 2000, protein_g: 50, carbs_g: 100, fats_g: 50, sodium_mg: 2000, fiber_g: 25 }}
        />
      );
      expect(screen.getByText("Update Goal")).toBeInTheDocument();
    });

    it("renders 'Saving...' button when goalSaving is true", () => {
      render(<GoalDialogTestWrapper goalSaving={true} />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("disables buttons when goalSaving is true", () => {
      render(<GoalDialogTestWrapper goalSaving={true} />);
      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByText("Saving...")).toBeDisabled();
    });
  });

  describe("Interactions", () => {
    it("calls onOpenChange when Cancel button is clicked", () => {
      const mockOnOpenChange = jest.fn();
      render(<GoalDialogTestWrapper onOpenChange={mockOnOpenChange} />);

      fireEvent.click(screen.getByText("Cancel"));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls onUseRecommended when 'Use Recommended' button is clicked", () => {
      const mockOnUseRecommended = jest.fn();
      render(<GoalDialogTestWrapper onUseRecommended={mockOnUseRecommended} />);

      fireEvent.click(screen.getByText("Use Recommended"));
      expect(mockOnUseRecommended).toHaveBeenCalled();
    });

    it("calls onSubmit when form is submitted", async () => {
      const mockOnSubmit = jest.fn();
      render(<GoalDialogTestWrapper onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText("Save Goal");
      fireEvent.click(submitButton);

      // Wait for react-hook-form to process submission
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("updates input value when changed", () => {
      render(<GoalDialogTestWrapper />);

      const caloriesInput = screen.getByTestId("input-goal-calories_kcal") as HTMLInputElement;
      fireEvent.change(caloriesInput, { target: { value: "2500" } });
      expect(caloriesInput.value).toBe("2500");
    });

    it("sets value to 0 when input is cleared", () => {
      render(
        <GoalDialogTestWrapper
          defaultValues={{ calories_kcal: 2000, protein_g: 50, carbs_g: 100, fats_g: 50, sodium_mg: 2000, fiber_g: 25 }}
        />
      );

      const caloriesInput = screen.getByTestId("input-goal-calories_kcal") as HTMLInputElement;
      fireEvent.change(caloriesInput, { target: { value: "" } });
      expect(caloriesInput.value).toBe("0");
    });
  });

  describe("Error State", () => {
    it("displays error message when goalError is set", () => {
      render(<GoalDialogTestWrapper goalError="Something went wrong" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("does not display error message when goalError is null", () => {
      render(<GoalDialogTestWrapper goalError={null} />);
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("Field Labels and Units", () => {
    it("renders field labels correctly", () => {
      render(<GoalDialogTestWrapper />);
      const labels = screen.getAllByTestId("field-label");
      expect(labels.some((label) => label.textContent === "Calories")).toBe(true);
      expect(labels.some((label) => label.textContent === "Protein")).toBe(true);
      expect(labels.some((label) => label.textContent === "Carbs")).toBe(true);
      expect(labels.some((label) => label.textContent === "Fat")).toBe(true);
    });

    it("renders unit text correctly", () => {
      render(<GoalDialogTestWrapper />);
      const unitTexts = screen.getAllByTestId("input-group-text");
      expect(unitTexts.some((unit) => unit.textContent === "kcal")).toBe(true);
      expect(unitTexts.filter((unit) => unit.textContent === "g").length).toBe(3);
    });

    it("renders field descriptions", () => {
      render(<GoalDialogTestWrapper />);
      const descriptions = screen.getAllByTestId("field-description");
      expect(descriptions.some((desc) => desc.textContent?.includes("calories"))).toBe(true);
    });
  });

  describe("Custom Fields", () => {
    it("renders custom fields configuration", () => {
      const customFields = [
        { key: "calories_kcal" as GoalField, label: "Energy", unit: "cal" },
        { key: "protein_g" as GoalField, label: "Protein Intake", unit: "grams" },
      ];

      render(<GoalDialogTestWrapper fields={customFields} />);

      const labels = screen.getAllByTestId("field-label");
      expect(labels.some((label) => label.textContent === "Energy")).toBe(true);
      expect(labels.some((label) => label.textContent === "Protein Intake")).toBe(true);

      const unitTexts = screen.getAllByTestId("input-group-text");
      expect(unitTexts.some((unit) => unit.textContent === "cal")).toBe(true);
      expect(unitTexts.some((unit) => unit.textContent === "grams")).toBe(true);
    });
  });
});
