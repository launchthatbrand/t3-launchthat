"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileTextIcon, LayoutDashboardIcon, RefreshCcwIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function PlatformNewsLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/platform/news/logs")) return "logs";
    if (pathname.startsWith("/platform/news/sync")) return "sync";
    return "dashboard";
  }, [pathname]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">News</h1>
            <div className="text-muted-foreground text-sm">
              Economic calendar + headlines ingestion and alerting.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="dashboard" asChild>
              <Link href="/platform/news">
                <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </TabsTrigger>
            <TabsTrigger value="sync" asChild>
              <Link href="/platform/news/sync">
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Sync
              </Link>
            </TabsTrigger>
            <TabsTrigger value="logs" asChild>
              <Link href="/platform/news/logs">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Logs
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {props.children}
    </div>
  );
}

