"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { StreakWidget } from "@/components/ui/StreakWidget";
import {
  Calendar,
  Trophy,
  ChefHat,
  TrendingUp,
  Target,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

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
                // Supabase returns nested relations - handle both array and object formats
                const recipeData = m.Recipe;
                const recipe = Array.isArray(recipeData) 
                  ? recipeData[0] 
                  : recipeData;
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
              // Handle nested relation - could be array or object
              const challengeData = uc.challenges;
              const challenge = Array.isArray(challengeData) 
                ? challengeData[0] 
                : challengeData;
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
              // Handle nested relation - could be array or object
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

    fetchUserData();
  }, [supabase]);

  const quickStats: QuickStat[] = [
    {
      label: "Meals Logged",
      value: stats.mealsLogged,
      icon: Calendar,
      href: "/dashboard/calendar",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Achievements",
      value: stats.achievements,
      icon: Trophy,
      href: "/dashboard/achievements",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Active Challenges",
      value: stats.challengesActive,
      icon: Target,
      href: "/dashboard/challenges",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Completed",
      value: stats.challengesCompleted,
      icon: CheckCircle2,
      href: "/dashboard/challenges",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
      case "silver":
        return "text-gray-400 bg-gray-50 dark:bg-gray-800";
      case "platinum":
        return "text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30";
      default:
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/30";
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {getGreeting()}, {userName || "there"}! 👋
          </h1>
          <p className="text-muted-foreground">Track your nutrition journey and stay motivated</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Streak Widget - Left Column */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 shadow-sm h-full">
            <StreakWidget variant="full" title="Your Streaks" />
          </div>
        </div>

        {/* Middle & Right Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Challenges */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Active Challenges</h3>
              </div>
              <Link
                href="/dashboard/challenges"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {activeChallenges.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {activeChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{challenge.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        {challenge.type}
                      </span>
                    </div>
                    {challenge.progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>
                            {challenge.progress.current}/{challenge.progress.target}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
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
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active challenges</p>
                <Link href="/dashboard/challenges" className="text-sm text-primary hover:underline">
                  Join a challenge
                </Link>
              </div>
            )}
          </div>

          {/* Two Column: Recent Meals & Achievements */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Recent Meals */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold">Recent Meals</h3>
                </div>
                <Link
                  href="/dashboard/calendar"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Calendar <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recentMeals.length > 0 ? (
                <div className="space-y-2">
                  {recentMeals.slice(0, 4).map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-lg">{getMealIcon(meal.meal_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {meal.recipe?.name || "Unnamed meal"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formatDate(meal.date)} · {meal.meal_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meals logged yet</p>
                  <Link href="/dashboard/calendar" className="text-sm text-primary hover:underline">
                    Log your first meal
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Achievements */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold">Recent Achievements</h3>
                </div>
                <Link
                  href="/dashboard/achievements"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recentAchievements.length > 0 ? (
                <div className="space-y-2">
                  {recentAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getTierColor(achievement.tier)}`}>
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {achievement.tier} · {formatDate(achievement.earned_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No achievements yet</p>
                  <Link
                    href="/dashboard/achievements"
                    className="text-sm text-primary hover:underline"
                  >
                    Start earning
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/dashboard/calendar"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Log Meal</span>
          </Link>
          <Link
            href="/dashboard/recipes"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
          >
            <ChefHat className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">Browse Recipes</span>
          </Link>
          <Link
            href="/dashboard/challenges"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors"
          >
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium">Challenges</span>
          </Link>
          <Link
            href="/dashboard/achievements"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
          >
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium">Achievements</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
