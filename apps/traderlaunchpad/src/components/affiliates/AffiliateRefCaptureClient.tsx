"use client";

import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { useAffiliateRefCapture } from "launchthat-plugin-affiliates/frontend";

import { api } from "@convex-config/_generated/api";

export function AffiliateRefCaptureClient() {
  const recordClick = useMutation(api.traderlaunchpad.affiliates.recordClick);

  const handleCapture = useCallback(
    ({ referralCode, visitorId }: { referralCode: string; visitorId: string }) => {
      const landingPath =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const referrer =
        typeof document !== "undefined" && document.referrer
          ? document.referrer
          : undefined;

      recordClick({
        referralCode,
        visitorId,
        landingPath,
        referrer,
      }).catch((err: unknown) => {
        console.error("[AffiliateRefCaptureClient] recordClick failed", err);
      });
    },
    [recordClick],
  );

  const options = useMemo(
    () => ({
      onCapture: handleCapture,
      cookieRefKey: "lt_aff_ref",
      cookieVisitorKey: "lt_aff_vid",
      days: 30,
    }),
    [handleCapture],
  );

  useAffiliateRefCapture(options);

  return null;
}

