"use client";

import React from "react";
import Link from "next/link";
import { Copy, ExternalLink, Lock, PlugZap, ShieldCheck } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";

const MOCK_CONNECTIONS = [
  {
    id: "pc_mock_001",
    portalOrg: "LaunchThat (Demo Org)",
    portalEnv: "production",
    scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
    status: "connected" as const,
    createdAt: "Jan 16, 2026",
    lastSeen: "2m ago",
  },
  {
    id: "pc_mock_002",
    portalOrg: "Second Org (Sandbox)",
    portalEnv: "staging",
    scopes: ["trades:read"],
    status: "revoked" as const,
    createdAt: "Dec 29, 2025",
    lastSeen: "—",
  },
];

export default function AdminPortalIntegrationsPage() {
  // mock entitlement gate
  const entitlement = "free" as const; // "pro" | "mentor"
  const isPro = entitlement !== "free";

  const authorizeUrl =
    "/oauth/authorize?client_id=portal_mock&redirect_uri=/admin/integrations/portal/callback&scope=trades:read%20tradeideas:read%20discord:routing:write&state=mockstate";

  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(authorizeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect a Portal org to your TraderLaunchpad account (mock).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/integrations">Back</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/setup">Setup</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/test">Test</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/scopes">Scopes</Link>
          </Button>
          {isPro ? (
            <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href={authorizeUrl}>
                Authorize Portal <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href="/admin/billing">
                Upgrade to authorize <Lock className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!isPro ? (
        <Card className="overflow-hidden border-blue-500/30 bg-blue-600/5">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-blue-600" />
              Integrations are a Pro feature
            </CardTitle>
            <CardDescription>
              Upgrade to Pro to connect Portal, issue tokens, and configure Discord routing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="text-muted-foreground text-sm">
              You can still browse this UI, but auth and routing actions are disabled.
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
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlugZap className="h-4 w-4 text-blue-500" />
              Connections
            </CardTitle>
            <CardDescription>
              Each connection links a Portal org to your TraderLaunchpad account and grants scoped access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {MOCK_CONNECTIONS.map((c) => (
              <Link
                key={c.id}
                href={`/admin/integrations/portal/${encodeURIComponent(c.id)}`}
                className="bg-card hover:bg-card/80 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{c.portalOrg}</div>
                    <div className="text-muted-foreground text-xs">
                      Env: {c.portalEnv} • Created: {c.createdAt} • Last seen: {c.lastSeen}
                    </div>
                  </div>
                  {c.status === "connected" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">Revoked</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.scopes.map((s) => (
                    <Badge key={s} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                      {s}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              OAuth (mock)
            </CardTitle>
            <CardDescription>
              This is the UI scaffold; backend will later generate real URLs, codes, and tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="text-muted-foreground text-sm">
              Portal will redirect users to TraderLaunchpad for consent, then receive an auth code.
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">Authorize URL (mock)</div>
              <Input value={authorizeUrl} readOnly />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                {isPro ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={authorizeUrl}>Open</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/billing">Upgrade</Link>
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="font-semibold">Scopes</div>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                <li>Read trades + TradeIdeas</li>
                <li>Configure Discord routing (via Portal)</li>
                <li>Audit + revoke anytime</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="font-semibold">Setup helpers</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/integrations/portal/setup">Guided setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/integrations/portal/webhooks">
                    Webhooks vs OAuth
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/sharing">Sharing UX</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

