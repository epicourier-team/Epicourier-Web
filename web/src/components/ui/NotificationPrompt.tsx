"use client";

import { useState } from "react";
import { Bell, BellOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * NotificationPrompt Component
 *
 * A UI component that prompts users to enable push notifications.
 * Shows different states based on permission and subscription status.
 */

interface NotificationPromptProps {
  /** Callback when notifications are successfully enabled */
  onEnabled?: () => void;
  /** Callback when notifications are disabled or permission denied */
  onDisabled?: () => void;
  /** Custom class name for styling */
  className?: string;
  /** Show as a compact inline version */
  compact?: boolean;
}

export function NotificationPrompt({
  onEnabled,
  onDisabled,
  className = "",
  compact = false,
}: NotificationPromptProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [showPrompt, setShowPrompt] = useState(true);

  // Don't render if notifications aren't supported
  if (!isSupported) {
    return null;
  }

  // Don't render if user already made a choice and prompt is dismissed
  if (!showPrompt && (permission === "granted" || permission === "denied")) {
    return null;
  }

  const handleEnableNotifications = async () => {
    // First request permission if not granted
    if (permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") {
        onDisabled?.();
        return;
      }
    }

    // Then subscribe
    const success = await subscribe();
    if (success) {
      onEnabled?.();
      setShowPrompt(false);
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
    onDisabled?.();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDisabled?.();
  };

  // Compact version for settings page
  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="text-muted-foreground h-5 w-5" />
          )}
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-muted-foreground text-sm">
              {isSubscribed
                ? "You'll receive notifications for achievements"
                : "Get notified when you earn achievements"}
            </p>
          </div>
        </div>

        <button
          onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
          disabled={isLoading || permission === "denied"}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isSubscribed
              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              : "bg-primary text-primary-foreground hover:opacity-90"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            "Disable"
          ) : (
            "Enable"
          )}
        </button>
      </div>
    );
  }

  // Full banner version
  if (permission === "denied") {
    return (
      <div
        className={`rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20 ${className}`}
      >
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Notifications Blocked
            </p>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              You&apos;ve blocked notifications for this site. To enable them, click the lock icon
              in your browser&apos;s address bar and allow notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div
        className={`rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Notifications Enabled
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                You&apos;ll receive notifications when you earn achievements.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-sm text-green-600 hover:underline dark:text-green-400"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="font-medium text-blue-800 dark:text-blue-200">Enable Push Notifications</p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Get notified when you unlock achievements, even when you&apos;re not using the app.
          </p>

          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enabling...
                </span>
              ) : (
                "Enable Notifications"
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPrompt;
