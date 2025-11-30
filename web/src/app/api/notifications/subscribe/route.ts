import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserIdentity } from "@/lib/auth";
import type { SubscribeRequest, NotificationResponse } from "@/types/push-notifications";

/**
 * POST /api/notifications/subscribe
 *
 * Subscribe a user to push notifications.
 * Stores the push subscription in the database.
 *
 * Request body:
 * - subscription: { endpoint, keys: { p256dh, auth } }
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
    console.warn("POST /api/notifications/subscribe auth error:", errorMessage);
    return NextResponse.json<NotificationResponse>(
      { success: false, message: errorMessage },
      { status: 401 }
    );
  }

  let body: SubscribeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate subscription data
  if (
    !body.subscription?.endpoint ||
    !body.subscription?.keys?.p256dh ||
    !body.subscription?.keys?.auth
  ) {
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Invalid subscription data: missing endpoint or keys" },
      { status: 400 }
    );
  }

  const { endpoint, keys } = body.subscription;

  try {
    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", authUserId)
      .eq("endpoint", endpoint)
      .single();

    if (existing) {
      // Subscription already exists, update it
      const { error: updateError } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating push subscription:", updateError.message);
        return NextResponse.json<NotificationResponse>(
          { success: false, message: "Failed to update subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json<NotificationResponse>({
        success: true,
        message: "Push subscription updated successfully",
      });
    }

    // Insert new subscription
    const { error: insertError } = await supabase.from("push_subscriptions").insert({
      user_id: authUserId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    if (insertError) {
      console.error("Error inserting push subscription:", insertError.message);
      return NextResponse.json<NotificationResponse>(
        { success: false, message: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json<NotificationResponse>({
      success: true,
      message: "Push subscription saved successfully",
    });
  } catch (error) {
    console.error("Error in subscribe endpoint:", error);
    return NextResponse.json<NotificationResponse>(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/subscribe
 *
 * Check if the current user has any push subscriptions.
 *
 * Returns:
 * - subscribed: boolean
 * - count: number of active subscriptions
 */
export async function GET() {
  const supabase = await createClient();
  let authUserId: string;

  try {
    ({ authUserId } = await getUserIdentity(supabase));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  try {
    const { data, error, count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact" })
      .eq("user_id", authUserId);

    if (error) {
      console.error("Error checking subscriptions:", error.message);
      return NextResponse.json({ error: "Failed to check subscriptions" }, { status: 500 });
    }

    return NextResponse.json({
      subscribed: (count ?? 0) > 0,
      count: count ?? 0,
      subscriptions: data?.length ?? 0,
    });
  } catch (error) {
    console.error("Error in subscription check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
