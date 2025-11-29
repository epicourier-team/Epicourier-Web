"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, Palette, User, ChevronRight } from "lucide-react";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Settings Page
 *
 * User settings and preferences including:
 * - Push notification settings
 * - Account settings (future)
 * - Appearance settings (future)
 * - Privacy settings (future)
 */
export default function SettingsPage() {
  const { isSupported, isSubscribed } = usePushNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Notifications Section */}
        <section className="border rounded-xl overflow-hidden bg-card">
          <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Notifications</h2>
          </div>

          <div className="p-4 space-y-4">
            {mounted && isSupported ? (
              <>
                <NotificationPrompt compact className="py-2" />

                {/* Additional notification preferences */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Notification Types
                  </h3>
                  <div className="space-y-3">
                    <NotificationToggle
                      label="Achievement Unlocks"
                      description="Get notified when you earn new achievements"
                      enabled={isSubscribed}
                      disabled={!isSubscribed}
                    />
                    <NotificationToggle
                      label="Streak Reminders"
                      description="Remind me to log meals to maintain my streak"
                      enabled={false}
                      disabled={true}
                      comingSoon
                    />
                    <NotificationToggle
                      label="Challenge Updates"
                      description="Updates on challenge progress and completions"
                      enabled={false}
                      disabled={true}
                      comingSoon
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser.
              </p>
            )}
          </div>
        </section>

        {/* Account Section (Coming Soon) */}
        <section className="border rounded-xl overflow-hidden bg-card opacity-60">
          <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Account</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Coming Soon
            </span>
          </div>

          <div className="p-4">
            <SettingRow
              label="Profile Settings"
              description="Update your name, email, and profile picture"
              disabled
            />
            <SettingRow
              label="Password & Security"
              description="Change password and security settings"
              disabled
            />
          </div>
        </section>

        {/* Appearance Section (Coming Soon) */}
        <section className="border rounded-xl overflow-hidden bg-card opacity-60">
          <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Appearance</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Coming Soon
            </span>
          </div>

          <div className="p-4">
            <SettingRow
              label="Theme"
              description="Choose light, dark, or system theme"
              disabled
            />
          </div>
        </section>

        {/* Privacy Section (Coming Soon) */}
        <section className="border rounded-xl overflow-hidden bg-card opacity-60">
          <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Privacy</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Coming Soon
            </span>
          </div>

          <div className="p-4">
            <SettingRow
              label="Data & Privacy"
              description="Manage your data and privacy preferences"
              disabled
            />
            <SettingRow
              label="Export Data"
              description="Download a copy of your data"
              disabled
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Notification Toggle Component
 */
function NotificationToggle({
  label,
  description,
  enabled,
  disabled = false,
  comingSoon = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {comingSoon && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Setting Row Component
 */
function SettingRow({
  label,
  description,
  disabled = false,
}: {
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-4 py-3 text-left ${
        disabled ? "cursor-not-allowed" : "hover:bg-muted/50"
      } -mx-2 px-2 rounded-lg transition-colors`}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
