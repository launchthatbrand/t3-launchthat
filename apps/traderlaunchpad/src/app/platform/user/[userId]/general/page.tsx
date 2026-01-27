"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui";

import { api } from "@convex-config/_generated/api";

export default function PlatformUserGeneralPage() {
  const params = useParams<{ userId?: string | string[] }>();
  const raw = params.userId;
  const userId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const user = useQuery(
    api.coreTenant.platformUsers.getUserByClerkId,
    userId ? { clerkId: userId } : "skip",
  );

  const createdLabel = React.useMemo(() => {
    if (!user?.createdAt) return "—";
    try {
      return new Date(user.createdAt).toLocaleString();
    } catch {
      return String(user.createdAt);
    }
  }, [user?.createdAt]);

  const userDocId = user?.userDocId ? String(user.userDocId) : "";

  const role = useQuery(
    api.platform.userAccess.getUserRole,
    userDocId ? { userId: userDocId } : "skip",
  ) as "user" | "staff" | "admin" | null | undefined;
  const entitlement = useQuery(
    api.platform.userAccess.getUserEntitlement,
    userDocId ? { userId: userDocId } : "skip",
  ) as
    | {
        userId: string;
        tier: "free" | "standard" | "pro";
        limits?: unknown;
        updatedAt: number;
      }
    | null
    | undefined;
  // Entitlements are stored in app-owned tables (`userEntitlements`).
  // Public visibility is managed by the user on `/admin/settings/visibility`.

  const contactSummary = useQuery(
    api.platform.crm.getUserContactSummary,
    userDocId ? { userId: userDocId } : "skip",
  ) as
    | {
        contactId: string | null;
        tags: {
          id: string;
          name: string;
          slug?: string;
          color?: string;
          category?: string;
        }[];
      }
    | undefined;

  const setUserRole = useMutation(api.platform.userAccess.setUserRole);
  const setUserEntitlement = useMutation(api.platform.userAccess.setUserEntitlement);

  const [roleDraft, setRoleDraft] = React.useState<"user" | "staff" | "admin">("user");
  const [tierDraft, setTierDraft] = React.useState<"free" | "standard" | "pro">("free");
  const [limitsDraft, setLimitsDraft] = React.useState<{
    maxOrganizations: string;
    features: {
      journal: boolean;
      tradeIdeas: boolean;
      analytics: boolean;
      orders: boolean;
    };
  }>({
    maxOrganizations: "",
    features: { journal: true, tradeIdeas: true, analytics: true, orders: true },
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (role) setRoleDraft(role);
  }, [role]);

  React.useEffect(() => {
    if (entitlement?.tier) setTierDraft(entitlement.tier);
  }, [entitlement?.tier]);

  React.useEffect(() => {
    const raw = entitlement?.limits;
    if (!raw || typeof raw !== "object") return;
    const record = raw as Record<string, unknown>;
    const maxOrganizations =
      typeof record.maxOrganizations === "number" && Number.isFinite(record.maxOrganizations)
        ? String(record.maxOrganizations)
        : "";
    const featuresRaw = record.features;
    const features =
      featuresRaw && typeof featuresRaw === "object"
        ? (featuresRaw as Record<string, unknown>)
        : {};

    setLimitsDraft({
      maxOrganizations,
      features: {
        journal: features.journal !== false,
        tradeIdeas: features.tradeIdeas !== false,
        analytics: features.analytics !== false,
        orders: features.orders !== false,
      },
    });
  }, [entitlement?.limits]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-blue-500" />
              Profile
            </CardTitle>
            <CardDescription>
              View core identity info and platform-level flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={userId} readOnly className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? "—"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user?.name ?? "—"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <Input value={createdLabel} readOnly />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Entitlement</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  {entitlement?.tier ?? "Free"}
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Status</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Active
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Role</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                  {role ?? "User"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Admin controls</CardTitle>
            <CardDescription>Update role, tier, and global permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Platform role</Label>
              <Select
                value={roleDraft}
                onValueChange={(v) => setRoleDraft(v as "user" | "staff" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entitlement tier</Label>
              <Select
                value={tierDraft}
                onValueChange={(v) => setTierDraft(v as "free" | "standard" | "pro")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-semibold">Entitlements</div>

              <div className="bg-card space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Journal</div>
                    <div className="text-muted-foreground text-sm">
                      Allow access to `/admin/journal` and broker-backed journal data.
                    </div>
                  </div>
                  <Switch
                    checked={limitsDraft.features.journal}
                    onCheckedChange={(v) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, journal: v },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Trade ideas</div>
                    <div className="text-muted-foreground text-sm">
                      Allow access to `/admin/tradeideas`.
                    </div>
                  </div>
                  <Switch
                    checked={limitsDraft.features.tradeIdeas}
                    onCheckedChange={(v) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, tradeIdeas: v },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Analytics</div>
                    <div className="text-muted-foreground text-sm">
                      Allow access to `/admin/analytics`.
                    </div>
                  </div>
                  <Switch
                    checked={limitsDraft.features.analytics}
                    onCheckedChange={(v) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, analytics: v },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Orders</div>
                    <div className="text-muted-foreground text-sm">
                      Allow access to `/admin/orders`.
                    </div>
                  </div>
                  <Switch
                    checked={limitsDraft.features.orders}
                    onCheckedChange={(v) =>
                      setLimitsDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, orders: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="bg-card space-y-2 rounded-lg border p-4">
                <div className="text-sm font-semibold">Limits</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Max organizations</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="e.g. 10"
                      value={limitsDraft.maxOrganizations}
                      onChange={(e) =>
                        setLimitsDraft((prev) => ({
                          ...prev,
                          maxOrganizations: e.target.value,
                        }))
                      }
                    />
                    <div className="text-muted-foreground text-xs">
                      Leave blank for unlimited.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button
                className="border-0 bg-blue-600 text-white hover:bg-blue-700"
                disabled={saving || !userDocId}
                onClick={async () => {
                  if (!userDocId) return;
                  setSaving(true);
                  try {
                    await setUserRole({ userId: userDocId, role: roleDraft });
                    await setUserEntitlement({
                      userId: userDocId,
                      tier: tierDraft,
                      limits: {
                        maxOrganizations: limitsDraft.maxOrganizations
                          ? Number(limitsDraft.maxOrganizations)
                          : undefined,
                        features: limitsDraft.features,
                      },
                    });
                    toast.success("User access updated.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Failed to update user access.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>Internal-only annotations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <div className="text-muted-foreground text-sm">
            Example: “User requested billing refund; watch for chargebacks.”
          </div>
          <Input placeholder="Add internal note…" />
          <div className="flex justify-end">
            <Button variant="outline">Add note (mock)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">CRM contact</CardTitle>
          <CardDescription>Linked contact record and tags.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {contactSummary?.contactId ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">Linked contact</div>
                  <div className="text-muted-foreground text-xs">
                    {contactSummary.contactId}
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/platform/crm/contacts/${contactSummary.contactId}`}>
                    View contact
                  </Link>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Tags</div>
                {contactSummary.tags.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No tags assigned.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contactSummary.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              No contact record linked to this user yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
