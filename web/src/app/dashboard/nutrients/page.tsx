"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Activity, Apple, Beef, Download, Scale } from "lucide-react";
import { useEffect, useState } from "react";

import type { DailyNutrient } from "@/types/data";

/**
 * Nutrient Dashboard Page
 * Displays daily nutrient tracking data from user's meal logs
 */
export default function NutrientsPage() {
  const [dailyData, setDailyData] = useState<DailyNutrient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNutrientData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/nutrients/daily?period=day");
        
        if (!response.ok) {
          throw new Error("Failed to fetch nutrient data");
        }

        const data = await response.json();
        setDailyData(data.daily);
      } catch (err) {
        console.error("Error fetching nutrient data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchNutrientData();
  }, []);

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      setExporting(true);

      // Calculate date range - last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startParam = startDate.toISOString().split("T")[0];
      const endParam = endDate.toISOString().split("T")[0];

      const url = `/api/nutrients/export?format=${format}&start=${startParam}&end=${endParam}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get the blob and create a download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `nutrition-export.${format}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export Successful",
        description: `Your nutrition data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export data",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="brutalism-card brutalism-shadow-lg p-8">
          <div className="text-center">
            <Activity className="mx-auto mb-4 size-12 animate-pulse" />
            <h2 className="brutalism-text-bold text-xl">Loading Nutrient Data...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="brutalism-card brutalism-shadow-lg border-4 border-red-500 bg-red-50 p-8">
          <div className="text-center">
            <h2 className="brutalism-text-bold mb-2 text-xl text-red-800">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const nutrients = dailyData;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <div className="brutalism-card brutalism-shadow-lg bg-gradient-to-r from-emerald-100 to-teal-100 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="brutalism-text-bold mb-2 text-4xl uppercase">Nutrient Tracking</h1>
            <p className="text-lg font-semibold text-gray-700">
              Monitor your daily nutritional intake from meals
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg border-2 border-black bg-white font-bold uppercase text-black transition-all hover:bg-emerald-100"
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg border-2 border-black bg-white font-bold uppercase text-black transition-all hover:bg-blue-100"
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Macronutrients Section */}
      <div>
        <h2 className="brutalism-text-bold mb-4 text-2xl uppercase">Macronutrients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Calories</CardTitle>
              <Scale className="size-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">{nutrients?.calories_kcal.toFixed(0) || 0}</div>
              <p className="text-xs font-semibold text-gray-600">kcal</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Protein</CardTitle>
              <Beef className="size-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">{nutrients?.protein_g.toFixed(1) || 0}</div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Carbs</CardTitle>
              <Apple className="size-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">{nutrients?.carbs_g.toFixed(1) || 0}</div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Fats</CardTitle>
              <Activity className="size-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">{nutrients?.fats_g.toFixed(1) || 0}</div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Nutrients Section */}
      <div>
        <h2 className="brutalism-text-bold mb-4 text-2xl uppercase">Additional Nutrients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Other Tracked Values</CardTitle>
              <CardDescription className="font-semibold">Additional nutrient information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Sugars</span>
                <span className="font-bold">{nutrients?.sugar_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Fiber</span>
                <span className="font-bold">{nutrients?.fiber_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Sodium</span>
                <span className="font-bold">{nutrients?.sodium_mg?.toFixed(1) || 0} mg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Meal Summary</CardTitle>
              <CardDescription className="font-semibold">Today&apos;s meal count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="brutalism-text-bold text-5xl text-emerald-600">
                  {nutrients?.meal_count || 0}
                </div>
                <p className="mt-2 font-semibold text-gray-600">Meals logged today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg bg-amber-50 transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Coming Soon</CardTitle>
              <CardDescription className="font-semibold">More features in development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">📊 Weekly Trends</p>
              </div>
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">📈 Monthly Reports</p>
              </div>
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">🎯 Goal Tracking</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Footer */}
      <div className="brutalism-card brutalism-shadow bg-blue-50 p-6">
        <p className="text-center font-semibold text-gray-700">
          💡 Tip: Your nutrient data is calculated from the meals you&apos;ve logged in your calendar
        </p>
      </div>
    </div>
  );
}
