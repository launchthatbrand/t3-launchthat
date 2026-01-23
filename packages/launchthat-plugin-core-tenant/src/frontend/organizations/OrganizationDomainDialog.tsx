"use client";

import * as React from "react";
import { useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type {
  CoreTenantOrganizationsUiApi,
  OrganizationDomainRow,
  OrganizationDomainStatus,
} from "./types";

export interface OrganizationDomainDialogProps {
  api: CoreTenantOrganizationsUiApi;
  organizationId: string;
  appKeys: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Pick<OrganizationDomainRow, "appKey" | "hostname" | "status">;
}

export const OrganizationDomainDialog = (props: OrganizationDomainDialogProps) => {
  const upsert = useMutation(props.api.launchthat_core_tenant.mutations.upsertOrganizationDomain);

  const [appKey, setAppKey] = React.useState(props.initial?.appKey ?? (props.appKeys[0] ?? ""));
  const [hostname, setHostname] = React.useState(props.initial?.hostname ?? "");
  const [status, setStatus] = React.useState<OrganizationDomainStatus>(
    props.initial?.status ?? "pending",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (props.open) {
      setAppKey(props.initial?.appKey ?? (props.appKeys[0] ?? ""));
      setHostname(props.initial?.hostname ?? "");
      setStatus(props.initial?.status ?? "pending");
      setError(null);
      setIsSaving(false);
    }
  }, [props.open, props.initial, props.appKeys]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await upsert({
        organizationId: props.organizationId,
        appKey,
        hostname,
        status,
      });
      props.onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save domain");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.initial ? "Edit domain" : "Add domain"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>App</Label>
            <select
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
            >
              {props.appKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Hostname</Label>
            <Input
              value={hostname}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHostname(e.target.value)}
              placeholder="markets.wsatraining.com"
            />
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

          {error ? <div className="text-destructive text-sm">{error}</div> : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!appKey.trim() || !hostname.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

