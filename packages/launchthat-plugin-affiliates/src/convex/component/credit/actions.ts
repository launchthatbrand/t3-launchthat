import { v } from "convex/values";
import { mutation } from "../_generated/server";

import { insertAffiliateLog } from "../logs";

const normalizeCurrency = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return s || "USD";
};

const clampCents = (raw: unknown): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

const getBalanceCents = async (ctx: any, userId: string): Promise<number> => {
  const rows = await ctx.db
    .query("affiliateCreditEvents")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId_and_createdAt", (q: any) => q.eq("userId", userId))
    .order("desc")
    .take(5000);
  let balance = 0;
  for (const row of rows) {
    const amount = typeof (row as any).amountCents === "number" ? Number((row as any).amountCents) : 0;
    balance += amount;
  }
  return balance;
};

const clampBps = (raw: unknown, fallback: number): number => {
  const n = typeof raw === "number" ? Math.round(raw) : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(10000, Math.round(n)));
};

const getCommissionSettings = async (
  ctx: any,
  scopeTypeRaw: unknown,
  scopeIdRaw: unknown,
): Promise<{
  mlmEnabled: boolean;
  directCommissionBps: number;
  sponsorOverrideBps: number;
}> => {
  const scopeType =
    scopeTypeRaw === "site" || scopeTypeRaw === "org" || scopeTypeRaw === "app"
      ? scopeTypeRaw
      : ("app" as const);
  const scopeId = typeof scopeIdRaw === "string" ? scopeIdRaw.trim() : "";
  const normalizedScopeId = scopeId || "default";

  const row = await ctx.db
    .query("affiliateProgramSettings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_scope", (q: any) => q.eq("scopeType", scopeType).eq("scopeId", normalizedScopeId))
    .first();

  // Defaults: direct 20%, sponsor override 5%, MLM enabled.
  const mlmEnabled = row ? (row as any).mlmEnabled !== false : true;
  const directCommissionBps = clampBps(row ? (row as any).directCommissionBps : undefined, 2000);
  const sponsorOverrideBps = clampBps(row ? (row as any).sponsorOverrideBps : undefined, 500);
  return { mlmEnabled, directCommissionBps, sponsorOverrideBps };
};

