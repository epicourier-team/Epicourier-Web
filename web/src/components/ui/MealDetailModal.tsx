"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

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

  const len = entries?.length ?? 0;

  useEffect(() => {
    if (len > 0) setSelectedIndex(0);
  }, [len]);

  const selected = useMemo<CalendarApiResponse | null>(() => {
    if (!entries || len === 0) return null;
    const safeIndex = ((selectedIndex % len) + len) % len;
    return entries[safeIndex];
  }, [entries, len, selectedIndex]);

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

  const handlePrev = useCallback(() => {
    if (len <= 0) return;
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
  }, [len]);

  const handleNext = useCallback(() => {
    if (len <= 0) return;
    setSelectedIndex((prev) => (prev + 1) % len);
  }, [len]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handlePrev, handleNext]);

  // update one
  const handleSingleUpdate = useCallback(
    async (entryId: number, newStatus: boolean) => {
      if (busy) return;
      try {
        setBusy(true);
        await onUpdateStatus(entryId, newStatus);
        await reloadEvents();
        onClose();
      } finally {
        setBusy(false);
      }
    },
    [busy, onUpdateStatus, reloadEvents, onClose]
  );

  // update all
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

  if (!isOpen || len === 0 || !selected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="brutalism-card brutalism-shadow-xl relative w-full max-w-2xl rounded-none p-8">
        <div className="flex flex-col items-center">
          {!!selected.Recipe?.image_url && (
            <div className="brutalism-border relative mb-4 h-48 w-full">
              <Image
                src={selected.Recipe.image_url}
                alt={selected.Recipe.name ?? "meal"}
                fill
                className="rounded-none object-cover"
              />
            </div>
          )}

          {/* title and arrow */}
          <div className="mb-2 flex w-full items-center justify-between">
            <button
              onClick={handlePrev}
              className={`brutalism-border brutalism-shadow-sm brutalism-hover brutalism-active rounded-none bg-white p-2 ${len <= 1 ? "invisible" : ""}`}
              aria-label="Previous meal"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <h3 className="brutalism-heading flex-1 truncate px-2 text-center text-2xl capitalize">
              {selected.Recipe?.name ?? selected.meal_type}
            </h3>

            <button
              onClick={handleNext}
              className={`brutalism-border brutalism-shadow-sm brutalism-hover brutalism-active rounded-none bg-white p-2 ${len <= 1 ? "invisible" : ""}`}
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

          {isPast && (
            <p className="mb-2 w-full text-center text-xs font-semibold text-gray-600">
              Past meal — status can still be updated.
            </p>
          )}

          {/* status controls */}
          {selected.status ? (
            <button
              onClick={() => handleSingleUpdate(selected.id, false)}
              disabled={busy}
              className="brutalism-border brutalism-shadow brutalism-hover brutalism-active mb-3 w-full rounded-none bg-yellow-300 px-4 py-2 font-bold disabled:opacity-60"
            >
              Mark as Incomplete
            </button>
          ) : (
            <button
              onClick={() => handleSingleUpdate(selected.id, true)}
              disabled={busy}
              className="brutalism-button-primary mb-3 w-full rounded-none px-4 py-2 disabled:opacity-60"
            >
              ✅ Mark as Completed
            </button>
          )}
        </div>

        {/* bottom button  */}
        <div className="mt-4 flex justify-between gap-3">
          <button
            onClick={() => handleBulkUpdate(!allCompleted)}
            disabled={busy}
            className={`brutalism-border brutalism-shadow brutalism-hover brutalism-active rounded-none px-4 py-2 font-bold ${
              allCompleted ? "bg-yellow-300" : "bg-emerald-400"
            } disabled:opacity-60`}
          >
            {allCompleted ? "Mark All as Incomplete" : "✅ Mark All as Completed"}
          </button>

          <button
            onClick={onClose}
            disabled={busy}
            className="brutalism-button-neutral rounded-none px-4 py-2 disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
