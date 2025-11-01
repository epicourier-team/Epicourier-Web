"use client";
import { useEffect, useState } from "react";
import { Recipe } from "../types/data";

export type RecipeFilter = {
  query?: string;
  ingredientIds?: number[];
  tagIds?: number[];
  page?: number;
  limit?: number;
};

export function useRecipes(filters: RecipeFilter) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState({
    page: filters.page || 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRecipes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.query) params.set("query", filters.query);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        filters.ingredientIds?.forEach((id) => params.append("ingredientIds", String(id)));
        filters.tagIds?.forEach((id) => params.append("tagIds", String(id)));

        const res = await fetch(`/api/recipes?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        setRecipes(data.recipes || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err: unknown) {
        if (err instanceof Error)
          if ("name" in err && err.name !== "AbortError") setError(err.message || "Fetch failed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
    return () => controller.abort();
  }, [
    filters.query,
    filters.page,
    filters.limit,
    JSON.stringify(filters.ingredientIds),
    JSON.stringify(filters.tagIds),
  ]);

  return { recipes, pagination, isLoading, error };
}
