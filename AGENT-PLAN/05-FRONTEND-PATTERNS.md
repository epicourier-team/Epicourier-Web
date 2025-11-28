# Epicourier Frontend Patterns

**Document Version**: 1.2  
**Last Updated**: November 28, 2025  
**Status**: Phase 2 In Progress

---

## 📋 Document Overview

This document describes frontend development patterns for Epicourier, built with **Next.js 15** (App Router), **React 19**, and **TypeScript**. It covers component organization, state management, authentication, and UI libraries.

**Purpose**:
- Understand Next.js App Router architecture
- Learn Server vs Client Component patterns
- Follow state management best practices
- Implement authentication flows correctly
- Use shadcn/ui components effectively

---

## 🏗️ Project Structure

### Directory Organization

```
web/src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout (Server Component)
│   ├── page.tsx             # Landing page
│   ├── signin/page.tsx      # Sign-in page (Client)
│   ├── signup/page.tsx      # Sign-up page (Client)
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── layout.tsx       # Dashboard layout (Client)
│   │   ├── calendar/        # Calendar page
│   │   ├── recipes/         # Recipe browsing
│   │   ├── recommender/     # AI recommendations
│   │   ├── nutrients/       # Nutrient tracking (Phase 2)
│   │   └── achievements/    # Achievement badges (Phase 2)
│   └── api/                 # API route handlers
│       ├── recipes/route.ts
│       ├── calendar/route.ts
│       ├── events/
│       ├── tags/route.ts
│       ├── ingredients/route.ts
│       ├── nutrients/       # Phase 2: Nutrient tracking APIs
│       │   ├── daily/route.ts
│       │   ├── export/route.ts
│       │   └── goals/route.ts
│       └── achievements/    # Phase 2: Gamification APIs
│           ├── route.ts
│           └── check/route.ts
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui components + custom UI
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sidebar.tsx
│   │   ├── searchbar.tsx
│   │   ├── pagenation.tsx
│   │   ├── filterpanel.tsx
│   │   ├── AddMealModal.tsx
│   │   ├── MealDetailModal.tsx
│   │   └── BadgeCard.tsx    # Phase 2: Achievement badge
│   ├── landing/             # Landing page components
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── FAQ.tsx
│   └── sidebar/             # Dashboard navigation
│       └── AppSidebar.tsx
├── hooks/                   # Custom React hooks
│   └── use-recipe.tsx      # Recipe data fetching hook
├── lib/                     # Utility libraries
│   ├── supabaseClient.ts   # Client-side Supabase
│   └── supabaseServer.ts   # Server-side Supabase (service role)
├── types/                   # TypeScript type definitions
│   └── data.ts             # Shared data types (incl. Phase 2)
├── utils/                   # Helper functions
│   └── supabase/
│       └── middleware.ts   # Auth middleware
├── styles/                  # Global styles
│   └── globals.css
└── middleware.ts           # Next.js middleware (auth)
```

---

## 🔄 Server vs Client Components

### Server Components (Default)

**When to Use**:
- ✅ Data fetching from database
- ✅ Accessing backend resources
- ✅ Keeping sensitive data on server (API keys)
- ✅ Static content rendering

**Example**: Root Layout (Server Component)

```tsx
// app/layout.tsx
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpiCourier",
  description: "Smart meal plan generator & grocery list maker & feedback app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Key Points**:
- No `"use client"` directive
- Can export `metadata` (SEO)
- Cannot use React hooks (useState, useEffect)
- Cannot use browser APIs

---

### Client Components

**When to Use**:
- ✅ Interactivity (onClick, onChange)
- ✅ React hooks (useState, useEffect, useContext)
- ✅ Browser APIs (localStorage, window)
- ✅ Event listeners

**Example**: Recipe Browser Page

```tsx
// app/dashboard/recipes/page.tsx
"use client";

