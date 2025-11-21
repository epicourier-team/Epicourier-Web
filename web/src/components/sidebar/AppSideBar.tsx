import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { Calendar, ChefHat, HelpCircle, Lightbulb, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

const menuItems = [
  { title: "Recipes", url: "/dashboard/recipes", icon: ChefHat },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Recommender", url: "/dashboard/recommender", icon: Lightbulb },
];

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="my-2 flex items-center gap-2 p-1">
            <SidebarTrigger />
            <div className="flex flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-semibold">EpiCourier</span>
              <span className="text-muted-foreground text-xs">v1.0.0</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    <Link href={item.url} className="flex w-full items-center gap-2">
                      <item.icon className="size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-muted text-muted-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <User className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">User</span>
                <span className="truncate text-xs">{userEmail || "Guest"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help Center">
              <Link
                href="https://slashpage.com/site-fn8swy4xu372s9jrqr2qdgr6l/dwy5rvmjgexyg2p46zn9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <HelpCircle className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Help Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Log Out">
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
