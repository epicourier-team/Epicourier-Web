"use client";

import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 flex w-full items-center gap-3">
      <input
        className="brutalism-input flex-1 px-3 py-2 placeholder:text-gray-500 focus:ring-0"
        type="text"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(value)}
      />
      <button onClick={() => onSearch(value)} className="brutalism-button-primary px-5 py-2">
        Search
      </button>
    </div>
  );
}
