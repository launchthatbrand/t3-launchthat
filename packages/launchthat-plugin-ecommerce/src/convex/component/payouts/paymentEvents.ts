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
    scopeType: v.optional(v.union(v.literal("site"), v.literal("org"), v.literal("app"))),
    scopeId: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
    directCommissionCents: v.number(),
    sponsorOverrideCents: v.number(),
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

    const res: any = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.credit.actions.recordCommissionDistributionFromPayment,
      {
        referredUserId,
        externalEventId,
        grossAmountCents: amountCents,
        currency,
        occurredAt,
        source,
        paymentKind: kind,
        scopeType: args.scopeType,
        scopeId: args.scopeId,
      },
    );

    return {
      ok: true,
      created: Boolean(res?.created),
      referrerUserId: typeof res?.referrerUserId === "string" ? res.referrerUserId : null,
      directCommissionCents:
        typeof res?.directCommissionCents === "number" ? Math.max(0, Math.round(res.directCommissionCents)) : 0,
      sponsorOverrideCents:
        typeof res?.sponsorOverrideCents === "number" ? Math.max(0, Math.round(res.sponsorOverrideCents)) : 0,
    };
  },
});

