import { NextResponse } from "next/server";
import { getRecipeDetail } from "../../../../lib/utils";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const recipeId = id;

  const recipeDetail = await getRecipeDetail(recipeId);

  if (!recipeDetail) {
    return NextResponse.json({ error: "Recipe not found", id: +recipeId }, { status: 404 });
  }

  return NextResponse.json(recipeDetail);
}