import FilterPanel from "@/components/ui/filterpanel";
import Pagination from "@/components/ui/pagenation";
import RecipeCard from "@/components/ui/recipecard";
import SearchBar from "@/components/ui/searchbar";
import { useRecipes } from "@/hooks/use-recipe";
import { useState } from "react";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const { recipes, pagination, isLoading } = useRecipes({
    query,
    ingredientIds,
    tagIds,
    page,
    limit: 20,
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <SearchBar
        onSearch={(q) => {
          setQuery(q);
          setPage(1);
        }}
      />
      <FilterPanel
        onFilterChange={({ ingredientIds, tagIds }) => {
          setIngredientIds(ingredientIds);
          setTagIds(tagIds);
          setPage(1);
        }}
      />

      {isLoading ? (
        <p className="mt-10 text-center text-gray-500">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">No recipes found</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

**Key Points**:
- Starts with `"use client"` directive
- Uses `useState` for local state
- Uses custom hooks (`useRecipes`)
- Handles user interactions

---

## 🎣 Custom Hooks Pattern

### Data Fetching Hook

**Purpose**: Encapsulate API calls and state management

**Example**: `useRecipes` Hook

```tsx
// hooks/use-recipe.tsx
"use client";
import { useEffect, useState } from "react";
import { Recipe } from "../types/data";

export type RecipeFilter = {
  query?: string;
  ingredientIds?: number[];
  tagIds?: number[];
  page?: number;
  limit?: number;
};

export function useRecipes(filters: RecipeFilter) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState({
    page: filters.page || 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRecipes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.query) params.set("query", filters.query);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        filters.ingredientIds?.forEach((id) => 
          params.append("ingredientIds", String(id))
        );
        filters.tagIds?.forEach((id) => 
          params.append("tagIds", String(id))
        );

        const res = await fetch(`/api/recipes?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        setRecipes(data.recipes || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Fetch failed");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
    return () => controller.abort();
  }, [
    filters.query,
    filters.page,
    filters.limit,
    filters.ingredientIds?.join(","),
    filters.tagIds?.join(","),
  ]);

  return { recipes, pagination, isLoading, error };
}
```

**Best Practices**:
1. ✅ Use `AbortController` for cleanup
2. ✅ Handle loading states
3. ✅ Handle errors gracefully
4. ✅ Return stable object structure
5. ✅ Optimize `useEffect` dependencies

---

## 🎨 Component Patterns

### Reusable UI Components

#### SearchBar Component

```tsx
// components/ui/searchbar.tsx
"use client";

import { useState } from "react";

export default function SearchBar({ 
  onSearch 
}: { 
  onSearch: (query: string) => void 
}) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 flex w-full items-center gap-2">
      <input
        className="w-full rounded-lg border px-3 py-2"
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
      />
      <button
        onClick={() => onSearch(value)}
        className="rounded-lg bg-green-600 px-4 py-2 text-white"
      >
        Search
      </button>
    </div>
  );
}
```

**Pattern Notes**:
- Controlled input with local state
- Enter key support
- Callback prop for parent communication
- Tailwind CSS styling

---

#### Modal Component Pattern

```tsx
// components/ui/AddMealModal.tsx
"use client";

import { useState } from "react";

interface AddMealModalProps {
  recipe: {
    id: number;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddMealModal({ 
  recipe, 
  isOpen, 
  onClose, 
  onSuccess 
}: AddMealModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [mealType, setMealType] = useState("breakfast");

  const handleConfirm = async () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: recipe.id,
        date: selectedDate,
        meal_type: mealType,
        status: false,
      }),
    });

    if (res.ok) {
      alert("✅ Added to Calendar!");
      onClose();
      onSuccess?.();
    } else {
      const err = await res.json();
      console.error(err);
      alert(`❌ Failed to add: ${err.error ?? "Unknown error"}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          Select Date for {recipe.name}
        </h2>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Choose a date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mb-4 block w-full rounded-lg border px-3 py-2"
        />
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Choose meal type:
        </label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="mb-4 block w-full rounded-lg border px-3 py-2"
        >
          <option value="breakfast">🍳 Breakfast</option>
          <option value="lunch">🍱 Lunch</option>
          <option value="dinner">🍲 Dinner</option>
        </select>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Modal Pattern Best Practices**:
1. ✅ TypeScript interface for props
2. ✅ Conditional rendering (`if (!isOpen) return null`)
3. ✅ Local state for form fields
4. ✅ Async API calls with error handling
5. ✅ Success callback for parent refresh
6. ✅ Fixed positioning with backdrop

---

## 🔐 Authentication Patterns

### Middleware for Route Protection

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!landing|signup|signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**How It Works**:
1. Intercepts all requests except public routes
2. Validates Supabase session
3. Redirects unauthenticated users to `/signin`
4. Refreshes expired tokens automatically

---

### Client-Side Supabase

```typescript
// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usage in Client Components**:

```tsx
"use client";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  );
}
```

---

### Server-Side Supabase

```typescript
// lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore cookies in Server Components
          }
        },
      },
    }
  )
}
```

**Usage in API Routes**:

```tsx
// app/api/events/route.ts
import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("Calendar")
    .select("*, Recipe(*)")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

## 📅 FullCalendar Integration

### Calendar Page Pattern

```tsx
// app/dashboard/calendar/page.tsx
"use client";

import { createClient } from "@/utils/supabase/client";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  extendedProps: {
    calendarData: CalendarApiResponse[];
    isPast: boolean;
  };
  backgroundColor: string;
  borderColor: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/events`);
    if (!res.ok) return;

    const data = await res.json();
    
    // Group events by date and meal type
    const grouped = {};
    for (const item of data) {
      const key = `${item.date}_${item.meal_type}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    // Format for FullCalendar
    const formatted = Object.entries(grouped).map(([key, items]) => {
      const first = items[0];
      const isPast = new Date(first.date) < new Date();
      
      return {
        id: key,
        title: `${getMealIcon(first.meal_type)} ${items.length} meal(s)`,
        start: first.date,
        allDay: true,
        extendedProps: { calendarData: items, isPast },
        backgroundColor: isPast ? "#9ca3af" : "#10b981",
        borderColor: isPast ? "#6b7280" : "#059669",
      };
    });

    setEvents(formatted);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  );
}

