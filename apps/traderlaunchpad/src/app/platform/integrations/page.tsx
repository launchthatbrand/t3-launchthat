"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  PlugZap,
  Shield,
  Users,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

export default function PlatformIntegrationsOverviewPage() {
  const kpis = [
    { label: "Active clients", value: "1", icon: PlugZap, hint: "Portal" },
    { label: "Active connections", value: "24", icon: Users, hint: "+3 today" },
    { label: "Errors (24h)", value: "2", icon: AlertTriangle, hint: "Discord retries" },
    { label: "Audit events (24h)", value: "418", icon: Activity, hint: "token refresh + pulls" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>{k.label}</span>
                <k.icon className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold">{k.value}</div>
              <div className="text-muted-foreground mt-1 text-xs">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              Health (mock)
            </CardTitle>
            <CardDescription>
              Quick view of integration stability and where you’ll need ops tooling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">Portal → Trade events</div>
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                  Healthy
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1">
                99.4% success • p95 latency 180ms • last pull 1m ago
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">Discord delivery</div>
                <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
                  Degraded
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1">
                2 retries in last 24h • rate limiting detected • recommend backoff + queue
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/platform/integrations/connections">
                  Review connections <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/platform/integrations/audit">
                  View audit log <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-purple-500" />
              Moderation (mock)
            </CardTitle>
            <CardDescription>
              Platform-level actions: disable a user’s OAuth, revoke tokens, investigate abuse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="font-semibold">Common actions</div>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                <li>Disable OAuth for a user</li>
                <li>Revoke a single connection</li>
                <li>Block a client (incident response)</li>
              </ul>
            </div>
            <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href="/platform/users">
                Open Users <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

