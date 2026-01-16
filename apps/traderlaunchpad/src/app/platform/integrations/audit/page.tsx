"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Filter, Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { cn } from "@acme/ui";

type Level = "info" | "warn" | "error";
type Event = {
  id: string;
  ts: string;
  level: Level;
  type:
    | "oauth.authorize"
    | "oauth.deny"
    | "oauth.token"
    | "oauth.revoke"
    | "portal.pull"
    | "discord.send";
  clientId: string;
  connectionId: string;
  userId: string;
  message: string;
};

const EVENTS: Event[] = [
  {
    id: "e1",
    ts: "2m ago",
    level: "info",
    type: "portal.pull",
    clientId: "portal_mock",
    connectionId: "pc_mock_001",
    userId: "u_002",
    message: "Portal pulled 3 TradeIdea events",
  },
  {
    id: "e2",
    ts: "2m ago",
    level: "warn",
    type: "discord.send",
    clientId: "portal_mock",
    connectionId: "pc_mock_001",
    userId: "u_002",
    message: "Discord rate limited, retry scheduled",
  },
  {
    id: "e3",
    ts: "1h ago",
    level: "info",
    type: "oauth.token",
    clientId: "portal_mock",
    connectionId: "pc_mock_002",
    userId: "u_003",
    message: "Refresh token exchanged successfully",
  },
  {
    id: "e4",
    ts: "Yesterday",
    level: "error",
    type: "oauth.revoke",
    clientId: "portal_mock",
    connectionId: "pc_mock_003",
    userId: "u_004",
    message: "Connection revoked due to suspicious activity",
  },
];

const levelIcon = (level: Level) => {
  if (level === "error") return AlertCircle;
  if (level === "warn") return Clock;
  return CheckCircle2;
};

const levelClass = (level: Level) => {
  if (level === "error") return "text-red-500";
  if (level === "warn") return "text-amber-500";
  return "text-emerald-500";
};

export default function PlatformIntegrationsAuditPage() {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return EVENTS;
    return EVENTS.filter((e) =>
      [e.id, e.type, e.clientId, e.connectionId, e.userId, e.message]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Audit log</h2>
          <p className="text-muted-foreground text-sm">
            Security and reliability events for OAuth + delivery pipelines (mock).
          </p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
          />
          <Button variant="outline" className="gap-2" disabled>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>
            Every authorize, token exchange, pull, send, retry, and revoke should be recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {filtered.map((e) => {
            const Icon = levelIcon(e.level);
            return (
              <div
                key={e.id}
                className="bg-card flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", levelClass(e.level))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{e.message}</div>
                    <div className="text-muted-foreground text-xs">
                      {e.ts} • <span className="font-mono">{e.type}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      client=<span className="font-mono">{e.clientId}</span> • connection=
                      <Link
                        className="font-mono hover:underline"
                        href={`/platform/integrations/connection/${encodeURIComponent(e.connectionId)}`}
                      >
                        {e.connectionId}
                      </Link>{" "}
                      • user=
                      <Link
                        className="font-mono hover:underline"
                        href={`/platform/user/${encodeURIComponent(e.userId)}/oauth`}
                      >
                        {e.userId}
                      </Link>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{e.level}</Badge>
              </div>
            );
          })}

          <div className="text-muted-foreground flex items-start gap-2 pt-2 text-xs">
            <Shield className="mt-0.5 h-4 w-4 text-purple-500" />
            <div>
              Backend later: append-only `oauthEvents` table, correlation IDs, and export to a log sink.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

