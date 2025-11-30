"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 flex w-full items-center gap-2">
      <input
        className="flex-1 rounded-lg border px-3 py-2"
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
      />
      <button
        onClick={() => onSearch(value)}
        className="rounded-xl bg-emerald-600 px-6 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        Search
      </button>
    </div>
  );
}
