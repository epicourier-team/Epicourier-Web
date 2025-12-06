"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing push notifications
 *
 * Provides functionality to:
 * - Check if push notifications are supported
 * - Request notification permission
 * - Subscribe/unsubscribe to push notifications
 * - Check subscription status
 */

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission | "unsupported";
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if any operation fails */
  error: string | null;
  /** Request notification permission from the user */
  requestPermission: () => Promise<NotificationPermission>;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Check current subscription status */
  checkSubscription: () => Promise<boolean>;
}

/**
 * Convert URL-safe base64 to Uint8Array
 * Required for VAPID key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Check subscription status on mount
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = subscription !== null;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch (err) {
      console.error("Error checking subscription:", err);
      return false;
    }
  }, [isSupported]);

  // Check subscription status on mount and when permission changes
  useEffect(() => {
    if (isSupported && permission === "granted") {
      checkSubscription();
    }
  }, [isSupported, permission, checkSubscription]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to request permission";
      setError(errorMessage);
      return "denied";
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
      }

      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/notifications/vapid-key");
      if (!vapidResponse.ok) {
        const data = await vapidResponse.json();
        throw new Error(data.error || "Failed to get VAPID key");
      }
      const { publicKey } = await vapidResponse.json();

      if (!publicKey) {
        throw new Error("VAPID public key not configured on server");
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const subscribeResponse = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
            },
          },
        }),
      });

      if (!subscribeResponse.ok) {
        const data = await subscribeResponse.json();
        throw new Error(data.message || "Failed to save subscription");
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to subscribe";
      setError(errorMessage);
      console.error("Error subscribing to push:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove subscription from server
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setIsSubscribed(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(errorMessage);
      console.error("Error unsubscribing from push:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}
