"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

type Level = "info" | "warn" | "error";
interface Event extends Record<string, unknown> {
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
}

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

const levelBadgeClass = (level: Level) => {
  if (level === "error") return "bg-red-500/10 text-red-500 hover:bg-red-500/10";
  if (level === "warn") return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
  return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
};

export default function PlatformIntegrationsAuditPage() {
  const router = useRouter();

  const columns = React.useMemo<ColumnDefinition<Event>[]>(
    () => [
      {
        id: "message",
        header: "Event",
        accessorKey: "message",
        cell: (e: Event) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{e.message}</div>
            <div className="text-muted-foreground text-xs">
              {e.ts} • <span className="font-mono">{e.type}</span>
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "connection",
        header: "Connection",
        accessorKey: "connectionId",
        cell: (e: Event) => (
          <Link
            className="font-mono text-xs hover:underline"
            href={`/platform/integrations/connection/${encodeURIComponent(e.connectionId)}`}
          >
            {e.connectionId}
          </Link>
        ),
        sortable: true,
      },
      {
        id: "user",
        header: "User",
        accessorKey: "userId",
        cell: (e: Event) => (
          <Link
            className="font-mono text-xs hover:underline"
            href={`/platform/user/${encodeURIComponent(e.userId)}/oauth`}
          >
            {e.userId}
          </Link>
        ),
        sortable: true,
      },
      {
        id: "level",
        header: "Level",
        accessorKey: "level",
        cell: (e: Event) => (
          <Badge className={levelBadgeClass(e.level)}>{e.level}</Badge>
        ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<Event>[]>(
    () => [
      {
        id: "openConnection",
        label: "Connection",
        variant: "outline",
        onClick: (e: Event) => {
          router.push(
            `/platform/integrations/connection/${encodeURIComponent(e.connectionId)}`,
          );
        },
      },
      {
        id: "openUser",
        label: "User",
        variant: "secondary",
        onClick: (e: Event) => {
          router.push(`/platform/user/${encodeURIComponent(e.userId)}/oauth`);
        },
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Audit log</h2>
          <p className="text-muted-foreground text-sm">
            Security and reliability events for OAuth + delivery pipelines (mock).
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>
            Every authorize, token exchange, pull, send, retry, and revoke should be recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList<Event>
            data={[...EVENTS]}
            columns={columns}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            getRowId={(e: Event) => e.id}
          />
        </CardContent>
      </Card>

      <div className="text-muted-foreground flex items-start gap-2 pt-2 text-xs">
        <Shield className="mt-0.5 h-4 w-4 text-purple-500" />
        <div>
          Backend later: append-only `oauthEvents` table, correlation IDs, and export to a log sink.
        </div>
      </div>
    </div>
  );
}

