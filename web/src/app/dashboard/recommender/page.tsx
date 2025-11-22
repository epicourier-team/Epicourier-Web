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
    <section className="min-h-screen py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="brutalism-title mb-8 text-center text-4xl md:text-5xl">
          Personalized Meal Recommendations
        </h1>
        <p className="brutalism-text-bold mb-4 text-center">
          Describe your goal (e.g. &quot;Lose 5 kg in 2 months&quot; or &quot;High-protein
          vegetarian diet&quot;) and choose how many meals you want for your daily plan.
        </p>
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
            className="brutalism-button-primary flex w-full items-center justify-center gap-2 rounded-none"
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
          <div className="brutalism-banner mt-12 rounded-none p-6 text-center">
            <h2 className="brutalism-heading mb-4">Expanded Goal</h2>
            <div className="prose prose-emerald mx-auto max-w-none text-left">
              <ReactMarkdown>{expandedGoal}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recipes */}
        {recipes.length > 0 && (
          <div className="mt-16 space-y-8">
            <h2 className="brutalism-title text-center text-3xl">Your Recommended Meals</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map((r, i) => {
                const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
                  const [isModalOpen, setIsModalOpen] = useState(false);

                  return (
                    <div className="brutalism-card rounded-none p-6">
                      <h3 className="brutalism-heading mb-3 text-emerald-700">{recipe.name}</h3>

                      <p className="mb-2">
                        <span className="brutalism-text-bold">Key Ingredients:</span>{" "}
                        {recipe.key_ingredients.join(", ")}
                      </p>

                      <p className="mb-2 whitespace-pre-line">
                        <span className="brutalism-text-bold">Recipe:</span> {recipe.recipe}
                      </p>

                      <p className="mb-2">
                        <span className="brutalism-text-bold">Tags:</span> {recipe.tags.join(", ")}
                      </p>

                      <p className="mb-2">
                        <span className="brutalism-text-bold">Reason:</span> {recipe.reason}
                      </p>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsModalOpen(true);
                        }}
                        className="brutalism-button-secondary mt-3 w-full rounded-none py-2"
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
