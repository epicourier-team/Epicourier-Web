import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="group flex flex-col overflow-hidden border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <Link href={`/dashboard/recipes/${recipe.id}`} className="flex flex-col gap-3 p-4">
        {recipe.image_url && (
          <div className="relative aspect-video w-full overflow-hidden border-2 border-black">
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
          <h3 className="line-clamp-2 text-base leading-tight font-bold">{recipe.name}</h3>
          <p className="line-clamp-2 text-sm text-gray-600">{recipe.description}</p>
        </div>
      </Link>
      <div className="mt-auto border-t-2 border-black bg-gray-50 p-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="w-full border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white hover:text-black"
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
