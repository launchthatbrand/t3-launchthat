"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";

interface PlatformUserRow {
  clerkId: string;
  email: string;
  name?: string;
}

interface AffiliateProfile {
  userId: string;
  referralCode: string;
  status: "active" | "disabled";
  acceptedTermsAt?: number;
  acceptedTermsVersion?: string;
  createdAt: number;
  updatedAt: number;
}

interface AffiliateStats {
  userId: string;
  referralCode: string | null;
  clicks30d: number;
  signups30d: number;
  activations30d: number;
  conversions30d: number;
  creditBalanceCents: number;
}

interface AffiliateBenefit {
  kind: string;
  value: unknown;
  startsAt: number;
  endsAt?: number;
  status: string;
}

interface AffiliateCreditEvent {
  amountCents: number;
  currency: string;
  reason: string;
  createdAt: number;
  referredUserId?: string;
  conversionId?: string;
}

interface AffiliateLog {
  ts: number;
  kind: string;
  ownerUserId: string;
  message: string;
  data?: unknown;
  referralCode?: string;
  visitorId?: string;
  referredUserId?: string;
  externalId?: string;
  amountCents?: number;
  currency?: string;
}

interface AffiliateAdminView {
  userId: string;
  profile: AffiliateProfile | null;
  stats: AffiliateStats;
  benefits: AffiliateBenefit[];
  creditEvents: AffiliateCreditEvent[];
  logs: AffiliateLog[];
  recruits: Array<{
    referredUserId: string;
    name: string;
    attributedAt: number;
    activatedAt?: number;
    firstPaidConversionAt?: number;
  }>;
}

const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

