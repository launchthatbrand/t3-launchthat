import { v } from "convex/values";
import { mutation } from "../_generated/server";

const normalizeCurrency = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return s || "USD";
};

const clampCents = (raw: unknown): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

export const setPayoutPreference = mutation({
  args: {
    userId: v.string(),
    policy: v.union(v.literal("payout_only"), v.literal("apply_to_subscription_then_payout")),
    currency: v.optional(v.string()),
    minPayoutCents: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const policy = args.policy;
    const currency = normalizeCurrency(args.currency);
    const minPayoutCents = clampCents(args.minPayoutCents ?? 0);

    const now = Date.now();
    const existing = await ctx.db
      .query("payoutPreferences")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        policy,
        currency,
        minPayoutCents,
        updatedAt: now,
      });
      return { ok: true };
    }
    await ctx.db.insert("payoutPreferences", {
      userId,
      policy,
      currency,
      minPayoutCents,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const upsertPayoutAccount = mutation({
  args: {
    userId: v.string(),
    provider: v.optional(v.string()),
    connectAccountId: v.string(),
    status: v.string(),
    details: v.optional(v.any()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const provider = typeof args.provider === "string" ? args.provider.trim() : "stripe";
    const connectAccountId = String(args.connectAccountId ?? "").trim();
    if (!connectAccountId) throw new Error("Missing connectAccountId");

    const now = Date.now();
    const existing = await ctx.db
      .query("payoutAccounts")
      .withIndex("by_provider_and_userId", (q: any) =>
        q.eq("provider", provider).eq("userId", userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        connectAccountId,
        status: String(args.status ?? ""),
        details: args.details,
        updatedAt: now,
      });
      return { ok: true, created: false };
    }

    await ctx.db.insert("payoutAccounts", {
      userId,
      provider,
      connectAccountId,
      status: String(args.status ?? ""),
      details: args.details,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, created: true };
  },
});

export const deletePayoutAccount = mutation({
  args: {
    userId: v.string(),
    provider: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    deleted: v.boolean(),
    connectAccountId: v.optional(v.string()),
  }),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const provider = typeof args.provider === "string" ? args.provider.trim() : "stripe";

    const existing = await ctx.db
      .query("payoutAccounts")
      .withIndex("by_provider_and_userId", (q: any) =>
        q.eq("provider", provider).eq("userId", userId),
      )
      .first();

    if (!existing) return { ok: true, deleted: false };

    const connectAccountId =
      typeof existing.connectAccountId === "string" ? existing.connectAccountId : undefined;
    await ctx.db.delete(existing._id);
    return { ok: true, deleted: true, connectAccountId };
  },
});

