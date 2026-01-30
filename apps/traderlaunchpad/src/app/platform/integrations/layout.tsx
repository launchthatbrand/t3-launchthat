"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function PlatformIntegrationsLayout(props: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    if (pathname.startsWith("/platform/integrations/discord")) return "discord";
    if (pathname.startsWith("/platform/integrations/clients")) return "clients";
    if (pathname.startsWith("/platform/integrations/connections")) return "connections";
    if (pathname.startsWith("/platform/integrations/audit")) return "audit";
    return "overview";
  }, [pathname]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Platform</div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Admin-only (mock)
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            Client registry, connection moderation, and audit trails.
          </div>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" asChild>
            <Link href="/platform/integrations">Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="discord" asChild>
            <Link href="/platform/integrations/discord">Discord</Link>
          </TabsTrigger>
          <TabsTrigger value="clients" asChild>
            <Link href="/platform/integrations/clients">Clients</Link>
          </TabsTrigger>
          <TabsTrigger value="connections" asChild>
            <Link href="/platform/integrations/connections">Connections</Link>
          </TabsTrigger>
          <TabsTrigger value="audit" asChild>
            <Link href="/platform/integrations/audit">Audit</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {props.children}
    </div>
  );
}

