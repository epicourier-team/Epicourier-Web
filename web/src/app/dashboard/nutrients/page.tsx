"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Activity,
  Apple,
  Beef,
  ChartArea,
  Loader2,
  PieChart as PieIcon,
  RefreshCcw,
  Scale,
  Target,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalDialog } from "./components/GoalDialog";
import { PercentLineChart } from "./components/PercentLineChart";
import { ExportActions } from "./components/ExportActions";
import {
  GOAL_FIELD_CONFIG,
  MACRO_COLORS,
  RECOMMENDED_GOALS,
  useNutrientDashboard,
} from "./useNutrientDashboard";
import { useNutrientExport } from "./useNutrientExport";

/**
 * Nutrient Dashboard Page
 * Displays daily snapshot plus weekly/monthly trends.
 */
export default function NutrientsPage() {
  const { exporting, exportData } = useNutrientExport();
  const {
    summaryLoading,
    error,
    dailyData,
    dailyPieData,
    pastSevenNormalized,
    weeklyTrendNormalized,
    monthlyTrendNormalized,
    monthRange,
    setMonthRange,
    goal,
    goalModalOpen,
    setGoalModalOpen,
    goalLoading,
    goalSaving,
    goalError,
    handleOpenGoalModal,
    onSubmitGoal,
    fetchNutrientData,
    goalForm,
    formatTooltipLabel,
  } = useNutrientDashboard();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-0">
      {error && (
        <div className="brutalism-card brutalism-shadow-lg border-4 border-red-500 bg-red-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="brutalism-text-bold text-lg text-red-800">Error Loading Data</h2>
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
            <button
              className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={fetchNutrientData}
            >
              <RefreshCcw className="size-4" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="brutalism-card brutalism-shadow-lg bg-linear-to-r from-emerald-100 to-teal-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="brutalism-text-bold mb-2 text-4xl uppercase">Nutrient Tracking</h1>
            <p className="text-lg font-semibold text-gray-700">
              Today&apos;s intake plus weekly &amp; monthly trends
            </p>
            {summaryLoading && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-none border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="size-4 animate-spin" />
                Updating data...
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={handleOpenGoalModal}
              disabled={goalLoading}
            >
              <Target className="size-4" />
              {goal ? "Edit Goal" : "Set Goal"}
            </button>
            <button
              className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={fetchNutrientData}
              data-testid="refresh-button"
            >
              <RefreshCcw className="size-4" /> Refresh Data
            </button>
            <ExportActions exporting={exporting} onExport={exportData} />
          </div>
        </div>
        {goalError && (
          <p className="mt-3 text-sm font-semibold text-red-700">
            Unable to load your goal: {goalError}
          </p>
        )}
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
              <div className="brutalism-text-bold text-3xl">
                {summaryLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  dailyData?.calories_kcal.toFixed(0) || 0
                )}
              </div>
              <p className="text-xs font-semibold text-gray-600">kcal</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Protein</CardTitle>
              <Beef className="size-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {summaryLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  dailyData?.protein_g.toFixed(1) || 0
                )}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Carbs</CardTitle>
              <Apple className="size-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {summaryLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  dailyData?.carbs_g.toFixed(1) || 0
                )}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Fats</CardTitle>
              <Activity className="size-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {summaryLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  dailyData?.fats_g.toFixed(1) || 0
                )}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Pie */}
      <div
        className="brutalism-card brutalism-shadow-lg bg-white p-4"
        data-testid="daily-pie-chart"
      >
        <div className="mb-3 flex items-center gap-2">
          <PieIcon className="size-5 text-rose-600" />
          <div>
            <h3 className="brutalism-text-bold text-xl uppercase">Today&apos;s Macro Split</h3>
            <p className="text-sm font-semibold text-gray-600">
              Visualize protein, carbs, and fats proportions
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          {summaryLoading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading breakdown...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dailyPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dailyPieData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={entry.color}
                      stroke="#000"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <PercentLineChart
        title="Past 7 Days"
        subtitle="Daily macros trend (percent of goal)"
        icon={<ChartArea className="size-5 text-blue-700" />}
        data={pastSevenNormalized}
        emptyText="No daily trend data yet. Add meals to see the last 7 days."
        dataTestId="daily-trend-chart"
        colors={MACRO_COLORS}
        loading={summaryLoading}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PercentLineChart
          title="Weekly Trend"
          subtitle="Smooth line view of last weeks"
          icon={<ChartArea className="size-5 text-indigo-700" />}
          data={weeklyTrendNormalized}
          emptyText="No nutrient data available for this range."
          dataTestId="weekly-line-chart"
          colors={MACRO_COLORS}
          labelFormatter={formatTooltipLabel}
          loading={summaryLoading}
        />

        <PercentLineChart
          title="Monthly Trend"
          subtitle={`Last ${monthRange} month${monthRange > 1 ? "s" : ""}`}
          icon={<ChartArea className="size-5 text-emerald-700" />}
          data={monthlyTrendNormalized}
          emptyText="Add meals to see charts for this period."
          dataTestId="monthly-line-chart"
          colors={MACRO_COLORS}
          actions={
            <div className="flex gap-2">
              {[3, 6, 12].map((range) => (
                <button
                  key={range}
                  onClick={() => setMonthRange(range as 3 | 6 | 12)}
                  className={`rounded-none border-2 px-2 py-1 text-xs font-bold uppercase transition ${
                    monthRange === range
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-yellow-200"
                  }`}
                >
                  {range}m
                </button>
              ))}
            </div>
          }
          labelFormatter={formatTooltipLabel}
          loading={summaryLoading}
        />
      </div>

      {/* Additional Nutrients Section */}
      <div>
        <h2 className="brutalism-text-bold mb-4 text-2xl uppercase">Additional Nutrients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Other Tracked Values</CardTitle>
              <CardDescription className="font-semibold">
                Additional nutrient information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Sugars</span>
                <span className="font-bold">{dailyData?.sugar_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Fiber</span>
                <span className="font-bold">{dailyData?.fiber_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Sodium</span>
                <span className="font-bold">{dailyData?.sodium_mg?.toFixed(1) || 0} mg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Meal Summary</CardTitle>
              <CardDescription className="font-semibold">Today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="brutalism-text-bold text-5xl text-emerald-600">
                  {dailyData?.meal_count || 0}
                </div>
                <p className="mt-2 font-semibold text-gray-600">Meals logged today</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Footer */}
      <div className="brutalism-card brutalism-shadow bg-blue-50 p-6">
        <div className="text-center font-semibold text-gray-700">
          💡 Tip: Your nutrient data is calculated from the meals you&apos;ve logged in your
          calendar
        </div>
      </div>

      <GoalDialog
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        goalForm={goalForm}
        goalError={goalError}
        goalSaving={goalSaving}
        onUseRecommended={() => goalForm.reset(RECOMMENDED_GOALS)}
        onSubmit={onSubmitGoal}
        fields={GOAL_FIELD_CONFIG}
      />
    </div>
  );
}
