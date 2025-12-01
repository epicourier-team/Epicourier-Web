"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SmartCartWidget } from "@/components/ui/SmartCartWidget";
import {
  Calendar,
  Trophy,
  ChefHat,
  Target,
  ArrowRight,
  CheckCircle2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ShoppingCart,
  Package,
} from "lucide-react";
import Link from "next/link";

interface RecentMeal {
  id: number;
  date: string;
  meal_type: string;
  recipe: { name: string; image_url?: string } | null;
}

interface ActiveChallenge {
  id: number;
  name: string;
  title: string;
  progress: { current: number; target: number } | null;
  type: string;
}

interface RecentAchievement {
  id: number;
  name: string;
  title: string;
  icon: string;
  tier: string;
  earned_at: string;
}

interface NutrientSummary {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  meal_count: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState({
    mealsLogged: 0,
    achievements: 0,
    challengesActive: 0,
    challengesCompleted: 0,
  });
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [todayNutrients, setTodayNutrients] = useState<NutrientSummary | null>(null);
  const [nutrientsLoading, setNutrientsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get user name from User table
        const { data: userData } = await supabase
          .from("User")
          .select("fullname, username")
          .eq("auth_id", user.id)
          .single();

        if (userData?.fullname) {
          setUserName(userData.fullname.split(" ")[0]);
        } else if (userData?.username) {
          setUserName(userData.username);
        } else {
          setUserName(user.email?.split("@")[0] || "there");
        }

        // Get user's integer ID for Calendar queries
        const { data: userRecord } = await supabase
          .from("User")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        const userId = userRecord?.id;

        // Fetch stats
        const [mealsResult, achievementsResult, challengesResult] = await Promise.all([
          userId
            ? supabase.from("Calendar").select("id", { count: "exact" }).eq("user_id", userId)
            : Promise.resolve({ count: 0 }),
          supabase
            .from("user_achievements")
            .select("id", { count: "exact" })
            .eq("user_id", user.id),
          supabase.from("user_challenges").select("id, completed_at").eq("user_id", user.id),
        ]);

        const completedChallenges =
          challengesResult.data?.filter((c) => c.completed_at !== null).length || 0;

        setStats({
          mealsLogged: mealsResult.count || 0,
          achievements: achievementsResult.count || 0,
          challengesActive: (challengesResult.data?.length || 0) - completedChallenges,
          challengesCompleted: completedChallenges,
        });

        // Fetch recent meals (last 5)
        if (userId) {
          const { data: meals } = await supabase
            .from("Calendar")
            .select("id, date, meal_type, Recipe(name, image_url)")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(5);

          if (meals) {
            setRecentMeals(
              meals.map((m) => {
                const recipeData = m.Recipe;
                const recipe = Array.isArray(recipeData) ? recipeData[0] : recipeData;
                return {
                  id: m.id,
                  date: m.date,
                  meal_type: m.meal_type,
                  recipe: recipe as { name: string; image_url?: string } | null,
                };
              })
            );
          }
        }

        // Fetch active challenges with details
        const { data: userChallenges } = await supabase
          .from("user_challenges")
          .select("id, progress, challenge_id, challenges(name, title, type)")
          .eq("user_id", user.id)
          .is("completed_at", null)
          .limit(4);

        if (userChallenges) {
          setActiveChallenges(
            userChallenges.map((uc) => {
              const challengeData = uc.challenges;
              const challenge = Array.isArray(challengeData) ? challengeData[0] : challengeData;
              return {
                id: uc.id,
                name: challenge?.name || "",
                title: challenge?.title || "",
                progress: uc.progress as { current: number; target: number } | null,
                type: challenge?.type || "",
              };
            })
          );
        }

        // Fetch recent achievements
        const { data: achievements } = await supabase
          .from("user_achievements")
          .select("id, earned_at, achievement_definitions(name, title, icon, tier)")
          .eq("user_id", user.id)
          .order("earned_at", { ascending: false })
          .limit(4);

        if (achievements) {
          setRecentAchievements(
            achievements.map((a) => {
              const achievementData = a.achievement_definitions;
              const achievement = Array.isArray(achievementData)
                ? achievementData[0]
                : achievementData;
              return {
                id: a.id,
                name: achievement?.name || "",
                title: achievement?.title || "",
                icon: achievement?.icon || "trophy",
                tier: achievement?.tier || "bronze",
                earned_at: a.earned_at || "",
              };
            })
          );
        }
      }
    }

    async function fetchTodayNutrients() {
      try {
        setNutrientsLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/nutrients/daily?period=day&date=${today}`);

        if (response.ok) {
          const data = await response.json();
          if (data.daily) {
            setTodayNutrients({
              calories_kcal: data.daily.calories_kcal || 0,
              protein_g: data.daily.protein_g || 0,
              carbs_g: data.daily.carbs_g || 0,
              fats_g: data.daily.fats_g || 0,
              meal_count: data.daily.meal_count || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching nutrients:", error);
      } finally {
        setNutrientsLoading(false);
      }
    }

    fetchUserData();
    fetchTodayNutrients();
  }, [supabase]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      default:
        return "🍽️";
    }
  };

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-300";
      case "silver":
        return "bg-gray-300";
      case "platinum":
        return "bg-cyan-300";
      default:
        return "bg-orange-300";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Welcome Banner - Neo-Brutalism Style */}
      <div className="brutalism-card rounded-none bg-amber-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
              {getGreeting()}, {userName || "there"}! 👋
            </h1>
            <p className="mt-1 font-medium text-gray-800">
              Track your nutrition journey and stay motivated
            </p>
          </div>
          <div className="brutalism-border inline-flex items-center gap-2 bg-white px-4 py-2 font-bold">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats - Neo-Brutalism Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href="/dashboard/calendar"
          className="brutalism-card rounded-none bg-blue-200 p-4 hover:bg-blue-300"
        >
          <div className="flex items-center gap-3">
            <div className="brutalism-border bg-white p-2">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-black">{stats.mealsLogged}</p>
              <p className="text-sm font-bold uppercase">Meals Logged</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/achievements"
          className="brutalism-card rounded-none bg-yellow-200 p-4 hover:bg-yellow-300"
        >
          <div className="flex items-center gap-3">
            <div className="brutalism-border bg-white p-2">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-black">{stats.achievements}</p>
              <p className="text-sm font-bold uppercase">Achievements</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/challenges"
          className="brutalism-card rounded-none bg-purple-200 p-4 hover:bg-purple-300"
        >
          <div className="flex items-center gap-3">
            <div className="brutalism-border bg-white p-2">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-black">{stats.challengesActive}</p>
              <p className="text-sm font-bold uppercase">Active</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/challenges"
          className="brutalism-card rounded-none bg-emerald-200 p-4 hover:bg-emerald-300"
        >
          <div className="flex items-center gap-3">
            <div className="brutalism-border bg-white p-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-black">{stats.challengesCompleted}</p>
              <p className="text-sm font-bold uppercase">Completed</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Smart Cart Widget - Full Width Horizontal */}
      <div className="brutalism-card rounded-none bg-white p-5">
        <SmartCartWidget title="Smart Cart" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Nutrient Summary */}
        <div className="lg:col-span-1">
          {/* Nutrient Summary */}
          <div className="brutalism-card rounded-none bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="brutalism-border bg-orange-300 p-1.5">
                  <Flame className="h-4 w-4" />
                </div>
                <h3 className="font-black uppercase">Today&apos;s Nutrition</h3>
              </div>
              <Link
                href="/dashboard/nutrients"
                className="text-sm font-bold text-orange-600 hover:underline"
              >
                <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>

            {nutrientsLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded bg-gray-100" />
                <div className="h-16 animate-pulse rounded bg-gray-100" />
                <div className="h-16 animate-pulse rounded bg-gray-100" />
              </div>
            ) : todayNutrients && todayNutrients.meal_count > 0 ? (
              <div className="space-y-3">
                {/* Calories */}
                <div className="brutalism-border bg-orange-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-bold">Calories</span>
                    </div>
                    <span className="text-2xl font-black text-orange-600">
                      {Math.round(todayNutrients.calories_kcal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">kcal consumed today</p>
                </div>

                {/* Protein */}
                <div className="brutalism-border bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Beef className="h-5 w-5 text-red-500" />
                      <span className="font-bold">Protein</span>
                    </div>
                    <span className="text-2xl font-black text-red-600">
                      {Math.round(todayNutrients.protein_g)}g
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">for muscle building</p>
                </div>

                {/* Carbs */}
                <div className="brutalism-border bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-5 w-5 text-amber-500" />
                      <span className="font-bold">Carbs</span>
                    </div>
                    <span className="text-2xl font-black text-amber-600">
                      {Math.round(todayNutrients.carbs_g)}g
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">for energy</p>
                </div>

                {/* Fats */}
                <div className="brutalism-border bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="font-bold">Fats</span>
                    </div>
                    <span className="text-2xl font-black text-blue-600">
                      {Math.round(todayNutrients.fats_g)}g
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">healthy fats intake</p>
                </div>
              </div>
            ) : (
              <div className="brutalism-border bg-gray-50 py-8 text-center">
                <Flame className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="font-bold">No meals logged today</p>
                <Link
                  href="/dashboard/calendar"
                  className="mt-2 inline-block text-sm font-bold text-orange-600 underline"
                >
                  Log your first meal →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Challenges */}
          <div className="brutalism-card rounded-none bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="brutalism-border bg-purple-300 p-1.5">
                  <Target className="h-4 w-4" />
                </div>
                <h3 className="font-black uppercase">Active Challenges</h3>
              </div>
              <Link
                href="/dashboard/challenges"
                className="brutalism-border flex items-center gap-1 bg-purple-200 px-3 py-1 text-sm font-bold hover:bg-purple-300"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {activeChallenges.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="brutalism-border bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="truncate text-sm font-bold">{challenge.title}</span>
                      <span className="brutalism-border bg-purple-200 px-2 py-0.5 text-xs font-bold uppercase">
                        {challenge.type}
                      </span>
                    </div>
                    {challenge.progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Progress</span>
                          <span className="font-bold">
                            {challenge.progress.current}/{challenge.progress.target}
                          </span>
                        </div>
                        <div className="brutalism-border h-3 overflow-hidden bg-gray-200">
                          <div
                            className="h-full bg-purple-400 transition-all"
                            style={{
                              width: `${Math.min(100, (challenge.progress.current / challenge.progress.target) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="brutalism-border bg-gray-50 py-8 text-center">
                <Target className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="font-bold">No active challenges</p>
                <Link
                  href="/dashboard/challenges"
                  className="mt-2 inline-block text-sm font-bold text-purple-600 underline"
                >
                  Join a challenge →
                </Link>
              </div>
            )}
          </div>

          {/* Two Column: Recent Meals & Achievements */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Recent Meals */}
            <div className="brutalism-card rounded-none bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <div className="brutalism-border bg-emerald-300 p-1.5">
                    <ChefHat className="h-4 w-4" />
                  </div>
                  <h3 className="font-black uppercase">Recent Meals</h3>
                </div>
                <Link
                  href="/dashboard/calendar"
                  className="text-sm font-bold text-emerald-600 hover:underline"
                >
                  <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              {recentMeals.length > 0 ? (
                <div className="space-y-2">
                  {recentMeals.slice(0, 4).map((meal) => (
                    <div
                      key={meal.id}
                      className="brutalism-border flex items-center gap-3 bg-gray-50 p-2 transition-colors hover:bg-emerald-50"
                    >
                      <span className="text-xl">{getMealIcon(meal.meal_type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {meal.recipe?.name || "Unnamed meal"}
                        </p>
                        <p className="text-xs font-medium text-gray-600">
                          {formatDate(meal.date)} ·{" "}
                          <span className="capitalize">{meal.meal_type}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brutalism-border bg-gray-50 py-6 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm font-bold">No meals logged yet</p>
                  <Link
                    href="/dashboard/calendar"
                    className="text-sm font-bold text-emerald-600 underline"
                  >
                    Log your first meal →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Achievements */}
            <div className="brutalism-card rounded-none bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <div className="brutalism-border bg-yellow-300 p-1.5">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h3 className="font-black uppercase">Achievements</h3>
                </div>
                <Link
                  href="/dashboard/achievements"
                  className="text-sm font-bold text-yellow-600 hover:underline"
                >
                  <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              {recentAchievements.length > 0 ? (
                <div className="space-y-2">
                  {recentAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="brutalism-border flex items-center gap-3 bg-gray-50 p-2 transition-colors hover:bg-yellow-50"
                    >
                      <div className={`brutalism-border p-2 ${getTierStyles(achievement.tier)}`}>
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{achievement.title}</p>
                        <p className="text-xs font-medium text-gray-600">
                          <span className="capitalize">{achievement.tier}</span> ·{" "}
                          {formatDate(achievement.earned_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brutalism-border bg-gray-50 py-6 text-center">
                  <Trophy className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm font-bold">No achievements yet</p>
                  <Link
                    href="/dashboard/achievements"
                    className="text-sm font-bold text-yellow-600 underline"
                  >
                    Start earning →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer - Neo-Brutalism Style */}
      <div className="brutalism-card rounded-none bg-white p-5">
        <h3 className="mb-4 border-b-2 border-black pb-3 font-black uppercase">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/dashboard/calendar"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-blue-200 p-4 hover:bg-blue-300"
          >
            <Calendar className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Log Meal</span>
          </Link>
          <Link
            href="/dashboard/recipes"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-emerald-200 p-4 hover:bg-emerald-300"
          >
            <ChefHat className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Recipes</span>
          </Link>
          <Link
            href="/dashboard/shopping"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-teal-200 p-4 hover:bg-teal-300"
          >
            <ShoppingCart className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Shopping</span>
          </Link>
          <Link
            href="/dashboard/inventory"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-cyan-200 p-4 hover:bg-cyan-300"
          >
            <Package className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Inventory</span>
          </Link>
          <Link
            href="/dashboard/challenges"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-purple-200 p-4 hover:bg-purple-300"
          >
            <Target className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Challenges</span>
          </Link>
          <Link
            href="/dashboard/achievements"
            className="brutalism-card flex flex-col items-center gap-2 rounded-none bg-yellow-200 p-4 hover:bg-yellow-300"
          >
            <Trophy className="h-7 w-7" />
            <span className="text-sm font-bold uppercase">Badges</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
