import { InventoryItemWithDetails, InventoryLocation } from "@/types/data";
import { ExpirationBadge } from "./ExpirationBadge";
import {
  getStockStatus,
  getStockStatusLabel,
  getStockStatusColor,
} from "@/utils/inventory/lowStock";
import { Trash2, Edit2, Package, MapPin } from "lucide-react";

interface InventoryCardProps {
  /** The inventory item to display */
  item: InventoryItemWithDetails;
  /** Callback when edit button is clicked */
  onEdit?: (item: InventoryItemWithDetails) => void;
  /** Callback when delete button is clicked */
  onDelete?: (item: InventoryItemWithDetails) => void;
  /** Additional CSS classes */
  className?: string;
}

const locationLabels: Record<InventoryLocation, string> = {
  pantry: "Pantry",
  fridge: "Fridge",
  freezer: "Freezer",
  other: "Other",
};

const locationColors: Record<InventoryLocation, string> = {
  pantry: "bg-amber-100 text-amber-800 border-2 border-black",
  fridge: "bg-sky-100 text-sky-800 border-2 border-black",
  freezer: "bg-cyan-100 text-cyan-800 border-2 border-black",
  other: "bg-gray-100 text-gray-800 border-2 border-black",
};

/**
 * Card component for displaying an inventory item
 */
export function InventoryCard({ item, onEdit, onDelete, className = "" }: InventoryCardProps) {
  const stockStatus = getStockStatus(item.quantity, item.min_quantity);
  const stockLabel = getStockStatusLabel(stockStatus);
  const stockColor = getStockStatusColor(stockStatus);

  const stockAccentColor = {
    red: "bg-red-100",
    orange: "bg-orange-100",
    green: "bg-emerald-100",
    gray: "bg-gray-100",
  }[stockColor];

  return (
    <div
      className={`brutalism-card overflow-hidden ${className} p-4`}
      data-testid="inventory-card"
      data-item-id={item.id}
    >
      {/* Header with accent color */}
      <div
        className={`-mx-4 -mt-4 mb-3 flex items-start justify-between border-b-2 border-black p-3 ${stockAccentColor}`}
      >
        <div className="flex items-center gap-2">
          <Package className="size-5 text-black" />
          <h3 className="brutalism-text-bold text-black" data-testid="item-name">
            {item.ingredient?.name || `Item #${item.ingredient_id}`}
          </h3>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="brutalism-border bg-white p-1 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="Edit item"
              data-testid="edit-button"
            >
              <Edit2 className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="brutalism-border bg-white p-1 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="Delete item"
              data-testid="delete-button"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="mb-3 grid grid-cols-2 gap-2 p-4 text-sm">
        {/* Quantity */}
        <div>
          <span className="text-gray-600">Quantity:</span>
          <span className="ml-1 font-bold" data-testid="item-quantity">
            {item.quantity} {item.unit || ""}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1">
          <MapPin className="size-3 text-black" />
          <span
            className={`px-1.5 py-0.5 text-xs font-bold ${locationColors[item.location]}`}
            data-testid="item-location"
          >
            {locationLabels[item.location]}
          </span>
        </div>

        {/* Min Quantity */}
        {item.min_quantity !== null && (
          <div>
            <span className="text-gray-500">Min:</span>
            <span className="ml-1" data-testid="item-min-quantity">
              {item.min_quantity} {item.unit || ""}
            </span>
          </div>
        )}

        {/* Stock Status */}
        {stockStatus !== "unknown" && (
          <div>
            <span
              className={`text-xs font-medium ${
                stockColor === "red"
                  ? "text-red-600"
                  : stockColor === "orange"
                    ? "text-orange-600"
                    : "text-green-600"
              }`}
              data-testid="stock-status"
            >
              {stockLabel}
            </span>
          </div>
        )}
      </div>

      {/* Footer with Expiration Badge */}
      <div className="flex items-center justify-between border-t-2 border-black px-4 pt-3">
        <ExpirationBadge expirationDate={item.expiration_date} showDetails />

        {item.notes && (
          <span className="truncate text-xs font-medium text-gray-600" title={item.notes}>
            {item.notes}
          </span>
        )}
      </div>
    </div>
  );
}

export default InventoryCard;
