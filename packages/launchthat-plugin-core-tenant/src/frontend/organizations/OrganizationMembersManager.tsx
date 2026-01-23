"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import type { CoreTenantOrganizationsUiApi, OrganizationMemberRow } from "./types";
import { OrganizationMemberAddDialog } from "./OrganizationMemberAddDialog";
import type { AvailableUserOption } from "./OrganizationMemberAddDialog";

export interface OrganizationMembersManagerProps {
  api: CoreTenantOrganizationsUiApi;
  organizationId: string;
  availableUsers: AvailableUserOption[];
  className?: string;
  onOpenUser?: (userId: string) => void;
}

export const OrganizationMembersManager = (props: OrganizationMembersManagerProps) => {
  const { listMembersByOrganizationId } = props.api.launchthat_core_tenant.queries;
  const { ensureMembership, removeMembership } = props.api.launchthat_core_tenant.mutations;

  if (!listMembersByOrganizationId || !ensureMembership || !removeMembership) {
    return (
      <div className={props.className}>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            This app’s API adapter is missing required member management functions.
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = useQuery(listMembersByOrganizationId, {
    organizationId: props.organizationId,
  });

  const addMember = useMutation(ensureMembership);
  const removeMember = useMutation(removeMembership);

  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const available = props.availableUsers;

  const handleAdd = async (userId: string) => {
    // Avoid adding duplicates (race-safe UI guard).
    if (rows.some((m) => m.userId === userId)) return;
    setBusyKey(`add:${userId}`);
    try {
      await addMember({
        userId,
        organizationId: props.organizationId,
        role: "viewer",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const rows = React.useMemo<OrganizationMemberRow[]>(() => {
    return Array.isArray(members) ? members : [];
  }, [members]);

  const usersById = React.useMemo(() => {
    const map = new Map<string, AvailableUserOption>();
    for (const u of available) map.set(u.userId, u);
    return map;
  }, [available]);

  const availableToAdd = React.useMemo(() => {
    const existing = new Set(rows.map((m) => m.userId));
    return available.filter((u) => !existing.has(u.userId));
  }, [available, rows]);

  const columns = React.useMemo<ColumnDefinition<OrganizationMemberRow>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessorKey: "userId",
        cell: (m: OrganizationMemberRow) => {
          const u = usersById.get(m.userId);
          const name = u?.name ?? "";
          const email = u?.email ?? "";
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {name ? name : email ? email : "—"}
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                {email && name ? email : m.userId}
              </div>
            </div>
          );
        },
        sortable: true,
      },
      {
        id: "role",
        header: "Role",
        accessorKey: "role",
        cell: (m: OrganizationMemberRow) => <span className="text-sm">{m.role}</span>,
        sortable: true,
      },
    ],
    [usersById],
  );

  const entityActions = React.useMemo<EntityAction<OrganizationMemberRow>[]>(
    () => [
      {
        id: "view",
        label: "View",
        variant: "outline",
        onClick: (m: OrganizationMemberRow) => {
          props.onOpenUser?.(m.userId);
        },
      },
      {
        id: "remove",
        label: "Remove",
        variant: "destructive",
        isDisabled: (m) => busyKey === `rm:${m.userId}`,
        onClick: (m: OrganizationMemberRow) => {
          setBusyKey(`rm:${m.userId}`);
          void removeMember({
            userId: m.userId,
            organizationId: props.organizationId,
          }).finally(() => setBusyKey(null));
        },
      },
    ],
    [busyKey, props, removeMember],
  );

  return (
    <div className={props.className}>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EntityList<OrganizationMemberRow>
            data={rows}
            columns={columns}
            isLoading={members === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={(m) => props.onOpenUser?.(m.userId)}
            getRowId={(m: OrganizationMemberRow) => m.userId}
            actions={
              <Button disabled={availableToAdd.length === 0} onClick={() => setIsAddOpen(true)}>
                Add member
              </Button>
            }
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
                <div className="text-lg font-medium">No members</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Add a user to grant access.
                </div>
                <div className="mt-4">
                  <Button disabled={availableToAdd.length === 0} onClick={() => setIsAddOpen(true)}>
                    Add member
                  </Button>
                </div>
              </div>
            }
          />

          <OrganizationMemberAddDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            availableUsers={availableToAdd}
            isAdding={busyKey?.startsWith("add:") ?? false}
            onAdd={handleAdd}
          />
        </CardContent>
      </Card>
    </div>
  );
};
