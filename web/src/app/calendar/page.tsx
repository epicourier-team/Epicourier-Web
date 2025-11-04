"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
}

export default function CalendarPage() {
  // ------------------------------
  // State management
  // ------------------------------
  const [users, setUsers] = useState<{ id: number; fullname: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // add Modal status
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [mealType, setMealType] = useState("breakfast");

  // ------------------------------
  // load user info
  // ------------------------------
  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  // ------------------------------
  // load current user info
  // ------------------------------
  const loadEvents = async (userId: string) => {
    if (!userId) return setEvents([]);
    const res = await fetch(`/api/calendar?user_id=${userId}`);
    const data = await res.json();

    // trans data into FullCalendar format
    const formatted = (data ?? []).map((c: any) => ({
      id: String(c.id),
      title: `${c.meal_type ? c.meal_type.charAt(0).toUpperCase() + c.meal_type.slice(1) : ""} - ${c.Recipe?.name ?? "Meal"}`,
      start: c.date,
      allDay: true,
    }));
    setEvents(formatted);
  };

  // ------------------------------
  // load recommendate receipts
  // ------------------------------
  const loadRecommendations = async () => {
    const res = await fetch("/api/recommendations");
    const data = await res.json();
    setRecommendations(data);
  };

  // ------------------------------
  // add to calendar
  // ------------------------------
  const handleAddToCalendar = async () => {
    console.log("▶ handleAddToCalendar triggered");

    if (!selectedUser || !selectedRecipe || !selectedDate) {
      alert("Please select a user, recipe, and date.");
      console.warn("Missing fields:", { selectedUser, selectedRecipe, selectedDate });
      return;
    }

    console.log("Sending to API:", {
      user_id: selectedUser,
      recipe_id: selectedRecipe.id,
      date: selectedDate,
      meal_type: mealType, // 如果有加餐別
    });

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: selectedUser,
        recipe_id: selectedRecipe.id,
        date: selectedDate,
        meal_type: mealType,
      }),
    });

    console.log("API Response status:", res.status);

    if (res.ok) {
      alert("✅ Added to Calendar!");
      setShowDateModal(false);
      await loadEvents(selectedUser);
    } else {
      const err = await res.json();
      console.error("❌ Error from API:", err);
      alert(`❌ Error: ${err.error}`);
    }
  };

  // ------------------------------
  // create a new user
  // ------------------------------
  const handleCreateUser = async () => {
    const fullname = prompt("Enter user's full name:");
    const email = prompt("Enter user's email:");
    if (!fullname || !email) return;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email }),
    });

    if (res.ok) {
      await loadUsers();
      alert("✅ User created!");
    } else {
      const err = await res.json();
      alert(`❌ Error: ${err.error}`);
    }
  };

  // ------------------------------
  // init load user
  // ------------------------------
  useEffect(() => {
    loadUsers();
  }, []);

  // ------------------------------
  // exchange user
  // ------------------------------
  useEffect(() => {
    if (selectedUser) loadEvents(selectedUser);
  }, [selectedUser]);

  // ------------------------------
  // UI Rendering
  // ------------------------------
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 使用者選擇 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Current User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="rounded-lg border px-3 py-2"
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullname}
                </option>
              ))}
            </select>
          </div>

          {/* 建立新使用者 */}
          <button
            onClick={handleCreateUser}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            + Create User
          </button>
        </div>

        {/* 載入推薦食譜 */}
        <button
          onClick={loadRecommendations}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          🍽️ Get Recommendations
        </button>
      </div>

      {/* 推薦食譜區塊 */}
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
      {/* 日期選擇 Modal */}
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

      {/* FullCalendar */}
      <div className="rounded-xl bg-white p-4 shadow">
        <FullCalendar
          key={selectedUser} // 切換使用者時強制 re-render
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
        />
      </div>
    </main>
  );
}
