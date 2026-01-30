"use client";

import * as React from "react";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Search } from "lucide-react";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui";

import { api } from "@convex-config/_generated/api";

type RoleRow = {
  key: "user" | "staff" | "admin";
  label: string;
  description?: string;
  isAdmin: boolean;
  updatedAt: number;
};

export default function PlatformUserRolesPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as { isAdmin: boolean } | undefined;

  const roles = useQuery(
    api.platform.roles.listPlatformRoles,
    shouldQuery ? {} : "skip",
  ) as RoleRow[] | undefined;

  const upsertRole = useMutation(api.platform.roles.upsertPlatformRole);

  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<{ key: RoleRow["key"]; label: string; description: string } | null>(
    null,
  );

  const rows = React.useMemo<RoleRow[]>(() => (Array.isArray(roles) ? roles : []), [roles]);

  const columns = React.useMemo<ColumnDefinition<RoleRow>[]>(
    () => [
      {
        id: "role",
        header: "Role",
        accessorKey: "key",
        cell: (r: RoleRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{r.label}</div>
            <div className="text-muted-foreground text-xs font-mono">{r.key}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "admin",
        header: "Admin",
        accessorKey: "isAdmin",
        cell: (r: RoleRow) => (
          <Badge variant={r.isAdmin ? "default" : "secondary"}>
            {r.isAdmin ? "admin" : "standard"}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "description",
        header: "Description",
        accessorKey: "description",
        cell: (r: RoleRow) => (
          <div className="text-muted-foreground text-sm">{r.description ?? "—"}</div>
        ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        accessorKey: "updatedAt",
        cell: (r: RoleRow) =>
          r.updatedAt ? (
            <span className="text-sm">{new Date(r.updatedAt).toLocaleDateString()}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<RoleRow>[]>(
    () => [
      {
        id: "edit",
        label: "Edit",
        variant: "outline",
        onClick: (role) => {
          setDraft({
            key: role.key,
            label: role.label ?? role.key,
            description: role.description ?? "",
          });
          setEditOpen(true);
        },
      },
    ],
    [],
  );

  if (!shouldQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!viewerSettings?.isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Admin access required.
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await upsertRole({
        key: draft.key,
        label: draft.label.trim() || draft.key,
        description: draft.description.trim() || undefined,
      });
      toast.success("Role updated.");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base">Platform roles</CardTitle>
        </CardHeader>

        <CardContent className="p-3">
          <EntityList<RoleRow>
            data={rows}
            columns={columns}
            isLoading={roles === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            getRowId={(r) => r.key}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <Search className="text-muted-foreground h-5 w-5" />
                <div className="mt-2 text-lg font-medium">No roles</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  No roles to display.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role key</Label>
              <Input value={draft?.key ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={draft?.label ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, label: event.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={draft?.description ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
