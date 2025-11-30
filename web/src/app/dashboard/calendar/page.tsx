"use client";

import { createClient } from "@/utils/supabase/client";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AddMealModal from "@/components/ui/AddMealModal";
import MealDetailModal from "@/components/ui/MealDetailModal";

// ------------------------------
// Type Definitions
// ------------------------------
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  extendedProps: {
    calendarData: CalendarApiResponse | CalendarApiResponse[];
    isPast: boolean;
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
  const supabase = createClient();

  // ------------------------------
  // State management
  // ------------------------------
  const [userName, setUserName] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCalendarEntry, setSelectedCalendarEntry] = useState<CalendarApiResponse[] | null>(
    null
  );

  // ------------------------------
  // load calendar event
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

    const grouped: Record<string, CalendarApiResponse[]> = {};
    for (const item of data) {
      const key = `${item.date}_${item.meal_type}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    const formatted: CalendarEvent[] = Object.entries(grouped).map(([key, items]) => {
      const first = items[0];
      const isCompleted = items.every((x) => x.status === true);
      const isPast = first.date < todayStr;

      const recipeNames = items.map((x) => x.Recipe?.name ?? "Meal").join(", ");

      // Greenish sustainability colors
      let bgColor = "#10b981"; // emerald-500
      let borderColor = "#059669"; // emerald-600
      if (isCompleted) {
        bgColor = "#22c55e"; // green-500
        borderColor = "#16a34a"; // green-600
      } else if (isPast) {
        bgColor = "#9ca3af"; // gray-400
        borderColor = "#6b7280"; // gray-500
      }

      return {
        id: key,
        title: `${first.meal_type.charAt(0).toUpperCase() + first.meal_type.slice(1)} - ${recipeNames}`,
        start: first.date,
        allDay: true,
        backgroundColor: bgColor,
        borderColor,
        extendedProps: {
          calendarData: items,
          isPast,
        },
      };
    });

    setEvents(formatted);
  }, [router]);

  // ------------------------------
  // click handle
  // ------------------------------
  const handleEventClick = (clickInfo: EventClickArg) => {
    const { calendarData, isPast } = clickInfo.event.extendedProps as {
      calendarData: CalendarApiResponse | CalendarApiResponse[];
      isPast: boolean;
    };
    const entries: CalendarApiResponse[] = Array.isArray(calendarData)
      ? calendarData
      : [calendarData];

    if (isPast && entries.every((x) => x.status === false)) {
      alert("This meal is expired and cannot be modified.");
      return;
    }

    setSelectedCalendarEntry(entries);
    setIsDetailModalOpen(true);
  };

  // ------------------------------
  // update status handle (PATCH)
  // ------------------------------
  const handleUpdateStatus = async (entryId: number, newStatus: boolean) => {
    const res = await fetch(`/api/events/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      alert(newStatus ? "✅ Meal marked as completed!" : "👌 Meal status updated!");
      await loadEvents();
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error updating status:", err);
      alert(`❌ Error: ${err.error ?? "Unknown error"}`);
    }
  };

  // ------------------------------
  // init
  // ------------------------------
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const fetchUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        const { data: profile } = await supabase
          .from("User")
          .select("fullname, username")
          .eq("email", user.email)
          .single();

        if (profile) {
          setUserName(profile.fullname || profile.username || "Welcome!");
        }
      }
    };

    fetchUserName();
    loadEvents();
  }, [supabase, loadEvents]);

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="h-8 w-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-neutral-100">
            {userName ? `${userName}'s Calendar` : "Meal Calendar"}
          </h1>
        </div>
        <p className="text-neutral-400">
          Plan and track your sustainable meal journey
        </p>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-emerald-100">
            Recommended Recipes
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-lg border border-neutral-800 shadow transition hover:shadow-md"
              >
                {r.image_url && (
                  <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" />
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-emerald-100">{r.name}</h3>
                  <p className="text-sm text-emerald-300">{r.description}</p>
                  <p className="mt-1 text-xs text-emerald-400">
                    ⏱ {r.min_prep_time ?? 0} mins • 🌿 Score {r.green_score ?? "?"}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedRecipe(r);
                      setShowDateModal(true);
                    }}
                    className="mt-2 w-full rounded-lg bg-emerald-700 py-2 text-white hover:bg-emerald-600"
                  >
                    + Add to Calendar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Meal Modal */}
      {showDateModal && selectedRecipe && (
        <AddMealModal
          recipe={{ id: selectedRecipe.id, name: selectedRecipe.name }}
          isOpen={true}
          onClose={() => setShowDateModal(false)}
          onSuccess={loadEvents}
        />
      )}

      {/* Meal Detail Modal */}
      <MealDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        entries={selectedCalendarEntry}
        onUpdateStatus={handleUpdateStatus}
        reloadEvents={loadEvents}
      />

      {/* Calendar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
        <style jsx global>{`
          /* FullCalendar Dark Mode Styles */
          .fc {
            color: #e5e5e5;
          }
          .fc-theme-standard .fc-scrollgrid {
            border-color: #404040;
          }
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #404040;
          }
          .fc-col-header-cell {
            background-color: #262626;
            color: #10b981;
          }
          .fc-daygrid-day {
            background-color: #171717;
          }
          .fc-daygrid-day:hover {
            background-color: #262626;
          }
          .fc-daygrid-day-number {
            color: #d4d4d4;
          }
          .fc-day-today {
            background-color: #064e3b !important;
          }
          .fc-toolbar-title {
            color: #10b981;
          }
          .fc-button {
            background-color: #10b981;
            border-color: #059669;
            color: white;
          }
          .fc-button:hover {
            background-color: #059669;
            border-color: #047857;
          }
          .fc-button-active {
            background-color: #047857 !important;
            border-color: #065f46 !important;
          }
          .fc-button:disabled {
            background-color: #404040;
            border-color: #525252;
            color: #737373;
          }
        `}</style>
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
    </div>
  );
}
