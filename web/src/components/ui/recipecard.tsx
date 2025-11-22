import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
