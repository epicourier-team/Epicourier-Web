"use client";

import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 flex w-full items-center gap-3">
      <input
        className="flex-1 border-2 border-black bg-white px-3 py-2 font-medium placeholder:text-gray-500 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:outline-none"
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
      />
      <button
        onClick={() => onSearch(value)}
        className="border-2 border-black bg-emerald-400 px-5 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        Search
      </button>
    </div>
  );
}
