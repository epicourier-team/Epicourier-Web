import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { notFound } from "next/navigation";
import { NUTRIENT_NAME } from "../../../../lib/constants";
import { getRecipeDetail } from "../../../../lib/utils";
import AddToCartButton from "@/components/shopping/AddToCartButton";

export async function generateStaticParams() {
  const { data: recipes } = await supabase.from("Recipe").select("id");
  return (recipes ?? []).map((r) => ({ id: String(r.id) }));
}

export const dynamicParams = true;

export const revalidate = 3600;

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipeData = await getRecipeDetail(id);
  if (!recipeData) return notFound();

  const { recipe, ingredients, tags, sumNutrients } = recipeData;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="relative mx-auto mb-6 h-64 w-64">
        {recipe.image_url && (
          <Image
            src={recipe.image_url}
            alt={recipe.name ?? "Recipe"}
            fill
            className="object-cover"
          />
        )}
      </div>

      <h1 className="mb-2 text-3xl font-bold">{recipe.name}</h1>
      <div className="mb-4 flex gap-2">
        <AddToCartButton
          recipeName={recipe.name ?? "Recipe"}
          ingredients={ingredients.map((i) => ({
            id: i.ingredient.id,
            name: i.ingredient.name ?? "Unknown",
            quantity: i.relative_unit_100 ?? 100,
            unit: i.ingredient.unit ?? "unit",
          }))}
        />
      </div>
      <div className="mb-6 text-sm text-gray-600">
        <p>🕒 Prep Time: {recipe.min_prep_time} mins</p>
        <p>🌿 Green Score: {recipe.green_score}</p>
      </div>
      <p className="mb-4 leading-relaxed whitespace-pre-line text-gray-700">{recipe.description}</p>
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <span className="text-gray-500">No tags available.</span>}
          {tags.map((t) => (
            <span
              key={t.tag.id}
              className="cursor-pointer rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {ingredients.map((i) => (
            <li
              key={i.ingredient.id}
              className="grid grid-cols-[180px_180px_auto] border-b pt-2 pb-2"
            >
              <span className="font-bold font-medium">{i.ingredient.name}</span>
              <span className="test-gray-600">
                {i.ingredient.unit} {i.relative_unit_100 === 100 ? "" : `X ${i.relative_unit_100}%`}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {((i.ingredient.calories_kcal ?? 0) * (i.relative_unit_100 ?? 0)) / 100} kcal
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Nutrient Info</h2>
        <div>
          {Object.entries(sumNutrients).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b py-2">
              <span className="font-medium">{NUTRIENT_NAME[key]}</span>
              <span>{(value ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
