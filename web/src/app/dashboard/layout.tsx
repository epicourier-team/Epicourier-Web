"use client";

import { AppSidebar } from "@/components/sidebar/AppSideBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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
    <div className="flex min-h-screen w-full bg-neutral-900">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-neutral-800 bg-neutral-900 px-6 shadow-sm">
          <Link href="/">
            <span className="font-bold text-neutral-200">🌱 EpiCourier</span>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-neutral-700 bg-neutral-800 font-medium text-neutral-300 hover:bg-neutral-700"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
