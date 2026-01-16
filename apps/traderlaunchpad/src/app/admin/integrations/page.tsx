"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Lock, PlugZap, Shield, Webhook } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

const INTEGRATIONS = [
  {
    key: "portal",
    title: "Portal",
    description:
      "Connect a Portal org to your TraderLaunchpad account (OAuth). Portal can pull trade events and route them to Discord.",
    status: "not_connected" as const,
    href: "/admin/integrations/portal",
    icon: PlugZap,
  },
  {
    key: "webhooks",
    title: "Webhooks",
    description:
      "Send events to your own endpoints. Good for custom analytics pipelines.",
    status: "coming_soon" as const,
    href: "#",
    icon: Webhook,
  },
  {
    key: "api",
    title: "API Keys",
    description:
      "Generate scoped keys for automation. Rotate/revoke anytime.",
    status: "coming_soon" as const,
    href: "#",
    icon: Shield,
  },
];

export default function AdminIntegrationsHubPage() {
  // mock entitlement gate
  const entitlement = "free" as const; // "pro" | "mentor"
  const isPro = entitlement !== "free";

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect TraderLaunchpad to other platforms (mock UI).
          </p>
        </div>
      </div>

      {!isPro ? (
        <Card className="overflow-hidden border-blue-500/30 bg-blue-600/5">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-blue-600" />
              Pro required for integrations
            </CardTitle>
            <CardDescription>
              Authorizing Portal OAuth and managing Discord routing are Pro features in the paid MVP.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="text-muted-foreground text-sm">
              Upgrade to enable integrations. (Mock gate for now.)
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
                <Link href="/admin/billing">Upgrade</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/billing">View plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {INTEGRATIONS.map((it) => (
          <Card key={it.key} className="group overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <it.icon className="h-4 w-4 text-blue-500" />
                    {it.title}
                  </CardTitle>
                  <CardDescription>{it.description}</CardDescription>
                </div>
                {it.status === "coming_soon" ? (
                  <Badge variant="outline">Coming soon</Badge>
                ) : it.status === "not_connected" ? (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
                  >
                    Not connected
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="text-muted-foreground text-sm">
                Typical flow: authorize → connection created → Portal pulls events → Portal routes to Discord.
              </div>
              <div className="flex flex-wrap gap-2">
                {it.status === "coming_soon" ? (
                  <Button variant="outline" size="sm" disabled>
                    Open
                  </Button>
                ) : (
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    size="sm"
                    asChild
                    disabled={!isPro && it.key === "portal"}
                  >
                    <Link href={it.href}>
                      {!isPro && it.key === "portal" ? (
                        <>
                          Locked <Lock className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Open <ArrowUpRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/platform">Platform dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

