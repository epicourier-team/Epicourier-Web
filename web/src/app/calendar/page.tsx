"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { supabase } from "@/lib/supabaseClient";
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
    // 儲存從 API 來的原始資料
    calendarData: CalendarApiResponse;
  };
  // 根據 status 改變顏色
  backgroundColor: string;
  borderColor: string;
}

// Recipe Type
interface Recipe {
  id: number;
  name: string;
  image_url?: string;
  description?: string;
  min_prep_time?: number;
  green_score?: number | string;
}

// CalendarApiResponse Type
interface CalendarApiResponse {
  id: number;
  date: string;
  meal_type: string;
  status: boolean | null; // 確保 status 被讀取
  Recipe: {
    id: number;
    name: string;
    image_url?: string;
    description?: string; // 確保 description 被讀取
    min_prep_time?: number;
    green_score?: number | string;
  } | null;
}

export default function CalendarPage() {
  const router = useRouter();
  // ------------------------------
  // State management
  // ------------------------------
  // const [users, setUsers] = useState<{ id: number; fullname: string }[]>([]); // development
  // const [selectedUser, setSelectedUser] = useState<string>(""); // for development
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // "Add Modal" 狀態
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [mealType, setMealType] = useState("breakfast");

  // ⭐ [新功能] "Edit/Detail Modal" 狀態
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // 用來存放被點擊的日曆事件的完整資料
  const [selectedCalendarEntry, setSelectedCalendarEntry] = useState<CalendarApiResponse | null>(
    null
  );

  // ------------------------------
  // load user info
  // ------------------------------
  // const loadUsers = async () => {
  //   const res = await fetch("/api/users");
  //   const data = await res.json();
  //   if (Array.isArray(data)) setUsers(data);
  // };
  // 檢查登入狀態的 Effect (取代原本的 loadUsers)
  // 載入時：
  // 1. 檢查使用者是否登入
  // 2. 如果登入，就載入他們的事件
  useEffect(() => {
    const checkUserAndLoadEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser(); // 這是 client-side check

      if (!user) {
        // 雖然 middleware 會阻擋，但這是一個好的雙重保險
        router.push("/signin");
      } else {
        // 使用者已登入，載入他們的事件
        loadEvents();
      }
    };

    checkUserAndLoadEvents();
    // 我們只希望這個 effect 在頁面載入時執行一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ------------------------------
  // load current user info
  // ------------------------------
  const loadEvents = async () => {
    const res = await fetch(`/api/events`);
    const data: CalendarApiResponse[] = await res.json();

    // trans data into FullCalendar format
    const formatted = (data ?? []).map((c: CalendarApiResponse) => {
      const isCompleted = c.status === true;
      return {
        id: String(c.id),
        title: `${c.meal_type ? c.meal_type.charAt(0).toUpperCase() + c.meal_type.slice(1) : ""} - ${c.Recipe?.name ?? "Meal"}`,
        start: c.date,
        allDay: true,
        // ⭐ [新功能] 儲存原始資料
        extendedProps: {
          calendarData: c,
        },
        // ⭐ [新功能] 根據 status 改變外觀
        backgroundColor: isCompleted ? "#22c55e" : "#3b82f6", // 完成: 綠色 / 未完成: 藍色
        borderColor: isCompleted ? "#16a34a" : "#2563eb",
      };
    });
    setEvents(formatted);
  };

  // ------------------------------
  // load recommendate receipts
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
    console.log("▶ handleAddToCalendar triggered");

    if (!selectedRecipe || !selectedDate) {
      alert("Please select a user, recipe, and date.");
      console.warn("Missing fields:", { selectedRecipe, selectedDate });
      return;
    }

    console.log("Sending to API:", {
      recipe_id: selectedRecipe.id,
      date: selectedDate,
      meal_type: mealType,
    });

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

    console.log("API Response status:", res.status);

    if (res.ok) {
      alert("✅ Added to Calendar!");
      setShowDateModal(false);
      await loadEvents(); // 重新載入事件
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error from API:", err);
      alert(`❌ Error: ${err.error ?? "Unknown error"}`);
    }
  };

  // ⭐ [新功能] 處理 FullCalendar 事件點擊
  const handleEventClick = (clickInfo: EventClickArg) => {
    // 從 extendedProps 中取出我們儲存的原始資料
    const eventData = clickInfo.event.extendedProps.calendarData as CalendarApiResponse;

    // 如果 API 回傳的資料中沒有食譜描述 (description)，
    // 你可以在這裡呼叫 API 獲取更完整的食譜資訊：
    //
    // const recipeId = eventData.Recipe?.id;
    // if (recipeId) {
    //   const res = await fetch(`/api/recipes/${recipeId}`);
    //   const fullRecipe = await res.json();
    //   // ... 然後把 fullRecipe 存到 state 中
    // }
    //
    // 為了簡單起見，我們假設 API 已經回傳了 description (如步驟 1 的 GET 所示)

    console.log("Clicked event:", eventData);
    setSelectedCalendarEntry(eventData);
    setIsDetailModalOpen(true);
  };

  // ⭐ [新功能] 處理更新狀態 (PATCH)
  const handleUpdateStatus = async (entryId: number, newStatus: boolean) => {
    console.log(`Updating entry ${entryId} to status: ${newStatus}`);

    const res = await fetch(`/api/events/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (res.ok) {
      alert(newStatus ? "✅ Meal marked as completed!" : "👌 Meal status updated!");
      setIsDetailModalOpen(false); // 關閉 Modal
      await loadEvents(); // 重新載入事件 (FullCalendar 會自動更新顏色)
    } else {
      const err: { error?: string } = await res.json();
      console.error("❌ Error updating status:", err);
      alert(`❌ Error: ${err.error ?? "Unknown error"}`);
    }
  };

  // ------------------------------
  // init load user
  // ------------------------------
  // useEffect(() => {
  //   loadUsers();
  // }, []);

  /*   // Initial load for the logged-in user
  useEffect(() => {
    loadEvents();
  }, []); // */

  // ------------------------------
  // UI Rendering
  // ------------------------------
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        {/* ... (既有的 Header 內容) ... */}
        <div className="flex items-center gap-4">
          {/* <div>
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
          </div> */}
        </div>
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
          {/* ... (既有的推薦食譜 UI) ... */}
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
          {/* ... (既有的 "Add Meal" Modal UI) ... */}
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
      {isDetailModalOpen && selectedCalendarEntry && selectedCalendarEntry.Recipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            {/* 食譜圖片 */}
            {selectedCalendarEntry.Recipe.image_url && (
              <img
                src={selectedCalendarEntry.Recipe.image_url}
                alt={selectedCalendarEntry.Recipe.name}
                className="mb-4 h-48 w-full rounded-lg object-cover"
              />
            )}
            {/* 食譜名稱 */}
            <h2 className="mb-2 text-2xl font-bold">{selectedCalendarEntry.Recipe.name}</h2>
            {/* 餐別和日期 */}
            <p className="mb-4 text-gray-500">
              {selectedCalendarEntry.meal_type.charAt(0).toUpperCase() +
                selectedCalendarEntry.meal_type.slice(1)}{" "}
              on {selectedCalendarEntry.date}
            </p>

            {/* 食譜描述 (如果 API 有提供) */}
            {selectedCalendarEntry.Recipe.description && (
              <p className="mb-6 max-h-40 overflow-y-auto whitespace-pre-line text-gray-700">
                {selectedCalendarEntry.Recipe.description}
              </p>
            )}

            {/* 操作按鈕 */}
            <div className="flex items-center justify-between gap-3">
              {/* 根據目前狀態顯示不同的按鈕 */}
              {selectedCalendarEntry.status === true ? (
                // 顯示「標記為未完成」
                <button
                  onClick={() => handleUpdateStatus(selectedCalendarEntry.id, false)}
                  className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                >
                  Mark as Incomplete
                </button>
              ) : (
                // 顯示「標記為已完成」
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
          // key={selectedUser}
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
          // ⭐ [新功能] 綁定點擊事件
          eventClick={handleEventClick}
        />
      </div>
    </main>
  );
}
