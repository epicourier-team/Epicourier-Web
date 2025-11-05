import Image from "next/image";
import Link from "next/link";
import { Recipe } from "../../types/data";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
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
  );
}
