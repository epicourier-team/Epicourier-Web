"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppSidebar } from "../../components/sidebar/AppSideBar";
import { Button } from "../../components/ui/button";
import { SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({scope: 'local'});
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message || "Could not sign out. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({ title: "Signed out", description: "You have been signed out." });
      // redirect to home (public route)
      router.push("/");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4">
            <SidebarTrigger />
            <Link href="/">
              <span className="font-bold">EpiCourier</span>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto border-2 border-gray-600 bg-green-100 font-bold text-gray-600"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? "Signing out..." : "Log Out"}
            </Button>
          </header>
          <main className="flex-1 pl-12">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
