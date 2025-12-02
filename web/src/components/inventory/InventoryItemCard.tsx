"use client";

import { useState } from "react";
import { Trash2, MapPin, Check, Package } from "lucide-react";
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

const LOCATION_COLORS: Record<string, string> = {
  pantry: "bg-amber-100",
  fridge: "bg-sky-100",
  freezer: "bg-cyan-100",
  other: "bg-purple-100",
};

/**
 * Inventory item card with expiration badge and actions
 *
 * Features:
 * - Ingredient name and quantity display
 * - Color-coded expiration badge
 * - Low stock indicator
 * - Location icon
 * - Click to edit
 * - Delete action
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

  const locationColor = LOCATION_COLORS[item.location] || "bg-gray-100";

  const handleCardClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(item);
    } else {
      onEdit(item);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "brutalism-card group relative flex cursor-pointer flex-col overflow-hidden transition-all duration-200",
        isHovered ? "brutalism-shadow-lg -translate-y-1" : "brutalism-shadow",
        // Border color based on expiration status (override black border if critical)
        item.expiration_status === "expired" && "border-red-500",
        // Selection styling
        isSelected && "ring-4 ring-black ring-offset-2",
        className
      )}
    >
      {/* Selection checkbox indicator */}
      {isSelectMode && (
        <div
          className={cn(
            "absolute top-3 left-3 z-20 flex size-6 items-center justify-center border-2 border-black transition-colors",
            isSelected ? "bg-black text-white" : "bg-white hover:bg-gray-100"
          )}
        >
          {isSelected && <Check className="size-4" />}
        </div>
      )}

      {/* Header with Location Color */}
      <div
        className={cn(
          "flex items-start justify-between border-b-2 border-black p-3",
          locationColor
        )}
      >
        <div className={cn("flex items-center gap-2", isSelectMode && "pl-8")}>
          <Package className="size-5 text-black" />
          <h3 className="brutalism-text-bold line-clamp-1 text-sm tracking-tight text-black uppercase">
            {item.ingredient?.name || `Item #${item.ingredient_id}`}
          </h3>
        </div>

        {/* Delete Button (visible on hover or always visible on mobile?) - Let's keep it always visible but subtle */}
        {!isSelectMode && (
          <button
            onClick={handleDeleteClick}
            className="brutalism-border -mt-1 -mr-1 flex size-8 items-center justify-center bg-white text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50"
            title="Delete Item"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Quantity & Location */}
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Quantity</p>
              <p className="text-3xl font-black tracking-tight">{item.quantity}</p>
            </div>
            {item.unit && (
              <span className="text-sm font-bold text-gray-500 uppercase">{item.unit}</span>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <MapPin className="size-3" />
            <span>{item.location}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <ExpirationBadge status={item.expiration_status} daysUntil={item.days_until_expiration} />
          <LowStockBadge
            isLowStock={item.is_low_stock}
            quantity={item.quantity}
            minQuantity={item.min_quantity}
          />
        </div>

        {/* Notes (if any) */}
        {item.notes && (
          <div className="mt-3 border-t-2 border-dashed border-gray-300 pt-2">
            <p className="line-clamp-2 text-xs font-medium text-gray-600 italic">
              &quot;{item.notes}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
