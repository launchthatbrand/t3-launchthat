"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3Icon, FileTextIcon, RefreshCcwIcon, ScaleIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { PlatformDataSelectors } from "./PlatformDataSelectors";

export default function PlatformDataLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/platform/data/logs")) return "logs";
    if (pathname.startsWith("/platform/data/sync")) return "sync";
    if (pathname.startsWith("/platform/data/compare")) return "compare";
    return "chart";
  }, [pathname]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Price data</h1>
            <div className="text-muted-foreground text-sm">
              Charting, coverage, and incremental backfills (ClickHouse).
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="chart" asChild>
              <Link href="/platform/data">
                <BarChart3Icon className="mr-2 h-4 w-4" />
                Chart
              </Link>
            </TabsTrigger>
            <TabsTrigger value="sync" asChild>
              <Link href="/platform/data/sync">
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Sync
              </Link>
            </TabsTrigger>
            <TabsTrigger value="compare" asChild>
              <Link href="/platform/data/compare">
                <ScaleIcon className="mr-2 h-4 w-4" />
                Compare
              </Link>
            </TabsTrigger>
            <TabsTrigger value="logs" asChild>
              <Link href="/platform/data/logs">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Logs
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <PlatformDataSelectors />
      </div>

      {props.children}
    </div>
  );
}

