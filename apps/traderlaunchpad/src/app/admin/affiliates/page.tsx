"use client";

import * as React from "react";

import Link from "next/link";

import {
  AffiliateBecomeCard,
  AffiliateAttributedSignupsCard,
  AffiliateDownlineCard,
  AffiliateDashboardCard,
  AffiliatePayoutsCard,
  AffiliateSponsorCard,
} from "launchthat-plugin-affiliates/frontend";
import type {
  AffiliateDownlineRow,
  AffiliateSponsorLink,
  AffiliateRecruitRow,
} from "launchthat-plugin-affiliates/frontend";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";

const buildAffiliateUrl = (args: {
  baseOrigin: string;
  landingPath: string;
  referralCode: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}): string | null => {
  try {
    const base = new URL(args.baseOrigin);
    const path = args.landingPath.startsWith("/") ? args.landingPath : `/${args.landingPath}`;
    base.pathname = path;
    base.searchParams.set("ref", args.referralCode);
    if (args.utmSource) base.searchParams.set("utm_source", args.utmSource);
    if (args.utmMedium) base.searchParams.set("utm_medium", args.utmMedium);
    if (args.utmCampaign) base.searchParams.set("utm_campaign", args.utmCampaign);
    if (args.utmContent) base.searchParams.set("utm_content", args.utmContent);
    return base.toString();
  } catch {
    return null;
  }
};

interface AffiliateDashboard {
  profile: { userId: string; referralCode: string; status: "active" | "disabled" } | null;
  stats: {
    userId: string;
    referralCode: string | null;
    clicks30d: number;
    signups30d: number;
    activations30d: number;
    conversions30d: number;
    creditBalanceCents: number;
  };
}

interface AffiliatePayoutSettings {
  ok: boolean;
  userId: string | null;
  payoutAccount:
    | null
    | { userId: string; provider: string; connectAccountId: string; status: string };
  payoutPreference:
    | null
    | { userId: string; policy: string; currency: string; minPayoutCents?: number };
  creditBalanceCents: number;
  upcomingSubscriptionDueCents: number;
}

const TERMS_VERSION = "v1";

