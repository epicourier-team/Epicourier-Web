"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Food } from "../types/food";

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}

export default function AddMealModal({ isOpen, onClose, onSaved, userId }: AddMealModalProps) {
  const [mealType, setMealType] = useState("breakfast");
  const [date, setDate] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);

  // ✅ 載入所有食物資料
  useEffect(() => {
    const loadFoods = async () => {
      try {
        const res = await fetch("/calendar/api/foods");
        const data = await res.json();
        setFoods(data);
      } catch (err) {
        console.error("Failed to load foods:", err);
      }
    };
    loadFoods();
  }, []);

  // ✅ 根據輸入過濾搜尋結果
  const filteredFoods = foods.filter(
    (food) =>
      food.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedFoods.some((f) => f.id === food.id)
  );

  // ✅ 點擊後選擇食物
  const handleSelectFood = (food: Food) => {
    if (selectedFoods.length >= 5) {
      alert("You can select up to 5 foods per meal.");
      return;
    }

    // ✅ 更新 state（一定要用 prev callback 形式）
    setSelectedFoods((prev) => [...prev, food]);

    // ✅ 清空搜尋框，但不要清空 filteredFoods（讓標籤顯示）
    setSearch("");
  };

  // ✅ 移除已選食物
  const handleRemoveFood = (foodId: number) => {
    setSelectedFoods((prev) => prev.filter((f) => f.id !== foodId));
  };

  // ✅ save events
  const handleSave = async () => {
    if (!date || selectedFoods.length === 0) {
      alert("Please select a date and at least one food.");
      return;
    }

    const startTime = `${date}T00:00:00`;
    const endTime = `${date}T23:59:59`;
    const formattedDate = date;
    const title = `${formattedDate} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

    await fetch("calendar/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        title,
        mealType,
        startTime,
        endTime,
        food_ids: selectedFoods.map((f) => f.id),
      }),
    });

    // ✅ 清空狀態
    setDate("");
    setSelectedFoods([]);
    setSearch("");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="mb-4 text-lg font-semibold">Add Meal</DialogTitle>

          <div className="space-y-4">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="breakfast">Breakfast 🍳</option>
                <option value="lunch">Lunch 🍱</option>
                <option value="dinner">Dinner 🍲</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>

            {/* Search Foods */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Foods (max 5)
              </label>
              <input
                type="text"
                placeholder="Search foods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2 w-full rounded-lg border px-3 py-2"
              />

              {/* Autocomplete 下拉清單 */}
              {search && filteredFoods.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border bg-white shadow">
                  {filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50"
                    >
                      {food.name}{" "}
                      <span className="text-xs text-gray-500">({food.calories ?? 0} kcal)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ 已選食物標籤區 */}
              {selectedFoods.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedFoods.map((food) => (
                    <span
                      key={food.id}
                      className="flex items-center gap-1 rounded-lg bg-indigo-100 px-2 py-1 text-sm text-indigo-700"
                    >
                      {food.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveFood(food.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
