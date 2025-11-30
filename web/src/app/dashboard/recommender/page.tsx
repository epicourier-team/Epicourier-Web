"use client";

import { Button } from "@/components/ui/button";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import AddMealModal from "../../../components/ui/AddMealModal";
import { supabase } from "../../../lib/supabaseClient";

interface Recipe {
  id: number;
  name: string;
  key_ingredients: string[];
  recipe: string;
  tags: string[];
  reason: string;
}

export default function RecommendPage() {
  const [goal, setGoal] = useState<string>("");
  const [numMeals, setNumMeals] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string>("");
  const [expandedGoal, setExpandedGoal] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!goal.trim()) {
      setError("Please enter your goal.");
      return;
    }
    if (![3, 5, 7].includes(numMeals)) {
      setError("Number of meals must be 3, 5, or 7.");
      return;
    }

    setLoading(true);
    setRecipes([]);
    try {
      const res = await fetch("/api/recommender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, numMeals }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded with ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setRecipes([]);
        return;
      }

      // backend sends expanded goal once, not per recipe
      setExpandedGoal(data.goal_expanded || "");
      // attach Supabase Recipe.id to each recipe (if a matching name exists)
      try {
        const recipesFromBackend: Recipe[] = data.recipes || [];

        const recipesWithIds = await Promise.all(
          recipesFromBackend.map(async (r) => {
            try {
              const { data: row, error } = await supabase
                .from("Recipe")
                .select("id")
                .eq("name", r.name)
                .maybeSingle();

              if (error) {
                console.error("Supabase lookup error for", r.name, error);
                return { ...r }; // return original if lookup fails
              }

              // row may be null if not found; keep id only when present
              const id = row?.id ?? null;
              return { ...r, id };
            } catch (e) {
              console.error("Unexpected error looking up recipe id:", e);
              return { ...r };
            }
          })
        );

        setRecipes(recipesWithIds);
      } catch (e) {
        console.error("Could not import supabase client or fetch ids:", e);
        // fallback to original data if anything goes wrong
        setRecipes(data.recipes || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching recommendations:", err);
      setError((err as { message: string }).message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-6">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="brutalism-banner mb-6 bg-red-300! p-5">
          <h1 className="text-3xl font-bold tracking-tight">Personalized Meal Recommendations</h1>
          <p className="mt-1 text-sm font-medium text-gray-900">
            Describe your goal (e.g. &quot;Lose 5 kg in 2 months&quot; or &quot;High-protein
            vegetarian diet&quot;) and choose how many meals you want for your daily plan.
          </p>
        </div>

        {error && <p className="mb-4 text-center text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="brutalism-panel space-y-6 rounded-none p-8">
          <div>
            <label className="brutalism-text-bold mb-2 block">Your Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="brutalism-input box-border w-full rounded-none p-3"
              placeholder="e.g., Lose 5 kg while keeping muscle, prefer Asian flavors"
              required
            />
          </div>

          <div>
            <label className="brutalism-text-bold mb-2 block">Number of Meals</label>
            <select
              value={numMeals}
              onChange={(e) => setNumMeals(Number(e.target.value))}
              className="brutalism-input w-full rounded-none p-3"
            >
              <option value={3}>3 meals</option>
              <option value={5}>5 meals</option>
              <option value={7}>7 meals</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="brutalism-button-primary flex w-full items-center justify-center gap-2 rounded-none text-black"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <UtensilsCrossed className="h-5 w-5" />
                Get My Daily Plan
              </>
            )}
          </Button>
        </form>

        {/* Expanded Goal */}
        {expandedGoal && (
          <div className="mt-6 overflow-hidden rounded-none border-2 border-black bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="border-b-2 border-black bg-emerald-400 px-4 py-2">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white text-sm">
                  📋
                </span>
                Your Personalized Nutrition Plan
              </h2>
            </div>
            <div className="p-5">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 text-sm leading-relaxed text-gray-700 last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => <ul className="mb-3 ml-1 space-y-2 text-sm">{children}</ul>,
                  ol: ({ children }) => (
                    <ol className="mb-3 ml-1 list-inside list-decimal space-y-2 text-sm">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-emerald-700">{children}</strong>
                  ),
                  h1: ({ children }) => (
                    <h3 className="mb-2 text-base font-bold text-gray-900">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h4 className="mb-2 text-sm font-bold text-gray-800">{children}</h4>
                  ),
                  h3: ({ children }) => (
                    <h5 className="mb-1 text-sm font-semibold text-gray-700">{children}</h5>
                  ),
                }}
              >
                {expandedGoal}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recipes */}
        {recipes.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="brutalism-title text-center text-2xl">Your Recommended Meals</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r, i) => {
                const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
                  const [isModalOpen, setIsModalOpen] = useState(false);

                  return (
                    <div className="brutalism-card flex h-full flex-col rounded-none p-4">
                      <h3 className="brutalism-heading mb-2 line-clamp-2 text-base text-emerald-700">
                        {recipe.name}
                      </h3>

                      <div className="mb-2 text-sm">
                        <span className="brutalism-text-bold">Ingredients:</span>
                        <p className="mt-1 line-clamp-2 text-gray-700">
                          {recipe.key_ingredients.join(", ")}
                        </p>
                      </div>

                      <div className="mb-2 text-sm">
                        <span className="brutalism-text-bold">Recipe:</span>
                        <p className="mt-1 line-clamp-3 text-gray-700">{recipe.recipe}</p>
                      </div>

                      <div className="mb-3 flex-1 text-sm">
                        <span className="brutalism-text-bold">Tags:</span>
                        <p className="mt-1">
                          {recipe.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="mr-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsModalOpen(true);
                        }}
                        className="brutalism-button-secondary mt-auto w-full rounded-none py-2 text-sm"
                      >
                        + Add to Calendar
                      </button>

                      {isModalOpen && (
                        <AddMealModal
                          recipe={{ id: recipe.id, name: recipe.name ?? "Recipe" }}
                          isOpen={isModalOpen}
                          onClose={() => setIsModalOpen(false)}
                        />
                      )}
                    </div>
                  );
                };

                return <RecipeCard key={i} recipe={r} />;
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
