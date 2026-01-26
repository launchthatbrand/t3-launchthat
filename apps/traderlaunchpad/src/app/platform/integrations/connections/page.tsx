"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import React from "react";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

type ConnStatus = "active" | "disabled" | "revoked";
interface ConnectionRow extends Record<string, unknown> {
  id: string;
  clientId: string;
  clientName: string;
  userId: string;
  portalOrg: string;
  env: "production" | "staging";
  status: ConnStatus;
  lastUsedAt: string;
  createdAt: string;
}

const CONNECTIONS: ConnectionRow[] = [
  {
    id: "pc_mock_001",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_002",
    portalOrg: "LaunchThat (Demo Org)",
    env: "production",
    status: "active",
    lastUsedAt: "2m ago",
    createdAt: "Jan 16, 2026",
  },
  {
    id: "pc_mock_002",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_003",
    portalOrg: "Second Org (Sandbox)",
    env: "staging",
    status: "disabled",
    lastUsedAt: "3w ago",
    createdAt: "Dec 29, 2025",
  },
  {
    id: "pc_mock_003",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_004",
    portalOrg: "Acme Org",
    env: "production",
    status: "revoked",
    lastUsedAt: "—",
    createdAt: "Nov 2, 2025",
  },
];

const statusBadgeClass = (s: ConnStatus) => {
  if (s === "active")
    return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
  if (s === "disabled")
    return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
  return "bg-muted text-muted-foreground hover:bg-muted";
};

export default function PlatformIntegrationsConnectionsPage() {
  const router = useRouter();

  const columns = React.useMemo<ColumnDefinition<ConnectionRow>[]>(
    () => [
      {
        id: "connection",
        header: "Connection",
        accessorKey: "id",
        cell: (c: ConnectionRow) => (
          <div className="space-y-1">
            <div className="font-mono text-sm">{c.id}</div>
            <div className="text-muted-foreground text-xs">
              Created {c.createdAt} • Last used {c.lastUsedAt}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "client",
        header: "Client",
        accessorKey: "clientName",
        cell: (c: ConnectionRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{c.clientName}</div>
            <div className="text-muted-foreground font-mono text-xs">{c.clientId}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "user",
        header: "User",
        accessorKey: "userId",
        cell: (c: ConnectionRow) => (
          <div className="space-y-1">
            <div className="font-mono text-sm">{c.userId}</div>
            <div className="text-muted-foreground text-xs">{c.env}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "portalOrg",
        header: "Portal org",
        accessorKey: "portalOrg",
        cell: (c: ConnectionRow) => <span className="text-sm">{c.portalOrg}</span>,
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (c: ConnectionRow) => (
          <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>
        ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<ConnectionRow>[]>(
    () => [
      {
        id: "open",
        label: "Open",
        variant: "outline",
        onClick: (c: ConnectionRow) => {
          router.push(`/platform/integrations/connection/${encodeURIComponent(c.id)}`);
        },
      },
      {
        id: "viewUser",
        label: "User",
        variant: "secondary",
        onClick: (c: ConnectionRow) => {
          router.push(`/platform/user/${encodeURIComponent(c.userId)}/oauth`);
        },
      },
      {
        id: "disable",
        label: "Disable",
        variant: "outline",
        onClick: (c: ConnectionRow) => {
          console.info("[mock] disable connection", c.id);
        },
      },
      {
        id: "revoke",
        label: "Revoke",
        variant: "destructive",
        onClick: (c: ConnectionRow) => {
          console.info("[mock] revoke connection", c.id);
        },
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
          <p className="text-muted-foreground text-sm">
            Global list of OAuth connections across users and Portal orgs
            (mock).
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">All connections</CardTitle>
          <CardDescription>
            Use this table to disable or revoke access when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <EntityList<ConnectionRow>
            data={[...CONNECTIONS]}
            columns={columns}
            defaultViewMode="list"
            viewModes={[]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={(c) =>
              router.push(`/platform/integrations/connection/${encodeURIComponent(c.id)}`)
            }
            getRowId={(c: ConnectionRow) => c.id}
          />
        </CardContent>
      </Card>

      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <Shield className="mt-0.5 h-4 w-4 text-purple-500" />
        <div>
          Backend later: `connections` table (status, scopes, token hashes),
          revocation flow, and audit trails for every moderation action.
        </div>
      </div>
    </div>
  );
}
