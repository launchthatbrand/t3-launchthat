"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import React from "react";
import { Search } from "lucide-react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

interface PlatformUserRow extends Record<string, unknown> {
  clerkId: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin?: boolean;
  organizationId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export default function PlatformUsersPage() {
  const router = useRouter();

  const users = useQuery(api.coreTenant.platformUsers.listUsers, {
    limit: 500,
  }) as PlatformUserRow[] | undefined;

  const rows = React.useMemo<PlatformUserRow[]>(() => {
    return Array.isArray(users) ? users : [];
  }, [users]);

  const columns = React.useMemo<ColumnDefinition<PlatformUserRow>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessorKey: "clerkId",
        cell: (u: PlatformUserRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{u.name ?? u.email ?? "—"}</div>
            <div className="text-muted-foreground text-xs">{u.email}</div>
            <div className="text-muted-foreground text-xs font-mono">{u.clerkId}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "admin",
        header: "Admin",
        accessorKey: "isAdmin",
        cell: (u: PlatformUserRow) => (
          <Badge variant={u.isAdmin ? "default" : "secondary"}>
            {u.isAdmin ? "admin" : "user"}
          </Badge>
        ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<PlatformUserRow>[]>(
    () => [
      {
        id: "view",
        label: "View",
        variant: "outline",
        onClick: (u: PlatformUserRow) => {
          router.push(`/platform/user/${encodeURIComponent(u.clerkId)}`);
        },
      },
    ],
    [router],
  );

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and roles.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base">Directory</CardTitle>
        </CardHeader>

        <CardContent className="p-3">
          <EntityList<PlatformUserRow>
            data={rows}
            columns={columns}
            isLoading={users === undefined}
            defaultViewMode="list"
            viewModes={["list", "grid"]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={(u) => router.push(`/platform/user/${encodeURIComponent(u.clerkId)}`)}
            getRowId={(u: PlatformUserRow) => u.clerkId}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <Search className="text-muted-foreground h-5 w-5" />
                <div className="mt-2 text-lg font-medium">No users</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  No users to display.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
