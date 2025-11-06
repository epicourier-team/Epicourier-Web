"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  // ✅ 所有 Hook 永遠在最上面（不要放在任何 return/if 之前）
  const [busy, setBusy] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const len = entries?.length ?? 0;

  // 當 entries 改變時，重設索引到 0（如果有資料）
  useEffect(() => {
    if (len > 0) setSelectedIndex(0);
  }, [len]);

  // 目前選中的餐點（len==0 時為 null，避免存取 undefined）
  const selected = useMemo<CalendarApiResponse | null>(() => {
    if (!entries || len === 0) return null;
    const safeIndex = ((selectedIndex % len) + len) % len;
    return entries[safeIndex];
  }, [entries, len, selectedIndex]);

  // 安全日期比較
  const isPast = useMemo(() => {
    if (!selected) return false;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const lhs = new Date(selected.date);
    const rhs = new Date(todayStr);
    lhs.setHours(0, 0, 0, 0);
    rhs.setHours(0, 0, 0, 0);
    return lhs.getTime() < rhs.getTime();
  }, [selected]);

  const allCompleted = useMemo(
    () => (entries ? entries.every((e) => e.status === true) : false),
    [entries]
  );

  // 左右切換（用 useCallback 穩定參考，避免 effect 反覆綁定）
  const handlePrev = useCallback(() => {
    if (len <= 0) return;
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
  }, [len]);

  const handleNext = useCallback(() => {
    if (len <= 0) return;
    setSelectedIndex((prev) => (prev + 1) % len);
  }, [len]);

  // 鍵盤 ← → 支援（Hook 仍然每次呼叫；內部再檢查 isOpen）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handlePrev, handleNext]);

  // 單筆更新
  const handleSingleUpdate = useCallback(
    async (entryId: number, newStatus: boolean) => {
      if (busy) return;
      try {
        setBusy(true);
        await onUpdateStatus(entryId, newStatus);
        await reloadEvents();
      } finally {
        setBusy(false);
      }
    },
    [busy, onUpdateStatus, reloadEvents]
  );

  // 全部更新
  const handleBulkUpdate = useCallback(
    async (newStatus: boolean) => {
      if (busy || !entries || len === 0) return;
      try {
        setBusy(true);
        await Promise.all(entries.map((e) => onUpdateStatus(e.id, newStatus)));
        await reloadEvents();
        onClose();
      } finally {
        setBusy(false);
      }
    },
    [busy, entries, len, onUpdateStatus, reloadEvents, onClose]
  );

  // ✅ 到這裡才做條件 return（Hook 都已固定呼叫過）
  if (!isOpen || len === 0 || !selected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
        <div className="flex flex-col items-center">
          {!!selected.Recipe?.image_url && (
            <img
              src={selected.Recipe.image_url}
              alt={selected.Recipe.name ?? "meal"}
              className="mb-4 h-48 w-full rounded-lg object-cover"
            />
          )}

          {/* 標題列 + 左右箭頭（與名稱同一高度） */}
          <div className="mb-2 flex w-full items-center justify-between">
            <button
              onClick={handlePrev}
              className={`rounded-full p-2 hover:bg-gray-100 ${len <= 1 ? "invisible" : ""}`}
              aria-label="Previous meal"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h3 className="flex-1 truncate px-2 text-center text-2xl font-bold capitalize">
              {selected.Recipe?.name ?? selected.meal_type}
            </h3>

            <button
              onClick={handleNext}
              className={`rounded-full p-2 hover:bg-gray-100 ${len <= 1 ? "invisible" : ""}`}
              aria-label="Next meal"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-600">
            {selected.meal_type.charAt(0).toUpperCase() + selected.meal_type.slice(1)} on{" "}
            {selected.date} ({(selectedIndex % len) + 1}/{len})
          </p>

          {!!selected.Recipe?.description && (
            <p className="mb-6 max-h-40 overflow-y-auto whitespace-pre-line text-gray-700">
              {selected.Recipe.description}
            </p>
          )}

          {/* 單筆狀態按鈕 */}
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

        {/* 底部按鈕 */}
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
