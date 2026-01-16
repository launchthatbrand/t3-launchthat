"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function PlatformUserLayout(props: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    if (pathname.includes("/oauth")) return "oauth";
    return "general";
  }, [pathname]);

  // Best-effort userId extraction for breadcrumb display (mock)
  const re = /\/platform\/user\/([^/]+)/;
  const match = re.exec(pathname);
  const userId = match?.[1] ? decodeURIComponent(match[1]) : "—";

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Platform user</div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">User</h1>
            <Badge variant="outline" className="font-mono">
              {userId}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
            >
              <Shield className="mr-1 h-3.5 w-3.5" />
              Platform (mock)
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            Manage profile and OAuth connections (mock UI).
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/platform/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general" asChild>
            <Link href={`/platform/user/${encodeURIComponent(userId)}/general`}>
              General
            </Link>
          </TabsTrigger>
          <TabsTrigger value="oauth" asChild>
            <Link href={`/platform/user/${encodeURIComponent(userId)}/oauth`}>
              OAuth
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {props.children}
    </div>
  );
}
