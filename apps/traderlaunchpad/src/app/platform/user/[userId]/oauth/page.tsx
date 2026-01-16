"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  PlugZap,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

type OAuthConnection = {
  id: string;
  client: "portal" | "other";
  orgName: string;
  environment: "production" | "staging";
  status: "active" | "revoked" | "disabled";
  scopes: string[];
  createdAt: string;
  lastUsedAt: string;
};

const CONNECTIONS: OAuthConnection[] = [
  {
    id: "oc_mock_001",
    client: "portal",
    orgName: "LaunchThat (Demo Org)",
    environment: "production",
    status: "active",
    scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
    createdAt: "Jan 16, 2026",
    lastUsedAt: "2m ago",
  },
  {
    id: "oc_mock_002",
    client: "portal",
    orgName: "Second Org (Sandbox)",
    environment: "staging",
    status: "disabled",
    scopes: ["trades:read"],
    createdAt: "Dec 29, 2025",
    lastUsedAt: "3w ago",
  },
];

const statusBadge = (status: OAuthConnection["status"]) => {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
  }
  if (status === "disabled") {
    return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
  }
  return "bg-muted text-muted-foreground hover:bg-muted";
};

export default function PlatformUserOAuthPage() {
  const params = useParams<{ userId?: string | string[] }>();
  const raw = params?.userId;
  const userId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  const [disableAll, setDisableAll] = React.useState(false);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <PlugZap className="h-4 w-4 text-blue-500" />
              OAuth connections (mock)
            </span>
            <Badge variant="outline" className="font-mono">
              {userId || "—"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage third-party connections (revoke, disable, rotate).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Disable all OAuth for user</div>
              <div className="text-muted-foreground text-sm">
                Immediately blocks all integration access for this user.
              </div>
            </div>
            <Switch checked={disableAll} onCheckedChange={setDisableAll} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {CONNECTIONS.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {c.client === "portal" ? "Portal" : "Client"}
                      </CardTitle>
                      <div className="text-muted-foreground text-sm">
                        {c.orgName} • {c.environment}
                      </div>
                      <div className="text-muted-foreground text-xs font-mono">
                        {c.id}
                      </div>
                    </div>
                    <Badge className={statusBadge(c.status)}>{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="text-muted-foreground text-xs">Created</div>
                      <div className="mt-1 text-sm font-semibold">{c.createdAt}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="text-muted-foreground text-xs">Last used</div>
                      <div className="mt-1 text-sm font-semibold">{c.lastUsedAt}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link href="/admin/integrations/portal">
                        <ExternalLink className="h-4 w-4" />
                        View integration UI
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" disabled>
                      <KeyRound className="h-4 w-4" />
                      Rotate tokens (soon)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                    >
                      <Ban className="h-4 w-4" />
                      Disable connection (mock)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke (mock)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                What revocation does (later)
              </div>
              <div className="text-muted-foreground text-sm">
                Immediately invalidates refresh/access tokens and blocks future API calls.
              </div>
            </div>
            <Button variant="outline" className="gap-2" disabled>
              <RefreshCw className="h-4 w-4" />
              Test connection (soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