function getMealIcon(mealType: string) {
  if (mealType === "breakfast") return "🍳";
  if (mealType === "lunch") return "🍱";
  return "🍲";
}
```

**FullCalendar Best Practices**:
1. ✅ Use `useCallback` for event handlers
2. ✅ Group events by date for better UX
3. ✅ Color-code past vs future events
4. ✅ Store custom data in `extendedProps`
5. ✅ Use `allDay: true` for meal events

---

## 🎨 shadcn/ui Component Library

### Installation & Setup

shadcn/ui components are installed individually:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add sidebar
npx shadcn@latest add accordion
npx shadcn@latest add separator
```

### Component Usage

**Button Component**:

```tsx
import { Button } from "@/components/ui/button"

export default function Example() {
  return (
    <>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </>
  )
}
```

**Card Component**:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function RecipeCard({ recipe }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{recipe.description}</p>
      </CardContent>
    </Card>
  )
}
```

**Sidebar Component** (App Shell Pattern):

```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
```

---

## 🎯 State Management Patterns

### Local State (useState)

**When to Use**: Component-specific state

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<number | null>(null);
```

---

### URL State (useSearchParams)

**When to Use**: Shareable/bookmarkable state

```tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const currentPage = Number(searchParams.get("page") || "1");
  
  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };
  
  return <Pagination page={currentPage} onPageChange={setPage} />;
}
```

---

### Server State (Custom Hooks)

**When to Use**: Data from APIs

```tsx
const { recipes, isLoading, error } = useRecipes({ page: 1, limit: 20 });
```

---

## 🚀 Performance Optimization

### Code Splitting

**Dynamic Imports** for heavy components:

```tsx
import dynamic from 'next/dynamic'

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => <p>Loading calendar...</p>
})
```

---

### Image Optimization

Use Next.js `<Image>` component:

```tsx
import Image from 'next/image'

<Image
  src={recipe.image_url}
  alt={recipe.name}
  width={300}
  height={200}
  className="rounded-lg"
/>
```

---

### Memoization

**React.memo** for expensive components:

```tsx
import { memo } from 'react'

const RecipeCard = memo(({ recipe }) => {
  // Heavy rendering logic
  return <div>...</div>
})
```

**useMemo** for expensive calculations:

```tsx
const sortedRecipes = useMemo(() => {
  return recipes.sort((a, b) => b.green_score - a.green_score)
}, [recipes])
```

---

## 📝 TypeScript Best Practices

### Type Definitions

```typescript
// types/data.ts
export interface Recipe {
  id: number;
  name: string;
  description?: string;
  min_prep_time?: number;
  green_score?: number;
  image_url?: string;
}

export interface CalendarEvent {
  id: number;
  user_id: number;
  recipe_id: number;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  status: boolean;
  notes?: string;
}
```

### Component Props

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: (id: number) => void;
}

export default function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  // ...
}
```

---

## � Phase 2: Recharts Integration (v1.1.0)

### Nutrient Dashboard Pattern

**Purpose**: Visualize daily/weekly/monthly nutrient data with interactive charts

**Example**: Nutrient Bar Chart

```tsx
// app/dashboard/nutrients/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { NutrientSummaryResponse, NutrientGoal } from "@/types/data";

