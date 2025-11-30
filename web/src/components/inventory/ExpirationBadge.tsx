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
  expired: "bg-red-200 text-black border-2 border-black",
  critical: "bg-orange-200 text-black border-2 border-black",
  warning: "bg-yellow-200 text-black border-2 border-black",
  good: "bg-emerald-200 text-black border-2 border-black",
  unknown: "bg-gray-200 text-black border-2 border-black",
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusStyles[status]} ${className}`}
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
