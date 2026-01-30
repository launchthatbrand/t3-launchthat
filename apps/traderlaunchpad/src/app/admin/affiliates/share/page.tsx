"use client";

import * as React from "react";

import Image from "next/image";

import {
  AffiliateBecomeCard,
  AffiliateReferralLink,
  AffiliateShareKitCard,
} from "launchthat-plugin-affiliates/frontend";
import type { AffiliateShareKitTemplate } from "launchthat-plugin-affiliates/frontend";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useAction, useConvexAuth, useMutation } from "convex/react";

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

const TERMS_VERSION = "v1";

export default function AdminAffiliatesSharePage() {
  const getDashboard = useAction(api.traderlaunchpad.affiliates.getMyAffiliateDashboard) as (
    args: Record<string, never>,
  ) => Promise<AffiliateDashboard | null>;
  const becomeAffiliate = useMutation(api.traderlaunchpad.affiliates.becomeAffiliate);
  const createShareLink = useMutation(api.traderlaunchpad.affiliates.createMyAffiliateShareLink);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const [data, setData] = React.useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [baseOrigin, setBaseOrigin] = React.useState<string>("http://localhost:3000");
  const [landingPath, setLandingPath] = React.useState<string>("/");
  const [utmCampaign, setUtmCampaign] = React.useState<string>("affiliate");

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
        console.error("[AdminAffiliatesSharePage] getDashboard failed", err);
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
    return buildAffiliateUrl({ baseOrigin, landingPath, referralCode });
  }, [baseOrigin, landingPath, referralCode]);

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
        console.error("[AdminAffiliatesSharePage] qr generation failed", err);
        setQrDataUrl(null);
      }
    })();
  }, [shareUrl]);

  const copyText = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err: unknown) {
      console.error("[AdminAffiliatesSharePage] clipboard write failed", err);
    }
  }, []);

  const shareTemplates = React.useMemo<AffiliateShareKitTemplate[]>(() => {
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
        console.error("[AdminAffiliatesSharePage] createMyAffiliateShareLink failed", err);
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
        console.error("[AdminAffiliatesSharePage] becomeAffiliate failed", err);
        setBecomeError("Failed to create affiliate profile. Please try again.");
      })
      .finally(() => setBecoming(false));
  }, [acceptedTerms, becomeAffiliate, refresh]);

  if (loading) {
    return (
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
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Not available</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          You must be signed in to access your affiliate share kit.
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loading…</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Fetching your affiliate dashboard…
        </CardContent>
      </Card>
    );
  }

  if (!data.profile) {
    return (
      <AffiliateBecomeCard
        acceptedTerms={acceptedTerms}
        onAcceptedTermsChange={setAcceptedTerms}
        onBecome={handleBecomeAffiliate}
        becoming={becoming}
        error={becomeError}
        onRefresh={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AffiliateShareKitCard
        landingPath={landingPath}
        onLandingPathChange={setLandingPath}
        campaign={utmCampaign}
        onCampaignChange={setUtmCampaign}
        referralUrl={referralUrl}
        utmLink={utmLink}
        shortUrl={shortUrl}
        onGenerateShortlink={handleGenerateShortlink}
        shortlinkLoading={shareLoading}
        shortlinkError={shareError}
        templates={shareTemplates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplateId={setSelectedTemplateId}
        onCopy={(text) => {
          void copyText(text);
        }}
        onOpenX={openTwitter}
        onOpenLinkedIn={openLinkedIn}
        onShare={() => {
          const url = shareUrl;
          if (!url) return;
          const shareFn: unknown = (navigator as unknown as { share?: unknown }).share;
          if (typeof shareFn === "function") {
            void (shareFn as (data: { text: string; url: string }) => Promise<void>)({
              text: selectedTemplate.text,
              url,
            });
            return;
          }
          void copyText(url);
        }}
        qrNode={
          qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="Affiliate QR code"
              width={160}
              height={160}
              unoptimized
              className="h-40 w-40 rounded-md border bg-white p-2"
            />
          ) : undefined
        }
        secondaryShareNode={
          referralCode ? (
            <>
              Or share:
              <span className="ml-2">
                <AffiliateReferralLink referralCode={referralCode} baseUrl={baseOrigin} />
              </span>
            </>
          ) : undefined
        }
        creditBalanceCents={data.stats.creditBalanceCents}
      />
    </div>
  );
}

