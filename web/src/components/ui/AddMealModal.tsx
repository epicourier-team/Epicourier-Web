"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddMealModalProps {
  recipe: {
    id: number;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddMealModal({ recipe, isOpen, onClose, onSuccess }: AddMealModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [mealType, setMealType] = useState("breakfast");

  const handleConfirm = async () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipe.id,
        date: selectedDate,
        meal_type: mealType,
        status: false,
      }),
    });

    if (res.ok) {
      alert("✅ Added to Calendar!");
      onClose();
      onSuccess?.();
    } else {
      const err = await res.json();
      console.error(err);
      alert(`❌ Failed to add: ${err.error ?? "Unknown error"}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black bg-amber-50 p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-md">
        <DialogHeader className="border-b-4 border-black bg-yellow-300 p-6">
          <DialogTitle className="text-xl font-black uppercase">Add to Calendar</DialogTitle>
          <DialogDescription className="text-sm font-bold text-gray-800">
            {recipe.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="meal-date" className="mb-2 block text-sm font-bold">
              Choose a date:
            </label>
            <input
              id="meal-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block border-2 border-black bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="meal-type" className="mb-2 block text-sm font-bold">
              Choose meal type:
            </label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="block w-full border-2 border-black bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            >
              <option value="breakfast">🍳 Breakfast</option>
              <option value="lunch">🍱 Lunch</option>
              <option value="dinner">🍲 Dinner</option>
            </select>
          </div>
        </div>

        <DialogFooter className="border-t-4 border-black bg-gray-100 p-6">
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-black bg-white px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 border-2 border-black bg-emerald-400 px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              Confirm
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