const assertActiveAffiliateProfile = async (ctx: any, userId: string): Promise<boolean> => {
  const row = await ctx.db
    .query("affiliateProfiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
  if (!row) return false;
  return (row as any).status !== "disabled";
};

export const recordCommissionDistributionFromPayment = mutation({
  args: {
    referredUserId: v.string(),
    externalEventId: v.string(),
    grossAmountCents: v.number(),
    currency: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    source: v.optional(v.string()),
    paymentKind: v.optional(v.string()),
    scopeType: v.optional(v.union(v.literal("site"), v.literal("org"), v.literal("app"))),
    scopeId: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
    sponsorUserId: v.union(v.string(), v.null()),
    grossAmountCents: v.number(),
    directCommissionCents: v.number(),
    sponsorOverrideCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const referredUserId = String(args.referredUserId ?? "").trim();
    const externalEventIdRaw = String(args.externalEventId ?? "").trim();
    if (!referredUserId) throw new Error("Missing referredUserId");
    if (!externalEventIdRaw) throw new Error("Missing externalEventId");

    const source = typeof args.source === "string" ? args.source.trim() : "stripe";
    const currency = normalizeCurrency(args.currency);
    const grossAmountCents = clampCents(args.grossAmountCents);
    if (grossAmountCents <= 0) {
      return {
        ok: true,
        created: false,
        referrerUserId: null,
        sponsorUserId: null,
        grossAmountCents: 0,
        directCommissionCents: 0,
        sponsorOverrideCents: 0,
      };
    }
    const occurredAt = typeof args.occurredAt === "number" ? Number(args.occurredAt) : Date.now();

    const { mlmEnabled, directCommissionBps, sponsorOverrideBps } = await getCommissionSettings(
      ctx as any,
      args.scopeType,
      args.scopeId,
    );

    const directCommissionCents = Math.max(
      0,
      Math.round((grossAmountCents * directCommissionBps) / 10000),
    );

    // Resolve direct affiliate (referrer) from attribution.
    const attribution = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
      .first();
    if (!attribution) {
      return {
        ok: true,
        created: false,
        referrerUserId: null,
        sponsorUserId: null,
        grossAmountCents,
        directCommissionCents: 0,
        sponsorOverrideCents: 0,
      };
    }

    const expiresAt =
      typeof (attribution as any).expiresAt === "number" ? Number((attribution as any).expiresAt) : 0;
    if (expiresAt > 0 && occurredAt > expiresAt) {
      return {
        ok: true,
        created: false,
        referrerUserId: null,
        sponsorUserId: null,
        grossAmountCents,
        directCommissionCents: 0,
        sponsorOverrideCents: 0,
      };
    }

    const referrerUserId = String((attribution as any).referrerUserId ?? "").trim();
    if (!referrerUserId || referrerUserId === referredUserId) {
      return {
        ok: true,
        created: false,
        referrerUserId: null,
        sponsorUserId: null,
        grossAmountCents,
        directCommissionCents: 0,
        sponsorOverrideCents: 0,
      };
    }

    const utmContent =
      typeof (attribution as any).utmContent === "string"
        ? String((attribution as any).utmContent)
        : undefined;
    const shortlinkCode =
      typeof (attribution as any).shortlinkCode === "string"
        ? String((attribution as any).shortlinkCode)
        : undefined;

    // Record conversion (gross revenue) once.
    const externalId = `${source}:${externalEventIdRaw}`;
    const conversionKind =
      typeof args.paymentKind === "string" && args.paymentKind.includes("subscription")
        ? ("paid_subscription" as const)
        : ("paid_order" as const);
    const existingConversion = await ctx.db
      .query("affiliateConversions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_externalId_and_kind", (q: any) => q.eq("externalId", externalId).eq("kind", conversionKind))
      .first();
    if (!existingConversion) {
      await ctx.db.insert("affiliateConversions", {
        kind: conversionKind,
        externalId,
        referredUserId,
        referrerUserId,
        utmContent,
        shortlinkCode,
        amountCents: grossAmountCents,
        currency,
        occurredAt,
      });

      await insertAffiliateLog(ctx as any, {
        ts: occurredAt,
        kind: "conversion_recorded",
        ownerUserId: referrerUserId,
        message: `Conversion recorded (${typeof args.paymentKind === "string" ? args.paymentKind : "payment"})`,
        referredUserId,
        externalId: externalEventIdRaw,
        amountCents: grossAmountCents,
        currency,
        data: {
          source,
          externalEventId: externalEventIdRaw,
          paymentKind: args.paymentKind,
          directCommissionBps,
          sponsorOverrideBps,
          mlmEnabled,
        },
      });
    }

    // Direct commission credit (idempotent per user+externalEventId).
    const directExternalEventId = `${source}:${externalEventIdRaw}:direct`;
    const existingDirect = await ctx.db
      .query("affiliateCreditEvents")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_externalEventId", (q: any) =>
        q.eq("userId", referrerUserId).eq("externalEventId", directExternalEventId),
      )
      .first();

    let created = false;
    if (!existingDirect && directCommissionCents > 0) {
      await ctx.db.insert("affiliateCreditEvents", {
        userId: referrerUserId,
        kind: "commission_direct",
        amountCents: directCommissionCents,
        currency,
        reason: `commission:direct:${source}:${externalEventIdRaw}`,
        externalEventId: directExternalEventId,
        source,
        referrerUserId,
        referredUserId,
        utmContent,
        shortlinkCode,
        createdAt: occurredAt,
      });
      created = true;

      await insertAffiliateLog(ctx as any, {
        ts: occurredAt,
        kind: "commission_recorded",
        ownerUserId: referrerUserId,
        message: `Commission credited (direct ${directCommissionBps} bps)`,
        referredUserId,
        externalId: externalEventIdRaw,
        amountCents: directCommissionCents,
        currency,
        data: {
          source,
          externalEventId: externalEventIdRaw,
          paymentKind: args.paymentKind,
          grossAmountCents,
          commissionRole: "direct",
          commissionBps: directCommissionBps,
        },
      });
    }

    // Sponsor override (one level up).
    let sponsorUserId: string | null = null;
    let sponsorOverrideCents = 0;
    if (mlmEnabled && sponsorOverrideBps > 0) {
      const link = await ctx.db
        .query("affiliateSponsorLinks")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_userId", (q: any) => q.eq("userId", referrerUserId))
        .first();
      const rawSponsorUserId =
        link && typeof (link as any).sponsorUserId === "string" ? String((link as any).sponsorUserId).trim() : "";
      if (rawSponsorUserId && rawSponsorUserId !== referrerUserId) {
        const sponsorOk = await assertActiveAffiliateProfile(ctx as any, rawSponsorUserId);
        if (sponsorOk) {
          sponsorUserId = rawSponsorUserId;
          sponsorOverrideCents = Math.max(
            0,
            Math.round((grossAmountCents * sponsorOverrideBps) / 10000),
          );
          if (sponsorOverrideCents > 0) {
            const sponsorExternalEventId = `${source}:${externalEventIdRaw}:sponsor_override`;
            const existingSponsor = await ctx.db
              .query("affiliateCreditEvents")
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .withIndex("by_userId_and_externalEventId", (q: any) =>
                q.eq("userId", sponsorUserId).eq("externalEventId", sponsorExternalEventId),
              )
              .first();
            if (!existingSponsor) {
              await ctx.db.insert("affiliateCreditEvents", {
                userId: sponsorUserId,
                kind: "commission_sponsor_override",
                amountCents: sponsorOverrideCents,
                currency,
                reason: `commission:sponsor_override:${source}:${externalEventIdRaw}`,
                externalEventId: sponsorExternalEventId,
                source,
                referrerUserId, // the direct affiliate (child)
                referredUserId, // the buyer
                utmContent,
                shortlinkCode,
                createdAt: occurredAt,
              });
              created = true;

              await insertAffiliateLog(ctx as any, {
                ts: occurredAt,
                kind: "commission_recorded",
                ownerUserId: sponsorUserId,
                message: `Commission credited (sponsor override ${sponsorOverrideBps} bps)`,
                referredUserId,
                externalId: externalEventIdRaw,
                amountCents: sponsorOverrideCents,
                currency,
                data: {
                  source,
                  externalEventId: externalEventIdRaw,
                  paymentKind: args.paymentKind,
                  grossAmountCents,
                  commissionRole: "sponsor_override",
                  commissionBps: sponsorOverrideBps,
                  childAffiliateUserId: referrerUserId,
                },
              });
            }
          }
        }
      }
    }

    return {
      ok: true,
      created,
      referrerUserId,
      sponsorUserId,
      grossAmountCents,
      directCommissionCents,
      sponsorOverrideCents,
    };
  },
});

