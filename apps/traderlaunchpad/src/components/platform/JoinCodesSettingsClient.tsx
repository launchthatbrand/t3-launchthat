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
import { Copy } from "lucide-react";

import { api } from "@convex-config/_generated/api";

type JoinCodeRow = {
  _id: string;
  code?: string;
  label?: string;
  role?: "user" | "staff" | "admin";
  tier?: "free" | "standard" | "pro";
  grants?: {
    limits?: {
      maxOrganizations?: number;
      features?: {
        journal?: boolean;
        strategies?: boolean;
        analytics?: boolean;
        orders?: boolean;
      };
    };
  };
  permissions?: {
    globalEnabled?: boolean;
    tradeIdeasEnabled?: boolean;
    openPositionsEnabled?: boolean;
    ordersEnabled?: boolean;
  };
  maxUses?: number;
  uses: number;
  expiresAt?: number;
  isActive: boolean;
  createdAt: number;
};

type PlatformRoleRow = {
  key: "user" | "staff" | "admin";
  label: string;
  description?: string;
  isAdmin: boolean;
  updatedAt: number;
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
  const [role, setRole] = React.useState<"user" | "staff" | "admin">("user");
  const platformRoles = useQuery(
    api.platform.roles.listPlatformRoles,
    shouldQuery ? {} : "skip",
  ) as PlatformRoleRow[] | undefined;
  const [tier, setTier] = React.useState<"free" | "standard" | "pro">("free");
  const [limitsDraft, setLimitsDraft] = React.useState<{
    maxOrganizations: string;
    features: {
      journal: boolean;
      strategies: boolean;
      analytics: boolean;
      orders: boolean;
    };
  }>({
    maxOrganizations: "",
    features: {
      journal: true,
      strategies: true,
      analytics: true,
      orders: true,
    },
  });
  const [maxUses, setMaxUses] = React.useState<string>("");
  const [expiresInDays, setExpiresInDays] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [lastCode, setLastCode] = React.useState("");

  const roleOptions = React.useMemo<PlatformRoleRow[]>(
    () =>
      Array.isArray(platformRoles) && platformRoles.length
        ? platformRoles
        : [
            { key: "user", label: "User", isAdmin: false, updatedAt: 0 },
            { key: "staff", label: "Staff", isAdmin: false, updatedAt: 0 },
            { key: "admin", label: "Admin", isAdmin: true, updatedAt: 0 },
          ],
    [platformRoles],
  );

  const roleLabelByKey = React.useMemo(() => {
    return new Map(roleOptions.map((opt) => [opt.key, opt.label]));
  }, [roleOptions]);

  const getJoinLink = React.useCallback((code: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/sign-in?join=${encodeURIComponent(code)}`;
  }, []);

  const handleCopy = React.useCallback(async (value: string, labelText = "Link") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${labelText} copied.`);
    } catch {
      toast.error("Failed to copy.");
    }
  }, []);

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
        role,
        tier,
        grants: {
          limits: {
            maxOrganizations: limitsDraft.maxOrganizations
              ? Number(limitsDraft.maxOrganizations)
              : undefined,
            features: limitsDraft.features,
          },
        },
        maxUses: typeof maxUsesValue === "number" && maxUsesValue > 0 ? maxUsesValue : undefined,
        expiresAt,
      });

      const code = typeof created?.code === "string" ? created.code : "";
      setLastCode(code);
      setLabel("");
      setRole("user");
      setTier("free");
      setLimitsDraft({
        maxOrganizations: "",
        features: {
          journal: true,
          strategies: true,
          analytics: true,
          orders: true,
        },
      });
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
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant={role === option.key ? "default" : "outline"}
                    onClick={() => setRole(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <div className="flex flex-wrap gap-2">
                {(["free", "standard", "pro"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={tier === value ? "default" : "outline"}
                    onClick={() => setTier(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <Label className="text-sm">Entitlements</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={limitsDraft.features.journal}
                    onChange={(event) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, journal: event.target.checked },
                      }))
                    }
                  />
                  <span>Journal</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={limitsDraft.features.strategies}
                    onChange={(event) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, strategies: event.target.checked },
                      }))
                    }
                  />
                  <span>Strategies</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={limitsDraft.features.analytics}
                    onChange={(event) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, analytics: event.target.checked },
                      }))
                    }
                  />
                  <span>Analytics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={limitsDraft.features.orders}
                    onChange={(event) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, orders: event.target.checked },
                      }))
                    }
                  />
                  <span>Orders</span>
                </label>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <Label className="text-sm">Limits</Label>
              <div className="mt-2 space-y-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max organizations</Label>
                  <Input
                    value={limitsDraft.maxOrganizations}
                    onChange={(event) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        maxOrganizations: event.target.value,
                      }))
                    }
                    placeholder="e.g. 10"
                    inputMode="numeric"
                  />
                </div>
              </div>
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
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">New code:</span>
                <span className="font-semibold text-foreground">{lastCode}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => void handleCopy(getJoinLink(lastCode), "Invite link")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy link
                </Button>
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
                  {code.role
                    ? ` · Role ${roleLabelByKey.get(code.role as PlatformRoleRow["key"]) ?? code.role}`
                    : ""}
                  {code.tier ? ` · Tier ${code.tier}` : ""}
                  </div>
                  {code.code ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Invite link:</span>
                      <span className="font-mono text-foreground/80">
                        {getJoinLink(code.code)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1"
                        onClick={() =>
                          void handleCopy(getJoinLink(code.code), "Invite link")
                        }
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Invite link hidden (code not stored).
                    </div>
                  )}
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
