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
      <div className="brutalism-panel mb-4 h-60 bg-gray-50 p-3">
        <p className="brutalism-text-bold text-gray-600">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="brutalism-panel mb-4 p-4">
      <h3 className="brutalism-heading mb-3">Filters</h3>

      {/* 🧂 Ingredients */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="brutalism-text-bold text-sm">Ingredients</p>
          <div className="flex gap-1.5">
            <button
              disabled={ingredientPage === 1}
              onClick={() => setIngredientPage((p) => Math.max(1, p - 1))}
              className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-hover-sm brutalism-active bg-gray-100 px-2 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <button
              onClick={() => setIngredientPage((p) => p + 1)}
              className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-hover-sm brutalism-active bg-gray-100 px-2 py-0.5 text-xs font-bold"
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
                className={active ? "brutalism-tag-active" : "brutalism-tag"}
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
          <p className="brutalism-text-bold text-sm">Tags</p>
          <div className="flex gap-1.5">
            <button
              disabled={tagPage === 1}
              onClick={() => setTagPage((p) => Math.max(1, p - 1))}
              className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-hover-sm brutalism-active bg-gray-100 px-2 py-0.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <button
              onClick={() => setTagPage((p) => p + 1)}
              className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-hover-sm brutalism-active bg-gray-100 px-2 py-0.5 text-xs font-bold"
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
                className={active ? "brutalism-tag bg-sky-300 font-bold" : "brutalism-tag"}
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
