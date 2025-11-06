"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "../../components/sidebar/AppSideBar";
import { Button } from "../../components/ui/button";
import { SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <Link href="/">
              <span className="font-bold">EpiCourier</span>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto border-2 border-gray-600 bg-green-100 font-bold text-gray-600"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </header>
          <main className="flex-1 pl-12">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}