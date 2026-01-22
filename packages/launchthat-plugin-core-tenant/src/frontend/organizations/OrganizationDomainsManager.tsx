"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type {
  CoreTenantOrganizationsUiApi,
  OrganizationDomainRow,
  OrganizationDomainStatus,
} from "./types";

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

  const domains = useQuery(props.api.launchthat_core_tenant.queries.listDomainsForOrg, {
    organizationId: props.organizationId,
  });

  const upsert = useMutation(props.api.launchthat_core_tenant.mutations.upsertOrganizationDomain);
  const remove = useMutation(props.api.launchthat_core_tenant.mutations.removeOrganizationDomain);

  const [hostname, setHostname] = React.useState("");
  const [appKey, setAppKey] = React.useState(appKeys[0] ?? "traderlaunchpad");
  const [status, setStatus] = React.useState<OrganizationDomainStatus>("pending");
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAdd = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await upsert({
        organizationId: props.organizationId,
        appKey,
        hostname,
        status,
      });
      setHostname("");
      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save domain");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={props.className}>
      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>App</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
              >
                {appKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Hostname</Label>
              <Input value={hostname} onChange={(e) => setHostname(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrganizationDomainStatus)}
              >
                <option value="pending">pending</option>
                <option value="verified">verified</option>
                <option value="unconfigured">unconfigured</option>
                <option value="error">error</option>
              </select>
            </div>
          </div>
          {error ? <div className="text-destructive text-sm">{error}</div> : null}
          <Button disabled={isSaving || !hostname.trim() || !appKey.trim()} onClick={handleAdd}>
            {isSaving ? "Saving…" : "Add / Update domain"}
          </Button>

          <DomainsTable
            domains={Array.isArray(domains) ? domains : []}
            onRemove={async (row) => {
              await remove({
                organizationId: props.organizationId,
                appKey: row.appKey,
                hostname: row.hostname,
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

const DomainsTable = (props: {
  domains: OrganizationDomainRow[];
  onRemove: (row: OrganizationDomainRow) => Promise<void>;
}) => {
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>App</TableHead>
          <TableHead>Hostname</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.domains.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground text-sm">
              No domains configured.
            </TableCell>
          </TableRow>
        ) : (
          props.domains.map((d) => {
            const key = `${d.appKey}:${d.hostname}`;
            return (
              <TableRow key={key}>
                <TableCell className="font-mono text-xs">{d.appKey}</TableCell>
                <TableCell className="font-mono text-xs">{d.hostname}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyKey === key}
                    onClick={async () => {
                      setBusyKey(key);
                      try {
                        await props.onRemove(d);
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {busyKey === key ? "…" : "Remove"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