export const recordCommissionFromPayment = mutation({
  args: {
    referredUserId: v.string(),
    externalEventId: v.string(),
    grossAmountCents: v.number(),
    amountCents: v.number(),
    commissionRateBps: v.optional(v.number()),
    currency: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    source: v.optional(v.string()),
    paymentKind: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
    grossAmountCents: v.number(),
    amountCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const referredUserId = String(args.referredUserId ?? "").trim();
    const externalEventIdRaw = String(args.externalEventId ?? "").trim();
    if (!referredUserId) throw new Error("Missing referredUserId");
    if (!externalEventIdRaw) throw new Error("Missing externalEventId");

    const source = typeof args.source === "string" ? args.source.trim() : "stripe";
    const externalEventId = `${source}:${externalEventIdRaw}`;
    const currency = normalizeCurrency(args.currency);
    const grossAmountCents = clampCents(args.grossAmountCents);
    const amountCents = clampCents(args.amountCents);
    if (grossAmountCents <= 0 || amountCents <= 0) {
      return { ok: true, created: false, referrerUserId: null, grossAmountCents: 0, amountCents: 0 };
    }

    const occurredAt = typeof args.occurredAt === "number" ? Number(args.occurredAt) : Date.now();

    const attribution = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
      .first();
    if (!attribution) {
      return { ok: true, created: false, referrerUserId: null, grossAmountCents: 0, amountCents: 0 };
    }

    const expiresAt =
      typeof (attribution as any).expiresAt === "number" ? Number((attribution as any).expiresAt) : 0;
    if (expiresAt > 0 && occurredAt > expiresAt) {
      return { ok: true, created: false, referrerUserId: null, grossAmountCents: 0, amountCents: 0 };
    }

    const referrerUserId = String((attribution as any).referrerUserId ?? "").trim();
    if (!referrerUserId || referrerUserId === referredUserId) {
      return { ok: true, created: false, referrerUserId: null, grossAmountCents: 0, amountCents: 0 };
    }

    const utmContent =
      typeof (attribution as any).utmContent === "string"
        ? String((attribution as any).utmContent)
        : undefined;
    const shortlinkCode =
      typeof (attribution as any).shortlinkCode === "string"
        ? String((attribution as any).shortlinkCode)
        : undefined;

    const existing = await ctx.db
      .query("affiliateCreditEvents")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_externalEventId", (q: any) =>
        q.eq("userId", referrerUserId).eq("externalEventId", externalEventId),
      )
      .first();
    if (existing) {
      return { ok: true, created: false, referrerUserId, grossAmountCents: 0, amountCents: 0 };
    }

    const reason = `commission:${source}:${externalEventIdRaw}`;

    const conversionKind =
      typeof args.paymentKind === "string" && args.paymentKind.includes("subscription")
        ? ("paid_subscription" as const)
        : ("paid_order" as const);
    const existingConversion = await ctx.db
      .query("affiliateConversions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_externalId_and_kind", (q: any) =>
        q.eq("externalId", externalEventId).eq("kind", conversionKind),
      )
      .first();
    if (!existingConversion) {
      await ctx.db.insert("affiliateConversions", {
        kind: conversionKind,
        externalId: externalEventId,
        referredUserId,
        referrerUserId,
        utmContent,
        shortlinkCode,
        amountCents: grossAmountCents,
        currency,
        occurredAt,
      });

      await insertAffiliateLog(ctx as any, {
        ts: occurredAt,
        kind: "conversion_recorded",
        ownerUserId: referrerUserId,
        message: `Conversion recorded (${typeof args.paymentKind === "string" ? args.paymentKind : "payment"})`,
        referredUserId,
        externalId: externalEventIdRaw,
        amountCents: grossAmountCents,
        currency,
        data: {
          source,
          externalEventId: externalEventIdRaw,
          paymentKind: args.paymentKind,
          commissionRateBps:
            typeof args.commissionRateBps === "number" ? Math.round(args.commissionRateBps) : undefined,
        },
      });
    }

    await ctx.db.insert("affiliateCreditEvents", {
      userId: referrerUserId,
      kind: "commission",
      amountCents,
      currency,
      reason,
      externalEventId,
      source,
      referrerUserId,
      referredUserId,
      utmContent,
      shortlinkCode,
      createdAt: occurredAt,
    });

    await insertAffiliateLog(ctx as any, {
      ts: occurredAt,
      kind: "commission_recorded",
      ownerUserId: referrerUserId,
      message: `Commission credited (${typeof args.paymentKind === "string" ? args.paymentKind : "payment"})`,
      referredUserId,
      externalId: externalEventIdRaw,
      amountCents,
      currency,
      data: {
        source,
        externalEventId: externalEventIdRaw,
        paymentKind: args.paymentKind,
        grossAmountCents,
        commissionRateBps:
          typeof args.commissionRateBps === "number" ? Math.round(args.commissionRateBps) : undefined,
      },
    });

    return { ok: true, created: true, referrerUserId, grossAmountCents, amountCents };
  },
});

