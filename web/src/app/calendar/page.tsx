"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AddMealModal from "./components/AddMealModal";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEvents = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(
      data.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.start_time,
        end: e.end_time,
        backgroundColor:
          e.meal_type === "breakfast"
            ? "#fef08a"
            : e.meal_type === "lunch"
            ? "#86efac"
            : e.meal_type === "dinner"
            ? "#93c5fd"
            : "#e5e7eb",
      }))
    );
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
