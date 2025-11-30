import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/pushNotifications";

/**
 * GET /api/notifications/vapid-key
 *
 * Returns the VAPID public key for push notification subscription.
 * This key is needed by the client to subscribe to push notifications.
 */
export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        error: "Push notifications not configured",
        configured: false,
      },
      { status: 503 }
    );
  }

  const publicKey = getVapidPublicKey();

  return NextResponse.json({
    publicKey,
    configured: true,
  });
}
