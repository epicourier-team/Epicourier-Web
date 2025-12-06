"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import AddToShoppingListModal from "@/components/shopping/AddToShoppingListModal";

interface Ingredient {
  id: number;
  ingredientId: number;
  name: string;
  unit?: string | null;
  quantity?: number;
}

interface AddToCartButtonProps {
  ingredients: Ingredient[];
  recipeName: string;
}

export default function AddToCartButton({ ingredients, recipeName }: AddToCartButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform ingredients to the format expected by the modal
  const formattedIngredients = ingredients.map((i) => ({
    id: i.id,
    ingredientId: i.ingredientId,
    name: i.name,
    unit: i.unit ?? undefined,
    quantity: i.quantity ?? 1,
  }));

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="brutalism-button flex items-center gap-2 bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-600"
      >
        <ShoppingCart className="h-5 w-5" />
        Add to Shopping List
      </button>

      <AddToShoppingListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ingredients={formattedIngredients}
        recipeName={recipeName}
      />
    </>
  );
}