export default function PlatformAffiliateDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === "string" ? decodeURIComponent(params.userId) : "";

  // NOTE: Convex codegen may lag behind new `api.platform.affiliates.*` routes during dev.
  // Cast to `any` to avoid blocking UI iteration; runtime is validated by Convex.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const view = useQuery((api as any).platform.affiliates.getAffiliateAdminView, {
    userId,
  }) as AffiliateAdminView | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const setStatus = useMutation((api as any).platform.affiliates.setAffiliateStatus);

  const users = useQuery(api.coreTenant.platformUsers.listUsers, { limit: 500 }) as
    | PlatformUserRow[]
    | undefined;

  const user = React.useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list.find((u) => u.clerkId === userId) ?? null;
  }, [users, userId]);

  const profile = view?.profile ?? null;
  const displayName = (user?.name ?? user?.email ?? userId) || "—";

  const [recruitFilter, setRecruitFilter] = React.useState<string>("all");
  const [recruitSearch, setRecruitSearch] = React.useState<string>("");

  const recruitRows = React.useMemo(() => {
    const rows = Array.isArray(view?.recruits) ? view!.recruits : [];
    const q = recruitSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (recruitFilter === "pending" && typeof r.activatedAt === "number") return false;
      if (recruitFilter === "activated" && typeof r.activatedAt !== "number") return false;
      if (recruitFilter === "paid" && typeof r.firstPaidConversionAt !== "number") return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.referredUserId.toLowerCase().includes(q)
      );
    });
  }, [recruitFilter, recruitSearch, view]);

  const recruitColumns = React.useMemo<
    ColumnDefinition<{
      referredUserId: string;
      name: string;
      attributedAt: number;
      activatedAt?: number;
      firstPaidConversionAt?: number;
    }>[]
  >(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        cell: (r: {
          referredUserId: string;
          name: string;
          attributedAt: number;
          activatedAt?: number;
          firstPaidConversionAt?: number;
        }) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-muted-foreground text-xs font-mono">{r.referredUserId}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "recruited",
        header: "Recruited",
        accessorKey: "attributedAt",
        cell: (r: {
          referredUserId: string;
          name: string;
          attributedAt: number;
          activatedAt?: number;
          firstPaidConversionAt?: number;
        }) => (
          <div className="whitespace-nowrap text-xs">
            {r.attributedAt ? new Date(r.attributedAt).toLocaleDateString() : "—"}
          </div>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "activatedAt",
        cell: (r: {
          referredUserId: string;
          name: string;
          attributedAt: number;
          activatedAt?: number;
          firstPaidConversionAt?: number;
        }) => (
          <div className="flex flex-wrap items-center gap-2">
            {typeof r.activatedAt === "number" ? (
              <Badge variant="secondary">activated</Badge>
            ) : (
              <Badge variant="outline">pending</Badge>
            )}
            {typeof r.firstPaidConversionAt === "number" ? <Badge>paid</Badge> : null}
          </div>
        ),
      },
      {
        id: "paid",
        header: "Paid",
        accessorKey: "firstPaidConversionAt",
        cell: (r: {
          referredUserId: string;
          name: string;
          attributedAt: number;
          activatedAt?: number;
          firstPaidConversionAt?: number;
        }) => (
          <div className="whitespace-nowrap text-xs">
            {typeof r.firstPaidConversionAt === "number"
              ? new Date(r.firstPaidConversionAt).toLocaleDateString()
              : "—"}
          </div>
        ),
        sortable: true,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Affiliate</h2>
        <div className="text-muted-foreground text-sm">{displayName}</div>
        <div className="text-muted-foreground text-xs font-mono">{userId}</div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Profile</CardTitle>
            <div className="text-muted-foreground text-sm">
              Referral code and status controls.
            </div>
          </div>

          {profile ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">Enabled</div>
              <Switch
                checked={profile.status === "active"}
                onCheckedChange={(checked) => {
                  setStatus({
                    userId,
                    status: checked ? "active" : "disabled",
                  }).catch((err: unknown) => {
                    console.error("[PlatformAffiliateDetailPage] setStatus failed", err);
                  });
                }}
              />
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {!view ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : !profile ? (
            <div className="text-muted-foreground text-sm">No affiliate profile for this user.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-muted-foreground text-xs">Referral code</div>
                <div className="mt-1 font-mono text-sm">{profile.referralCode}</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-muted-foreground text-xs">Status</div>
                <div className="mt-1">
                  <Badge variant={profile.status === "disabled" ? "secondary" : "default"}>
                    {profile.status}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-muted-foreground text-xs">Balance</div>
                <div className="mt-1 text-sm font-semibold">
                  {formatUsd(view.stats.creditBalanceCents)}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3 md:col-span-3">
                <div className="text-muted-foreground text-xs">Terms accepted</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="outline">{profile.acceptedTermsVersion ?? "—"}</Badge>
                  <div className="text-muted-foreground text-xs">
                    {typeof profile.acceptedTermsAt === "number"
                      ? new Date(profile.acceptedTermsAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {view ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-base">Recruited users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={recruitFilter === "all" ? "default" : "outline"}
                  onClick={() => setRecruitFilter("all")}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={recruitFilter === "pending" ? "default" : "outline"}
                  onClick={() => setRecruitFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  type="button"
                  variant={recruitFilter === "activated" ? "default" : "outline"}
                  onClick={() => setRecruitFilter("activated")}
                >
                  Activated
                </Button>
                <Button
                  type="button"
                  variant={recruitFilter === "paid" ? "default" : "outline"}
                  onClick={() => setRecruitFilter("paid")}
                >
                  Paid
                </Button>
              </div>
              <div className="w-full sm:w-72">
                <Input
                  value={recruitSearch}
                  onChange={(e) => setRecruitSearch(e.target.value)}
                  placeholder="Search recruits…"
                />
              </div>
            </div>

            <EntityList
              data={recruitRows}
              columns={recruitColumns}
              isLoading={view === undefined}
              defaultViewMode="list"
              viewModes={[]}
              enableSearch={false}
              getRowId={(r) => r.referredUserId}
              emptyState={
                <div className="text-muted-foreground text-sm">
                  No recruits yet.
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {view ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clicks (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{view.stats.clicks30d}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Signups (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{view.stats.signups30d}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activations (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{view.stats.activations30d}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversions (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{view.stats.conversions30d}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Credit</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatUsd(view.stats.creditBalanceCents)}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Benefits</CardTitle>
            <Button variant="outline" size="sm" disabled>
              Manage (soon)
            </Button>
          </CardHeader>
          <CardContent>
            {view.benefits.length === 0 ? (
              <div className="text-muted-foreground text-sm">No active benefits.</div>
            ) : (
              <div className="space-y-2">
                {view.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-start justify-between rounded-lg border bg-card p-3">
                    <div>
                      <div className="text-sm font-medium">{b.kind}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {new Date(b.startsAt).toLocaleString()}
                      </div>
                    </div>
                    <pre className="max-w-[520px] overflow-auto rounded-md bg-muted/30 p-2 text-xs">
                      {JSON.stringify(b.value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {view ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit ledger</CardTitle>
          </CardHeader>
          <CardContent>
            {view.creditEvents.length === 0 ? (
              <div className="text-muted-foreground text-sm">No credit events.</div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Referred user</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {view.creditEvents.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(e.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatUsd(e.amountCents)} {e.currency}
                        </TableCell>
                        <TableCell className="text-sm">{e.reason}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {e.referredUserId ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {view ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent logs</CardTitle>
          </CardHeader>
          <CardContent>
            {view.logs.length === 0 ? (
              <div className="text-muted-foreground text-sm">No logs.</div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {view.logs.map((l) => (
                      <TableRow key={`${l.ts}:${l.kind}:${l.message}`}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(l.ts).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{l.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{l.message}</TableCell>
                        <TableCell className="max-w-[520px]">
                          <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-xs">
                            {l.data ? JSON.stringify(l.data, null, 2) : "—"}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

