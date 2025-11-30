import { ExpirationStatus } from "@/types/data";
import {
  getExpirationStatus,
  getExpirationStatusLabel,
  formatExpirationDate,
} from "@/utils/inventory/expiration";
import { Clock, AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface ExpirationBadgeProps {
  /** Expiration date string (YYYY-MM-DD format) or null */
  expirationDate: string | null;
  /** Show icon */
  showIcon?: boolean;
  /** Show detailed text (e.g., "Expires in 3 days") */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusStyles: Record<ExpirationStatus, string> = {
  expired: "bg-red-100 text-red-800 border-red-300",
  critical: "bg-orange-100 text-orange-800 border-orange-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  good: "bg-green-100 text-green-800 border-green-300",
  unknown: "bg-gray-100 text-gray-600 border-gray-300",
};

const StatusIcon = ({ status }: { status: ExpirationStatus }) => {
  const iconClass = "size-3.5";
  switch (status) {
    case "expired":
      return <AlertCircle className={iconClass} />;
    case "critical":
      return <AlertTriangle className={iconClass} />;
    case "warning":
      return <Clock className={iconClass} />;
    case "good":
      return <CheckCircle className={iconClass} />;
    case "unknown":
    default:
      return <HelpCircle className={iconClass} />;
  }
};

/**
 * Badge component to display expiration status of inventory items
 */
export function ExpirationBadge({
  expirationDate,
  showIcon = true,
  showDetails = false,
  className = "",
}: ExpirationBadgeProps) {
  const status = getExpirationStatus(expirationDate);
  const label = getExpirationStatusLabel(status);
  const details = formatExpirationDate(expirationDate);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[status]} ${className}`}
      title={details}
      data-testid="expiration-badge"
      data-status={status}
    >
      {showIcon && <StatusIcon status={status} />}
      <span>{showDetails ? details : label}</span>
    </span>
  );
}

export default ExpirationBadge;
