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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import {
  Activity,
  Calendar,
  ChefHat,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  LogOut,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const menuItems = [
  { title: "Recipes", url: "/dashboard/recipes", icon: ChefHat },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Recommender", url: "/dashboard/recommender", icon: Lightbulb },
  { title: "Nutrients", url: "/dashboard/nutrients", icon: Activity },
  { title: "Achievements", url: "/dashboard/achievements", icon: Trophy },
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
    <Sidebar collapsible="icon" className="brutalism-border brutalism-shadow bg-white">
      <SidebarHeader className="border-b-2 border-black bg-amber-100 py-4">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarTrigger className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-active rounded-none bg-white p-2" />
            <div className="flex flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="brutalism-text-bold text-lg uppercase">EpiCourier</span>
              <span className="text-xs font-semibold">v1.0.0</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="brutalism-text-bold px-4 py-2 text-xs tracking-wider uppercase">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="brutalism-border brutalism-shadow-sm brutalism-hover brutalism-active data-[active=true]:brutalism-shadow rounded-none bg-white font-semibold hover:bg-amber-100 data-[active=true]:bg-emerald-400"
                  >
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
      <SidebarFooter className="border-t-2 border-black bg-amber-100 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="brutalism-border brutalism-shadow brutalism-hover brutalism-active rounded-none bg-white font-semibold data-[state=open]:bg-emerald-400"
                >
                  <div className="brutalism-border flex aspect-square size-8 items-center justify-center rounded-none bg-yellow-300">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold">User</span>
                    <span className="truncate text-xs font-medium">{userEmail || "Guest"}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="brutalism-border brutalism-shadow-md w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none bg-white"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="border-b-2 border-black p-0 font-normal">
                  <div className="flex items-center gap-2 bg-amber-100 px-2 py-2 text-left text-sm">
                    <div className="brutalism-border flex aspect-square size-8 items-center justify-center rounded-none bg-yellow-300">
                      <User className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold">User</span>
                      <span className="truncate text-xs font-medium">{userEmail || "Guest"}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  asChild
                  className="font-semibold hover:bg-sky-200 focus:bg-sky-200"
                >
                  <Link
                    href="https://slashpage.com/site-fn8swy4xu372s9jrqr2qdgr6l/dwy5rvmjgexyg2p46zn9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="size-4" />
                    <span>Help Center</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onLogout}
                  className="font-semibold hover:bg-red-200 focus:bg-red-200"
                >
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
