"use client";
import FilterPanel from "@/components/ui/filterpanel";
import Pagination from "@/components/ui/pagenation";
import RecipeCard from "@/components/ui/recipecard";
import SearchBar from "@/components/ui/searchbar";
import { useRecipes } from "@/hooks/use-recipe";
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
    <div className="mx-auto max-w-7xl p-6">
      {/* Page Title */}
      <div className="mb-6 border-2 border-black bg-amber-100 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-3xl font-bold tracking-tight">Recipe Collection</h1>
        <p className="mt-1 text-sm font-medium text-gray-700">Find your next favorite meal</p>
      </div>

      <SearchBar
        onSearch={(q) => {
          setQuery(q);
          setPage(1);
        }}
      />
      <FilterPanel
        onFilterChange={({ ingredientIds, tagIds }) => {
          setIngredientIds(ingredientIds);
          setTagIds(tagIds);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="mt-10 border-2 border-black bg-gray-100 p-6 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-bold">Loading...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="mt-10 border-2 border-black bg-gray-100 p-6 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-bold">No recipes found</p>
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
