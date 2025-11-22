"use client";

import { useEffect, useState } from "react";

type FilterItem = { id: number; name: string };

export default function FilterPanel({
  onFilterChange,
}: {
  onFilterChange: (filters: { ingredientIds: number[]; tagIds: number[] }) => void;
}) {
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);

  const [ingredients, setIngredients] = useState<FilterItem[]>([]);
  const [tags, setTags] = useState<FilterItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [ingredientPage, setIngredientPage] = useState(1);
  const [tagPage, setTagPage] = useState(1);

  const ingredientLimit = 10;
  const tagLimit = 7;

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      try {
        const [ingRes, tagRes] = await Promise.all([
          fetch(`/api/ingredients?page=${ingredientPage}&limit=${ingredientLimit}`),
          fetch(`/api/tags?page=${tagPage}&limit=${tagLimit}`),
        ]);

        const ingData = await ingRes.json();
        const tagData = await tagRes.json();

        setIngredients(ingData.data || []);
        setTags(tagData.data || []);
      } catch (err) {
        console.error("Failed to load filters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, [ingredientPage, tagPage]);

  const handleIngredientClick = (id: number) => {
    const updated = ingredientIds.includes(id)
      ? ingredientIds.filter((x) => x !== id)
      : [...ingredientIds, id];
    setIngredientIds(updated);
    onFilterChange({ ingredientIds: updated, tagIds });
  };

  const handleTagClick = (id: number) => {
    const updated = tagIds.includes(id) ? tagIds.filter((x) => x !== id) : [...tagIds, id];
    setTagIds(updated);
    onFilterChange({ ingredientIds, tagIds: updated });
  };

  if (loading) {
    return (
      <div className="mb-4 h-60 border-2 border-black bg-gray-50 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-bold text-gray-600">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="mb-4 border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="mb-3 text-lg font-bold">Filters</h3>

      {/* 🧂 Ingredients */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">Ingredients</p>
          <div className="flex gap-1.5">
            <button
              disabled={ingredientPage === 1}
              onClick={() => setIngredientPage((p) => Math.max(1, p - 1))}
              className="border-2 border-black bg-gray-100 px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <button
              onClick={() => setIngredientPage((p) => p + 1)}
              className="border-2 border-black bg-gray-100 px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing) => {
            const active = ingredientIds.includes(ing.id);
            return (
              <button
                key={ing.id}
                onClick={() => handleIngredientClick(ing.id)}
                className={`border-2 border-black px-3 py-1 text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 active:shadow-none ${
                  active ? "bg-emerald-300 font-bold" : "bg-white"
                }`}
              >
                {ing.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🏷️ Tags */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">Tags</p>
          <div className="flex gap-1.5">
            <button
              disabled={tagPage === 1}
              onClick={() => setTagPage((p) => Math.max(1, p - 1))}
              className="border-2 border-black bg-gray-100 px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <button
              onClick={() => setTagPage((p) => p + 1)}
              className="border-2 border-black bg-gray-100 px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const active = tagIds.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => handleTagClick(t.id)}
                className={`border-2 border-black px-3 py-1 text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 active:shadow-none ${
                  active ? "bg-sky-300 font-bold" : "bg-white"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
