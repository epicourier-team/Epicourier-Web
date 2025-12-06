"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { Achievement } from "@/types/data";
import { AchievementToast } from "@/components/ui/AchievementToast";

interface AchievementNotification {
  id: string;
  achievement: Achievement;
}

interface AchievementNotificationContextValue {
  /**
   * Show a toast notification for a newly earned achievement
   */
  showAchievement: (achievement: Achievement) => void;

  /**
   * Show multiple achievement notifications (queued sequentially)
   */
  showAchievements: (achievements: Achievement[]) => void;

  /**
   * Dismiss a specific notification
   */
  dismissAchievement: (id: string) => void;

  /**
   * Dismiss all notifications
   */
  dismissAll: () => void;

  /**
   * Current active notifications
   */
  notifications: AchievementNotification[];
}

const AchievementNotificationContext = createContext<AchievementNotificationContextValue | null>(
  null
);

// Auto-increment ID for notifications
let notificationId = 0;
function generateId(): string {
  notificationId = (notificationId + 1) % Number.MAX_SAFE_INTEGER;
  return `achievement-${notificationId}-${Date.now()}`;
}

interface AchievementNotificationProviderProps {
  children: ReactNode;
  /**
   * Maximum number of visible notifications at once
   * @default 3
   */
  maxVisible?: number;
  /**
   * Default duration for each notification (ms)
   * @default 5000
   */
  defaultDuration?: number;
  /**
   * Delay between showing queued notifications (ms)
   * @default 500
   */
  queueDelay?: number;
}

/**
 * AchievementNotificationProvider
 *
 * Provides context for showing achievement toast notifications throughout the app.
 * Handles queuing multiple achievements and displaying them sequentially.
 *
 * Usage:
 * ```tsx
 * // In layout or app root
 * <AchievementNotificationProvider>
 *   <App />
 * </AchievementNotificationProvider>
 *
 * // In any component
 * const { showAchievement, showAchievements } = useAchievementNotification();
 *
 * // Show single achievement
 * showAchievement(achievement);
 *
 * // Show multiple (e.g., from API response)
 * showAchievements(response.newly_earned);
 * ```
 */
export function AchievementNotificationProvider({
  children,
  maxVisible = 3,
  defaultDuration = 5000,
  queueDelay = 500,
}: AchievementNotificationProviderProps) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [queue, setQueue] = useState<Achievement[]>([]);

  // Process queue when notifications decrease
  const processQueue = useCallback(() => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      setNotifications((current) => {
        if (current.length >= maxVisible) return current;

        const [next, ...rest] = currentQueue;
        if (!next) return current;

        const newNotification: AchievementNotification = {
          id: generateId(),
          achievement: next,
        };

        // Schedule next queue processing
        if (rest.length > 0) {
          setTimeout(processQueue, queueDelay);
        }

        setQueue(rest);
        return [...current, newNotification];
      });

      return currentQueue;
    });
  }, [maxVisible, queueDelay]);

  const showAchievement = useCallback(
    (achievement: Achievement) => {
      setNotifications((current) => {
        if (current.length >= maxVisible) {
          // Queue for later
          setQueue((q) => [...q, achievement]);
          return current;
        }

        return [
          ...current,
          {
            id: generateId(),
            achievement,
          },
        ];
      });
    },
    [maxVisible]
  );

  const showAchievements = useCallback(
    (achievements: Achievement[]) => {
      if (achievements.length === 0) return;

      // Show first one immediately, queue the rest
      const [first, ...rest] = achievements;

      if (first) {
        showAchievement(first);
      }

      if (rest.length > 0) {
        setQueue((q) => [...q, ...rest]);
        setTimeout(processQueue, queueDelay);
      }
    },
    [showAchievement, processQueue, queueDelay]
  );

  const dismissAchievement = useCallback(
    (id: string) => {
      setNotifications((current) => {
        const filtered = current.filter((n) => n.id !== id);

        // Process queue if we have room
        if (filtered.length < maxVisible && queue.length > 0) {
          setTimeout(processQueue, queueDelay);
        }

        return filtered;
      });
    },
    [maxVisible, queue.length, processQueue, queueDelay]
  );

  const dismissAll = useCallback(() => {
    setNotifications([]);
    setQueue([]);
  }, []);

  return (
    <AchievementNotificationContext.Provider
      value={{
        showAchievement,
        showAchievements,
        dismissAchievement,
        dismissAll,
        notifications,
      }}
    >
      {children}

      {/* Render notifications */}
      <div className="pointer-events-none fixed inset-0 z-[200]">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              position: "absolute",
              top: `${16 + index * 140}px`,
              right: "16px",
            }}
            className="pointer-events-auto"
          >
            <AchievementToast
              achievement={notification.achievement}
              onClose={() => dismissAchievement(notification.id)}
              duration={defaultDuration}
            />
          </div>
        ))}
      </div>
    </AchievementNotificationContext.Provider>
  );
}

/**
 * Hook to access achievement notification functions
 *
 * Must be used within an AchievementNotificationProvider
 */
export function useAchievementNotification(): AchievementNotificationContextValue {
  const context = useContext(AchievementNotificationContext);

  if (!context) {
    throw new Error(
      "useAchievementNotification must be used within an AchievementNotificationProvider"
    );
  }

  return context;
}

export type { AchievementNotification, AchievementNotificationContextValue };
