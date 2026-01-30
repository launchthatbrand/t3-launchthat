"use client";

import * as React from "react";

import {
  AffiliateDashboardCard,
  AffiliateEarnings30dCard,
  AffiliateEarningsLedgerCard,
  AffiliateShareLinksCard,
} from "launchthat-plugin-affiliates/frontend";
import type {
  AffiliateCreditEventRow,
  AffiliateRecruitRow,
  AffiliateShareLinkRow,
  AffiliateTopLandingPaths,
} from "launchthat-plugin-affiliates/frontend";
import { useAction, useConvexAuth, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";

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

export default function AdminAffiliatesAnalyticsPage() {
  const getDashboard = useAction(api.traderlaunchpad.affiliates.getMyAffiliateDashboard) as (
    args: Record<string, never>,
  ) => Promise<AffiliateDashboard | null>;

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const recruits = useQuery(
    api.traderlaunchpad.affiliates.listMyRecruits,
    !authLoading && isAuthenticated ? { limit: 250 } : "skip",
  ) as AffiliateRecruitRow[] | undefined;

  const creditEvents = useQuery(
    api.traderlaunchpad.affiliates.listMyCreditEvents,
    !authLoading && isAuthenticated ? { limit: 200 } : "skip",
  ) as AffiliateCreditEventRow[] | undefined;

  const topPaths = useQuery(
    api.traderlaunchpad.affiliates.getMyTopLandingPaths,
    !authLoading && isAuthenticated ? { daysBack: 30, limit: 8 } : "skip",
  ) as AffiliateTopLandingPaths | undefined;

  type AffiliateShareLinkRaw = Omit<
    AffiliateShareLinkRow,
    "signups" | "activations" | "paid" | "earningsCents"
  >;
  const shareLinks = useQuery(
    api.traderlaunchpad.affiliates.listMyAffiliateShareLinks,
    !authLoading && isAuthenticated ? { limit: 50 } : "skip",
  ) as AffiliateShareLinkRaw[] | undefined;

  const [baseOrigin, setBaseOrigin] = React.useState<string>("http://localhost:3000");
  React.useEffect(() => {
    if (typeof window !== "undefined") setBaseOrigin(window.location.origin);
  }, []);

  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDashboard({})
      .then((res) => setData(res))
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesAnalyticsPage] getDashboard failed", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [authLoading, getDashboard, isAuthenticated]);

  const creditRows = React.useMemo<AffiliateCreditEventRow[]>(() => {
    return Array.isArray(creditEvents) ? creditEvents : [];
  }, [creditEvents]);

  const recruitsRows = React.useMemo<AffiliateRecruitRow[]>(() => {
    return Array.isArray(recruits) ? recruits : [];
  }, [recruits]);

  const shareLinkRows = React.useMemo<AffiliateShareLinkRaw[]>(() => {
    return Array.isArray(shareLinks) ? shareLinks : [];
  }, [shareLinks]);

  const shareLinkRowsWithMetrics = React.useMemo<AffiliateShareLinkRow[]>(() => {
    return shareLinkRows.map((l) => {
      const code = typeof l.code === "string" ? l.code.trim() : "";
      const templateId = typeof l.templateId === "string" ? l.templateId.trim() : "";

      // Signup-side attribution (first-touch) gives us utmContent + shortlinkCode.
      const signups = recruitsRows.filter((r) => {
        const utmContent = typeof r.utmContent === "string" ? r.utmContent : "";
        const shortlinkCode = typeof r.shortlinkCode === "string" ? r.shortlinkCode : "";
        return (code && shortlinkCode === code) || (templateId && utmContent === templateId);
      }).length;

      const activations = recruitsRows.filter((r) => {
        if (typeof r.activatedAt !== "number") return false;
        const utmContent = typeof r.utmContent === "string" ? r.utmContent : "";
        const shortlinkCode = typeof r.shortlinkCode === "string" ? r.shortlinkCode : "";
        return (code && shortlinkCode === code) || (templateId && utmContent === templateId);
      }).length;

      const paid = recruitsRows.filter((r) => {
        if (typeof r.firstPaidConversionAt !== "number") return false;
        const utmContent = typeof r.utmContent === "string" ? r.utmContent : "";
        const shortlinkCode = typeof r.shortlinkCode === "string" ? r.shortlinkCode : "";
        return (code && shortlinkCode === code) || (templateId && utmContent === templateId);
      }).length;

      const earningsCents = creditRows.reduce((sum, e) => {
        const utmContent = typeof e.utmContent === "string" ? e.utmContent : "";
        const shortlinkCode = typeof e.shortlinkCode === "string" ? e.shortlinkCode : "";
        const matches = (code && shortlinkCode === code) || (templateId && utmContent === templateId);
        if (!matches) return sum;
        return sum + (typeof e.amountCents === "number" ? e.amountCents : 0);
      }, 0);

      return { ...l, signups, activations, paid, earningsCents };
    });
  }, [creditRows, recruitsRows, shareLinkRows]);

  const directEarnings30d = React.useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const e of creditRows) {
      if (typeof e.createdAt !== "number" || e.createdAt < since) continue;
      if (e.kind === "commission_direct") sum += e.amountCents;
    }
    return sum;
  }, [creditRows]);

  const sponsorOverrideEarnings30d = React.useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const e of creditRows) {
      if (typeof e.createdAt !== "number" || e.createdAt < since) continue;
      if (e.kind === "commission_sponsor_override") sum += e.amountCents;
    }
    return sum;
  }, [creditRows]);

  const copyText = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err: unknown) {
      console.error("[AdminAffiliatesAnalyticsPage] clipboard write failed", err);
    }
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-60 w-full animate-pulse rounded-xl border bg-muted/30" />
        <div className="h-60 w-full animate-pulse rounded-xl border bg-muted/30" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border bg-background p-4 text-muted-foreground text-sm">
        You must be signed in to view analytics.
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="rounded-xl border bg-background p-4 text-muted-foreground text-sm">
        Create an affiliate profile first to view analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
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
              Clicks are tracked via shortlinks + referral tracking.
            </div>
          }
        />

        <AffiliateEarnings30dCard
          directEarningsCents={directEarnings30d}
          sponsorOverrideEarningsCents={sponsorOverrideEarnings30d}
        />
      </div>

      <AffiliateShareLinksCard
        baseOrigin={baseOrigin}
        rows={shareLinkRowsWithMetrics}
        isLoading={shareLinks === undefined}
        onCopy={(text) => {
          void copyText(text);
        }}
      />

      <AffiliateEarningsLedgerCard
        creditRows={creditRows}
        isLoading={creditEvents === undefined}
        topPaths={topPaths}
      />
    </div>
  );
}

