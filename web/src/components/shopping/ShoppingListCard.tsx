"use client";

import { useState } from "react";
import { Trash2, Edit2, ShoppingBag, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { ShoppingList } from "@/types/data";

interface ShoppingListCardProps {
  list: ShoppingList;
  onUpdate: () => void;
}

/**
 * Shopping list card component
 * 
 * Features:
 * - Display list name, description, creation date
 * - Show item count (placeholder for now)
 * - Click to view details
 * - Hover effects with brutalism styling
 */
export default function ShoppingListCard({ list, onUpdate }: ShoppingListCardProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const createdDate = new Date(list.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleClick = () => {
    // TODO: Navigate to list detail page
    toast({
      title: "📝 List Details",
      description: `Opening "${list.name}"...`,
    });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`brutalism-card group cursor-pointer overflow-hidden transition-all ${
        isHovered ? "translate-x-[-2px] translate-y-[-2px]" : ""
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-gray-700" />
            <h3 className="brutalism-text-bold text-lg leading-tight">{list.name}</h3>
          </div>
        </div>

        {/* Description */}
        {list.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">{list.description}</p>
        )}

        {/* Stats */}
        <div className="mb-3 flex items-center gap-4 text-sm font-semibold text-gray-700">
          <div className="flex items-center gap-1">
            <ShoppingBag className="size-4" />
            <span>0 items</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-4" />
            <span>{createdDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "✏️ Edit",
                description: "Edit functionality coming in Issue #82",
              });
            }}
            className="brutalism-button-neutral flex-1 px-3 py-2 text-sm"
          >
            <Edit2 className="size-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "🗑️ Delete",
                description: "Delete functionality coming in Issue #82",
              });
            }}
            className="brutalism-button-neutral flex-1 px-3 py-2 text-sm"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Footer accent */}
      <div className="h-2 bg-emerald-400" />
    </div>
  );
}
