"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Globe, Plus, Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";

const CLIENTS = [
  {
    id: "portal_mock",
    name: "Portal",
    status: "active" as const,
    type: "first_party" as const,
    redirectAllowlist: [
      "https://portal.launchthat.app/oauth/callback",
      "https://app.traderlaunchpad.com/admin/integrations/portal/callback",
    ],
    scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
    createdAt: "Jan 16, 2026",
  },
] as const;

export default function PlatformIntegrationsClientsPage() {
  const [q, setQ] = React.useState("");
  const filtered = CLIENTS.filter((c) =>
    (c.name + c.id).toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Client registry
          </h2>
          <p className="text-muted-foreground text-sm">
            Define OAuth clients, redirect allowlists, and default scopes
            (mock).
          </p>
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          New client (soon)
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>Find clients by name or client_id.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Input
            placeholder="Search clients…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filtered.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    {c.name}
                  </CardTitle>
                  <div className="text-muted-foreground font-mono text-xs">
                    {c.id}
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="bg-muted/20 rounded-lg border p-4">
                  <div className="text-muted-foreground text-xs">Type</div>
                  <div className="mt-1 text-sm font-semibold">First-party</div>
                </div>
                <div className="bg-muted/20 rounded-lg border p-4">
                  <div className="text-muted-foreground text-xs">Created</div>
                  <div className="mt-1 text-sm font-semibold">
                    {c.createdAt}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Redirect allowlist
                </div>
                <div className="space-y-2">
                  {c.redirectAllowlist.map((u) => (
                    <div
                      key={u}
                      className="bg-card rounded-lg border px-3 py-2 font-mono text-xs"
                    >
                      {u}
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground text-xs">
                  Backend later: enforce exact match (scheme + host + path).
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Default scopes
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.scopes.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-muted text-muted-foreground hover:bg-muted"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/platform/integrations/connections">
                    View connections <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" disabled>
                  Rotate client secret (soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Client settings (mock)</CardTitle>
          <CardDescription>
            This section is intentionally read-only for now—only to visualize
            the backend work.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input value="portal_mock" readOnly className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value="active" readOnly />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
