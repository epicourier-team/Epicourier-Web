import { AlertTriangle, Package, ArrowRight } from "lucide-react";

interface LowStockBannerProps {
  /** Number of items that are low on stock */
  lowStockCount: number;
  /** Number of items that are out of stock (critical) */
  criticalCount?: number;
  /** Callback when user clicks to view low stock items */
  onViewItems?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Banner component to alert users about low stock items
 */
export function LowStockBanner({
  lowStockCount,
  criticalCount = 0,
  onViewItems,
  className = "",
}: LowStockBannerProps) {
  if (lowStockCount === 0) {
    return null;
  }

  const hasCritical = criticalCount > 0;
  const bannerStyle = hasCritical ? "bg-red-200" : "bg-yellow-200";

  return (
    <div
      className={`flex items-center justify-between border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${bannerStyle} ${className}`}
      data-testid="low-stock-banner"
    >
      <div className="flex items-center gap-3">
        <div
          className={`border-2 border-black p-2 ${hasCritical ? "bg-red-300" : "bg-yellow-300"}`}
        >
          {hasCritical ? (
            <AlertTriangle className="size-5 text-black" />
          ) : (
            <Package className="size-5 text-black" />
          )}
        </div>
        <div>
          <p className="brutalism-text-bold text-black" data-testid="low-stock-title">
            {hasCritical ? "Stock Alert!" : "Low Stock Warning"}
          </p>
          <p className="text-sm font-medium text-black" data-testid="low-stock-message">
            {hasCritical
              ? `${criticalCount} item${criticalCount === 1 ? " is" : "s are"} out of stock`
              : `${lowStockCount} item${lowStockCount === 1 ? " is" : "s are"} running low`}
          </p>
        </div>
      </div>

      {onViewItems && (
        <button
          onClick={onViewItems}
          className="brutalism-button-inverse flex items-center gap-1 px-3 py-1.5 text-sm"
          data-testid="view-low-stock-button"
        >
          View Items
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

export default LowStockBanner;