export default function AdminAffiliatesPage() {
  const getDashboard = useAction(api.traderlaunchpad.affiliates.getMyAffiliateDashboard) as (
    args: Record<string, never>,
  ) => Promise<AffiliateDashboard | null>;
  const getPayoutSettings = useAction(api.traderlaunchpad.affiliates.getMyAffiliatePayoutSettings) as (
    args: Record<string, never>,
  ) => Promise<AffiliatePayoutSettings>;
  const createOnboardingLink = useAction(api.traderlaunchpad.affiliates.createMyAffiliatePayoutOnboardingLink) as (
    args: { refreshUrl: string; returnUrl: string },
  ) => Promise<{ url?: string }>;
  const disconnectPayouts = useAction(api.traderlaunchpad.affiliates.disconnectMyAffiliatePayoutAccount) as (
    args: { deleteRemote: boolean },
  ) => Promise<{ ok: boolean }>;
  const becomeAffiliate = useMutation(api.traderlaunchpad.affiliates.becomeAffiliate);
  const setPayoutPreference = useMutation(api.traderlaunchpad.affiliates.setMyAffiliatePayoutPreference);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const sponsorLink = useQuery(
    api.traderlaunchpad.affiliates.getMySponsorLink,
    !authLoading && isAuthenticated ? {} : "skip",
  ) as AffiliateSponsorLink | null | undefined;

  const recruits = useQuery(
    api.traderlaunchpad.affiliates.listMyRecruits,
    !authLoading && isAuthenticated ? { limit: 250 } : "skip",
  ) as AffiliateRecruitRow[] | undefined;

  const directDownline = useQuery(
    api.traderlaunchpad.affiliates.listMyDirectDownline,
    !authLoading && isAuthenticated ? { limit: 250 } : "skip",
  ) as AffiliateDownlineRow[] | undefined;

  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [payout, setPayout] = React.useState<AffiliatePayoutSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [payoutLoading, setPayoutLoading] = React.useState(true);
  const [acceptedTerms, setAcceptedTerms] = React.useState<boolean>(false);
  const [becoming, setBecoming] = React.useState<boolean>(false);
  const [becomeError, setBecomeError] = React.useState<string | null>(null);
  const [payoutError, setPayoutError] = React.useState<string | null>(null);

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

  const refreshPayout = React.useCallback(() => {
    setPayoutLoading(true);
    getPayoutSettings({})
      .then((res) => setPayout(res))
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] getPayoutSettings failed", err);
        setPayout(null);
      })
      .finally(() => setPayoutLoading(false));
  }, [getPayoutSettings]);

  React.useEffect(() => {
    // Wait for Convex auth to resolve before fetching.
    if (authLoading) {
      setLoading(true);
      setPayoutLoading(true);
      return;
    }
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      setPayout(null);
      setPayoutLoading(false);
      return;
    }
    refresh();
    refreshPayout();
  }, [authLoading, isAuthenticated, refresh, refreshPayout]);

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

  const handleStartOnboarding = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setPayoutError(null);
    createOnboardingLink({
      refreshUrl: `${window.location.origin}/admin/affiliates`,
      returnUrl: `${window.location.origin}/admin/affiliates`,
    })
      .then((res) => {
        if (res.url) window.location.href = res.url;
        else setPayoutError("Failed to start onboarding.");
      })
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] createOnboardingLink failed", err);
        setPayoutError("Failed to start onboarding.");
      });
  }, [createOnboardingLink]);

  const handleDisconnectPayouts = React.useCallback(() => {
    setPayoutError(null);
    disconnectPayouts({ deleteRemote: true })
      .then(() => refreshPayout())
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] disconnectPayouts failed", err);
        setPayoutError("Failed to disconnect payouts.");
      });
  }, [disconnectPayouts, refreshPayout]);

  const handleSetPolicy = React.useCallback(
    (policy: "payout_only" | "apply_to_subscription_then_payout") => {
      setPayoutError(null);
      setPayoutPreference({ policy, minPayoutCents: payout?.payoutPreference?.minPayoutCents ?? 0 })
        .then(() => refreshPayout())
        .catch((err: unknown) => {
          console.error("[AdminAffiliatesPage] setPayoutPreference failed", err);
          setPayoutError("Failed to save payout preference.");
        });
    },
    [payout?.payoutPreference?.minPayoutCents, refreshPayout, setPayoutPreference],
  );

  const handleSetMinPayout = React.useCallback(
    (next: number) => {
      const policy =
        payout?.payoutPreference?.policy === "apply_to_subscription_then_payout"
          ? "apply_to_subscription_then_payout"
          : "payout_only";
      setPayoutError(null);
      setPayoutPreference({ policy, minPayoutCents: next })
        .then(() => refreshPayout())
        .catch((err: unknown) => {
          console.error("[AdminAffiliatesPage] setPayoutPreference failed", err);
          setPayoutError("Failed to save payout preference.");
        });
    },
    [payout?.payoutPreference?.policy, refreshPayout, setPayoutPreference],
  );

  const payoutPolicy =
    payout?.payoutPreference?.policy === "apply_to_subscription_then_payout"
      ? "apply_to_subscription_then_payout"
      : "payout_only";
  const minPayoutCents = payout?.payoutPreference?.minPayoutCents ?? 0;
  const payoutAccountStatus = payout?.payoutAccount?.status ?? null;

  const recruitRows = React.useMemo<AffiliateRecruitRow[]>(() => {
    return Array.isArray(recruits) ? recruits : [];
  }, [recruits]);

  const downlineRows = React.useMemo<AffiliateDownlineRow[]>(() => {
    return Array.isArray(directDownline) ? directDownline : [];
  }, [directDownline]);

  const downlineCount = downlineRows.length;
  const attributedSignupsCount = recruitRows.length;

  return (
    <div className="space-y-6">
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
        <AffiliateBecomeCard
          acceptedTerms={acceptedTerms}
          onAcceptedTermsChange={setAcceptedTerms}
          onBecome={handleBecomeAffiliate}
          becoming={becoming}
          error={becomeError}
          onRefresh={refresh}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <AffiliateDashboardCard
              title="Performance"
              stats={{
                clicks30d: data.stats.clicks30d,
                signups30d: data.stats.signups30d,
                activations30d: data.stats.activations30d,
                conversions30d: data.stats.conversions30d,
                creditBalanceCents: data.stats.creditBalanceCents,
              }}
              className="rounded-xl border bg-background p-4 lg:col-span-2"
              footer={
                <div className="text-muted-foreground text-xs">
                  Detailed analytics are available on{" "}
                  <Link href="/admin/affiliates/analytics" className="underline underline-offset-2">
                    the Analytics tab
                  </Link>
                  .
                </div>
              }
            />

            <div className="space-y-6">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link
                    href="/admin/affiliates/share"
                    className="block rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">Share your link</div>
                    <div className="text-muted-foreground text-xs">
                      Generate a shortlink and share templates.
                    </div>
                  </Link>
                  <Link
                    href="/admin/affiliates/analytics"
                    className="block rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">View analytics</div>
                    <div className="text-muted-foreground text-xs">
                      Per-link clicks, signups, and earnings.
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xs text-muted-foreground">Direct downline</div>
                      <div className="mt-1 text-lg font-semibold">{downlineCount}</div>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xs text-muted-foreground">Attributed signups</div>
                      <div className="mt-1 text-lg font-semibold">{attributedSignupsCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AffiliateSponsorCard sponsorLink={sponsorLink} />
            </div>
          </div>

          <AffiliatePayoutsCard
            payoutAccountStatus={payoutAccountStatus}
            payoutPolicy={payoutPolicy}
            minPayoutCents={minPayoutCents}
            creditBalanceCents={payout?.creditBalanceCents ?? 0}
            upcomingSubscriptionDueCents={payout?.upcomingSubscriptionDueCents ?? 0}
            payoutError={payoutError}
            payoutLoading={payoutLoading}
            onConnectOrManage={handleStartOnboarding}
            onDisconnectTest={handleDisconnectPayouts}
            onRefresh={refreshPayout}
            onSetPolicy={handleSetPolicy}
            onSetMinPayoutCents={handleSetMinPayout}
          />

          <AffiliateDownlineCard
            rows={downlineRows}
            isLoading={directDownline === undefined}
          />

          <AffiliateAttributedSignupsCard
            rows={recruitRows}
            isLoading={recruits === undefined}
          />
        </div>
      )}
    </div>
  );
}

