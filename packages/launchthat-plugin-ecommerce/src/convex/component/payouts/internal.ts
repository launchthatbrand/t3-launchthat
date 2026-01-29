import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const listPayoutPreferences = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      policy: v.string(),
      currency: v.string(),
      minPayoutCents: v.number(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const limitRaw = typeof args.limit === "number" ? args.limit : 5000;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));
    const rows = await ctx.db.query("payoutPreferences").order("desc").take(limit);
    return rows.map((row: any) => ({
      userId: String(row.userId ?? ""),
      policy: String(row.policy ?? ""),
      currency: String(row.currency ?? "USD").toUpperCase(),
      minPayoutCents: typeof row.minPayoutCents === "number" ? Number(row.minPayoutCents) : 0,
    }));
  },
});

export const getPayoutAccountByProviderUserId = internalQuery({
  args: { userId: v.string(), provider: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("payoutAccounts"),
      userId: v.string(),
      provider: v.string(),
      connectAccountId: v.string(),
      status: v.string(),
      details: v.optional(v.any()),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    const provider = String(args.provider ?? "").trim();
    if (!userId || !provider) return null;
    const row = await ctx.db
      .query("payoutAccounts")
      .withIndex("by_provider_and_userId", (q: any) =>
        q.eq("provider", provider).eq("userId", userId),
      )
      .first();
    if (!row) return null;
    return {
      _id: row._id,
      userId: String(row.userId ?? ""),
      provider: String(row.provider ?? ""),
      connectAccountId: String(row.connectAccountId ?? ""),
      status: String(row.status ?? ""),
      details: row.details,
    };
  },
});

export const createPayoutRun = internalMutation({
  args: {
    provider: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    status: v.string(),
  },
  returns: v.id("payoutRuns"),
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("payoutRuns", {
      provider: String(args.provider ?? ""),
      periodStart: Number(args.periodStart ?? 0),
      periodEnd: Number(args.periodEnd ?? 0),
      status: String(args.status ?? "running"),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const patchPayoutRunStatus = internalMutation({
  args: { runId: v.id("payoutRuns"), status: v.string() },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.runId, { status: String(args.status ?? ""), updatedAt: Date.now() });
    return null;
  },
});

export const insertPayoutTransfer = internalMutation({
  args: {
    runId: v.id("payoutRuns"),
    provider: v.string(),
    userId: v.string(),
    currency: v.string(),
    cashCents: v.number(),
    subscriptionCreditCents: v.number(),
  },
  returns: v.id("payoutTransfers"),
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("payoutTransfers", {
      runId: args.runId,
      provider: String(args.provider ?? ""),
      userId: String(args.userId ?? ""),
      currency: String(args.currency ?? "USD").toUpperCase(),
      cashCents: Math.max(0, Math.round(args.cashCents ?? 0)),
      subscriptionCreditCents: Math.max(0, Math.round(args.subscriptionCreditCents ?? 0)),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const patchPayoutTransfer = internalMutation({
  args: {
    transferRowId: v.id("payoutTransfers"),
    status: v.string(),
    externalTransferId: v.optional(v.string()),
    externalBalanceTxnId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.transferRowId, {
      status: String(args.status ?? ""),
      externalTransferId: args.externalTransferId,
      externalBalanceTxnId: args.externalBalanceTxnId,
      error: args.error,
      updatedAt: Date.now(),
    });
    return null;
  },
});

