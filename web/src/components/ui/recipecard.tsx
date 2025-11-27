import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";
import { CalendarPlus, Clock, Flame } from "lucide-react";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="group flex flex-col h-full rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      <Link
        className="flex flex-col flex-1"
        href={`/dashboard/recipes/${recipe.id}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.name ?? "recipe"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <span className="text-4xl">🍳</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="flex flex-col flex-1 p-5">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-2">
            {recipe.name}
          </h3>
          <p className="line-clamp-2 text-sm text-gray-500 mb-4 flex-1">
            {recipe.description || "A delicious and nutritious meal option."}
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mt-auto">
            {/* Placeholder stats if available in future */}
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Quick</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0 mt-auto">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 active:bg-emerald-200"
        >
          <CalendarPlus className="h-4 w-4" />
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
