"use client";

import React from "react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function PlatformLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();

  React.useEffect(() => {
    if (isLoaded && !userId) redirect("/sign-in");
  }, [isLoaded, userId]);

  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/platform/integrations")) return "integrations";
    if (pathname.startsWith("/platform/users")) return "users";
    if (pathname.startsWith("/platform/settings")) return "settings";
    return "dashboard";
  }, [pathname]);

  if (!isLoaded || !userId) return null;

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs text-white">
                TL
              </div>
              <span>TraderLaunchpad</span>
            </Link>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
              >
                <Shield className="mr-1 h-3.5 w-3.5" />
                Platform (mock)
              </Badge>
            </div>

            <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
              <Tabs value={activeTab} className="w-[560px]">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dashboard" asChild>
                    <Link href="/platform">Dashboard</Link>
                  </TabsTrigger>
                  <TabsTrigger value="integrations" asChild>
                    <Link href="/platform/integrations">Integrations</Link>
                  </TabsTrigger>
                  <TabsTrigger value="users" asChild>
                    <Link href="/platform/users">Users</Link>
                  </TabsTrigger>
                  <TabsTrigger value="settings" asChild>
                    <Link href="/platform/settings">Settings</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </nav>
          </div>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="container py-6">{props.children}</main>
    </div>
  );
}