export default function NutrientsPage() {
  const [data, setData] = useState<NutrientSummaryResponse | null>(null);
  const [goals, setGoals] = useState<NutrientGoal | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [nutrientsRes, goalsRes] = await Promise.all([
        fetch(`/api/nutrients/daily?period=${period}`),
        fetch("/api/nutrients/goals"),
      ]);
      
      setData(await nutrientsRes.json());
      setGoals(await goalsRes.json());
      setIsLoading(false);
    }
    fetchData();
  }, [period]);

  // Transform data for Recharts
  const chartData = data?.daily
    ? [
        { name: "Calories", value: data.daily.calories_kcal, goal: goals?.calories_kcal },
        { name: "Protein", value: data.daily.protein_g, goal: goals?.protein_g },
        { name: "Carbs", value: data.daily.carbs_g, goal: goals?.carbs_g },
        { name: "Fats", value: data.daily.fats_g, goal: goals?.fats_g },
      ]
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nutrient Tracking</h1>
      
      <div className="flex gap-2 mb-6">
        {(["day", "week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded ${
              period === p ? "bg-primary text-white" : "bg-gray-100"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" name="Actual" />
          <Bar dataKey="goal" fill="#82ca9d" name="Goal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Export Data Pattern

**Purpose**: Allow users to export nutrient data in different formats

```tsx
// Example: Export button component
const handleExport = async (format: "csv" | "text") => {
  const response = await fetch(`/api/nutrients/export?period=week&format=${format}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nutrients-${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "txt"}`;
  a.click();
};
```

---

## 🏆 Phase 2: Achievement System (v1.2.0)

### BadgeCard Component Pattern

**Purpose**: Display achievement badges with tier-based styling

```tsx
// components/ui/BadgeCard.tsx
"use client";

import { Achievement, BadgeTier } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";

const tierColors: Record<BadgeTier, string> = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-gray-200",
};

interface BadgeCardProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: { current: number; target: number; percentage: number };
}

export function BadgeCard({ achievement, earned = false, progress }: BadgeCardProps) {
  // Dynamic icon loading from lucide-react
  const IconComponent = Icons[achievement.icon as keyof typeof Icons] || Icons.Award;

  return (
    <Card className={`relative ${!earned ? "opacity-50 grayscale" : ""}`}>
      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${tierColors[achievement.tier]}`}>
        {achievement.tier}
      </div>
      <CardHeader className="flex flex-col items-center">
        <IconComponent className="w-12 h-12 mb-2" />
        <CardTitle className="text-center">{achievement.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600">{achievement.description}</p>
        {progress && !earned && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs mt-1">{progress.current} / {progress.target}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Achievement Page Pattern

```tsx
// app/dashboard/achievements/page.tsx
"use client";

import { useState, useEffect } from "react";
import { BadgeCard } from "@/components/ui/BadgeCard";
import { AchievementsResponse } from "@/types/data";

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null);

  useEffect(() => {
    fetch("/api/achievements")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Your Achievements</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Earned ({data.earned.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.earned.map((ua) => (
            <BadgeCard
              key={ua.achievement_id}
              achievement={ua.achievement!}
              earned={true}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Available ({data.available.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.available.map((a) => (
            <BadgeCard
              key={a.id}
              achievement={a}
              earned={false}
              progress={data.progress[a.name]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### Achievement Check Pattern

**Purpose**: Trigger achievement check after user actions

```tsx
// Example: Check achievements after logging a meal
const handleMealLogged = async () => {
  // ... meal logging logic ...
  
  // Trigger achievement check
  const response = await fetch("/api/achievements/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "meal_logged" }),
  });
  
  const result = await response.json();
  
  if (result.newly_earned.length > 0) {
    // Show toast notification for new achievements
    toast({
      title: "Achievement Unlocked! 🎉",
      description: result.newly_earned.map((a) => a.title).join(", "),
    });
  }
};
```

---

## �🔄 Data Fetching Patterns

### API Route Handlers

**Pattern**: Use Next.js Route Handlers for API endpoints

```typescript
// app/api/recipes/route.ts
import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const query = searchParams.get("query") || "";
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  
  let dbQuery = supabase
    .from("Recipe")
    .select("*", { count: "exact" });
  
  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }
  
  const { data, error, count } = await dbQuery
    .range((page - 1) * limit, page * limit - 1);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    recipes: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
```

---

## 📚 Related Documentation

| Document                                      | Purpose                        |
|-----------------------------------------------|--------------------------------|
| [01-TECH-STACK.md](./01-TECH-STACK.md)       | Technology stack overview      |
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)   | System architecture            |
| [03-API-SPECIFICATIONS.md](./03-API-SPECIFICATIONS.md) | API endpoints |
| [07-TESTING-STRATEGY.md](./07-TESTING-STRATEGY.md) | Frontend testing patterns |

---

## 🔄 Document Updates

This document should be updated when:
- ✅ New component patterns are established
- ✅ State management approaches change
- ✅ New libraries are added (shadcn/ui components)
- ✅ Authentication flows are modified

**Last Review**: November 28, 2025  
**Next Review**: December 15, 2025
