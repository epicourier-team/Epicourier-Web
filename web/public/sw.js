/**
 * Service Worker for Push Notifications
 *
 * Handles incoming push notifications and click events.
 * Registered at the root of the application.
 */

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  // Skip waiting to activate immediately
  event.waitUntil(self.skipWaiting());
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  if (!event.data) {
    console.log("[Service Worker] Push event has no data");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error("[Service Worker] Error parsing push data");
    return;
  }

  const { title, body, icon, badge, tag, data } = payload;

  const options = {
    body: body || "You have a new notification",
    icon: icon || "/icons/icon-192x192.png",
    badge: badge || "/icons/badge-96x96.png",
    tag: tag || "default",
    data: data || {},
    vibrate: [100, 50, 100],
    requireInteraction: false,
    renotify: true,
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title || "EpiCourier", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  // Handle dismiss action
  if (action === "dismiss") {
    return;
  }

  // Determine the URL to open
  let urlToOpen = "/dashboard";

  if (data?.url) {
    urlToOpen = data.url;
  } else if (data?.type === "achievement") {
    urlToOpen = "/dashboard/achievements";
  }

  // Open or focus the app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event (for analytics)
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event);
  // Could track dismissal analytics here
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
