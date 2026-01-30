"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function PlatformDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/platform/data/news")) return "news";
    return "price";
  }, [pathname]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Data</h1>
        <div className="text-muted-foreground text-sm">
          Platform data tools for pricing and news.
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="price" asChild>
            <Link href="/platform/data/price">Price</Link>
          </TabsTrigger>
          <TabsTrigger value="news" asChild>
            <Link href="/platform/data/news">News</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}