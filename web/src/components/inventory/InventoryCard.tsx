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
  pantry: "bg-amber-100 text-amber-800",
  fridge: "bg-blue-100 text-blue-800",
  freezer: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

/**
 * Card component for displaying an inventory item
 */
export function InventoryCard({
  item,
  onEdit,
  onDelete,
  className = "",
}: InventoryCardProps) {
  const stockStatus = getStockStatus(item.quantity, item.min_quantity);
  const stockLabel = getStockStatusLabel(stockStatus);
  const stockColor = getStockStatusColor(stockStatus);

  const stockBorderColor = {
    red: "border-l-red-500",
    orange: "border-l-orange-500",
    green: "border-l-green-500",
    gray: "border-l-gray-300",
  }[stockColor];

  return (
    <div
      className={`rounded-lg border border-l-4 bg-white p-4 shadow-sm ${stockBorderColor} ${className}`}
      data-testid="inventory-card"
      data-item-id={item.id}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900" data-testid="item-name">
            {item.ingredient?.name || `Item #${item.ingredient_id}`}
          </h3>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Edit item"
              data-testid="edit-button"
            >
              <Edit2 className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
              title="Delete item"
              data-testid="delete-button"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        {/* Quantity */}
        <div>
          <span className="text-gray-500">Quantity:</span>
          <span className="ml-1 font-medium" data-testid="item-quantity">
            {item.quantity} {item.unit || ""}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1">
          <MapPin className="size-3 text-gray-400" />
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${locationColors[item.location]}`}
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
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <ExpirationBadge expirationDate={item.expiration_date} showDetails />

        {item.notes && (
          <span className="truncate text-xs text-gray-500" title={item.notes}>
            {item.notes}
          </span>
        )}
      </div>
    </div>
  );
}

export default InventoryCard;
