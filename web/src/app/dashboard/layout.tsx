"use client";

import { AppSidebar } from "@/components/sidebar/AppSideBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { logout } from "./action";

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
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <AppSidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <SidebarTrigger className="mb-2 md:hidden" />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
