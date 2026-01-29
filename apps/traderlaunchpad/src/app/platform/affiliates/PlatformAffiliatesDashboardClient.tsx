"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Search } from "lucide-react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

type PlatformAffiliateProfileRow = {
  userId: string;
  referralCode: string;
  status: "active" | "disabled";
  createdAt: number;
  updatedAt: number;
};

type PlatformUserRow = {
  clerkId: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
};

const formatNumber = (n: number): string => {
  if (!Number.isFinite(n)) return "0";
  return Intl.NumberFormat().format(Math.max(0, Math.round(n)));
};

export const PlatformAffiliatesDashboardClient = () => {
  const router = useRouter();

  const summary = useQuery(api.platform.affiliates.getSummary, { daysBack: 30 });
  const profiles = useQuery(api.platform.affiliates.listProfiles, { limit: 500 });
  const users = useQuery(api.coreTenant.platformUsers.listUsers, { limit: 500 }) as
    | PlatformUserRow[]
    | undefined;

  const usersById = React.useMemo(() => {
    const m = new Map<string, PlatformUserRow>();
    for (const u of Array.isArray(users) ? users : []) {
      if (typeof u?.clerkId === "string") m.set(u.clerkId, u);
    }
    return m;
  }, [users]);

  const rows = React.useMemo<PlatformAffiliateProfileRow[]>(() => {
    return Array.isArray(profiles) ? (profiles as PlatformAffiliateProfileRow[]) : [];
  }, [profiles]);

  const columns = React.useMemo<ColumnDefinition<PlatformAffiliateProfileRow>[]>(
    () => [
      {
        id: "user",
        header: "Affiliate",
        accessorKey: "userId",
        cell: (p: PlatformAffiliateProfileRow) => {
          const u = usersById.get(p.userId);
          return (
            <div className="space-y-1">
              <div className="text-sm font-semibold">{u?.name ?? u?.email ?? "—"}</div>
              <div className="text-muted-foreground text-xs">{u?.email ?? "—"}</div>
              <div className="text-muted-foreground text-xs font-mono">{p.userId}</div>
            </div>
          );
        },
        sortable: true,
      },
      {
        id: "code",
        header: "Referral code",
        accessorKey: "referralCode",
        cell: (p: PlatformAffiliateProfileRow) => (
          <div className="font-mono text-xs">{p.referralCode}</div>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (p: PlatformAffiliateProfileRow) => (
          <Badge variant={p.status === "disabled" ? "secondary" : "default"}>
            {p.status}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "updatedAt",
        header: "Updated",
        accessorKey: "updatedAt",
        cell: (p: PlatformAffiliateProfileRow) => (
          <div className="whitespace-nowrap text-xs">
            {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
          </div>
        ),
        sortable: true,
      },
    ],
    [usersById],
  );

  const entityActions = React.useMemo<EntityAction<PlatformAffiliateProfileRow>[]>(
    () => [
      {
        id: "manage",
        label: "Manage",
        variant: "outline",
        onClick: (p) => router.push(`/platform/affiliate/${encodeURIComponent(p.userId)}`),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.affiliates.total) : "—"}
            </div>
            <div className="text-muted-foreground text-xs">
              Active {summary ? formatNumber(summary.affiliates.active) : "—"} · Disabled{" "}
              {summary ? formatNumber(summary.affiliates.disabled) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.activity.clicks) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Signups (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.activity.signups) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid conversions (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatNumber(summary.activity.conversions) : "—"}
            </div>
            <div className="text-muted-foreground text-xs">
              Activations {summary ? formatNumber(summary.activity.activations) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base">All affiliates</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <EntityList<PlatformAffiliateProfileRow>
            data={rows}
            columns={columns}
            isLoading={profiles === undefined}
            defaultViewMode="list"
            viewModes={[]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={(p) => router.push(`/platform/affiliate/${encodeURIComponent(p.userId)}`)}
            getRowId={(p) => p.userId}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <Search className="text-muted-foreground h-5 w-5" />
                <div className="mt-2 text-lg font-medium">No affiliates</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  No affiliate profiles to display.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

