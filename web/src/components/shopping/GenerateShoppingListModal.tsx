"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ShoppingCart, Loader2, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

interface GenerateShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateShoppingListModal({
  isOpen,
  onClose,
}: GenerateShoppingListModalProps) {
  const { toast } = useToast();
  const router = useRouter();

  // Default to current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(formatDate(weekStart));
  const [endDate, setEndDate] = useState(formatDate(weekEnd));
  const [listName, setListName] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(
    new Set(["breakfast", "lunch", "dinner"])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", emoji: "🌅" },
    { id: "lunch", label: "Lunch", emoji: "☀️" },
    { id: "dinner", label: "Dinner", emoji: "🌙" },
    { id: "snack", label: "Snack", emoji: "🍿" },
  ];

  const toggleMealType = (type: string) => {
    setSelectedMealTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const setThisWeek = () => {
    setStartDate(formatDate(weekStart));
    setEndDate(formatDate(weekEnd));
  };

  const setNextWeek = () => {
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    setStartDate(formatDate(nextWeekStart));
    setEndDate(formatDate(nextWeekEnd));
  };

  const handleSubmit = async () => {
    if (selectedMealTypes.size === 0) {
      toast({
        title: "No meal types selected",
        description: "Please select at least one meal type.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid date range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/shopping-lists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName.trim() || undefined,
          startDate,
          endDate,
          mealTypes: Array.from(selectedMealTypes),
        }),
      });

      if (res.status === 404) {
        toast({
          title: "No meals found",
          description: "No meals were found in the selected date range.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate shopping list");
      }

      const data = await res.json();

      toast({
        title: "✅ Shopping list created!",
        description: `Added ${data.item_count} ingredients from ${data.meals_count} meals.`,
      });

      onClose();
      router.push(`/dashboard/shopping/${data.id}`);
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate shopping list.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutalism-card brutalism-shadow-xl max-w-md rounded-none border-2 border-black p-0">
        <DialogHeader className="border-b-2 border-black bg-indigo-300 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <CalendarDays className="h-5 w-5" />
            Generate Shopping List
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-700">
            Create a shopping list from your meal plan
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* List Name */}
          <div className="mb-4">
            <Label className="mb-2 block font-bold">List Name (optional)</Label>
            <Input
              className="brutalism-border rounded-none"
              placeholder="Weekly Shopping"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="font-bold">Date Range</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setThisWeek}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  This week
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={setNextWeek}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Next week
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-gray-500">From</Label>
                <Input
                  type="date"
                  className="brutalism-border rounded-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-gray-500">To</Label>
                <Input
                  type="date"
                  className="brutalism-border rounded-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Meal Types */}
          <div className="mb-4">
            <Label className="mb-2 block font-bold">
              Meal Types ({selectedMealTypes.size}/{mealTypes.length})
            </Label>
            <div className="brutalism-border grid grid-cols-2 gap-0 bg-white">
              {mealTypes.map((type) => (
                <label
                  key={type.id}
                  className="flex cursor-pointer items-center gap-3 border-r border-b border-gray-200 p-3 last:border-r-0 hover:bg-gray-50 [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0"
                >
                  <Checkbox
                    checked={selectedMealTypes.has(type.id)}
                    onCheckedChange={() => toggleMealType(type.id)}
                    className="brutalism-border h-5 w-5 rounded-none"
                    disabled={isSubmitting}
                  />
                  <span className="font-medium">
                    {type.emoji} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-black bg-gray-50 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="brutalism-border rounded-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedMealTypes.size === 0}
            className="brutalism-border brutalism-shadow-sm rounded-none bg-indigo-500 font-bold text-white hover:bg-indigo-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Generate List
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
