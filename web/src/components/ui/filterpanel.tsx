"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

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
    return <div className="mb-4 h-60 rounded-2xl border border-gray-100 bg-white p-6 text-gray-500 shadow-sm flex items-center justify-center">Loading filters...</div>;
  }

  return (
    <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-bold text-gray-900 flex items-center gap-2">
        <Filter className="h-4 w-4" />
        Filters
      </h3>

      {/* 🧂 Ingredients */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Ingredients</p>
          <div className="flex gap-1">
            <button
              disabled={ingredientPage === 1}
              onClick={() => setIngredientPage((p) => Math.max(1, p - 1))}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIngredientPage((p) => p + 1)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronRight className="h-4 w-4" />
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
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-gray-50"
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
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Tags</p>
          <div className="flex gap-1">
            <button
              disabled={tagPage === 1}
              onClick={() => setTagPage((p) => Math.max(1, p - 1))}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setTagPage((p) => p + 1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
              <ChevronRight className="h-4 w-4" />
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
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${active
                    ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:bg-gray-50"
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
