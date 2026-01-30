"use client";

import * as React from "react";

import Image from "next/image";

import { AffiliateDashboardCard, AffiliateReferralLink } from "launchthat-plugin-affiliates/frontend";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";

const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

const stripClerkIssuerPrefix = (userKey: unknown): string => {
  const s = typeof userKey === "string" ? userKey.trim() : "";
  const pipeIdx = s.indexOf("|");
  if (pipeIdx === -1) return s;
  const tail = s.slice(pipeIdx + 1).trim();
  return tail || s;
};

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
  const createShareLink = useMutation(api.traderlaunchpad.affiliates.createMyAffiliateShareLink);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const sponsorLink = useQuery(
    api.traderlaunchpad.affiliates.getMySponsorLink,
    !authLoading && isAuthenticated ? {} : "skip",
  ) as
    | {
        userId: string;
        sponsorUserId: string;
        createdAt: number;
        createdSource: string;
        updatedAt?: number;
        updatedBy?: string;
      }
    | null
    | undefined;

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

  const directDownline = useQuery(
    api.traderlaunchpad.affiliates.listMyDirectDownline,
    !authLoading && isAuthenticated ? { limit: 250 } : "skip",
  ) as
    | {
      userId: string;
      name: string;
      joinedAt: number;
      createdSource: string;
    }[]
    | undefined;

  const creditEvents = useQuery(
    api.traderlaunchpad.affiliates.listMyCreditEvents,
    !authLoading && isAuthenticated ? { limit: 200 } : "skip",
  ) as
    | {
      kind?: string;
      amountCents: number;
      currency: string;
      reason: string;
      externalEventId?: string;
      createdAt: number;
      referredUserId?: string;
      referrerUserId?: string;
      conversionId?: string;
    }[]
    | undefined;

  const topPaths = useQuery(
    api.traderlaunchpad.affiliates.getMyTopLandingPaths,
    !authLoading && isAuthenticated ? { daysBack: 30, limit: 5 } : "skip",
  ) as
    | {
      userId: string;
      referralCode: string | null;
      daysBack: number;
      totalClicks: number;
      topLandingPaths: { path: string; clicks: number }[];
    }
    | undefined;

  const shareLinks = useQuery(
    api.traderlaunchpad.affiliates.listMyAffiliateShareLinks,
    !authLoading && isAuthenticated ? { limit: 50 } : "skip",
  ) as
    | {
      code: string;
      url?: string;
      path: string;
      createdAt: number;
      clickCount?: number;
      lastAccessAt?: number;
      campaign: string;
      templateId: string;
    }[]
    | undefined;

  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [payout, setPayout] = React.useState<AffiliatePayoutSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [payoutLoading, setPayoutLoading] = React.useState(true);
  const [baseOrigin, setBaseOrigin] = React.useState<string>("http://localhost:3000");
  const [landingPath, setLandingPath] = React.useState<string>("/");
  const [copyLabel, setCopyLabel] = React.useState<string>("Copy");
  const [acceptedTerms, setAcceptedTerms] = React.useState<boolean>(false);
  const [becoming, setBecoming] = React.useState<boolean>(false);
  const [becomeError, setBecomeError] = React.useState<string | null>(null);
  const [payoutError, setPayoutError] = React.useState<string | null>(null);

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

  const referralCode = data?.profile?.referralCode ?? null;

  const referralUrl = React.useMemo(() => {
    if (!referralCode) return null;
    return buildAffiliateUrl({ baseOrigin, landingPath, referralCode });
  }, [baseOrigin, landingPath, referralCode]);

  const [utmCampaign, setUtmCampaign] = React.useState<string>("affiliate");
  const utmLink = React.useMemo(() => {
    if (!referralCode) return null;
    return buildAffiliateUrl({
      baseOrigin,
      landingPath,
      referralCode,
      utmSource: "affiliate",
      utmMedium: "share",
      utmCampaign: utmCampaign.trim() || "affiliate",
    });
  }, [baseOrigin, landingPath, referralCode, utmCampaign]);

  const [shortUrl, setShortUrl] = React.useState<string | null>(null);
  const shareUrl = shortUrl ?? utmLink ?? referralUrl;

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    const target = shareUrl;
    if (!target) {
      setQrDataUrl(null);
      return;
    }
    void (async () => {
      try {
        const mod = await import("qrcode");
        const dataUrl = await mod.toDataURL(target, { margin: 1, width: 256 });
        setQrDataUrl(dataUrl);
      } catch (err: unknown) {
        console.error("[AdminAffiliatesPage] qr generation failed", err);
        setQrDataUrl(null);
      }
    })();
  }, [shareUrl]);

  const copyText = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err: unknown) {
      console.error("[AdminAffiliatesPage] clipboard write failed", err);
    }
  }, []);

  const shareTemplates = React.useMemo(() => {
    const safeUrl = shareUrl ?? "";
    return [
      {
        id: "x",
        label: "X / Twitter",
        text: `Track your trades with TraderLaunchpad. Free to start.\n\n${safeUrl}`,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        text: `If you’re journaling trades in spreadsheets, this is a big upgrade.\n\nTry TraderLaunchpad:\n${safeUrl}`,
      },
      {
        id: "sms",
        label: "SMS",
        text: `Try TraderLaunchpad: ${safeUrl}`,
      },
      {
        id: "discord",
        label: "Discord",
        text: `Sharing a trading journal tool I’ve been using: ${safeUrl}`,
      },
      {
        id: "email",
        label: "Email",
        text:
          `Subject: Trading journal that actually makes reviewing easy\n\n` +
          `Hey — sharing TraderLaunchpad. It’s been useful for reviewing trades and spotting patterns.\n\n` +
          `Link: ${safeUrl}\n`,
      },
    ];
  }, [shareUrl]);

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("x");
  const selectedTemplate = React.useMemo(() => {
    const found = shareTemplates.find((t) => t.id === selectedTemplateId);
    if (found) return found;
    return { id: "x", label: "X / Twitter", text: "" };
  }, [selectedTemplateId, shareTemplates]);

  const openTwitter = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", selectedTemplate.text);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }, [selectedTemplate.text]);

  const openLinkedIn = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const url = shareUrl;
    if (!url) return;
    const intent = new URL("https://www.linkedin.com/sharing/share-offsite/");
    intent.searchParams.set("url", url);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  const directEarnings30d = React.useMemo(() => {
    const rows = Array.isArray(creditEvents) ? creditEvents : [];
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const e of rows) {
      if (typeof e.createdAt !== "number" || e.createdAt < since) continue;
      if (e.kind === "commission_direct") sum += e.amountCents;
    }
    return sum;
  }, [creditEvents]);

  const sponsorOverrideEarnings30d = React.useMemo(() => {
    const rows = Array.isArray(creditEvents) ? creditEvents : [];
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const e of rows) {
      if (typeof e.createdAt !== "number" || e.createdAt < since) continue;
      if (e.kind === "commission_sponsor_override") sum += e.amountCents;
    }
    return sum;
  }, [creditEvents]);

  const handleCopy = React.useCallback(() => {
    if (!referralUrl) return;
    copyText(referralUrl)
      .then(() => {
        setCopyLabel("Copied");
        setTimeout(() => setCopyLabel("Copy"), 1200);
      })
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] clipboard copy failed", err);
      });
  }, [copyText, referralUrl]);

  const [shareLoading, setShareLoading] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const handleGenerateShortlink = React.useCallback(() => {
    if (!isAuthenticated || authLoading) return;
    setShareLoading(true);
    setShareError(null);
    setShortUrl(null);
    createShareLink({
      landingPath,
      campaign: utmCampaign.trim() || "affiliate",
      templateId: selectedTemplateId,
    })
      .then((res) => {
        const urlFromServer = typeof res.url === "string" && res.url ? res.url : null;
        const url = urlFromServer ?? `${baseOrigin}/s/${res.code}`;
        setShortUrl(url);
      })
      .catch((err: unknown) => {
        console.error("[AdminAffiliatesPage] createMyAffiliateShareLink failed", err);
        setShareError("Failed to generate short link. Please try again.");
      })
      .finally(() => setShareLoading(false));
  }, [
    authLoading,
    baseOrigin,
    createShareLink,
    isAuthenticated,
    landingPath,
    selectedTemplateId,
    utmCampaign,
  ]);

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

  const recruitRows = React.useMemo(() => {
    return Array.isArray(recruits) ? recruits : [];
  }, [recruits]);

  const downlineRows = React.useMemo(() => {
    return Array.isArray(directDownline) ? directDownline : [];
  }, [directDownline]);

  const shareLinkRows = React.useMemo(() => {
    return Array.isArray(shareLinks) ? shareLinks : [];
  }, [shareLinks]);

  const shareLinkRowsWithMetrics = React.useMemo(() => {
    const recruitsArr = Array.isArray(recruits) ? recruits : [];
    const creditsArr = Array.isArray(creditEvents) ? creditEvents : [];
    return shareLinkRows.map((l) => {
      const since = typeof l.createdAt === "number" ? l.createdAt : 0;
      const signups = recruitsArr.filter((r) => typeof r.attributedAt === "number" && r.attributedAt >= since).length;
      const activations = recruitsArr.filter((r) => typeof r.activatedAt === "number" && r.activatedAt >= since).length;
      const paid = recruitsArr.filter((r) => typeof r.firstPaidConversionAt === "number" && r.firstPaidConversionAt >= since).length;
      const earningsCents = creditsArr.reduce((sum, e) => {
        if (typeof e.createdAt !== "number" || e.createdAt < since) return sum;
        return sum + (typeof e.amountCents === "number" ? e.amountCents : 0);
      }, 0);
      return { ...l, signups, activations, paid, earningsCents };
    });
  }, [creditEvents, recruits, shareLinkRows]);

  const downlineColumns = React.useMemo<
    ColumnDefinition<{ userId: string; name: string; joinedAt: number; createdSource: string }>[]
  >(
    () => [
      {
        id: "name",
        header: "User",
        accessorKey: "name",
        cell: (r: { userId: string; name: string; joinedAt: number; createdSource: string }) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-muted-foreground text-xs font-mono">
              {stripClerkIssuerPrefix(r.userId)}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "joinedAt",
        header: "Joined",
        accessorKey: "joinedAt",
        cell: (r: { userId: string; name: string; joinedAt: number; createdSource: string }) => (
          <div className="whitespace-nowrap text-xs">
            {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : "—"}
          </div>
        ),
        sortable: true,
      },
      {
        id: "source",
        header: "Source",
        accessorKey: "createdSource",
        cell: (r: { userId: string; name: string; joinedAt: number; createdSource: string }) => (
          <div className="text-muted-foreground text-xs">{r.createdSource || "—"}</div>
        ),
        sortable: true,
      },
    ],
    [],
  );

  const shareLinkColumns = React.useMemo<
    ColumnDefinition<{
      code: string;
      url?: string;
      path: string;
      createdAt: number;
      clickCount?: number;
      lastAccessAt?: number;
      campaign: string;
      templateId: string;
      signups: number;
      activations: number;
      paid: number;
      earningsCents: number;
    }>[]
  >(
    () => [
      {
        id: "url",
        header: "Link",
        accessorKey: "code",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => {
          const url = r.url ?? `${baseOrigin}/s/${r.code}`;
          return (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-mono text-xs">{url}</div>
                <div className="text-muted-foreground truncate text-[10px]">{r.path}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  copyText(url).catch((err: unknown) => {
                    console.error("[AdminAffiliatesPage] copy shortlink failed", err);
                  })
                }
              >
                Copy
              </Button>
            </div>
          );
        },
      },
      {
        id: "campaign",
        header: "Campaign",
        accessorKey: "campaign",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => <div className="text-xs">{r.campaign || "—"}</div>,
      },
      {
        id: "template",
        header: "Template",
        accessorKey: "templateId",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => <div className="text-xs">{r.templateId || "—"}</div>,
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => (
          <div className="whitespace-nowrap text-xs">
            {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
          </div>
        ),
        sortable: true,
      },
      {
        id: "clicks",
        header: "Clicks",
        accessorKey: "clickCount",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => <div className="text-xs">{typeof r.clickCount === "number" ? r.clickCount : 0}</div>,
        sortable: true,
      },
      {
        id: "signups",
        header: "Signups",
        accessorKey: "signups",
        cell: (r: { signups: number }) => <div className="text-xs">{r.signups}</div>,
        sortable: true,
      },
      {
        id: "paid",
        header: "Paid",
        accessorKey: "paid",
        cell: (r: { paid: number }) => <div className="text-xs">{r.paid}</div>,
        sortable: true,
      },
      {
        id: "earnings",
        header: "Earnings",
        accessorKey: "earningsCents",
        cell: (r: { earningsCents: number }) => (
          <div className="font-mono text-xs">{formatUsd(r.earningsCents)}</div>
        ),
        sortable: true,
      },
      {
        id: "lastAccessAt",
        header: "Last clicked",
        accessorKey: "lastAccessAt",
        cell: (r: {
          code: string;
          url?: string;
          path: string;
          createdAt: number;
          clickCount?: number;
          lastAccessAt?: number;
          campaign: string;
          templateId: string;
        }) => (
          <div className="whitespace-nowrap text-xs">
            {typeof r.lastAccessAt === "number" && r.lastAccessAt > 0
              ? new Date(r.lastAccessAt).toLocaleString()
              : "—"}
          </div>
        ),
        sortable: true,
      },
    ],
    [baseOrigin, copyText],
  );

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
                <CardTitle className="text-base">Share kit</CardTitle>
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
                  <div className="text-muted-foreground text-xs">Campaign</div>
                  <Input
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="affiliate"
                  />
                  <div className="text-muted-foreground text-xs">
                    Used to build UTM links so you can test which content converts best.
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Input value={utmLink ?? ""} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!utmLink) return;
                        copyText(utmLink).catch((err: unknown) => {
                          console.error("[AdminAffiliatesPage] copy UTM link failed", err);
                        });
                      }}
                      disabled={!utmLink}
                    >
                      Copy UTM link
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

                <div className="grid gap-2">
                  <div className="text-muted-foreground text-xs">Tracked short link</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleGenerateShortlink}
                      disabled={!referralCode || shareLoading}
                    >
                      {shareLoading ? "Generating…" : "Generate short link"}
                    </Button>
                    {shortUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          copyText(shortUrl).catch((err: unknown) => {
                            console.error("[AdminAffiliatesPage] copy shortUrl failed", err);
                          })
                        }
                      >
                        Copy short link
                      </Button>
                    ) : null}
                  </div>
                  <Input value={shortUrl ?? ""} readOnly placeholder={`${baseOrigin}/s/...`} />
                  {shareError ? <div className="text-sm text-destructive">{shareError}</div> : null}
                  <div className="text-muted-foreground text-xs">
                    Use this link in posts. Clicks will be tracked on the shortlink itself.
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-muted-foreground text-xs">Template</div>
                  <div className="flex flex-wrap gap-2">
                    {shareTemplates.map((t) => (
                      <Button
                        key={t.id}
                        type="button"
                        variant={selectedTemplateId === t.id ? "default" : "outline"}
                        onClick={() => setSelectedTemplateId(t.id)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                  <Textarea value={selectedTemplate.text} readOnly className="min-h-[120px]" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        copyText(selectedTemplate.text).catch((err: unknown) => {
                          console.error("[AdminAffiliatesPage] copy template failed", err);
                        });
                      }}
                    >
                      Copy text
                    </Button>
                    <Button type="button" variant="outline" onClick={openTwitter} disabled={!selectedTemplate.text}>
                      Open X
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openLinkedIn}
                      disabled={!shareUrl}
                    >
                      Open LinkedIn
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const url = shareUrl;
                        if (!url) return;
                        const shareFn: unknown = (navigator as unknown as { share?: unknown }).share;
                        if (typeof shareFn === "function") {
                          (shareFn as (data: { text: string; url: string }) => Promise<void>)({
                            text: selectedTemplate.text,
                            url,
                          }).catch((err: unknown) => {
                            console.error("[AdminAffiliatesPage] navigator.share failed", err);
                          });
                          return;
                        }
                        copyText(url).catch((err: unknown) => {
                          console.error("[AdminAffiliatesPage] copy shareUrl failed", err);
                        });
                      }}
                      disabled={!shareUrl}
                    >
                      Share…
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-muted-foreground text-xs">QR code</div>
                  {qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt="Affiliate QR code"
                      width={160}
                      height={160}
                      unoptimized
                      className="h-40 w-40 rounded-md border bg-white p-2"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs">QR not available.</div>
                  )}
                </div>

                <div className="rounded-lg border bg-card p-3 text-sm">
                  <div className="text-muted-foreground text-xs">Credit balance</div>
                  <div className="mt-1 font-semibold">{formatUsd(data.stats.creditBalanceCents)}</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Earnings (30d)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-card p-3">
                    <div className="text-muted-foreground text-xs">Direct commissions</div>
                    <div className="mt-1 text-sm font-semibold">{formatUsd(directEarnings30d)}</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="text-muted-foreground text-xs">Sponsor overrides</div>
                    <div className="mt-1 text-sm font-semibold">{formatUsd(sponsorOverrideEarnings30d)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your sponsor (upline)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sponsorLink === undefined ? (
                    <div className="text-muted-foreground text-sm">Loading…</div>
                  ) : sponsorLink ? (
                    <>
                      <div className="text-sm font-semibold">
                        {stripClerkIssuerPrefix(sponsorLink.sponsorUserId)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Joined{" "}
                        {sponsorLink.createdAt
                          ? new Date(sponsorLink.createdAt).toLocaleString()
                          : "—"}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm">No sponsor linked.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Your share links</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <EntityList
                data={shareLinkRowsWithMetrics}
                columns={shareLinkColumns}
                isLoading={shareLinks === undefined}
                defaultViewMode="list"
                viewModes={[]}
                enableSearch={true}
                getRowId={(r) => r.code}
                emptyState={
                  <div className="text-muted-foreground text-sm">
                    No share links yet. Generate one from the Share kit to start tracking per-post clicks.
                  </div>
                }
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Payouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {payoutLoading ? (
                <div className="text-muted-foreground text-sm">Loading payout settings…</div>
              ) : !payout?.userId ? (
                <div className="text-muted-foreground text-sm">Sign in to manage payouts.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Payout account</div>
                      <div className="text-muted-foreground text-xs">
                        Connect a bank account to receive affiliate payouts.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {payoutAccountStatus ? (
                        <Badge variant={payoutAccountStatus === "enabled" ? "default" : "secondary"}>
                          {payoutAccountStatus}
                        </Badge>
                      ) : (
                        <Badge variant="outline">not connected</Badge>
                      )}
                      <Button type="button" variant="outline" onClick={handleStartOnboarding}>
                        {payoutAccountStatus ? "Manage" : "Connect payouts"}
                      </Button>
                      {payoutAccountStatus ? (
                        <Button type="button" variant="outline" onClick={handleDisconnectPayouts}>
                          Disconnect (test)
                        </Button>
                      ) : null}
                      <Button type="button" variant="outline" onClick={refreshPayout}>
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-muted-foreground text-xs">Credit balance</div>
                      <div className="mt-1 text-sm font-semibold">
                        {formatUsd(payout.creditBalanceCents)}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-muted-foreground text-xs">Next subscription due (est.)</div>
                      <div className="mt-1 text-sm font-semibold">
                        {formatUsd(payout.upcomingSubscriptionDueCents)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Distribution policy</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={payoutPolicy === "payout_only" ? "default" : "outline"}
                        onClick={() => handleSetPolicy("payout_only")}
                      >
                        Payout only
                      </Button>
                      <Button
                        type="button"
                        variant={
                          payoutPolicy === "apply_to_subscription_then_payout" ? "default" : "outline"
                        }
                        onClick={() => handleSetPolicy("apply_to_subscription_then_payout")}
                      >
                        Apply to subscription, then payout remainder
                      </Button>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      If your recruits cancel, you earn $0 and your subscription bills normally.
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Minimum payout</div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={String(Math.round(minPayoutCents / 100))}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const next = Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
                          handleSetMinPayout(next);
                        }}
                        className="w-36"
                      />
                      <div className="text-muted-foreground text-xs">USD</div>
                    </div>
                  </div>

                  {payoutError ? <div className="text-sm text-destructive">{payoutError}</div> : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Network (MLM): direct downline</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-muted-foreground mb-3 text-xs">
                These users explicitly opted into joining your sponsor network. This is separate from signup
                attribution.
              </div>
              <EntityList
                data={downlineRows}
                columns={downlineColumns}
                isLoading={directDownline === undefined}
                defaultViewMode="list"
                viewModes={[]}
                enableSearch={true}
                getRowId={(r) => r.userId}
                emptyState={
                  <div className="text-muted-foreground text-sm">No direct downline yet.</div>
                }
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Attributed signups</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-muted-foreground mb-3 text-xs">
                Users attributed to your referral code during signup (marketing attribution window).
              </div>
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
              <CardTitle className="text-base">Earnings ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {topPaths ? (
                <div className="mb-3 rounded-lg border bg-card p-3">
                  <div className="text-muted-foreground text-xs">
                    Top landing paths (last {topPaths.daysBack}d)
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topPaths.topLandingPaths.length ? (
                      topPaths.topLandingPaths.map((p) => (
                        <Badge key={p.path} variant="secondary">
                          {p.path} · {p.clicks}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-xs">No click data yet.</div>
                    )}
                  </div>
                </div>
              ) : null}
              <EntityList
                data={creditRows}
                columns={[
                  {
                    id: "date",
                    header: "Date",
                    accessorKey: "createdAt",
                    cell: (e: {
                      kind?: string;
                      amountCents: number;
                      currency: string;
                      reason: string;
                      externalEventId?: string;
                      createdAt: number;
                      referredUserId?: string;
                      referrerUserId?: string;
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
                      kind?: string;
                      amountCents: number;
                      currency: string;
                      reason: string;
                      externalEventId?: string;
                      createdAt: number;
                      referredUserId?: string;
                      referrerUserId?: string;
                      conversionId?: string;
                    }) => (
                      <div className="space-y-1">
                        <div className="font-mono text-xs">
                          {formatUsd(e.amountCents)} {e.currency}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {e.kind === "commission_direct"
                            ? "Direct commission"
                            : e.kind === "commission_sponsor_override"
                              ? `Sponsor override (child: ${stripClerkIssuerPrefix(String(e.referrerUserId ?? ""))})`
                              : (e.kind ?? "—")}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "reason",
                    header: "Reason",
                    accessorKey: "reason",
                    cell: (e: {
                      kind?: string;
                      amountCents: number;
                      currency: string;
                      reason: string;
                      externalEventId?: string;
                      createdAt: number;
                      referredUserId?: string;
                      referrerUserId?: string;
                      conversionId?: string;
                    }) => (
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{e.reason}</div>
                        <div className="text-muted-foreground text-xs font-mono">
                          {e.referredUserId ? stripClerkIssuerPrefix(e.referredUserId) : "—"}
                        </div>
                        {e.externalEventId ? (
                          <div className="text-muted-foreground text-[10px] font-mono">
                            {String(e.externalEventId)}
                          </div>
                        ) : null}
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

