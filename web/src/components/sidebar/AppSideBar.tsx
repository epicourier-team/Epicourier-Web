import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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

export function AppSidebar() {
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
    <Sidebar collapsible="icon" className="border-r bg-white">
      <div className="h-14" />
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
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
