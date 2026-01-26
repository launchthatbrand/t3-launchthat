"use client";

import * as React from "react";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from "@acme/ui";

import { api } from "@convex-config/_generated/api";

type JoinCodeRow = {
  _id: string;
  label?: string;
  maxUses?: number;
  uses: number;
  expiresAt?: number;
  isActive: boolean;
  createdAt: number;
};

export const JoinCodesSettingsClient = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as { isAdmin: boolean } | undefined;

  const codes = useQuery(
    api.platform.joinCodes.listPlatformJoinCodes,
    shouldQuery ? {} : "skip",
  ) as JoinCodeRow[] | undefined;

  const createCode = useMutation(api.platform.joinCodes.createPlatformJoinCode);
  const deactivateCode = useMutation(
    api.platform.joinCodes.deactivatePlatformJoinCode,
  );
  const deleteCode = useMutation(api.platform.joinCodes.deletePlatformJoinCode);

  const [label, setLabel] = React.useState("");
  const [maxUses, setMaxUses] = React.useState<string>("");
  const [expiresInDays, setExpiresInDays] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [lastCode, setLastCode] = React.useState("");

  if (!shouldQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join codes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  if (!viewerSettings?.isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join codes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Admin access required.
        </CardContent>
      </Card>
    );
  }

  const handleCreate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const maxUsesValue =
        typeof maxUses === "string" && maxUses.trim()
          ? Number(maxUses)
          : undefined;
      const daysValue =
        typeof expiresInDays === "string" && expiresInDays.trim()
          ? Number(expiresInDays)
          : undefined;
      const expiresAt =
        typeof daysValue === "number" && Number.isFinite(daysValue) && daysValue > 0
          ? Date.now() + daysValue * 24 * 60 * 60 * 1000
          : undefined;

      const created = await createCode({
        label: label.trim() ? label.trim() : undefined,
        maxUses: typeof maxUsesValue === "number" && maxUsesValue > 0 ? maxUsesValue : undefined,
        expiresAt,
      });

      const code = typeof created?.code === "string" ? created.code : "";
      setLastCode(code);
      setLabel("");
      setMaxUses("");
      setExpiresInDays("");
      toast.success("Join code created.");
    } catch {
      toast.error("Failed to create join code.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform join codes</CardTitle>
          <CardDescription>
            Generate invite-only codes for alpha/beta cohorts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Alpha cohort"
              />
            </div>
            <div className="space-y-2">
              <Label>Max uses</Label>
              <Input
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
                placeholder="10"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Expires in (days)</Label>
              <Input
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder="30"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => void handleCreate()}
              disabled={saving}
            >
              Create join code
            </Button>
            {lastCode ? (
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                New code:{" "}
                <span className="font-semibold text-foreground">{lastCode}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active codes</CardTitle>
          <CardDescription>Manage or revoke join codes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(codes ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No join codes yet.</div>
          ) : (
            (codes ?? []).map((code) => (
              <div
                key={code._id}
                className="flex flex-col justify-between gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    {code.label ?? "Join code"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Uses: {code.uses}
                    {typeof code.maxUses === "number" ? ` / ${code.maxUses}` : ""}
                    {typeof code.expiresAt === "number"
                      ? ` · Expires ${format(code.expiresAt, "MMM d, yyyy")}`
                      : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!code.isActive}
                    onClick={() =>
                      void deactivateCode({ joinCodeId: code._id })
                    }
                  >
                    Disable
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => void deleteCode({ joinCodeId: code._id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
