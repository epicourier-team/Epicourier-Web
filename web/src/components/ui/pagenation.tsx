"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Page <span className="text-neutral-900 dark:text-neutral-100">{page}</span> of{" "}
          <span className="text-neutral-900 dark:text-neutral-100">{totalPages}</span>
        </span>
      </div>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
