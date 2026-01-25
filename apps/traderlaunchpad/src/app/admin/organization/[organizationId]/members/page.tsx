"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";

import { api } from "@convex-config/_generated/api";

interface MemberRow extends Record<string, unknown> {
  userId: string;
  role: string;
  isActive: boolean;
}

export default function AdminOrganizationMembersPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const members = useQuery(
    api.coreTenant.organizations.listMembersByOrganizationId,
    organizationId ? { organizationId } : "skip",
  ) as MemberRow[] | undefined;

  const rows = Array.isArray(members) ? members : [];

  const columns = React.useMemo<ColumnDefinition<MemberRow>[]>(() => {
    return [
      {
        id: "userId",
        header: "User",
        accessorKey: "userId",
        cell: (row: MemberRow) => (
          <div className="space-y-1">
            <div className="text-sm font-medium">{row.userId}</div>
            <div className="text-muted-foreground font-mono text-xs">
              {row.isActive ? "active" : "inactive"}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "role",
        header: "Role",
        accessorKey: "role",
        cell: (row: MemberRow) => <span className="text-sm">{row.role}</span>,
        sortable: true,
      },
    ];
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <EntityList<MemberRow>
          data={rows}
          columns={columns}
          isLoading={members === undefined}
          defaultViewMode="list"
          viewModes={["list"]}
          enableSearch={true}
          getRowId={(row) => `${row.userId}:${row.role}`}
          emptyState={
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="text-lg font-medium">No members</div>
              <div className="text-muted-foreground mt-1 text-sm">
                This organization has no members.
              </div>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}

