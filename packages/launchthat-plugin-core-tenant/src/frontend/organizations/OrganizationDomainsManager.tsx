"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import type {
  CoreTenantOrganizationsUiApi,
  OrganizationDomainRow,
  OrganizationDomainStatus,
} from "./types";
import { OrganizationDomainDialog } from "./OrganizationDomainDialog";

const statusVariant = (
  status: OrganizationDomainStatus,
): "default" | "secondary" | "outline" | "destructive" => {
  if (status === "verified") return "default";
  if (status === "pending") return "secondary";
  if (status === "error") return "destructive";
  return "outline";
};

export interface OrganizationDomainsManagerProps {
  api: CoreTenantOrganizationsUiApi;
  organizationId: string;
  appKeys?: string[];
  className?: string;
}

export const OrganizationDomainsManager = (props: OrganizationDomainsManagerProps) => {
  const appKeys = props.appKeys?.length ? props.appKeys : ["portal", "traderlaunchpad"];

  const domains: OrganizationDomainRow[] | undefined = useQuery(
    props.api.launchthat_core_tenant.queries.listDomainsForOrg,
    {
    organizationId: props.organizationId,
    },
  );

  const remove = useMutation(props.api.launchthat_core_tenant.mutations.removeOrganizationDomain);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<
    Pick<OrganizationDomainRow, "appKey" | "hostname" | "status"> | undefined
  >(undefined);

  const rows = React.useMemo<OrganizationDomainRow[]>(() => {
    return Array.isArray(domains) ? domains : [];
  }, [domains]);

  const columns = React.useMemo<ColumnDefinition<OrganizationDomainRow>[]>(
    () => [
      {
        id: "appKey",
        header: "App",
        accessorKey: "appKey",
        cell: (d: OrganizationDomainRow) => (
          <span className="font-mono text-xs">{d.appKey}</span>
        ),
        sortable: true,
      },
      {
        id: "hostname",
        header: "Hostname",
        accessorKey: "hostname",
        cell: (d: OrganizationDomainRow) => (
          <span className="font-mono text-xs">{d.hostname}</span>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (d: OrganizationDomainRow) => (
          <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
        ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<OrganizationDomainRow>[]>(
    () => [
      {
        id: "edit",
        label: "Edit",
        variant: "outline",
        onClick: (d: OrganizationDomainRow) => {
          setEditing({ appKey: d.appKey, hostname: d.hostname, status: d.status });
          setIsDialogOpen(true);
        },
      },
      {
        id: "remove",
        label: "Remove",
        variant: "destructive",
        onClick: (d: OrganizationDomainRow) => {
          void remove({
            organizationId: props.organizationId,
            appKey: d.appKey,
            hostname: d.hostname,
          });
        },
      },
    ],
    [props.organizationId, remove],
  );

  return (
    <div className={props.className}>
      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EntityList<OrganizationDomainRow>
            data={rows}
            columns={columns}
            isLoading={domains === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            getRowId={(d: OrganizationDomainRow) => `${d.appKey}:${d.hostname}`}
            actions={
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setIsDialogOpen(true);
                }}
              >
                Add domain
              </Button>
            }
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <div className="text-lg font-medium">No domains</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Add a domain mapping for this organization.
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setEditing(undefined);
                      setIsDialogOpen(true);
                    }}
                  >
                    Add domain
                  </Button>
                </div>
              </div>
            }
          />

          <OrganizationDomainDialog
            api={props.api}
            organizationId={props.organizationId}
            appKeys={appKeys}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            initial={editing}
          />
        </CardContent>
      </Card>
    </div>
  );
};
