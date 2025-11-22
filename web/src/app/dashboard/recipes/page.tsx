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
    <div className="mx-auto max-w-5xl p-6">
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
        <p className="mt-10 text-center text-gray-500">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">No recipes found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
