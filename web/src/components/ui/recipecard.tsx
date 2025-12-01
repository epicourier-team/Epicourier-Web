import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";
import { CalendarPlus, Clock, Flame } from "lucide-react";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
      <Link
        className="flex flex-col"
        href={`/dashboard/recipes/${recipe.id}`}
      >
        {recipe.image_url && (
          <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-700">
            <Image
              src={recipe.image_url}
              alt={recipe.name ?? "recipe"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {recipe.name}
          </h3>
          <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {recipe.description}
          </p>
        </div>
      </Link>

      <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          <Calendar className="h-4 w-4" />
          Add to Calendar
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
