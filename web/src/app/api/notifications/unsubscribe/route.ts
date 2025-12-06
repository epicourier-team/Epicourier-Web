import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import type { UnsubscribeRequest, NotificationResponse } from "@/types/push-notifications";

/**
 * POST /api/notifications/unsubscribe
 *
 * Unsubscribe a user from push notifications.
 * Removes the push subscription from the database.
 *
 * Request body:
 * - endpoint: string (the push subscription endpoint to remove)
 *
 * Returns:
 * - success: boolean
 * - message: string
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  let authUserId: string;

  try {
    ({ authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    console.warn("POST /api/notifications/unsubscribe auth error:", errorMessage);
    return NextResponse.json<NotificationResponse>(
      { success: false, message: errorMessage },
      { status: 401 }
    );
  }

  let body: UnsubscribeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.endpoint) {
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Missing endpoint in request body" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", authUserId)
      .eq("endpoint", body.endpoint);

    if (error) {
      console.error("Error deleting push subscription:", error.message);
      return NextResponse.json<NotificationResponse>(
        { success: false, message: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json<NotificationResponse>({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error in unsubscribe endpoint:", error);
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/unsubscribe
 *
 * Remove all push subscriptions for the current user.
 * Used when user wants to disable all notifications.
 *
 * Returns:
 * - success: boolean
 * - message: string
 * - removed: number of subscriptions removed
 */
export async function DELETE() {
  const supabase = await createClient();
  let authUserId: string;

  try {
    ({ authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json<NotificationResponse>(
      { success: false, message: errorMessage },
      { status: 401 }
    );
  }

  try {
    // First count existing subscriptions
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact" })
      .eq("user_id", authUserId);

    // Delete all subscriptions for this user
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", authUserId);

    if (error) {
      console.error("Error deleting all push subscriptions:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to unsubscribe from all notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from all push notifications",
      removed: count ?? 0,
    });
  } catch (error) {
    console.error("Error in unsubscribe all endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
