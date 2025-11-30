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
  const bannerStyle = hasCritical
    ? "bg-red-50 border-red-200 text-red-800"
    : "bg-yellow-50 border-yellow-200 text-yellow-800";

  const iconStyle = hasCritical ? "text-red-500" : "text-yellow-500";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${bannerStyle} ${className}`}
      data-testid="low-stock-banner"
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${hasCritical ? "bg-red-100" : "bg-yellow-100"}`}>
          {hasCritical ? (
            <AlertTriangle className={`size-5 ${iconStyle}`} />
          ) : (
            <Package className={`size-5 ${iconStyle}`} />
          )}
        </div>
        <div>
          <p className="font-semibold" data-testid="low-stock-title">
            {hasCritical ? "Stock Alert!" : "Low Stock Warning"}
          </p>
          <p className="text-sm opacity-80" data-testid="low-stock-message">
            {hasCritical
              ? `${criticalCount} item${criticalCount === 1 ? " is" : "s are"} out of stock`
              : `${lowStockCount} item${lowStockCount === 1 ? " is" : "s are"} running low`}
          </p>
        </div>
      </div>

      {onViewItems && (
        <button
          onClick={onViewItems}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            hasCritical ? "bg-red-100 hover:bg-red-200" : "bg-yellow-100 hover:bg-yellow-200"
          }`}
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
