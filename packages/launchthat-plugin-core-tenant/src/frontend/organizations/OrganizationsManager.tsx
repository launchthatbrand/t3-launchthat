"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { OrganizationSwitcher } from "../OrganizationSwitcher";
import type {
  CoreTenantOrganizationsUiApi,
  OrganizationMembershipRow,
} from "./types";
import { OrganizationCreateDialog } from "./OrganizationCreateDialog";

export interface OrganizationsManagerProps {
  api: CoreTenantOrganizationsUiApi;
  userId: string | null | undefined;
  className?: string;
  onOpenOrganization?: (organizationId: string) => void;
  showOrganizationSwitcher?: boolean;
  showSetActiveAction?: boolean;
  showActiveColumn?: boolean;
}

export const OrganizationsManager = (props: OrganizationsManagerProps) => {
  const memberships: OrganizationMembershipRow[] | undefined = useQuery(
    props.api.launchthat_core_tenant.queries.listOrganizationsByUserId,
    props.userId ? { userId: props.userId } : "skip",
  );

  const setActiveOrganization = useMutation(
    props.api.launchthat_core_tenant.mutations.setActiveOrganizationForUser,
  );

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const showOrganizationSwitcher = props.showOrganizationSwitcher !== false;
  const showSetActiveAction = props.showSetActiveAction !== false;
  const showActiveColumn = props.showActiveColumn !== false;

  const rows = React.useMemo<OrganizationMembershipRow[]>(() => {
    return Array.isArray(memberships) ? memberships : [];
  }, [memberships]);

  const columns = React.useMemo<ColumnDefinition<OrganizationMembershipRow>[]>(
    () => {
      const result: ColumnDefinition<OrganizationMembershipRow>[] = [
        {
          id: "name",
          header: "Organization",
          accessorKey: "organizationId",
          cell: (m: OrganizationMembershipRow) => (
            <div className="space-y-1">
              <div className="font-medium">{m.org.name}</div>
              <div className="text-muted-foreground font-mono text-xs">/{m.org.slug}</div>
            </div>
          ),
          sortable: true,
        },
        {
          id: "role",
          header: "Role",
          accessorKey: "role",
          cell: (m: OrganizationMembershipRow) => (
            <span className="text-sm">{m.role}</span>
          ),
          sortable: true,
        },
      ];

      if (showActiveColumn) {
        result.push({
          id: "active",
          header: "Active",
          accessorKey: "isActive",
          cell: (m: OrganizationMembershipRow) => (
            <span className="text-sm">{m.isActive ? "Active" : "—"}</span>
          ),
          sortable: true,
        });
      }

      return result;
    },
    [showActiveColumn],
  );

  const entityActions = React.useMemo<EntityAction<OrganizationMembershipRow>[]>(
    () => {
      const actions: EntityAction<OrganizationMembershipRow>[] = [
        {
          id: "open",
          label: "Open",
          variant: "outline",
          onClick: (m: OrganizationMembershipRow) => {
            props.onOpenOrganization?.(m.organizationId);
          },
        },
      ];

      if (showSetActiveAction) {
        actions.push({
          id: "setActive",
          label: "Set active",
          variant: "secondary",
          isDisabled: (m: OrganizationMembershipRow) => m.isActive === true || !props.userId,
          onClick: (m: OrganizationMembershipRow) => {
            if (!props.userId) return;
            void setActiveOrganization({
              userId: props.userId,
              organizationId: m.organizationId,
            });
          },
        });
      }

      return actions;
    },
    [props, setActiveOrganization, showSetActiveAction],
  );

  return (
    <div className={props.className}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showOrganizationSwitcher ? (
              <div className="max-w-sm">
                <div className="text-muted-foreground text-sm">Active org</div>
                <div className="mt-2">
                  <OrganizationSwitcher api={props.api} userId={props.userId} />
                </div>
              </div>
            ) : null}

            <EntityList<OrganizationMembershipRow>
              data={rows}
              columns={columns}
              isLoading={memberships === undefined}
              defaultViewMode="list"
              viewModes={["list"]}
              enableSearch={true}
              entityActions={entityActions}
              onRowClick={(m) => props.onOpenOrganization?.(m.organizationId)}
              getRowId={(m: OrganizationMembershipRow) => m.organizationId}
              actions={
                props.userId ? (
                  <Button onClick={() => setIsCreateOpen(true)}>Add organization</Button>
                ) : null
              }
              emptyState={
                <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                  <div className="text-lg font-medium">No organizations</div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    Create your first organization to get started.
                  </div>
                  {props.userId ? (
                    <div className="mt-4">
                      <Button onClick={() => setIsCreateOpen(true)}>
                        Add organization
                      </Button>
                    </div>
                  ) : null}
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Domain management lives in app-level org detail pages (e.g. /platform/organization/:id/domains). */}
      </div>

      {props.userId ? (
        <OrganizationCreateDialog
          api={props.api}
          userId={props.userId}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={(res) => {
            props.onOpenOrganization?.(res.organizationId);
          }}
        />
      ) : null}
    </div>
  );
};

