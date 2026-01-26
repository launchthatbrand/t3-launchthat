"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { EntityList } from "@acme/ui/entity-list/EntityList";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

interface MembershipRow extends Record<string, unknown> {
  _id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  userRole: string;
}

export default function AdminSettingsOrganizationsPage() {
  const router = useRouter();
  const rows = useQuery(api.coreTenant.organizations.myOrganizations, {}) as
    | MembershipRow[]
    | undefined;

  const columns = React.useMemo<ColumnDefinition<MembershipRow>[]>(() => {
    return [
      {
        id: "name",
        header: "Organization",
        accessorKey: "name",
        cell: (row: MembershipRow) => (
          <div className="space-y-1">
            <div className="font-medium">{row.name}</div>
            <div className="text-muted-foreground font-mono text-xs">/{row.slug}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "role",
        header: "Role",
        accessorKey: "userRole",
        cell: (row: MembershipRow) => (
          <span className="text-muted-foreground text-sm">{row.userRole}</span>
        ),
        sortable: true,
      },
      {
        id: "domain",
        header: "Domain",
        accessorKey: "customDomain",
        cell: (row: MembershipRow) => (
          <span className="text-muted-foreground text-sm">{row.customDomain ?? "—"}</span>
        ),
        sortable: true,
      },
    ];
  }, []);

  const entityActions = React.useMemo<EntityAction<MembershipRow>[]>(() => {
    return [
      {
        id: "go",
        label: "Open",
        variant: "outline",
        onClick: (row: MembershipRow) => {
          router.push(`/admin/organization/${encodeURIComponent(row._id)}/public-profile`);
        },
      },
    ];
  }, [router]);

  return (
    <div className="relative animate-in fade-in space-y-8 text-foreground selection:bg-orange-500/30 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your organizations and what data they have access to.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityList<MembershipRow>
            data={Array.isArray(rows) ? rows : []}
            columns={columns}
            isLoading={rows === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={(row: MembershipRow) => {
              router.push(`/admin/organization/${encodeURIComponent(row._id)}/public-profile`);
            }}
            getRowId={(row: MembershipRow) => row._id}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <div className="text-lg font-medium">No organizations</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  You’re not currently a member of any organizations.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

