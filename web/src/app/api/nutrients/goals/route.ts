import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const GOAL_FIELDS = [
  "calories_kcal",
  "protein_g",
  "carbs_g",
  "fats_g",
  "sodium_mg",
  "fiber_g",
] as const;
type GoalField = (typeof GOAL_FIELDS)[number];

type GoalValues = Partial<Record<GoalField, number>>;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type NutrientGoalRow = Record<GoalField, number | null> & {
  created_at?: string | null;
  updated_at?: string | null;
};

async function requireAuthUserId(supabase: SupabaseServerClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user.id;
}

function parseGoalPayload(body: unknown): { payload?: GoalValues; error?: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid payload" };
  }

  const payload: GoalValues = {};
  let hasField = false;

  for (const field of GOAL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const value = (body as Record<string, unknown>)[field];
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { error: `Invalid value for ${field}` };
      }
      payload[field] = value;
      hasField = true;
    }
  }

  if (!hasField) {
    return { error: "At least one goal field must be provided" };
  }

  return { payload };
}

export async function GET() {
  const supabase = await createClient();

  let userId: string;
  try {
    userId = await requireAuthUserId(supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { data: goal, error } = await supabase
    .from("nutrient_goals")
    .select(
      "user_id, calories_kcal, protein_g, carbs_g, fats_g, sodium_mg, fiber_g, created_at, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("GET /api/nutrients/goals error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal: goal ?? null });
}

export async function PUT(request: Request) {
  const supabase = await createClient();

  let userId: string;
  try {
    userId = await requireAuthUserId(supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { payload, error: payloadError } = parseGoalPayload(body);
  if (payloadError || !payload) {
    return NextResponse.json({ error: payloadError ?? "Invalid payload" }, { status: 400 });
  }

  const { data: existingGoal, error: fetchError } = await supabase
    .from("nutrient_goals")
    .select("calories_kcal, protein_g, carbs_g, fats_g, sodium_mg, fiber_g, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("PUT /api/nutrients/goals fetch error:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const mergedGoals = GOAL_FIELDS.reduce<Record<GoalField, number>>(
    (acc, field) => {
      const incoming = payload[field];
      const existing = (existingGoal as NutrientGoalRow | null)?.[field] ?? 0;
      acc[field] = typeof incoming === "number" ? incoming : existing;
      return acc;
    },
    {} as Record<GoalField, number>
  );

  const upsertInput = {
    user_id: userId,
    ...mergedGoals,
    updated_at: new Date().toISOString(),
  };

  const { data: goal, error: upsertError } = await supabase
    .from("nutrient_goals")
    .upsert([upsertInput], { onConflict: "user_id" })
    .select(
      "user_id, calories_kcal, protein_g, carbs_g, fats_g, sodium_mg, fiber_g, created_at, updated_at"
    )
    .single();

  if (upsertError) {
    console.error("PUT /api/nutrients/goals upsert error:", upsertError.message);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ goal });
}
