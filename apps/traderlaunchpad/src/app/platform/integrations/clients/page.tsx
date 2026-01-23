"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Globe, Plus, Shield } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

interface ClientRow extends Record<string, unknown> {
  id: string;
  name: string;
  status: "active" | "disabled";
  type: "first_party" | "third_party";
  redirectAllowlist: string[];
  scopes: string[];
  createdAt: string;
}

const CLIENTS: ClientRow[] = [
  {
    id: "portal_mock",
    name: "Portal",
    status: "active",
    type: "first_party",
    redirectAllowlist: [
      "https://portal.launchthat.app/oauth/callback",
      "https://app.traderlaunchpad.com/admin/integrations/portal/callback",
    ],
    scopes: ["trades:read", "tradeideas:read", "discord:routing:write"],
    createdAt: "Jan 16, 2026",
  },
];

export default function PlatformIntegrationsClientsPage() {
  const router = useRouter();

  const columns = React.useMemo<ColumnDefinition<ClientRow>[]>(
    () => [
      {
        id: "client",
        header: "Client",
        accessorKey: "id",
        cell: (c: ClientRow) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              {c.name}
            </div>
            <div className="text-muted-foreground font-mono text-xs">{c.id}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (c: ClientRow) => (
          <Badge
            className={
              c.status === "active"
                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }
          >
            {c.status}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        cell: (c: ClientRow) => (
          <span className="text-sm">{c.type === "first_party" ? "First-party" : "Third-party"}</span>
        ),
        sortable: true,
      },
      {
        id: "redirects",
        header: "Redirects",
        accessorKey: "redirectAllowlist",
        cell: (c: ClientRow) => (
          <div className="text-sm">
            <span className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              {c.redirectAllowlist.length}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        id: "scopes",
        header: "Scopes",
        accessorKey: "scopes",
        cell: (c: ClientRow) => (
          <div className="text-sm">
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              {c.scopes.length}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        cell: (c: ClientRow) => <span className="text-sm">{c.createdAt}</span>,
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<ClientRow>[]>(
    () => [
      {
        id: "connections",
        label: "Connections",
        variant: "outline",
        onClick: () => {
          router.push("/platform/integrations/connections");
        },
      },
    ],
    [router],
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
          <CardTitle className="text-base">Registry</CardTitle>
          <CardDescription>Find clients by name or client_id (mock).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList<ClientRow>
            data={[...CLIENTS]}
            columns={columns}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            getRowId={(c: ClientRow) => c.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
