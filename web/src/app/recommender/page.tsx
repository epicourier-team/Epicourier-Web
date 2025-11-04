"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UtensilsCrossed } from "lucide-react";

interface Recipe {
  name: string;
  ingredients: string[];
  directions: string;
}

export default function RecommendPage() {
  const [goal, setGoal] = useState("");
  const [numMeals, setNumMeals] = useState(3);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecipes([]);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, numMeals }),
      });

      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to get recommendations.");
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
        <p className="text-center text-gray-600 mb-12">
          Describe your goal (e.g. “Lose 5 kg in 2 months” or “High-protein vegetarian diet”)
          and choose how many meals you want for your day plan.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-8 space-y-6 border border-gray-100"
        >
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Your Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Lose 5 kg while keeping muscle, prefer Asian flavors"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Number of Meals
            </label>
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

        {/* Results */}
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
                    <strong>Ingredients:</strong> {r.ingredients.join(", ")}
                  </p>
                  <p className="text-gray-700 whitespace-pre-line">
                    <strong>Directions:</strong> {r.directions}
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