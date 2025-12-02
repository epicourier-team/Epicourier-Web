"use client";
import FilterPanel from "@/components/ui/filterpanel";
import Pagination from "@/components/ui/pagenation";
import RecipeCard from "@/components/ui/recipecard";
import SearchBar from "@/components/ui/searchbar";
import { useRecipes } from "@/hooks/use-recipe";
import { useInventory } from "@/hooks/useInventory";
import { useState } from "react";
import { Filter } from "lucide-react";

type SortOption = "default" | "match-high" | "match-low";
type MatchFilter = "all" | "can-make" | "partial" | "need-shopping";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");

  const { items: inventoryItems } = useInventory();
  const userIngredientIds = inventoryItems.map((item) => item.ingredient_id);

  const { recipes, pagination, isLoading } = useRecipes({
    query,
    ingredientIds,
    tagIds,
    page,
    limit: 20,
    sortBy,
    matchFilter,
    userIngredientIds,
  });

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Page Title */}
      <div className="brutalism-banner mb-6 p-5">
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

      {/* Match Filter & Sort Controls */}
      <div className="brutalism-panel mb-6 flex flex-wrap items-center gap-4 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-bold">Match Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Recipes" },
            { value: "can-make", label: "Can Make Now (≥80%)" },
            { value: "partial", label: "Partial Match (50-79%)" },
            { value: "need-shopping", label: "Need Shopping (<50%)" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setMatchFilter(option.value as MatchFilter);
                setPage(1);
              }}
              className={`brutalism-border px-3 py-1 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                matchFilter === option.value
                  ? "brutalism-shadow bg-yellow-300"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              setPage(1);
            }}
            className="brutalism-border bg-white px-3 py-1 text-xs font-bold"
          >
            <option value="default">Default</option>
            <option value="match-high">Match % (High to Low)</option>
            <option value="match-low">Match % (Low to High)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="brutalism-panel mt-10 bg-gray-100 p-6 text-center">
          <p className="brutalism-heading">Loading...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="brutalism-panel mt-10 bg-gray-100 p-6 text-center">
          <p className="brutalism-heading">No recipes found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} inventoryItems={inventoryItems} />
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
