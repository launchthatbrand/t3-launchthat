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

import type { CoreTenantOrganizationsUiApi } from "./types";

export interface OrganizationCreateDialogProps {
  api: CoreTenantOrganizationsUiApi;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (args: { organizationId: string }) => void;
}

export const OrganizationCreateDialog = (props: OrganizationCreateDialogProps) => {
  const createOrganization = useMutation(
    props.api.launchthat_core_tenant.mutations.createOrganization,
  );
  const setActiveOrganization = useMutation(
    props.api.launchthat_core_tenant.mutations.setActiveOrganizationForUser,
  );

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) {
      setName("");
      setSlug("");
      setError(null);
      setIsSaving(false);
    }
  }, [props.open]);

  const handleCreate = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const createdOrgId = await createOrganization({
        userId: props.userId,
        name: name.trim(),
        slug: slug.trim() ? slug.trim() : undefined,
      });
      await setActiveOrganization({
        userId: props.userId,
        organizationId: createdOrgId,
      });
      props.onCreated?.({ organizationId: createdOrgId });
      props.onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Wall Street Academy"
            />
          </div>

          <div className="space-y-1">
            <Label>Slug (optional)</Label>
            <Input
              value={slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
              placeholder="wall-street-academy"
            />
          </div>

          {error ? <div className="text-destructive text-sm">{error}</div> : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!name.trim() || isSaving} onClick={handleCreate}>
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

