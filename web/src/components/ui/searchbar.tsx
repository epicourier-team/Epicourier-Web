"use client";

import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 flex w-full items-center gap-2">
      <input
        className="w-full rounded-lg border px-3 py-2"
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
      />
      <button
        onClick={() => onSearch(value)}
        className="rounded-lg bg-green-600 px-4 py-2 text-white"
      >
        Search
      </button>
    </div>
  );
}
