"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, UtensilsCrossed, CalendarPlus, CheckCircle2, AlertCircle } from "lucide-react";
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
    <section className="min-h-screen bg-gray-50/50 py-12 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4">
            <UtensilsCrossed className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">
            Your Personal Nutritionist
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us your goals, and our AI will craft the perfect meal plan for you.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-3xl mx-auto">
          <div className="p-8 md:p-10 space-y-8">
            {error && (
              <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  What is your goal?
                </label>
                <div className="relative">
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full min-h-[120px] rounded-xl border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 transition-all resize-none text-lg"
                    placeholder="e.g., I want to lose 5kg in 2 months while building muscle. I prefer vegetarian food with Asian flavors."
                    required
                  />
                  <div className="absolute bottom-3 right-3">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Daily Meals
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumMeals(num)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                        numMeals === num
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                          : "border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <span className="text-2xl font-bold">{num}</span>
                      <span className="text-xs font-medium uppercase">Meals</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing Nutritional Needs...</span>
                  </div>
                ) : (
                  "Generate My Plan"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Loading Skeleton / State */}
        {loading && !expandedGoal && (
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        )}

        {/* Results Section */}
        {(expandedGoal || recipes.length > 0) && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Expanded Goal Insight */}
            {expandedGoal && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-emerald-900">AI Analysis</h2>
                </div>
                <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown>{expandedGoal}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Recipes Grid */}
            {recipes.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Daily Plan</h2>
                  <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                    {recipes.length} Meals
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((r, i) => {
                    const RecipeCard: React.FC<{ recipe: Recipe; index: number }> = ({ recipe, index }) => {
                      const [isModalOpen, setIsModalOpen] = useState(false);

                      return (
                        <div
                          className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 overflow-hidden"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="p-6 flex-1 space-y-4">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {recipe.name}
                              </h3>
                              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-xs font-bold text-gray-400">
                                {index + 1}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Why this meal?</p>
                                <p className="text-sm text-gray-600 italic leading-relaxed">"{recipe.reason}"</p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Ingredients</p>
                                <div className="flex flex-wrap gap-2">
                                  {recipe.key_ingredients.slice(0, 4).map((ing, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md">
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                            <Button
                              onClick={() => setIsModalOpen(true)}
                              className="w-full bg-white text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 font-semibold shadow-sm"
                              variant="outline"
                            >
                              <CalendarPlus className="w-4 h-4 mr-2" />
                              Add to Calendar
                            </Button>
                          </div>

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

                    return <RecipeCard key={i} recipe={r} index={i} />;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
