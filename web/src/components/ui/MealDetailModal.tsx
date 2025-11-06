"use client";

import React, { useMemo, useState } from "react";

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

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: CalendarApiResponse[] | null;
  onUpdateStatus: (id: number, newStatus: boolean) => Promise<void>;
  reloadEvents: () => Promise<void>;
}

export default function MealDetailModal({
  isOpen,
  onClose,
  entries,
  onUpdateStatus,
  reloadEvents,
}: MealDetailModalProps) {
  const [busy, setBusy] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = entries?.[selectedIndex] ?? null;

  const isPast = useMemo(() => {
    if (!selected) return false;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const lhs = new Date(selected.date);
    const rhs = new Date(todayStr);
    lhs.setHours(0, 0, 0, 0);
    rhs.setHours(0, 0, 0, 0);
    return lhs.getTime() < rhs.getTime();
  }, [selected?.date]);

  const allCompleted = entries?.every((e) => e.status === true) ?? false;

  const handleSingleUpdate = async (entryId: number, newStatus: boolean) => {
    if (busy) return;
    try {
      setBusy(true);
      await onUpdateStatus(entryId, newStatus);
      await reloadEvents();
    } finally {
      setBusy(false);
    }
  };

  const handleBulkUpdate = async (newStatus: boolean) => {
    if (busy || !entries) return;
    try {
      setBusy(true);
      await Promise.all(entries.map((e) => onUpdateStatus(e.id, newStatus)));
      await reloadEvents();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen || !entries || entries.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* 側邊餐點列表 */}
          <div className="w-full border-r border-gray-200 md:w-1/3">
            <h2 className="mb-2 text-xl font-semibold">Meals</h2>
            <ul className="space-y-2">
              {entries.map((entry, idx) => (
                <li key={entry.id}>
                  <button
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full rounded-lg px-3 py-2 text-left ${
                      idx === selectedIndex
                        ? "bg-indigo-100 font-semibold text-indigo-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {entry.Recipe?.name ?? "Meal"} {entry.status ? "✅" : "⏺️"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 右側詳細資訊 */}
          {selected && (
            <div className="flex-1">
              {!!selected.Recipe?.image_url && (
                <img
                  src={selected.Recipe.image_url}
                  alt={selected.Recipe.name ?? "meal"}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              )}

              <h3 className="mb-1 text-2xl font-bold capitalize">{selected.meal_type}</h3>
              <p className="mb-2 text-gray-600">
                {selected.meal_type.charAt(0).toUpperCase() + selected.meal_type.slice(1)} on{" "}
                {selected.date}
              </p>

              {!!selected.Recipe?.description && (
                <p className="mb-6 max-h-40 overflow-y-auto whitespace-pre-line text-gray-700">
                  {selected.Recipe.description}
                </p>
              )}

              {/* 單筆操作 */}
              {isPast && !selected.status ? (
                <button
                  disabled
                  className="mb-3 w-full cursor-not-allowed rounded-lg bg-gray-400 px-4 py-2 text-white"
                >
                  ❌ Expired Meal
                </button>
              ) : selected.status ? (
                <button
                  onClick={() => handleSingleUpdate(selected.id, false)}
                  disabled={busy}
                  className="mb-3 w-full rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:opacity-60"
                >
                  Mark as Incomplete
                </button>
              ) : (
                <button
                  onClick={() => handleSingleUpdate(selected.id, true)}
                  disabled={busy}
                  className="mb-3 w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  ✅ Mark as Completed
                </button>
              )}
            </div>
          )}
        </div>

        {/* 底部按鈕區 */}
        <div className="mt-4 flex justify-between gap-3">
          <button
            onClick={() => handleBulkUpdate(!allCompleted)}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-white ${
              allCompleted ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
            } disabled:opacity-60`}
          >
            {allCompleted ? "Mark All as Incomplete" : "✅ Mark All as Completed"}
          </button>

          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
