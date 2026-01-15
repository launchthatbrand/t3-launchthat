"use client";

import React from "react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();

  // Protect the route client-side (redundant with middleware but safe)
  React.useEffect(() => {
    if (isLoaded && !userId) {
      redirect("/sign-in");
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) return null;

  // Determine active tab based on path
  const activeTab = pathname.split("/").pop() || "dashboard";

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs text-white">
                TL
              </div>
              <span>TraderLaunchpad</span>
            </Link>
            <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
              <Tabs value={activeTab} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dashboard" asChild>
                    <Link href="/admin/dashboard">Dashboard</Link>
                  </TabsTrigger>
                  <TabsTrigger value="orders" asChild>
                    <Link href="/admin/orders">Orders</Link>
                  </TabsTrigger>
                  <TabsTrigger value="settings" asChild>
                    <Link href="/admin/settings">Settings</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
