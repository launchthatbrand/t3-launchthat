"use client";

import * as React from "react";

import { AffiliateDashboardCard, AffiliateReferralLink } from "launchthat-plugin-affiliates/frontend";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { api } from "@convex-config/_generated/api";

const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

const TERMS_VERSION = "v1" as const;

export default function AdminAffiliatesPage() {
  const getDashboard = useAction(api.traderlaunchpad.affiliates.getMyAffiliateDashboard);
  const becomeAffiliate = useMutation(api.traderlaunchpad.affiliates.becomeAffiliate);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const recruits = useQuery(
    api.traderlaunchpad.affiliates.listMyRecruits,
    !authLoading && isAuthenticated ? { limit: 250 } : "skip",
  ) as
    | {
      referredUserId: string;
      name: string;
      attributedAt: number;
      activatedAt?: number;
      firstPaidConversionAt?: number;
    }[]
    | undefined;

  const creditEvents = useQuery(
    api.traderlaunchpad.affiliates.listMyCreditEvents,
    !authLoading && isAuthenticated ? { limit: 200 } : "skip",
  ) as
    | {
      amountCents: number;
      currency: string;
      reason: string;
      createdAt: number;
      referredUserId?: string;
      conversionId?: string;
    }[]
    | undefined;

  const [data, setData] = React.useState<Awaited<ReturnType<typeof getDashboard>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [baseOrigin, setBaseOrigin] = React.useState<string>("http://localhost:3000");
  const [landingPath, setLandingPath] = React.useState<string>("/");
  const [copyLabel, setCopyLabel] = React.useState<string>("Copy");
  const [acceptedTerms, setAcceptedTerms] = React.useState<boolean>(false);
  const [becoming, setBecoming] = React.useState<boolean>(false);
  const [becomeError, setBecomeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") setBaseOrigin(window.location.origin);
  }, []);

  const refresh = React.useCallback(() => {
    setLoading(true);
    getDashboard({})
      .then((res) => setData(res))
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] getDashboard failed", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [getDashboard]);

  React.useEffect(() => {
    // Wait for Convex auth to resolve before fetching.
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [authLoading, isAuthenticated, refresh]);

  const referralCode = data?.profile?.referralCode ?? null;

  const referralUrl = React.useMemo(() => {
    if (!referralCode) return null;
    try {
      const base = new URL(baseOrigin);
      const path = landingPath.startsWith("/") ? landingPath : `/${landingPath}`;
      base.pathname = path;
      base.searchParams.set("ref", referralCode);
      return base.toString();
    } catch {
      return null;
    }
  }, [baseOrigin, landingPath, referralCode]);

  const handleCopy = React.useCallback(() => {
    if (!referralUrl) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(referralUrl)
      .then(() => {
        setCopyLabel("Copied");
        setTimeout(() => setCopyLabel("Copy"), 1200);
      })
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] clipboard copy failed", err);
      });
  }, [referralUrl]);

  const handleBecomeAffiliate = React.useCallback(() => {
    if (!acceptedTerms) return;
    setBecoming(true);
    setBecomeError(null);
    becomeAffiliate({ termsVersion: TERMS_VERSION })
      .then(() => refresh())
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] becomeAffiliate failed", err);
        setBecomeError("Failed to create affiliate profile. Please try again.");
      })
      .finally(() => setBecoming(false));
  }, [acceptedTerms, becomeAffiliate, refresh]);

  const recruitRows = React.useMemo(() => {
    return Array.isArray(recruits) ? recruits : [];
  }, [recruits]);

  const creditRows = React.useMemo(() => {
    return Array.isArray(creditEvents) ? creditEvents : [];
  }, [creditEvents]);

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
        id: "date",
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
        id: "credit",
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
            {typeof r.firstPaidConversionAt === "number" ? (
              <Badge>paid</Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "paidAt",
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
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
        <p className="text-muted-foreground text-sm">
          Create your affiliate profile, share your referral link, and track progress.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading…</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-9 w-full animate-pulse rounded-md bg-muted/40" />
              <div className="h-9 w-2/3 animate-pulse rounded-md bg-muted/40" />
              <div className="h-24 w-full animate-pulse rounded-md bg-muted/40" />
            </CardContent>
          </Card>
          <div className="h-60 w-full animate-pulse rounded-xl border bg-muted/30" />
        </div>
      ) : !isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not available</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            You must be signed in to access your affiliate dashboard.
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading…</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Fetching your affiliate dashboard…
          </CardContent>
        </Card>
      ) : !data.profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Become an affiliate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Create your affiliate profile to generate a referral link and earn rewards.
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
              />
              <label htmlFor="accept-terms" className="text-sm leading-5">
                I agree to the{" "}
                <a
                  href="/terms/affiliates"
                  className="font-medium underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  affiliate terms and conditions
                </a>
                .
              </label>
            </div>

            {becomeError ? <div className="text-sm text-destructive">{becomeError}</div> : null}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleBecomeAffiliate}
                disabled={!acceptedTerms || becoming}
              >
                {becoming ? "Creating…" : "Become an affiliate"}
              </Button>
              <Button type="button" variant="outline" onClick={refresh}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your referral link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="text-muted-foreground text-xs">Landing path</div>
                  <Input
                    value={landingPath}
                    onChange={(e) => setLandingPath(e.target.value)}
                    placeholder="/"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="text-muted-foreground text-xs">Referral URL</div>
                  <div className="flex items-center gap-2">
                    <Input value={referralUrl ?? ""} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                      disabled={!referralUrl}
                    >
                      {copyLabel}
                    </Button>
                  </div>
                  {referralCode ? (
                    <div className="text-muted-foreground text-xs">
                      Or share:
                      <span className="ml-2">
                        <AffiliateReferralLink referralCode={referralCode} baseUrl={baseOrigin} />
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border bg-card p-3 text-sm">
                  <div className="text-muted-foreground text-xs">Credit balance</div>
                  <div className="mt-1 font-semibold">{formatUsd(data.stats.creditBalanceCents)}</div>
                </div>
              </CardContent>
            </Card>

            <AffiliateDashboardCard
              title="Performance"
              stats={{
                clicks30d: data.stats.clicks30d,
                signups30d: data.stats.signups30d,
                activations30d: data.stats.activations30d,
                conversions30d: data.stats.conversions30d,
                creditBalanceCents: data.stats.creditBalanceCents,
              }}
              className="rounded-xl border bg-background p-4"
              footer={
                <div className="text-muted-foreground text-xs">
                  Rewards are granted automatically based on activations and paid conversions.
                </div>
              }
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Recruited users</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <EntityList
                data={recruitRows}
                columns={recruitColumns}
                isLoading={recruits === undefined}
                defaultViewMode="list"
                viewModes={[]}
                enableSearch={true}
                getRowId={(r) => r.referredUserId}
                emptyState={
                  <div className="text-muted-foreground text-sm">
                    No recruits yet. Share your referral link to start earning.
                  </div>
                }
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Credit events</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <EntityList
                data={creditRows}
                columns={[
                  {
                    id: "date",
                    header: "Date",
                    accessorKey: "createdAt",
                    cell: (e: {
                      amountCents: number;
                      currency: string;
                      reason: string;
                      createdAt: number;
                      referredUserId?: string;
                      conversionId?: string;
                    }) => (
                      <div className="whitespace-nowrap text-xs">
                        {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                      </div>
                    ),
                  },
                  {
                    id: "amount",
                    header: "Amount",
                    accessorKey: "amountCents",
                    cell: (e: {
                      amountCents: number;
                      currency: string;
                      reason: string;
                      createdAt: number;
                      referredUserId?: string;
                      conversionId?: string;
                    }) => (
                      <div className="font-mono text-xs">
                        {formatUsd(e.amountCents)} {e.currency}
                      </div>
                    ),
                  },
                  {
                    id: "reason",
                    header: "Reason",
                    accessorKey: "reason",
                    cell: (e: {
                      amountCents: number;
                      currency: string;
                      reason: string;
                      createdAt: number;
                      referredUserId?: string;
                      conversionId?: string;
                    }) => (
                      <div className="text-sm">
                        <div className="font-medium">{e.reason}</div>
                        <div className="text-muted-foreground text-xs font-mono">
                          {e.referredUserId ?? "—"}
                        </div>
                      </div>
                    ),
                  },
                ]}
                isLoading={creditEvents === undefined}
                defaultViewMode="list"
                viewModes={[]}
                enableSearch={true}
                getRowId={(e) => `${e.createdAt}:${e.reason}:${e.amountCents}`}
                emptyState={
                  <div className="text-muted-foreground text-sm">
                    No credit events yet.
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

