import { createClient } from "@/utils/supabase/server";
import { getPublicUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

interface NutrientRow {
  date: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  meal_count: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
}

type IngredientRow = {
  agg_fats_g: number | null;
  calories_kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  sugars_g: number | null;
  fiber_g?: number | null;
  sodium_mg?: number | null;
};

type RecipeIngredientMapRow = {
  relative_unit_100: number | null;
  Ingredient: IngredientRow | null;
};

type CalendarMealRow = {
  date: string | null;
  Recipe: {
    "Recipe-Ingredient_Map": RecipeIngredientMapRow[];
  } | null;
};

// Normalize a Date to UTC midnight and return YYYY-MM-DD
const toDateKey = (date: Date) => date.toISOString().split("T")[0];

const normalizeDate = (input: Date) => {
  return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
};

const buildDateRange = (start: Date, end: Date) => {
  const days: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
};

const createEmptyRow = (date: string): NutrientRow => ({
  date,
  calories_kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fats_g: 0,
  meal_count: 0,
  sugar_g: 0,
  fiber_g: 0,
  sodium_mg: 0,
});

/**
 * Fetch nutrient data for a date range
 */
async function fetchNutrientData(
  supabase: SupabaseClient<Database>,
  publicUserId: number,
  startDate: Date,
  endDate: Date
): Promise<NutrientRow[]> {
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);

  // Pre-fill map with every day in the range to avoid missing rows in CSV/PDF
  const allDays = buildDateRange(normalizedStart, normalizedEnd);
  const nutrientsByDate = new Map<string, NutrientRow>(
    allDays.map((dateKey) => [dateKey, createEmptyRow(dateKey)])
  );

  // Query Calendar table to get meal logs within date range
  const { data: calendarData, error: calendarError } = await supabase
    .from("Calendar")
    .select(
      `
      id,
      date,
      meal_type,
      recipe_id,
      Recipe: recipe_id(
        id,
        name,
        Recipe-Ingredient_Map(
          relative_unit_100,
          Ingredient: ingredient_id(
            agg_fats_g,
            calories_kcal,
            carbs_g,
            protein_g,
            sugars_g
          )
        )
      )
    `
    )
    .eq("user_id", publicUserId)
    .eq("status", true)
    .gte("date", toDateKey(normalizedStart))
    .lte("date", toDateKey(normalizedEnd))
    .order("date", { ascending: true })
    .returns<CalendarMealRow[]>();

  if (calendarError) {
    console.error("Error fetching calendar data:", calendarError.message);
    throw new Error(calendarError.message);
  }

  if (calendarData && calendarData.length > 0) {
    for (const meal of calendarData as CalendarMealRow[]) {
      if (!meal?.date) continue;

      const dateKey = toDateKey(normalizeDate(new Date(meal.date)));
      if (!nutrientsByDate.has(dateKey)) {
        continue;
      }

      const dayData = nutrientsByDate.get(dateKey)!;
      dayData.meal_count += 1;

      const recipe = meal.Recipe as {
        id: number;
        name: string;
        "Recipe-Ingredient_Map": Array<{
          relative_unit_100: number;
          Ingredient: {
            agg_fats_g: number | null;
            calories_kcal: number | null;
            carbs_g: number | null;
            protein_g: number | null;
            sugars_g: number | null;
            fiber_g?: number | null;
            sodium_mg?: number | null;
          };
        }>;
      } | null;

      if (!recipe) continue;

      const ingredientMaps = recipe["Recipe-Ingredient_Map"] || [];

      for (const map of ingredientMaps) {
        const ingredient = map.Ingredient;
        if (!ingredient) continue;

        const ratio = (map.relative_unit_100 || 100) / 100;

        dayData.calories_kcal += Number(ingredient.calories_kcal || 0) * ratio;
        dayData.protein_g += Number(ingredient.protein_g || 0) * ratio;
        dayData.carbs_g += Number(ingredient.carbs_g || 0) * ratio;
        dayData.fats_g += Number(ingredient.agg_fats_g || 0) * ratio;
        dayData.sugar_g += Number(ingredient.sugars_g || 0) * ratio;
        dayData.fiber_g += Number(ingredient.fiber_g || 0) * ratio;
        dayData.sodium_mg += Number(ingredient.sodium_mg || 0) * ratio;
      }
    }
  }

  // Convert map to array and round values
  return Array.from(nutrientsByDate.values())
    .map((row) => ({
      ...row,
      calories_kcal: Math.round(row.calories_kcal * 100) / 100,
      protein_g: Math.round(row.protein_g * 100) / 100,
      carbs_g: Math.round(row.carbs_g * 100) / 100,
      fats_g: Math.round(row.fats_g * 100) / 100,
      sugar_g: Math.round(row.sugar_g * 100) / 100,
      fiber_g: Math.round(row.fiber_g * 100) / 100,
      sodium_mg: Math.round(row.sodium_mg * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate CSV content from nutrient data
 */
function generateCSV(data: NutrientRow[]): string {
  const headers = [
    "Date",
    "Calories (kcal)",
    "Protein (g)",
    "Carbs (g)",
    "Fats (g)",
    "Fiber (g)",
    "Sugar (g)",
    "Sodium (mg)",
    "Meal Count",
  ];

  const rows = data.map((row) => [
    row.date,
    row.calories_kcal.toString(),
    row.protein_g.toString(),
    row.carbs_g.toString(),
    row.fats_g.toString(),
    row.fiber_g.toString(),
    row.sugar_g.toString(),
    row.sodium_mg.toString(),
    row.meal_count.toString(),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return csvContent;
}

/**
 * Generate simple PDF content from nutrient data
 */
function generatePDF(data: NutrientRow[], startDate: string, endDate: string): string {
  // Simple text-based PDF-like report
  const lines: string[] = [];

  lines.push("NUTRITION SUMMARY REPORT");
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Period: ${startDate} to ${endDate}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("=".repeat(50));
  lines.push("");

  if (data.length === 0) {
    lines.push("No nutrition data available for this period.");
  } else {
    // Calculate totals
    const totals = data.reduce(
      (acc, row) => ({
        calories_kcal: acc.calories_kcal + row.calories_kcal,
        protein_g: acc.protein_g + row.protein_g,
        carbs_g: acc.carbs_g + row.carbs_g,
        fats_g: acc.fats_g + row.fats_g,
        sugar_g: acc.sugar_g + row.sugar_g,
        fiber_g: acc.fiber_g + row.fiber_g,
        sodium_mg: acc.sodium_mg + row.sodium_mg,
        meal_count: acc.meal_count + row.meal_count,
      }),
      {
        calories_kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        fats_g: 0,
        sugar_g: 0,
        fiber_g: 0,
        sodium_mg: 0,
        meal_count: 0,
      }
    );

    const avgDays = data.length;

    lines.push("SUMMARY STATISTICS");
    lines.push("-".repeat(50));
    lines.push(`Total Days: ${avgDays}`);
    lines.push(`Total Meals: ${totals.meal_count}`);
    lines.push("");

    lines.push("TOTAL NUTRIENTS");
    lines.push("-".repeat(50));
    lines.push(`Calories: ${Math.round(totals.calories_kcal)} kcal`);
    lines.push(`Protein: ${Math.round(totals.protein_g * 10) / 10} g`);
    lines.push(`Carbs: ${Math.round(totals.carbs_g * 10) / 10} g`);
    lines.push(`Fats: ${Math.round(totals.fats_g * 10) / 10} g`);
    lines.push(`Fiber: ${Math.round(totals.fiber_g * 10) / 10} g`);
    lines.push(`Sugar: ${Math.round(totals.sugar_g * 10) / 10} g`);
    lines.push(`Sodium: ${Math.round(totals.sodium_mg * 10) / 10} mg`);
    lines.push("");

    lines.push("DAILY AVERAGES");
    lines.push("-".repeat(50));
    lines.push(`Calories: ${Math.round(totals.calories_kcal / avgDays)} kcal/day`);
    lines.push(`Protein: ${Math.round((totals.protein_g / avgDays) * 10) / 10} g/day`);
    lines.push(`Carbs: ${Math.round((totals.carbs_g / avgDays) * 10) / 10} g/day`);
    lines.push(`Fats: ${Math.round((totals.fats_g / avgDays) * 10) / 10} g/day`);
    lines.push(`Fiber: ${Math.round((totals.fiber_g / avgDays) * 10) / 10} g/day`);
    lines.push(`Sugar: ${Math.round((totals.sugar_g / avgDays) * 10) / 10} g/day`);
    lines.push(`Sodium: ${Math.round((totals.sodium_mg / avgDays) * 10) / 10} mg/day`);
    lines.push("");

    lines.push("DAILY BREAKDOWN");
    lines.push("-".repeat(50));
    lines.push("");

    for (const row of data) {
      lines.push(`Date: ${row.date}`);
      lines.push(`  Calories: ${Math.round(row.calories_kcal)} kcal`);
      lines.push(`  Protein: ${Math.round(row.protein_g * 10) / 10} g`);
      lines.push(`  Carbs: ${Math.round(row.carbs_g * 10) / 10} g`);
      lines.push(`  Fats: ${Math.round(row.fats_g * 10) / 10} g`);
      lines.push(`  Fiber: ${Math.round(row.fiber_g * 10) / 10} g`);
      lines.push(`  Sugar: ${Math.round(row.sugar_g * 10) / 10} g`);
      lines.push(`  Sodium: ${Math.round(row.sodium_mg * 10) / 10} mg`);
      lines.push(`  Meals: ${row.meal_count}`);
      lines.push("");
    }
  }

  lines.push("=".repeat(50));
  lines.push("End of Report");

  return lines.join("\n");
}

/**
 * GET /api/nutrients/export?format=csv|pdf&start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Query parameters:
 * - format: "csv" or "pdf" (default: "csv")
 *   Note: "pdf" format returns a text-based summary report, not a true PDF file.
 *   The format parameter name is maintained for API consistency and simplicity.
 * - start: Start date in YYYY-MM-DD format (required)
 * - end: End date in YYYY-MM-DD format (required)
 *
 * Returns nutrient data as downloadable CSV or text-based summary report.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.warn("GET /api/nutrients/export auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  // Validate format
  if (format !== "csv" && format !== "pdf") {
    return NextResponse.json({ error: "Invalid format. Must be 'csv' or 'pdf'" }, { status: 400 });
  }

  // Validate date parameters
  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: "Both 'start' and 'end' date parameters are required" },
      { status: 400 }
    );
  }

  const startDate = new Date(startParam);
  const endDate = new Date(endParam);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "Start date must be before or equal to end date" },
      { status: 400 }
    );
  }

  try {
    // Fetch nutrient data
    const data = await fetchNutrientData(supabase, publicUserId, startDate, endDate);

    if (format === "csv") {
      const csvContent = generateCSV(data);
      const filename = `nutrition-${startParam}-to-${endParam}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // PDF format - returns a text-based summary report
      // Note: Uses "pdf" in format parameter for simplicity, but generates a .txt file
      // Future enhancement: Could implement actual PDF generation with a library
      const pdfContent = generatePDF(data, startParam, endParam);
      const filename = `nutrition-report-${startParam}-to-${endParam}.txt`;

      return new NextResponse(pdfContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error("Error generating export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
