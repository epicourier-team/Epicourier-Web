"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AddMealModal from "./components/AddMealModal";

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "" });

  // ✅ 載入使用者清單
  const loadUsers = async () => {
    const res = await fetch("calendar/api/users");
    const data = await res.json();
    console.log("Fetch users: ", data);
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ create a new user
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert("Please fill in name and email.");
      return;
    }
    const res = await fetch("calendar/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setNewUser({ name: "", email: "" });
      setShowCreateUser(false);
      await loadUsers();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* 頂部功能區 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Select User */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Current User</label>
            <select
              className="rounded-lg border px-3 py-2"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select user</option>
              {Array.isArray(users) &&
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setShowCreateUser(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            + Create User
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedUser}
          className={`rounded-lg px-4 py-2 ${
            selectedUser
              ? "bg-green-600 text-white hover:bg-green-700"
              : "cursor-not-allowed bg-gray-300 text-gray-600"
          }`}
        >
          + Add Meal
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl bg-white p-4 text-black shadow">
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
        />
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Create New User</h2>
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="mb-3 w-full rounded-lg border px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="mb-4 w-full rounded-lg border px-3 py-2"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateUser(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          // reload events
        }}
        userId={selectedUser}
      />
    </main>
  );
}
