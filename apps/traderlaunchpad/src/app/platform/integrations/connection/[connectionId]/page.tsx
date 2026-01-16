"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ExternalLink,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

export default function PlatformIntegrationConnectionDetailPage() {
  const params = useParams<{ connectionId?: string | string[] }>();
  const raw = params.connectionId;
  const connectionId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  // Mock record
  const record = {
    id: connectionId || "pc_mock_001",
    clientName: "Portal",
    clientId: "portal_mock",
    env: "production",
    status: "active" as const,
    userId: "u_002",
    portalOrg: "LaunchThat (Demo Org)",
    scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
    createdAt: "Jan 16, 2026",
    lastUsedAt: "2m ago",
    tokenHealth: "ok" as const,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">
            Platform connection
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Connection</h2>
            <Badge variant="outline" className="font-mono">
              {record.id}
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
              Active (mock)
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            Client: <span className="font-semibold">{record.clientName}</span> •
            User: <span className="font-mono">{record.userId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/platform/integrations/connections">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/platform/user/${encodeURIComponent(record.userId)}/oauth`}
            >
              <UserRound className="mr-2 h-4 w-4" />
              User OAuth
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription>
              Everything you need to debug and moderate a single OAuth
              connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Portal org</div>
                <div className="mt-1 text-sm font-semibold">
                  {record.portalOrg}
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Created</div>
                <div className="mt-1 text-sm font-semibold">
                  {record.createdAt}
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Last used</div>
                <div className="mt-1 text-sm font-semibold">
                  {record.lastUsedAt}
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">Token health</div>
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  OK
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                Env: {record.env} • backend later: rotate tokens, refresh
                failures, and expiry windows.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-semibold">Scopes</div>
              <div className="flex flex-wrap gap-2">
                {record.scopes.map((s) => (
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
                Backend later: enforce per-scope permissions and log scope
                changes.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/platform/integrations/audit">
                  View audit events <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/integrations/portal">
                  Open user-facing integration UI{" "}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Moderation actions</CardTitle>
            <CardDescription>
              Incident response + user support (mock).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
            >
              <Ban className="h-4 w-4" />
              Disable connection
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Revoke + invalidate tokens
            </Button>
            <div className="text-muted-foreground pt-2 text-xs">
              Backend later: require a reason, create an audit event, and
              optionally notify the user.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <Shield className="mt-0.5 h-4 w-4 text-purple-500" />
        <div>
          Data model later: `oauthClients`, `oauthConnections`, `oauthEvents`,
          `tokenRevocations`.
        </div>
      </div>
    </div>
  );
}
