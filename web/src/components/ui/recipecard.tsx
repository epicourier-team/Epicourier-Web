import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="flex flex-col rounded-lg border p-4 shadow-sm transition hover:shadow-lg">
      <Link
        className="flex flex-col rounded-lg border p-4 shadow-sm transition hover:shadow-lg"
        href={`/dashboard/recipes/${recipe.id}`}
      >
        {recipe.image_url && (
          <Image
            src={recipe.image_url}
            alt={recipe.name ?? "recipe"}
            width={120}
            height={120}
            className="mb-2 self-center rounded-lg object-cover"
          />
        )}
        <h3 className="text-lg font-semibold">{recipe.name}</h3>
        <p className="line-clamp-2 text-sm text-gray-600">{recipe.description}</p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault(); // 防止 Link 觸發跳轉
          setIsModalOpen(true);
        }}
        className="mt-3 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        + Add to Calendar
      </button>

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
