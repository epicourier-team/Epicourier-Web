"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search bar for filtering inventory items by ingredient name
 */
export default function InventorySearchBar({
  value,
  onChange,
  placeholder = "Search ingredients...",
  className,
}: InventorySearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-black bg-white py-2.5 pr-10 pl-10 font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="size-4 text-gray-500" />
        </button>
      )}
    </div>
  );
}
