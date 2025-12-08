"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800 dark:border-neutral-600 dark:border-t-neutral-200"></div>
          <span className="ml-3 text-neutral-500 dark:text-neutral-400">Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="mb-5 text-lg font-semibold text-neutral-800 dark:text-neutral-200">Filters</h3>

      {/* Ingredients */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Ingredients</p>
          <div className="flex gap-2">
            <button
              disabled={ingredientPage === 1}
              onClick={() => setIngredientPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </button>
            <button
              onClick={() => setIngredientPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Next
              <ChevronRight className="h-3 w-3" />
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
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${active
                  ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-600 dark:text-white"
                  : "border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-emerald-300 dark:hover:bg-neutral-700"
                  }`}
              >
                {ing.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tags</p>
          <div className="flex gap-2">
            <button
              disabled={tagPage === 1}
              onClick={() => setTagPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </button>
            <button
              onClick={() => setTagPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Next
              <ChevronRight className="h-3 w-3" />
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
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${active
                  ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-600 dark:text-white"
                  : "border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-emerald-300 dark:hover:bg-neutral-700"
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
