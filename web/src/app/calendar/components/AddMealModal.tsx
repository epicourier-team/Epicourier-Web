"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

export default function AddMealModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mealItems, setMealItems] = useState<string[]>([""]);
  const [mealType, setMealType] = useState("breakfast");
  const [date, setDate] = useState("");

  const handleAddDish = () => {
    if (mealItems.length >= 5) return alert("You can only add up to 5 dishes.");
    setMealItems([...mealItems, ""]);
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...mealItems];
    updated[index] = value;
    setMealItems(updated);
  };
  const handleSave = async () => {
    if (mealItems.filter(Boolean).length === 0 || !date)
      return alert("Please fill in all fields");

    const startTime = `${date}T00:00:00`;
    const formattedDate = startTime.split("T")[0];
    const title = `${formattedDate} ${
      mealType.charAt(0).toUpperCase() + mealType.slice(1)
    }`;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          meal_type: mealType,
          // For all-day events, prefer date-only and let the server derive end
          start_time: startTime.split("T")[0],
          meal_items: mealItems.filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(`POST /api/events ${res.status}`);
    } catch (e) {
      alert("Failed to save. Please try again.");
      console.error(e);
      return;
    }

    //setTitle("");
    setDate("");
    setMealType("breakfast");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md">
          <DialogTitle className="text-lg font-semibold text-black mb-4">
            Add Meal
          </DialogTitle>

          <div className="space-y-4">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full border rounded-lg text-gray-600 px-3 py-2 mt-1"
              >
                <option value="breakfast">Breakfast 🍳</option>
                <option value="lunch">Lunch 🍱</option>
                <option value="dinner">Dinner 🍲</option>
              </select>
            </div>
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg text-gray-600 px-3 py-2 mt-1"
              />
            </div>
            {/* Dishes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dishes (up to 5)
              </label>
              {mealItems.map((item, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Dish ${i + 1}`}
                  value={item}
                  onChange={(e) => handleChange(i, e.target.value)}
                  className="w-full border rounded-lg text-gray-700 px-3 py-2 mb-2"
                />
              ))}

              {mealItems.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  + Add another dish
                </button>
              )}
            </div>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
