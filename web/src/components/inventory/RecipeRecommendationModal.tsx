"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChefHat,
  Clock,
  ShoppingCart,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Plus,
  Utensils,
} from "lucide-react";
import type { InventoryRecipeRecommendation, InventoryRecommendResponse } from "@/types/data";

interface RecipeRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: InventoryRecommendResponse | null;
  isLoading: boolean;
  onAddToShoppingList?: (missingIngredients: string[]) => void;
}

export function RecipeRecommendationModal({
  isOpen,
  onClose,
  recommendations,
  isLoading,
  onAddToShoppingList,
}: RecipeRecommendationModalProps) {
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const getMatchScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  const getMatchScoreBackground = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 70) return "Great Match";
    if (score >= 40) return "Good Match";
    return "Needs Shopping";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden rounded-none border-2 border-black p-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        {/* Header - Neo-Brutalism style */}
        <div className="border-b-2 border-black bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-3 text-xl">
              <div className="rounded-none border-2 border-black bg-emerald-100 p-2">
                <Sparkles className="size-5 text-emerald-600" />
              </div>
              AI Recipe Recommendations
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Smart recipes based on your inventory • Expiring items prioritized
            </DialogDescription>
          </DialogHeader>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : recommendations ? (
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="space-y-6 p-6">
              {/* AI Summary Card */}
              {recommendations.overall_reasoning && (
                <Card className="rounded-none border-2 border-black bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="h-fit rounded-none border-2 border-black bg-emerald-100 p-2">
                        <Lightbulb className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-foreground mb-1 text-sm font-medium">AI Analysis</p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {recommendations.overall_reasoning}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recipe Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Utensils className="text-muted-foreground size-5" />
                    Recommended Recipes
                  </h3>
                  <Badge variant="secondary" className="font-normal">
                    {recommendations.recommendations.length} recipes
                  </Badge>
                </div>

                {recommendations.recommendations.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.recipe_id}
                    recipe={recipe}
                    index={index}
                    isExpanded={expandedRecipe === recipe.recipe_id}
                    onToggle={() =>
                      setExpandedRecipe(
                        expandedRecipe === recipe.recipe_id ? null : recipe.recipe_id
                      )
                    }
                    onAddToShoppingList={onAddToShoppingList}
                    getMatchScoreColor={getMatchScoreColor}
                    getMatchScoreBackground={getMatchScoreBackground}
                    getMatchScoreLabel={getMatchScoreLabel}
                  />
                ))}
              </div>

              {/* Shopping Suggestions */}
              {recommendations.shopping_suggestions.length > 0 && (
                <ShoppingSuggestions
                  suggestions={recommendations.shopping_suggestions}
                  onAddToShoppingList={onAddToShoppingList}
                />
              )}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState />
        )}

        {/* Footer */}
        <div className="bg-muted/30 flex justify-end border-t-2 border-black p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-none border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="relative">
        <div className="rounded-none border-2 border-black bg-gradient-to-br from-emerald-100 to-teal-100 p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-foreground font-medium">Analyzing your inventory...</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Our AI is finding the best recipes that use your expiring ingredients first
        </p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
      <div className="bg-muted rounded-none border-2 border-black p-4">
        <ChefHat className="text-muted-foreground size-10" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-foreground font-medium">No recommendations yet</p>
        <p className="text-muted-foreground text-sm">
          Add items to your inventory to get personalized recipe suggestions
        </p>
      </div>
    </div>
  );
}

// Shopping Suggestions Component
interface ShoppingSuggestionsProps {
  suggestions: string[];
  onAddToShoppingList?: (ingredients: string[]) => void;
}

