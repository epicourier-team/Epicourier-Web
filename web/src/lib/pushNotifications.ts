/**
 * Web Push Notification Service
 *
 * Handles sending push notifications to subscribed users.
 * Uses the web-push library for VAPID authentication.
 */

import webpush from "web-push";
import { supabaseServer } from "@/lib/supabaseServer";
import type { Achievement } from "@/types/data";
import type { AchievementNotificationPayload, PushSubscription } from "@/types/push-notifications";

// VAPID keys should be generated once and stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@epicourier.com";

// Configure web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Check if push notifications are properly configured
 */
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}

/**
 * Get all push subscriptions for a user
 * Note: Uses raw query since push_subscriptions table types are not yet generated
 */
async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseServer as any)
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user subscriptions:", error.message);
    return [];
  }

  return (data ?? []) as PushSubscription[];
}

/**
 * Remove an invalid subscription from the database
 * Note: Uses raw query since push_subscriptions table types are not yet generated
 */
async function removeInvalidSubscription(subscriptionId: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseServer as any)
    .from("push_subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error removing invalid subscription:", error.message);
  }
}

/**
 * Send a push notification to a single subscription
 */
async function sendToSubscription(
  subscription: PushSubscription,
  payload: string
): Promise<boolean> {
  if (!isPushConfigured()) {
    console.warn("Push notifications not configured (missing VAPID keys)");
    return false;
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, payload);
    return true;
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number };
    
    // Handle expired or invalid subscriptions
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      console.log(`Removing expired subscription ${subscription.id}`);
      await removeInvalidSubscription(subscription.id);
    } else {
      console.error("Error sending push notification:", error);
    }
    return false;
  }
}

/**
 * Send achievement notification to all user's subscribed devices
 */
export async function sendAchievementNotification(
  userId: string,
  achievement: Achievement
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getUserSubscriptions(userId);
  
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload: AchievementNotificationPayload = {
    type: "achievement",
    title: "🏆 Achievement Unlocked!",
    body: `You earned "${achievement.title}" - ${achievement.description}`,
    icon: `/icons/achievements/${achievement.icon || "trophy"}.png`,
    badge: "/icons/badge-96x96.png",
    tag: `achievement-${achievement.id}`,
    data: {
      achievementId: achievement.id,
      achievementName: achievement.name,
      tier: achievement.tier,
      url: "/dashboard/achievements",
    },
  };

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendToSubscription(subscription, payloadString);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log(`Achievement notification sent: ${sent}/${subscriptions.length} devices`);
  return { sent, failed };
}

/**
 * Send multiple achievement notifications (for batch unlocks)
 */
export async function sendMultipleAchievementNotifications(
  userId: string,
  achievements: Achievement[]
): Promise<{ total: number; sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const achievement of achievements) {
    const { sent, failed } = await sendAchievementNotification(userId, achievement);
    totalSent += sent;
    totalFailed += failed;
  }

  return {
    total: achievements.length,
    sent: totalSent,
    failed: totalFailed,
  };
}

/**
 * Send a generic notification to a user
 */
export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getUserSubscriptions(userId);
  
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-96x96.png",
    data: data ?? {},
  });

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendToSubscription(subscription, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
