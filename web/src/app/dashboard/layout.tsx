"use client";

import { AppSidebar } from "@/components/sidebar/AppSideBar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "./action";
import { LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/signin");
    } else if (result.error) {
      toast({
        title: "Logout failed",
        description: result.error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200/50 bg-white/80 px-6 backdrop-blur-xl transition-all">
            <SidebarTrigger aria-label="Toggle sidebar" className="text-gray-500 hover:text-gray-900" />
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-emerald-950">EpiCourier</span>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <span className="hidden sm:inline font-medium">Log Out</span>
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
