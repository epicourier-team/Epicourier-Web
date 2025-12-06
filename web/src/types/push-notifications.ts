/**
 * Push Notification Types
 * Types for Web Push API integration
 */

/**
 * Push subscription stored in database
 */
export interface PushSubscription {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

/**
 * Push subscription insert type (for creating new subscriptions)
 */
export interface PushSubscriptionInsert {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Web Push subscription from browser
 * Matches the PushSubscription interface from the Push API
 */
export interface BrowserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Request body for subscribe endpoint
 */
export interface SubscribeRequest {
  subscription: BrowserPushSubscription;
}

/**
 * Request body for unsubscribe endpoint
 */
export interface UnsubscribeRequest {
  endpoint: string;
}

/**
 * Response from subscribe/unsubscribe endpoints
 */
export interface NotificationResponse {
  success: boolean;
  message: string;
}

/**
 * Push notification payload for achievements
 */
export interface AchievementNotificationPayload {
  type: "achievement";
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: {
    achievementId: number;
    achievementName: string;
    tier: string;
    url: string;
  };
}

/**
 * Generic push notification payload
 */
export type PushNotificationPayload = AchievementNotificationPayload;

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  achievements: boolean;
  streaks: boolean;
  challenges: boolean;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  achievements: true,
  streaks: true,
  challenges: true,
};
