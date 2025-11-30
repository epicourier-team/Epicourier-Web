"use client";

import { useState } from "react";
import { Edit2, Trash2, MapPin, Check } from "lucide-react";
import ExpirationBadge from "./ExpirationBadge";
import LowStockBadge from "./LowStockBadge";
import { cn } from "@/lib/utils";
import type { InventoryItemWithDetails } from "@/types/data";

interface InventoryItemCardProps {
  item: InventoryItemWithDetails;
  onEdit: (item: InventoryItemWithDetails) => void;
  onDelete: (item: InventoryItemWithDetails) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (item: InventoryItemWithDetails) => void;
  className?: string;
}

const LOCATION_EMOJI: Record<string, string> = {
  pantry: "🥫",
  fridge: "❄️",
  freezer: "🧊",
  other: "📍",
};

/**
 * Inventory item card with expiration badge and actions
 *
 * Features:
 * - Ingredient name and quantity display
 * - Color-coded expiration badge
 * - Low stock indicator
 * - Location icon
 * - Edit/Delete actions
 */
export default function InventoryItemCard({
  item,
  onEdit,
  onDelete,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  className,
}: InventoryItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const locationEmoji = LOCATION_EMOJI[item.location] || "📍";

  // Format quantity with unit
  const quantityDisplay = item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`;

  const handleCardClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "brutalism-card group relative flex flex-col overflow-hidden transition-all",
        isHovered ? "-translate-x-0.5 -translate-y-0.5" : "",
        // Border color based on expiration status
        item.expiration_status === "expired" && "border-red-500",
        item.expiration_status === "critical" && "border-orange-500",
        // Selection styling
        isSelectMode && "cursor-pointer",
        isSelected && "border-blue-500 ring-2 ring-blue-500 ring-offset-2",
        className
      )}
    >
      {/* Selection checkbox indicator */}
      {isSelectMode && (
        <div
          className={cn(
            "absolute top-3 left-3 z-10 flex size-6 items-center justify-center rounded-md border-2 transition-colors",
            isSelected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-400 bg-white hover:border-blue-400"
          )}
        >
          {isSelected && <Check className="size-4" />}
        </div>
      )}

      <div className={cn("flex flex-1 flex-col p-4", isSelectMode && "pt-10")}>
        {/* Header: Name + Location */}
        <div className="mb-2 flex items-start justify-between">
          <h3 className="brutalism-text-bold line-clamp-2 flex-1 text-base leading-tight">
            {item.ingredient?.name || `Ingredient #${item.ingredient_id}`}
          </h3>
          <span className="ml-2 text-lg" title={item.location}>
            {locationEmoji}
          </span>
        </div>

        {/* Quantity */}
        <p className="mb-2 text-lg font-bold text-gray-900">{quantityDisplay}</p>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <ExpirationBadge status={item.expiration_status} daysUntil={item.days_until_expiration} />
          <LowStockBadge
            isLowStock={item.is_low_stock}
            quantity={item.quantity}
            minQuantity={item.min_quantity}
          />
        </div>

        {/* Notes (if any) */}
        {item.notes && (
          <p className="mb-2 line-clamp-2 text-xs text-gray-500 italic">{item.notes}</p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Location info (text) */}
        <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="size-3" />
          <span className="capitalize">{item.location}</span>
        </div>

        {/* Actions - hidden in select mode */}
        {!isSelectMode && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="brutalism-button-neutral flex flex-1 items-center justify-center gap-1 px-3 py-2 text-sm"
            >
              <Edit2 className="size-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="brutalism-button-danger flex items-center justify-center gap-1 px-3 py-2 text-sm"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
