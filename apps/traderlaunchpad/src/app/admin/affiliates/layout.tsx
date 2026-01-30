"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3Icon, LayoutDashboardIcon, Share2Icon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function AdminAffiliatesLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/admin/affiliates/analytics")) return "analytics";
    if (pathname.startsWith("/admin/affiliates/share")) return "share";
    return "overview";
  }, [pathname]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
            <div className="text-muted-foreground text-sm">
              Share your referral link, connect payouts, and track performance.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="overview" asChild>
              <Link href="/admin/affiliates">
                <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                Overview
              </Link>
            </TabsTrigger>
            <TabsTrigger value="share" asChild>
              <Link href="/admin/affiliates/share">
                <Share2Icon className="mr-2 h-4 w-4" />
                Share
              </Link>
            </TabsTrigger>
            <TabsTrigger value="analytics" asChild>
              <Link href="/admin/affiliates/analytics">
                <BarChart3Icon className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {props.children}
    </div>
  );
}

