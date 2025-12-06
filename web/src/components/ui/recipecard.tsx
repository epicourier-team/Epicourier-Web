import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { RecipeWithIngredients, InventoryItemWithDetails } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  inventoryItems?: InventoryItemWithDetails[];
}

export default function RecipeCard({ recipe, inventoryItems = [] }: RecipeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculateMatchPercentage = () => {
    const recipeIngredients = recipe["Recipe-Ingredient_Map"] || [];
    if (recipeIngredients.length === 0) return 0;

    const totalIngredients = recipeIngredients.length;
    let matchedIngredients = 0;

    recipeIngredients.forEach((ri) => {
      const hasItem = inventoryItems.some((item) => item.ingredient_id === ri.ingredient_id);
      if (hasItem) {
        matchedIngredients++;
      }
    });

    return Math.round((matchedIngredients / totalIngredients) * 100);
  };

  const matchPercentage = calculateMatchPercentage();
  const missingCount =
    (recipe["Recipe-Ingredient_Map"]?.length || 0) -
    Math.floor((matchPercentage / 100) * (recipe["Recipe-Ingredient_Map"]?.length || 0));

  // Color coding based on match percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return { bg: "bg-green-300", icon: CheckCircle2, text: "High Match" };
    if (percentage >= 50)
      return { bg: "bg-yellow-300", icon: AlertTriangle, text: "Partial Match" };
    return { bg: "bg-red-300", icon: XCircle, text: "Low Match" };
  };

  const matchInfo = getMatchColor(matchPercentage);
  const MatchIcon = matchInfo.icon;

  return (
    <div className="brutalism-card group flex flex-col overflow-hidden">
      <Link href={`/dashboard/recipes/${recipe.id}`} className="flex flex-col gap-3 p-4">
        {recipe.image_url && (
          <div className="brutalism-border relative aspect-video w-full overflow-hidden">
            <Image
              src={recipe.image_url}
              alt={recipe.name ?? "recipe"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Match percentage badge */}
            <div
              className={`brutalism-border absolute top-2 right-2 ${matchInfo.bg} flex items-center gap-1 px-2 py-1 text-xs font-bold`}
              title={`${matchInfo.text}: ${missingCount} ingredient(s) needed`}
            >
              <MatchIcon className="h-3 w-3" />
              {matchPercentage}%
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="brutalism-text-bold line-clamp-2 text-base leading-tight">
            {recipe.name}
          </h3>
          <p className="line-clamp-2 text-sm text-gray-600">{recipe.description}</p>
        </div>
      </Link>
      <div className="brutalism-border mt-auto border-x-0 border-b-0 bg-gray-50 p-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="brutalism-button-inverse w-full px-4 py-2 text-sm"
        >
          + Add to Calendar
        </button>
      </div>

      {isModalOpen && (
        <AddMealModal
          recipe={{ id: recipe.id, name: recipe.name ?? "Unnamed Recipe" }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
