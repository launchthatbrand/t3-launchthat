export type AffiliateLogKind =
  | "profile_created"
  | "profile_status_changed"
  | "click_logged"
  | "signup_attributed"
  | "activated"
  | "conversion_recorded"
  | "commission_recorded"
  | "sponsor_linked"
  | "sponsor_changed"
  | "payout_consumed"
  | "credit_event"
  | "benefit_granted";

export type InsertAffiliateLogArgs = {
  ts?: number;
  kind: AffiliateLogKind;
  ownerUserId: string;
  message: string;
  data?: unknown;
  referralCode?: string;
  visitorId?: string;
  referredUserId?: string;
  externalId?: string;
  amountCents?: number;
  currency?: string;
};

export const insertAffiliateLog = async (
  ctx: any,
  args: InsertAffiliateLogArgs,
): Promise<void> => {
  const ownerUserId = String(args.ownerUserId ?? "").trim();
  if (!ownerUserId) return;

  const ts = typeof args.ts === "number" ? args.ts : Date.now();
  await ctx.db.insert("affiliateLogs", {
    ts,
    kind: String(args.kind),
    ownerUserId,
    message: String(args.message ?? ""),
    data: args.data,
    referralCode: args.referralCode,
    visitorId: args.visitorId,
    referredUserId: args.referredUserId,
    externalId: args.externalId,
    amountCents: args.amountCents,
    currency: args.currency,
  });
};

