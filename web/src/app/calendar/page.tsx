"use client";

import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AddMealModal from "./components/AddMealModal";
import { EventInput } from "@fullcalendar/core";

export type CalendarEvent = EventInput & {
  extendedProps: {
    meal_items: string[];
  };
};

// src/types/event.ts
export interface MealEvent {
  id: string | number;
  title: string;
  meal_type: "breakfast" | "lunch" | "dinner" | string;
  start_time: string; // ISO or date-only string
  end_time?: string;
  meal_items?: string[];
}

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/events ${res.status}`);
      const data = await res.json();
      const mapColor = (t?: string) =>
        t === "breakfast"
          ? "#fef08a"
          : t === "lunch"
          ? "#86efac"
          : t === "dinner"
          ? "#93c5fd"
          : "#e5e7eb";
      setEvents(
        (Array.isArray(data) ? data : []).map((e: MealEvent): CalendarEvent => {
          const mealType = e.meal_type ?? "other";
          const startIso = e.start_time;
          const dateOnly = startIso ? startIso.split("T")[0] : "";

          return {
            id: String(e.id),
            title:
              e.title ??
              (dateOnly
                ? `${dateOnly} ${String(mealType ?? "").replace(/^./, (c) =>
                    c.toUpperCase()
                  )}`
                : "Meal"),
            start: dateOnly, // date-only ISO for all-day
            allDay: true,
            color: mapColor(mealType),
            extendedProps: {
              meal_items: e.meal_items ?? [],
            },
          } as const;
        })
      );
    } catch (err) {
      // TODO: surface a toast/snackbar
      console.error("LoadEvents error:", err);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <main className="min-h-screen p-6 bg-gray-500">
      {/* Header toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🍽️ Meal Planner Calendar</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Add Meal
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white p-4 text-black rounded-xl shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="local"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="80vh"
          events={events}
          displayEventTime={false}
          eventDidMount={(info) => {
            if (info.event.extendedProps.meal_items) {
              const dishes = info.event.extendedProps.meal_items.join(", ");
              info.el.setAttribute("title", dishes);
            }
          }}
        />
      </div>

      {/* Modal */}
      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadEvents}
      />
    </main>
  );
}
