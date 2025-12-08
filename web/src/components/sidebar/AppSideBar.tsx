"use client";

import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/animated-sidebar";
import { createClient } from "@/utils/supabase/client";
import { Calendar, ChefHat, Lightbulb, ShoppingBasket, UserCircle, TrendingUp, Boxes, Bot } from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <UserCircle className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Pantry",
    href: "/dashboard/pantry",
    icon: <Boxes className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Shopping List",
    href: "/dashboard/shopping-list",
    icon: <ShoppingBasket className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Recipes",
    href: "/dashboard/recipes",
    icon: <ChefHat className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Recommender",
    href: "/dashboard/recommender",
    icon: <Lightbulb className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: <Calendar className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "Insights",
    href: "/dashboard/insights",
    icon: <TrendingUp className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
  {
    label: "AI Agent",
    href: "/dashboard/agent",
    icon: <Bot className="text-neutral-300 h-5 w-5 flex-shrink-0" />
  },
];

export function AppSidebar() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) setUserEmail(user?.email);
    };

    fetchUserName();
  }, [supabase]);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="font-bold text-xl text-neutral-200 mb-8">
            {open ? "🌱 EpiCourier" : "🌱"}
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-2">
            {menuItems.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>

        {/* Footer with User Info */}
        <div className="border-t border-neutral-700 pt-4 space-y-3 mb-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900">
              <span className="text-sm font-medium text-emerald-200">
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </span>
            </div>
            {open && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-neutral-400 truncate">
                  {userEmail}
                </span>
              </div>
            )}
          </div>

          {/* Help Link */}
          <a
            href="https://slashpage.com/site-fn8swy4xu372s9jrqr2qdgr6l/dwy5rvmjgexyg2p46zn9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-neutral-800"
            aria-label="Help Center (opens in a new tab)"
            title="Help Center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 1 1 5.83 1c-.26.9-1.22 1.5-1.91 2" />
              <line x1="12" y1="17" x2="12" y2="17" />
            </svg>
            {open && <span className="text-neutral-200">Help</span>}
          </a>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
