"use client";

import { createClient } from "@/utils/supabase/client";
import { EventClickArg } from "@fullcalendar/core";
import Image from "next/image";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useToast } from "@/hooks/use-toast";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
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
  const { toast } = useToast();

  // ------------------------------
  // State management
  // ------------------------------
  const [userName, setUserName] = useState<string>("");

  // const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [recommendations] = useState<Recipe[]>([]); // Kept empty for now as logic is commented out
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

      let bgColor = "#3b82f6";
      let borderColor = "#2563eb";
      if (isCompleted) {
        bgColor = "#22c55e";
        borderColor = "#16a34a";
      } else if (isPast) {
        bgColor = "#9ca3af";
        borderColor = "#6b7280";
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
  // load recommendation
  // ------------------------------
  {
    /*}
  const loadRecommendations = async () => {
    const res = await fetch("/api/recommendations");
    const data: Recipe[] = await res.json();
    if (Array.isArray(data)) {
      setRecommendations(data);
    }
  };
  */
  }

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
      toast({
        title: "❌ Expired Meal",
        description: "This meal is expired and cannot be modified.",
        variant: "destructive",
      });
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
      toast({
        title: newStatus ? "✅ Meal Completed" : "👌 Status Updated",
        description: newStatus ? "Meal marked as completed!" : "Meal status updated!",
      });
      await loadEvents();
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error updating status:", err);
      toast({
        title: "❌ Error",
        description: err.error ?? "Unknown error occurred",
        variant: "destructive",
      });
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
  }, [supabase, loadEvents, setUserName]);

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="p-6 pl-12">
      {/* Header */}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="brutalism-title text-3xl">
          {userName ? `${userName}'s Calendar` : "Loading Calendar..."}
        </h1>
        {/*
        <button
          onClick={loadRecommendations}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          🍽️ Get Recommendations
        </button>
        */}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="brutalism-panel mb-6 rounded-none p-6">
          <h2 className="brutalism-heading mb-4">Recommended Recipes</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((r) => (
              <li key={r.id} className="brutalism-card overflow-hidden rounded-none">
                {r.image_url && (
                  <div className="relative h-40 w-full">
                    <Image src={r.image_url} alt={r.name} fill className="object-cover" />
                  </div>
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
                    className="brutalism-button-secondary mt-2 w-full rounded-none py-2"
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
      <div className="brutalism-panel rounded-none p-6">
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
