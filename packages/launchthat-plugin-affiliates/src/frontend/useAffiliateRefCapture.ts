import { useEffect, useMemo, useState } from "react";

type CaptureResult = {
  referralCode: string | null;
  visitorId: string | null;
};

export type UseAffiliateRefCaptureOptions = {
  /**
   * Query param name. Default: "ref"
   */
  param?: string;
  /**
   * Cookie key for the referral code. Default: "lt_aff_ref"
   */
  cookieRefKey?: string;
  /**
   * Cookie key for the visitor id. Default: "lt_aff_vid"
   */
  cookieVisitorKey?: string;
  /**
   * Cookie TTL in days. Default: 30
   */
  days?: number;
  /**
   * Callback invoked when a referral is captured from the URL.
   * Use this to call your backend to `recordClick`.
   */
  onCapture?: (data: { referralCode: string; visitorId: string }) => void;
};

const normalizeReferralCode = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const readCookie = (key: string): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${key}=`)) continue;
    const value = part.slice(`${key}=`.length);
    return decodeURIComponent(value);
  }
  return null;
};

const writeCookie = (key: string, value: string, days: number): void => {
  if (typeof document === "undefined") return;
  const maxAge = Math.max(0, Math.floor(days * 24 * 60 * 60));
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};

const getOrCreateVisitorId = (cookieVisitorKey: string, days: number): string => {
  const existing = readCookie(cookieVisitorKey);
  if (existing && existing.trim()) return existing.trim();
  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `vid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  writeCookie(cookieVisitorKey, next, days);
  return next;
};

/**
 * Capture `?ref=CODE` into first-party cookies.
 *
 * Intended usage:
 * - On landing pages, call this hook and pass `onCapture` that calls your
 *   Convex action/mutation to record the click.
 * - On signup/onboarding, read cookies and call `attributeSignup`.
 */
export const useAffiliateRefCapture = (
  options: UseAffiliateRefCaptureOptions = {},
): CaptureResult => {
  const param = options.param ?? "ref";
  const cookieRefKey = options.cookieRefKey ?? "lt_aff_ref";
  const cookieVisitorKey = options.cookieVisitorKey ?? "lt_aff_vid";
  const days = options.days ?? 30;

  const [state, setState] = useState<CaptureResult>({
    referralCode: null,
    visitorId: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const raw = url.searchParams.get(param) ?? "";
    const referralCode = raw ? normalizeReferralCode(raw) : "";
    const visitorId = getOrCreateVisitorId(cookieVisitorKey, days);

    if (referralCode) {
      writeCookie(cookieRefKey, referralCode, days);
      options.onCapture?.({ referralCode, visitorId });
    }

    const cookieRef = readCookie(cookieRefKey);
    setState({
      referralCode: cookieRef ? normalizeReferralCode(cookieRef) : null,
      visitorId,
    });
  }, [cookieRefKey, cookieVisitorKey, days, options, param]);

  return useMemo(() => state, [state]);
};

