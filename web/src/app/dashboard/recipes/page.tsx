"use client";
import FilterPanel from "@/components/ui/filterpanel";
import Pagination from "@/components/ui/pagenation";
import RecipeCard from "@/components/ui/recipecard";
import SearchBar from "@/components/ui/searchbar";
import { useRecipes } from "@/hooks/use-recipe";
import { ChefHat } from "lucide-react";
import { useState } from "react";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const { recipes, pagination, isLoading } = useRecipes({
    query,
    ingredientIds,
    tagIds,
    page,
    limit: 20,
  });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ChefHat className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Recipe Collection
          </h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Discover sustainable and delicious recipes for every occasion
        </p>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={(q) => {
          setQuery(q);
          setPage(1);
        }}
      />

      {/* Filters */}
      <FilterPanel
        onFilterChange={({ ingredientIds, tagIds }) => {
          setIngredientIds(ingredientIds);
          setTagIds(tagIds);
          setPage(1);
        }}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-900 dark:border-t-emerald-400"></div>
          <p className="mt-4 text-emerald-600 dark:text-emerald-400">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-20 dark:border-neutral-800 dark:bg-neutral-900">
          <ChefHat className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-4 text-lg font-medium text-neutral-700 dark:text-neutral-300">
            No recipes found
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
