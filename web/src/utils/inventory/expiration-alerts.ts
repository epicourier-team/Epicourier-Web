// Enhanced Expiration Alerts
// Issue #107: Improve inventory expiration notifications with smart scheduling

import { createClient } from "@supabase/supabase-js";

interface ExpiringItem {
  id: string;
  item_name: string;
  expiration_date: string;
  quantity: number;
  unit: string;
  daysUntilExpiration: number;
  alertSeverity: "critical" | "warning" | "info";
}

// Helper function to calculate days between dates
function differenceInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay);
}

// Helper function to format date
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function getExpiringItemsWithAlerts(
  userId: string
): Promise<ExpiringItem[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: items, error } = await supabase
    .from("user_inventory")
    .select("*")
    .eq("user_id", userId)
    .not("expiration_date", "is", null)
    .lte("expiration_date", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()); // Next 14 days

  if (error) throw error;

  // Calculate alert severity based on days remaining
  return items
    .map((item: any) => {
      const daysUntilExpiration = differenceInDays(
        new Date(item.expiration_date),
        new Date()
      );

      let alertSeverity: "critical" | "warning" | "info" = "info";
      if (daysUntilExpiration <= 1) alertSeverity = "critical";
      else if (daysUntilExpiration <= 3) alertSeverity = "warning";

      return {
        ...item,
        daysUntilExpiration,
        alertSeverity,
      };
    })
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
}

// Smart notification scheduling
export async function scheduleExpirationNotifications(
  userId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const expiringItems = await getExpiringItemsWithAlerts(userId);

  for (const item of expiringItems) {
    // Only notify once per day per item
    const { data: existingNotification } = await supabase
      .from("expiration_notifications")
      .select("*")
      .eq("inventory_id", item.id)
      .eq("notification_date", formatDate(new Date()))
      .single();

    if (existingNotification) continue;

    // Create notification record
    await supabase.from("expiration_notifications").insert({
      user_id: userId,
      inventory_id: item.id,
      item_name: item.item_name,
      expiration_date: item.expiration_date,
      days_until_expiration: item.daysUntilExpiration,
      severity: item.alertSeverity,
      notification_date: formatDate(new Date()),
      sent_at: new Date().toISOString(),
    });
  }
}

// Get summary of expiring items by severity
export async function getExpirationSummary(userId: string) {
  const items = await getExpiringItemsWithAlerts(userId);

  return {
    critical: items.filter((i) => i.alertSeverity === "critical"),
    warning: items.filter((i) => i.alertSeverity === "warning"),
    info: items.filter((i) => i.alertSeverity === "info"),
    total: items.length,
  };
}
