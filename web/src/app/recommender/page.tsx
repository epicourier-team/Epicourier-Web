"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UtensilsCrossed } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Recipe {
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
      setRecipes(data.recipes || []);
    } catch (err: any) {
      console.error("Error fetching recommendations:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8">
          Personalized Meal Recommendations
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Describe your goal (e.g. “Lose 5 kg in 2 months” or “High-protein vegetarian diet”)
          and choose how many meals you want for your daily plan.
        </p>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-8 space-y-6 border border-gray-100"
        >
          <div>
            <label className="block text-gray-700 font-medium mb-2">Your Goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Lose 5 kg while keeping muscle, prefer Asian flavors"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Number of Meals</label>
            <select
              value={numMeals}
              onChange={(e) => setNumMeals(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500"
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
            className="w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-5 h-5" />
                Get My Daily Plan
              </>
            )}
          </Button>
        </form>

        {/* Expanded Goal */}
        {expandedGoal && (
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Expanded Goal</h2>
            {/* <div className="prose prose-emerald mx-auto text-left max-w-2xl"> */}
            {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>{expandedGoal}</ReactMarkdown> */}
            {/* </div> */}
            <div className="prose prose-emerald max-w-none mx-auto text-left">
              <ReactMarkdown>{expandedGoal}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recipes */}
        {recipes.length > 0 && (
          <div className="mt-16 space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Your Recommended Meals
            </h2>
            <div className="grid gap-6">
              {recipes.map((r, i) => (
                <div
                  key={i}
                  className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <h3 className="text-2xl font-semibold text-emerald-700 mb-3">{r.name}</h3>

                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold text-gray-900">Key Ingredients:</span>{" "}
                    {r.key_ingredients.join(", ")}
                  </p>

                  <p className="text-gray-700 whitespace-pre-line mb-2">
                    <span className="font-semibold text-gray-900">Recipe:</span>{" "}
                    {r.recipe}
                  </p>

                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold text-gray-900">Tags:</span>{" "}
                    {r.tags.join(", ")}
                  </p>

                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold text-gray-900">Reason:</span>{" "}
                    {r.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}