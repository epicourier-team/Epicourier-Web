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
    return <div className="mb-4 h-60 rounded-lg border p-3 text-gray-500">Loading filters...</div>;
  }

  return (
    <div className="mb-4 rounded-lg border p-3">
      <h3 className="mb-3 font-semibold">Filters</h3>

      {/* 🧂 Ingredients */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium">Ingredients</p>
          <div className="flex gap-1 text-xs">
            <button
              disabled={ingredientPage === 1}
              onClick={() => setIngredientPage((p) => Math.max(1, p - 1))}
              className="rounded border px-2 py-0.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setIngredientPage((p) => p + 1)}
              className="rounded border px-2 py-0.5"
            >
              Next
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
                className={`rounded border px-3 py-1 text-sm ${
                  active ? "border-green-500 bg-green-200 font-medium" : "border-gray-300 bg-white"
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
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium">Tags</p>
          <div className="flex gap-1 text-xs">
            <button
              disabled={tagPage === 1}
              onClick={() => setTagPage((p) => Math.max(1, p - 1))}
              className="rounded border px-2 py-0.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button onClick={() => setTagPage((p) => p + 1)} className="rounded border px-2 py-0.5">
              Next
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
                className={`rounded border px-3 py-1 text-sm ${
                  active ? "border-blue-500 bg-blue-200 font-medium" : "border-gray-300 bg-white"
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
