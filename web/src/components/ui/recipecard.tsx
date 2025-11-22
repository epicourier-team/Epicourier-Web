import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="group bg-card text-card-foreground flex flex-col overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-lg">
      <Link href={`/dashboard/recipes/${recipe.id}`} className="flex flex-col gap-3 p-4">
        {recipe.image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={recipe.image_url}
              alt={recipe.name ?? "recipe"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="space-y-2">
          <h3 className="line-clamp-1 text-lg font-semibold">{recipe.name}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{recipe.description}</p>
        </div>
      </Link>
      <div className="mt-auto border-t p-4 pt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors"
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
