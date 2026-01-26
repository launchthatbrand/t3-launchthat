"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useHostContext } from "~/context/HostContext";
import { useRouter } from "next/navigation";

export default function PlatformOrganizationsPage() {
  const { isAuthHost } = useHostContext();

  // This page is "platform admin" tooling and must not rely on Clerk on tenant hosts.
  // We render the same component on both; Convex auth works on both (Clerk on auth host,
  // tenant-session on tenant hosts).
  return isAuthHost ? <PlatformOrganizationsPageInner /> : <PlatformOrganizationsPageInner />;
}

type OrgRow = {
  _id: string;
  _creationTime: number;
  name: string;
  slug: string;
  ownerId: string;
  clerkOrganizationId?: string;
  createdAt?: number;
  updatedAt?: number;
};

function PlatformOrganizationsPageInner() {
  const router = useRouter();

  const [search, setSearch] = React.useState("");

  const rows = useQuery(api.coreTenant.organizations.listAllOrganizations, {
    search: search.trim() ? search.trim() : undefined,
    limit: 500,
  }) as OrgRow[] | undefined;

  const createOrg = useMutation(api.coreTenant.organizations.createOrganizationAsViewer);
  const [isCreating, setIsCreating] = React.useState(false);

  const columns = React.useMemo<ColumnDefinition<OrgRow>[]>(() => {
    return [
      {
        id: "name",
        header: "Organization",
        accessorKey: "name",
        cell: (row: OrgRow) => (
          <div className="space-y-1">
            <div className="font-medium">{row.name}</div>
            <div className="text-muted-foreground font-mono text-xs">/{row.slug}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "owner",
        header: "Owner",
        accessorKey: "ownerId",
        cell: (row: OrgRow) => (
          <span className="text-muted-foreground font-mono text-xs">{row.ownerId}</span>
        ),
        sortable: true,
      },
    ];
  }, []);

  const entityActions = React.useMemo<EntityAction<OrgRow>[]>(() => {
    return [
      {
        id: "open",
        label: "Open",
        variant: "outline",
        onClick: (row: OrgRow) => {
          router.push(`/platform/organization/${encodeURIComponent(row._id)}`);
        },
      },
    ];
  }, [router]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Manage all organizations and their domain mappings across the platform.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>All organizations</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, slug, owner id…"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm sm:max-w-md"
            />
            <Button
              disabled={isCreating}
              onClick={async () => {
                const name = window.prompt("Organization name");
                if (!name) return;
                setIsCreating(true);
                try {
                  await createOrg({ name });
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              {isCreating ? "Creating…" : "Add organization"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EntityList<OrgRow>
            data={Array.isArray(rows) ? rows : []}
            columns={columns}
            isLoading={rows === undefined}
            defaultViewMode="list"
            viewModes={[]}
            enableSearch={false}
            entityActions={entityActions}
            onRowClick={(row: OrgRow) => {
              router.push(`/platform/organization/${encodeURIComponent(row._id)}`);
            }}
            getRowId={(row: OrgRow) => row._id}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <div className="text-lg font-medium">No organizations</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  No organizations matched your search.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
