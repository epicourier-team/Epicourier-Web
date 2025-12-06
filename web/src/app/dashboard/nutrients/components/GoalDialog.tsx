"use client";

import { Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Target, Wand2 } from "lucide-react";
import type { GoalField, GoalFormValues } from "../types";
import type { UseFormReturn } from "react-hook-form";

type GoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalForm: UseFormReturn<GoalFormValues>;
  goalError: string | null;
  goalSaving: boolean;
  onUseRecommended: () => void;
  onSubmit: () => void;
  fields: { key: GoalField; label: string; unit: string }[];
};

export function GoalDialog({
  open,
  onOpenChange,
  goalForm,
  goalError,
  goalSaving,
  onUseRecommended,
  onSubmit,
  fields,
}: GoalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="brutalism-card brutalism-shadow-lg border-4 border-black bg-white p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b-4 border-black bg-yellow-200 p-6">
          <DialogTitle className="brutalism-text-bold flex items-center gap-2 text-2xl uppercase">
            <Target className="size-5" />
            {goalForm.getValues().calories_kcal ? "Edit Daily Goals" : "Set Daily Goals"}
          </DialogTitle>
          <DialogDescription className="font-semibold text-gray-800">
            Define how many calories and macros you aim for each day.
          </DialogDescription>
        </DialogHeader>

        <form id="nutrient-goal-form" onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">
              Set your daily macro and micro targets.
            </p>
            <button
              type="button"
              onClick={onUseRecommended}
              className="flex items-center gap-2 border-2 border-black bg-amber-200 px-3 py-2 text-sm font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Wand2 className="size-4" />
              Use Recommended
            </button>
          </div>
          <FieldGroup className="gap-4 md:grid md:grid-cols-2">
            {fields.map(({ key, label, unit }) => (
              <Controller
                key={key}
                name={key}
                control={goalForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor={`goal-${key}`}
                      className="text-sm font-bold tracking-tight uppercase"
                    >
                      {label}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={`goal-${key}`}
                        type="number"
                        inputMode="decimal"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                        }
                        aria-invalid={fieldState.invalid}
                        className="font-semibold"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText className="brutalism-text-bold text-xs uppercase">
                          {unit}
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription className="text-xs font-medium text-gray-600">
                      Daily target for {label.toLowerCase()}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </FieldGroup>
          {goalError && (
            <p className="rounded-none border-2 border-red-600 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {goalError}
            </p>
          )}
        </form>

        <DialogFooter className="border-t-4 border-black bg-gray-100 p-6">
          <div className="flex w-full gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-black bg-white px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
              disabled={goalSaving}
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="nutrient-goal-form"
              className="flex-1 border-2 border-black bg-emerald-400 px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-80"
              disabled={goalSaving}
            >
              {goalSaving
                ? "Saving..."
                : goalForm.getValues().calories_kcal
                  ? "Update Goal"
                  : "Save Goal"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
