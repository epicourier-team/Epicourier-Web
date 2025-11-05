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
import { Calendar, ChefHat, Lightbulb, PieChart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const menuItems = [
  { title: "Recipes", url: "/dashboard/recipes", icon: ChefHat },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Recommendations", url: "/recommendations", icon: Lightbulb },
  { title: "Nutrient Summary", url: "/nutrient-summary", icon: PieChart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const supabase = createClient();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    const fetchUserName = async () => {
      // 1. 獲取 auth 使用者
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        // 2. 根據 email 查詢 public.User 表
        const { data: profile } = await supabase
          .from("User")
          .select("fullname, username") // 抓取 fullname 或 username
          .eq("email", user.email)
          .single();

        if (profile) {
          // 3. 設定 state
          setUserName(profile.fullname || profile.username || "Welcome!");
          setUserEmail(user.email);
        }
      }
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
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-muted-foreground text-xs">{userEmail}</span>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