function ShoppingSuggestions({ suggestions, onAddToShoppingList }: ShoppingSuggestionsProps) {
  return (
    <Card className="rounded-none border-2 border-black bg-gradient-to-br from-teal-50 to-cyan-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-none border-2 border-black bg-teal-100 p-2">
              <ShoppingCart className="size-4 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-base">Shopping Suggestions</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                These ingredients unlock more recipe possibilities
              </CardDescription>
            </div>
          </div>
          {onAddToShoppingList && (
            <Button
              size="sm"
              className="rounded-none border-2 border-black bg-teal-600 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-teal-700 hover:shadow-none"
              onClick={() => onAddToShoppingList(suggestions)}
            >
              <Plus className="mr-1.5 size-3" />
              Add All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((ingredient) => (
            <Badge
              key={ingredient}
              variant="secondary"
              className="cursor-pointer rounded-none border-2 border-black bg-white px-3 py-1.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-teal-100 hover:shadow-none"
              onClick={() => onAddToShoppingList?.([ingredient])}
            >
              <Plus className="mr-1.5 size-3 text-teal-600" />
              {ingredient}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: InventoryRecipeRecommendation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAddToShoppingList?: (ingredients: string[]) => void;
  getMatchScoreColor: (score: number) => string;
  getMatchScoreBackground: (score: number) => string;
  getMatchScoreLabel: (score: number) => string;
}

function RecipeCard({
  recipe,
  index,
  isExpanded,
  onToggle,
  onAddToShoppingList,
  getMatchScoreColor,
  getMatchScoreLabel,
}: RecipeCardProps) {
  const totalIngredients = recipe.ingredients_available.length + recipe.ingredients_missing.length;
  const progressValue =
    totalIngredients > 0 ? (recipe.ingredients_available.length / totalIngredients) * 100 : 0;

  return (
    <Card
      className={`overflow-hidden rounded-none border-2 border-black transition-all duration-200 ${isExpanded ? "translate-x-[2px] translate-y-[2px] shadow-none" : "shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"}`}
    >
      {/* Card Header - Clickable */}
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center bg-black text-xs font-bold text-white">
                  {index + 1}
                </div>
                <CardTitle className="truncate text-base">{recipe.recipe_name}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">{recipe.reason}</CardDescription>
            </div>

            {/* Match Score */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className={`text-2xl font-bold ${getMatchScoreColor(recipe.match_score)}`}>
                {recipe.match_score}%
              </div>
              <span className={`text-xs font-medium ${getMatchScoreColor(recipe.match_score)}`}>
                {getMatchScoreLabel(recipe.match_score)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1.5">
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Ingredient coverage</span>
              <span>
                {recipe.ingredients_available.length} of {totalIngredients}
              </span>
            </div>
            <Progress value={progressValue} className="h-2 rounded-none border border-black" />
          </div>

          {/* Expiring Warning */}
          {recipe.expiring_ingredients_used.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-none border-2 border-black bg-amber-100 px-3 py-2">
              <Clock className="size-4 shrink-0 text-amber-700" />
              <span className="text-xs font-medium text-amber-800">
                Uses {recipe.expiring_ingredients_used.length} expiring ingredient
                {recipe.expiring_ingredients_used.length > 1 ? "s" : ""}:{" "}
                {recipe.expiring_ingredients_used.join(", ")}
              </span>
            </div>
          )}

          {/* Expand Indicator */}
          <div className="text-muted-foreground mt-2 flex items-center justify-center">
            {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </div>
        </CardHeader>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="bg-muted/20 border-t-2 border-black pt-0">
          <div className="space-y-4 pt-4">
            {/* Ingredients Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Available Ingredients */}
              {recipe.ingredients_available.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <Check className="size-4" />
                    You Have ({recipe.ingredients_available.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients_available.map((ing) => (
                      <Badge
                        key={ing}
                        variant="outline"
                        className="rounded-none border-2 border-emerald-600 bg-emerald-100 text-emerald-800"
                      >
                        <Check className="mr-1 size-3" />
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Ingredients */}
              {recipe.ingredients_missing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-rose-700">
                    <AlertCircle className="size-4" />
                    Missing ({recipe.ingredients_missing.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients_missing.map((ing) => (
                      <Badge
                        key={ing}
                        variant="outline"
                        className="rounded-none border-2 border-rose-600 bg-rose-100 text-rose-800"
                      >
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                className="rounded-none border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                asChild
              >
                <a href={`/dashboard/recipes?id=${recipe.recipe_id}`} target="_blank">
                  <ExternalLink className="mr-2 size-4" />
                  View Recipe
                </a>
              </Button>
              {recipe.ingredients_missing.length > 0 && onAddToShoppingList && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  onClick={() => onAddToShoppingList(recipe.ingredients_missing)}
                >
                  <ShoppingCart className="mr-2 size-4" />
                  Add {recipe.ingredients_missing.length} Missing to List
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default RecipeRecommendationModal;
