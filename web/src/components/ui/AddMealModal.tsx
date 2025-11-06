"use client";

import { useState } from "react";

interface AddMealModalProps {
  recipe: {
    id: number;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // 可選 callback（例如刷新日曆）
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Select Date for {recipe.name}</h2>
        <label className="mb-2 block text-sm font-medium text-gray-700">Choose a date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mb-4 w-full rounded-lg border px-3 py-2"
        />
        <label className="mb-2 block text-sm font-medium text-gray-700">Choose meal type:</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="mb-4 w-full rounded-lg border px-3 py-2"
        >
          <option value="breakfast">🍳 Breakfast</option>
          <option value="lunch">🍱 Lunch</option>
          <option value="dinner">🍲 Dinner</option>
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
