"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-6 flex w-full items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white px-12 py-3.5 text-neutral-800 placeholder-neutral-400 shadow-sm transition-all focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-neutral-600"
          type="text"
          placeholder="Search for delicious recipes..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
        />
      </div>
      <button
        onClick={() => onSearch(value)}
        className="rounded-xl bg-emerald-600 px-6 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        Search
      </button>
    </div>
  );
}
