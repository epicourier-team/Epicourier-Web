"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import AddMealModal from "../../../components/ui/AddMealModal";
import { supabase } from "../../../lib/supabaseClient";
import { cn } from "@/lib/utils";

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
    setExpandedGoal(""); // Clear previous results

    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to get recommendations.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/recommender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, numMeals, userId: user.id }),
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

      setExpandedGoal(data.goal_expanded || "");
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
                // Recipe not found in database - this is expected for AI-generated names
                return { ...r };
              }

              const id = row?.id ?? r.id ?? null;
              return { ...r, id };
            } catch (e) {
              // Silently handle lookup errors - recipe will work without database ID
              return { ...r };
            }
          })
        );

        setRecipes(recipesWithIds);
      } catch (e) {
        console.error("Could not import supabase client or fetch ids:", e);
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
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            AI Meal Recommender
          </h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Get personalized sustainable meal recommendations powered by AI
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-6 rounded-xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <label className="mb-2 block font-medium text-emerald-900 dark:text-emerald-100">
            Your Goal
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-emerald-900 placeholder-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-emerald-100 dark:placeholder-emerald-600 dark:focus:border-emerald-600"
            placeholder="e.g., Lose 5 kg while keeping muscle, prefer Asian flavors"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium text-emerald-900 dark:text-emerald-100">
            Number of Meals
          </label>
          <select
            value={numMeals}
            onChange={(e) => setNumMeals(Number(e.target.value))}
            className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-emerald-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-emerald-100 dark:focus:border-emerald-600"
          >
            <option value={3}>3 meals</option>
            <option value={5}>5 meals</option>
            <option value={7}>7 meals</option>
          </select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="flex w-full items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Get My Sustainable Meal Plan
            </>
          )}
        </Button>
      </form>

      {/* Expanded Goal */}
      {expandedGoal && (
        <div className="mb-8 rounded-xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-emerald-900 dark:text-emerald-100">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Your Personalized Goal
          </h2>
          <div className="prose prose-emerald max-w-none dark:prose-invert">
            <ReactMarkdown>{expandedGoal}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Recipes */}
      {recipes.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            Your Recommended Meals
          </h2>
          <div className="grid gap-6">
            {recipes.map((r, i) => {
              const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
                const [isModalOpen, setIsModalOpen] = useState(false);

                return (
                  <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        {i + 1}
                      </span>
                      {recipe.name}
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          🥗 Key Ingredients:
                        </span>{" "}
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {recipe.key_ingredients.join(", ")}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          📝 Recipe:
                        </span>
                        <p className="mt-1 whitespace-pre-line text-emerald-700 dark:text-emerald-300">
                          {recipe.recipe}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          🏷️ Tags:
                        </span>{" "}
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {recipe.tags.join(", ")}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          💡 Why this meal:
                        </span>
                        <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                          {recipe.reason}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsModalOpen(true);
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-medium text-white transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                    >
                      <Calendar className="h-4 w-4" />
                      Add to Calendar
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
  );
}
