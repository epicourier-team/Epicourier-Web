import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Calendar, ChefHat, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const menuItems = [
  { title: "Recipes", url: "/dashboard/recipes", icon: ChefHat },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Recommender", url: "/dashboard/recommender", icon: Lightbulb },
  // { title: "Nutrient Summary", url: "/nutrient-summary", icon: PieChart },
];

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    const fetchUserName = async () => {
      // 1. 獲取 auth 使用者
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) setUserEmail(user?.email);
    };

    fetchUserName();
  }, [supabase]);

  return (
    <Sidebar collapsible="icon" className="bg-white">
      <SidebarHeader>
        <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger aria-label="Toggle sidebar" />
            {!collapsed && (
              <Link href="/">
                <span className="font-bold">EpiCourier</span>
              </Link>
            )}
          </div>
          {!collapsed && (
            <Button
              size="sm"
              variant="outline"
              className="border-2 border-gray-600 bg-green-100 font-bold text-gray-600"
              onClick={onLogout}
            >
              Log Out
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="border-t p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-primary text-sm font-medium">U</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">{userEmail}</span>
                </div>
              )}
            </div>

            <a
              href="https://slashpage.com/site-fn8swy4xu372s9jrqr2qdgr6l/dwy5rvmjgexyg2p46zn9"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted/50 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
              aria-label="Help Center (opens in a new tab)"
              title="Help Center"
            >
              {/* question-mark-in-circle icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              {!collapsed && <span>Help</span>}
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
