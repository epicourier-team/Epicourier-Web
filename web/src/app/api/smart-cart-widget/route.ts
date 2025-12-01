import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type {
  SmartCartWidgetData,
  ActiveListSummary,
  InventoryAlerts,
  SuggestedAction,
} from "@/types/data";

/**
 * Helper function to calculate days until a date
 */
function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to format "days until" text for display
 */
function formatDaysUntil(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

/**
 * GET /api/smart-cart-widget
 * Get aggregated data for the dashboard smart cart widget
 */
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch active shopping lists (non-archived)
    const { data: lists } = await supabase
      .from("shopping_lists")
      .select(
        `
        id,
        name,
        shopping_list_items (
          id,
          item_name,
          is_checked,
          position
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(1);

    // Fetch inventory items for alerts
    const { data: inventory } = await supabase
      .from("user_inventory")
      .select(
        `
        id,
        quantity,
        expiration_date,
        min_quantity,
        Ingredient:ingredient_id (name)
      `
      )
      .eq("user_id", user.id);

    // Calculate active list summary
    let activeList: ActiveListSummary | null = null;
    if (lists && lists.length > 0) {
      const list = lists[0];
      const items = list.shopping_list_items || [];
      const uncheckedItems = items
        .filter((item: { is_checked: boolean }) => !item.is_checked)
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

      activeList = {
        id: list.id,
        name: list.name,
        item_count: items.length,
        checked_count: items.filter((item: { is_checked: boolean }) => item.is_checked).length,
        next_items: uncheckedItems.slice(0, 3).map((item: { item_name: string }) => item.item_name),
      };
    }

    // Calculate inventory alerts
    const inventoryAlerts: InventoryAlerts = {
      expiring_soon: 0,
      expired: 0,
      low_stock: 0,
    };

    // Track expiring items for suggested action
    interface ExpiringItem {
      name: string;
      daysUntil: number;
    }
    const expiringItems: ExpiringItem[] = [];

    if (inventory) {
      for (const item of inventory) {
        // Check expiration
        const daysUntil = getDaysUntil(item.expiration_date);
        if (daysUntil !== null) {
          if (daysUntil < 0) {
            inventoryAlerts.expired++;
          } else if (daysUntil <= 7) {
            inventoryAlerts.expiring_soon++;
            // Track for suggested action
            if (daysUntil <= 3 && item.Ingredient) {
              const ingredient = Array.isArray(item.Ingredient)
                ? item.Ingredient[0]
                : item.Ingredient;
              if (ingredient?.name) {
                expiringItems.push({
                  name: ingredient.name,
                  daysUntil: daysUntil,
                });
              }
            }
          }
        }

        // Check low stock
        if (item.min_quantity && item.quantity < item.min_quantity) {
          inventoryAlerts.low_stock++;
        }
      }
    }

    // Generate suggested action
    let suggestedAction: SuggestedAction | null = null;

    // Priority 1: Use expiring items
    if (expiringItems.length > 0) {
      // Sort by urgency (soonest first)
      expiringItems.sort((a, b) => a.daysUntil - b.daysUntil);
      const urgentItem = expiringItems[0];
      const daysText = formatDaysUntil(urgentItem.daysUntil);

      suggestedAction = {
        type: "use_expiring",
        title: `Use ${urgentItem.name} ${daysText}`,
        description: `This item is expiring soon. Find recipes to use it!`,
        action_label: "Find Recipes",
        action_href: "/dashboard/recipes",
      };
    }
    // Priority 2: Complete shopping if list is close to done
    else if (activeList && activeList.item_count > 0) {
      const remaining = activeList.item_count - activeList.checked_count;
      const progress = (activeList.checked_count / activeList.item_count) * 100;

      if (progress >= 75 && remaining > 0) {
        suggestedAction = {
          type: "complete_shopping",
          title: `Almost done! ${remaining} item${remaining !== 1 ? "s" : ""} left`,
          description: `You're ${Math.round(progress)}% through your shopping list.`,
          action_label: "Complete List",
          action_href: `/dashboard/shopping/${activeList.id}`,
        };
      }
    }
    // Priority 3: Restock low items
    else if (inventoryAlerts.low_stock > 0) {
      suggestedAction = {
        type: "restock",
        title: `${inventoryAlerts.low_stock} item${inventoryAlerts.low_stock !== 1 ? "s" : ""} running low`,
        description: "Add these to your shopping list.",
        action_label: "View Inventory",
        action_href: "/dashboard/inventory",
      };
    }

    const widgetData: SmartCartWidgetData = {
      active_list: activeList,
      inventory_alerts: inventoryAlerts,
      suggested_action: suggestedAction,
    };

    return NextResponse.json(widgetData);
  } catch (error) {
    console.error("Error fetching smart cart widget data:", error);
    return NextResponse.json({ error: "Failed to fetch widget data" }, { status: 500 });
  }
}
