"use client";

import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// ------------------------------
// Type Definitions
// ------------------------------
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  extendedProps: {
    calendarData: CalendarApiResponse;
  };
  backgroundColor: string;
  borderColor: string;
}

interface Recipe {
  id: number;
  name: string;
  image_url?: string;
  description?: string;
  min_prep_time?: number;
  green_score?: number | string;
}

interface CalendarApiResponse {
  id: number;
  date: string;
  meal_type: string;
  status: boolean | null;
  Recipe: {
    id: number;
    name: string;
    image_url?: string;
    description?: string;
    min_prep_time?: number;
    green_score?: number | string;
  } | null;
}

export default function CalendarPage() {
  const router = useRouter();

  // create client instance in component
  const supabase = createClient();

  // ------------------------------
  // State management
  // ------------------------------
  const [userName, setUserName] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [mealType, setMealType] = useState("breakfast");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCalendarEntry, setSelectedCalendarEntry] = useState<CalendarApiResponse | null>(
    null
  );

  // ------------------------------
  // load calendar event (use useCallback)
  // ------------------------------
  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/events`);
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/signin");
        return;
      }
      console.error("Failed to fetch events");
      return;
    }

    const data: CalendarApiResponse[] = await res.json();

    const formatted = (data ?? []).map((c: CalendarApiResponse) => {
      const isCompleted = c.status === true;
      return {
        id: String(c.id),
        title: `${c.meal_type ? c.meal_type.charAt(0).toUpperCase() + c.meal_type.slice(1) : ""} - ${c.Recipe?.name ?? "Meal"}`,
        start: c.date,
        allDay: true,
        extendedProps: {
          calendarData: c,
        },
        backgroundColor: isCompleted ? "#22c55e" : "#3b82f6",
        borderColor: isCompleted ? "#16a34a" : "#2563eb",
      };
    });
    setEvents(formatted);
  }, [router]);

  // ------------------------------
  // load recommendation
  // ------------------------------
  const loadRecommendations = async () => {
    const res = await fetch("/api/recommendations");
    const data: Recipe[] = await res.json();
    if (Array.isArray(data)) {
      setRecommendations(data);
    }
  };

  // ------------------------------
  // add to calendar (POST)
  // ------------------------------
  const handleAddToCalendar = async () => {
    if (!selectedRecipe || !selectedDate) {
      alert("Please select a user, recipe, and date.");
      return;
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_id: selectedRecipe.id,
        date: selectedDate,
        meal_type: mealType,
        status: false,
      }),
    });

    if (res.ok) {
      alert("✅ Added to Calendar!");
      setShowDateModal(false);
      await loadEvents();
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error from API:", err);
      alert(`❌ Error: ${err.error ?? "Unknown error"}`);
    }
  };

  // ------------------------------
  // click handle
  // ------------------------------
  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventData = clickInfo.event.extendedProps.calendarData as CalendarApiResponse;
    setSelectedCalendarEntry(eventData);
    setIsDetailModalOpen(true);
  };

  // ------------------------------
  // update status handle (PATCH)
  // ------------------------------
  const handleUpdateStatus = async (entryId: number, newStatus: boolean) => {
    const res = await fetch(`/api/events/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (res.ok) {
      alert(newStatus ? "✅ Meal marked as completed!" : "👌 Meal status updated!");
      setIsDetailModalOpen(false);
      await loadEvents();
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error updating status:", err);
      alert(`❌ Error: ${err.error ?? "Unknown error"}`);
    }
  };

  // ------------------------------
  // ⭐ 步驟 3: 簡化初始載入
  // ------------------------------
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const fetchUserName = async () => {
      // 1. 獲取 auth 使用者
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        // 2. 根據 email 查詢 public.User 表
        const { data: profile } = await supabase
          .from("User")
          .select("fullname, username") // 抓取 fullname 或 username
          .eq("email", user.email)
          .single();

        if (profile) {
          // 3. 設定 state
          setUserName(profile.fullname || profile.username || "Welcome!");
        }
      }
    };

    fetchUserName();
    loadEvents();
  }, [supabase, loadEvents]); // 依賴 supabase client

  // ------------------------------
  // UI Rendering
  // ------------------------------
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        {/* ⭐ 已移除 "Current User" 下拉選單，因為不再需要 */}
        <h1 className="text-2xl font-semibold text-gray-800">
          {userName ? `${userName}'s Calendar` : "Loading Calendar..."}
        </h1>
        <button
          onClick={loadRecommendations}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          🍽️ Get Recommendations
        </button>
      </div>

      {/* 'recommendations'*/}
      {recommendations.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Recommended Recipes</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-lg border shadow transition hover:shadow-md"
              >
                {r.image_url && (
                  <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" />
                )}
                <div className="p-3">
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-gray-500">{r.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    ⏱ {r.min_prep_time ?? 0} mins • 🌿 Score {r.green_score ?? "?"}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedRecipe(r);
                      setShowDateModal(true);
                    }}
                    className="mt-2 w-full rounded bg-blue-600 py-1 text-white hover:bg-blue-700"
                  >
                    + Add to Calendar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* "Add Meal" Modal */}
      {showDateModal && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Select Date for {selectedRecipe.name}</h2>
            <label className="mb-2 block text-sm font-medium text-gray-700">Choose a date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2"
            />
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Choose meal type:
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2"
            >
              <option value="breakfast">🍳 Breakfast</option>
              <option value="lunch">🍱 Lunch</option>
              <option value="dinner">🍲 Dinner</option>
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDateModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCalendar}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Meal Detail" Modal*/}
      {isDetailModalOpen && selectedCalendarEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            {/* ⭐ 步驟 2: 在 Modal *內部* 檢查 'Recipe' 物件是否存在
             */}
            {selectedCalendarEntry.Recipe ? (
              <>
                {/* --- A: 如果有食譜，顯示食譜詳情 --- */}
                {selectedCalendarEntry.Recipe.image_url && (
                  <img
                    src={selectedCalendarEntry.Recipe.image_url}
                    alt={selectedCalendarEntry.Recipe.name}
                    className="mb-4 h-48 w-full rounded-lg object-cover"
                  />
                )}
                <h2 className="mb-2 text-2xl font-bold">{selectedCalendarEntry.Recipe.name}</h2>
                <p className="mb-4 text-gray-500">
                  {selectedCalendarEntry.meal_type.charAt(0).toUpperCase() +
                    selectedCalendarEntry.meal_type.slice(1)}{" "}
                  on {selectedCalendarEntry.date}
                </p>
                {selectedCalendarEntry.Recipe.description && (
                  <p className="mb-6 max-h-40 overflow-y-auto whitespace-pre-line text-gray-700">
                    {selectedCalendarEntry.Recipe.description}
                  </p>
                )}
              </>
            ) : (
              <>
                {/* --- B: 如果沒有食譜 (Recipe is null)，顯示備用資訊 --- */}
                <h2 className="mb-2 text-2xl font-bold">Meal Entry</h2>
                <p className="mb-4 text-gray-500">
                  {selectedCalendarEntry.meal_type.charAt(0).toUpperCase() +
                    selectedCalendarEntry.meal_type.slice(1)}{" "}
                  on {selectedCalendarEntry.date}
                </p>
                <p className="mb-6 text-gray-700">
                  (No recipe details associated with this entry.)
                </p>
              </>
            )}

            <div className="flex items-center justify-between gap-3">
              {selectedCalendarEntry.status === true ? (
                <button
                  onClick={() => handleUpdateStatus(selectedCalendarEntry.id, false)}
                  className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                >
                  Mark as Incomplete
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(selectedCalendarEntry.id, true)}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  ✅ Mark as Completed
                </button>
              )}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FullCalendar */}
      <div className="rounded-xl bg-white p-4 shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="80vh"
          events={events}
          displayEventTime={false}
          timeZone="local"
          eventClick={handleEventClick}
        />
      </div>
    </main>
  );
}
