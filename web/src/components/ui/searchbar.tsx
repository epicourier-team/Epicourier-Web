"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-6 relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          type="text"
          placeholder="Search for recipes..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <button
        onClick={() => onSearch(value)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
      >
        Search
      </button>
    </div>
  );
}