export const consumeForPayout = mutation({
  args: {
    userId: v.string(),
    runId: v.string(),
    cashCents: v.optional(v.number()),
    subscriptionCreditCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    balanceCents: v.number(),
    consumedCashCents: v.number(),
    consumedSubscriptionCreditCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    const runId = String(args.runId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    if (!runId) throw new Error("Missing runId");

    const source = typeof args.source === "string" ? args.source.trim() : "ecommerce";
    const currency = normalizeCurrency(args.currency);

    const cashCents = clampCents(args.cashCents);
    const subscriptionCreditCents = clampCents(args.subscriptionCreditCents);
    const total = cashCents + subscriptionCreditCents;
    if (total <= 0) {
      const bal = await getBalanceCents(ctx as any, userId);
      return { ok: true, balanceCents: bal, consumedCashCents: 0, consumedSubscriptionCreditCents: 0 };
    }

    const balance = await getBalanceCents(ctx as any, userId);
    if (balance < total) throw new Error("Insufficient balance");

    const now = Date.now();

    const consumeOne = async (kind: "payout_cash" | "payout_subscription_credit", cents: number) => {
      if (cents <= 0) return;
      const externalEventId = `${source}:payout:${runId}:${kind}`;
      const existing = await ctx.db
        .query("affiliateCreditEvents")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_userId_and_externalEventId", (q: any) =>
          q.eq("userId", userId).eq("externalEventId", externalEventId),
        )
        .first();
      if (existing) return;

      await ctx.db.insert("affiliateCreditEvents", {
        userId,
        kind,
        amountCents: -cents,
        currency,
        reason: `payout:${kind}`,
        externalEventId,
        source,
        createdAt: now,
      });
    };

    await consumeOne("payout_subscription_credit", subscriptionCreditCents);
    await consumeOne("payout_cash", cashCents);

    await insertAffiliateLog(ctx as any, {
      ts: now,
      kind: "payout_consumed",
      ownerUserId: userId,
      message: `Payout consumed (run ${runId})`,
      amountCents: -total,
      currency,
      data: {
        runId,
        cashCents,
        subscriptionCreditCents,
        source,
      },
    });

    const nextBalance = await getBalanceCents(ctx as any, userId);
    return {
      ok: true,
      balanceCents: nextBalance,
      consumedCashCents: cashCents,
      consumedSubscriptionCreditCents: subscriptionCreditCents,
    };
  },
});

