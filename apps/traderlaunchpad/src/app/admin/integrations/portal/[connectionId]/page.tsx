"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

const MOCK = {
  portalOrg: "LaunchThat (Demo Org)",
  portalEnv: "production",
  createdAt: "Jan 16, 2026",
  lastUsedAt: "2m ago",
  scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
  tokenHealth: "ok" as const,
  routingMode: "portal_controls" as const,
};

export default function PortalConnectionDetailPage() {
  const params = useParams<{ connectionId?: string | string[] }>();
  const raw = params?.connectionId;
  const connectionId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Portal connection</div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{MOCK.portalOrg}</h1>
            <Badge variant="outline">{MOCK.portalEnv}</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
              Connected (mock)
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            Connection ID: <span className="font-mono">{connectionId || "—"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal">Back</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/integrations/portal/${encodeURIComponent(connectionId)}/logs`}>
              View logs
            </Link>
          </Button>
          <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
            <Link href={`/admin/integrations/portal/${encodeURIComponent(connectionId)}/routing`}>
              Configure routing <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>
              What Portal can do with this connection (scopes + health).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Created</div>
                <div className="mt-1 text-lg font-semibold">{MOCK.createdAt}</div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Last used</div>
                <div className="mt-1 text-lg font-semibold">{MOCK.lastUsedAt}</div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Token health</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  OK
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Scopes</div>
              <div className="flex flex-wrap gap-2">
                {MOCK.scopes.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="bg-muted text-muted-foreground hover:bg-muted"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="text-muted-foreground text-xs">
                In production, scopes enforce least-privilege access for integrations.
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  Routing control
                </div>
                <div className="text-muted-foreground mt-2 text-sm">
                  Mode:{" "}
                  <span className="font-semibold">
                    {MOCK.routingMode === "portal_controls"
                      ? "Portal controls Discord routing"
                      : "TraderLaunchpad controls routing"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Trust signals
                </div>
                <div className="text-muted-foreground mt-2 text-sm">
                  Audit logs, revocation, and re-authorization are always available.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Manage connection lifecycle (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/oauth/authorize?client_id=portal_mock&redirect_uri=/admin/integrations/portal/callback&scope=trades:read%20tradeideas:read%20discord:routing:write&state=mockstate">
                <ExternalLink className="h-4 w-4" />
                Re-authorize
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" disabled>
              <Shield className="h-4 w-4" />
              Rotate token (soon)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Disconnect
            </Button>
            <div className="text-muted-foreground pt-2 text-xs">
              Backend later: revocation, reauth flows, token rotation, scoped enforcement.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

