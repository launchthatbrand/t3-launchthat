import { v } from "convex/values";
import { mutation } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const normalizeCurrency = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return s || "USD";
};

const clampCents = (raw: unknown): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

export const recordCommissionablePayment = mutation({
  args: {
    source: v.string(), // e.g. "stripe"
    kind: v.string(), // e.g. "subscription_invoice_paid"
    externalEventId: v.string(), // invoice.id / payment_intent.id
    referredUserId: v.string(),
    amountCents: v.number(), // gross amount paid in cents
    currency: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    // For future: allow custom commission rates per program/plan
    commissionRateBps: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
    commissionCents: v.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const source = String(args.source ?? "").trim();
    const kind = String(args.kind ?? "").trim();
    const externalEventId = String(args.externalEventId ?? "").trim();
    const referredUserId = String(args.referredUserId ?? "").trim();
    if (!source) throw new Error("Missing source");
    if (!externalEventId) throw new Error("Missing externalEventId");
    if (!referredUserId) throw new Error("Missing referredUserId");

    const amountCents = clampCents(args.amountCents);
    const currency = normalizeCurrency(args.currency);
    const occurredAt = typeof args.occurredAt === "number" ? Number(args.occurredAt) : Date.now();

    // MVP: default 20% commission
    const commissionRateBpsRaw =
      typeof args.commissionRateBps === "number" ? Math.round(args.commissionRateBps) : 2000;
    const commissionRateBps = Math.max(0, Math.min(10000, commissionRateBpsRaw));
    const commissionCents = Math.max(0, Math.round((amountCents * commissionRateBps) / 10000));
    if (commissionCents <= 0) {
      return { ok: true, created: false, referrerUserId: null, commissionCents: 0 };
    }

    const res: any = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.credit.actions.recordCommissionFromPayment,
      {
        referredUserId,
        externalEventId,
        grossAmountCents: amountCents,
        amountCents: commissionCents,
        commissionRateBps,
        currency,
        occurredAt,
        source,
        paymentKind: kind,
      },
    );

    return {
      ok: true,
      created: Boolean(res?.created),
      referrerUserId: typeof res?.referrerUserId === "string" ? res.referrerUserId : null,
      commissionCents,
    };
  },
});

