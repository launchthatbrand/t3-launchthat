import type { ReactNode } from "react";

export type AffiliateReferralLinkProps = {
  referralCode: string;
  baseUrl: string;
  children?: ReactNode;
  className?: string;
};

const normalizeReferralCode = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const AffiliateReferralLink = ({
  referralCode,
  baseUrl,
  children,
  className,
}: AffiliateReferralLinkProps) => {
  const code = normalizeReferralCode(referralCode);
  const url = new URL(baseUrl);
  url.searchParams.set("ref", code);

  return (
    <a
      href={url.toString()}
      className={className ?? "text-sm font-medium underline underline-offset-4"}
    >
      {children ?? url.toString()}
    </a>
  );
};

