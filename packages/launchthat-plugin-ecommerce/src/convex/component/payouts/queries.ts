import { v } from "convex/values";
import { query } from "../_generated/server";

export const getPayoutAccount = query({
  args: { userId: v.string(), provider: v.optional(v.string()) },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      provider: v.string(),
      connectAccountId: v.string(),
      status: v.string(),
      details: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const provider = typeof args.provider === "string" ? args.provider.trim() : "stripe";
    const row = await ctx.db
      .query("payoutAccounts")
      .withIndex("by_provider_and_userId", (q: any) =>
        q.eq("provider", provider).eq("userId", userId),
      )
      .first();
    if (!row) return null;
    return {
      userId: String(row.userId ?? ""),
      provider: String(row.provider ?? ""),
      connectAccountId: String(row.connectAccountId ?? ""),
      status: String(row.status ?? ""),
      details: row.details,
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
    };
  },
});

export const getPayoutPreference = query({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      policy: v.string(),
      currency: v.string(),
      minPayoutCents: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const row = await ctx.db
      .query("payoutPreferences")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (!row) return null;
    return {
      userId: String(row.userId ?? ""),
      policy: String(row.policy ?? ""),
      currency: String(row.currency ?? "USD").toUpperCase(),
      minPayoutCents: typeof row.minPayoutCents === "number" ? Number(row.minPayoutCents) : 0,
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
    };
  },
});

export const listPayoutTransfersForUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      runId: v.id("payoutRuns"),
      provider: v.string(),
      userId: v.string(),
      currency: v.string(),
      cashCents: v.number(),
      subscriptionCreditCents: v.number(),
      status: v.string(),
      externalTransferId: v.optional(v.string()),
      externalBalanceTxnId: v.optional(v.string()),
      error: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 100;
    const limit = Math.max(1, Math.min(1000, Math.floor(limitRaw)));
    const rows = await ctx.db
      .query("payoutTransfers")
      .withIndex("by_userId_and_createdAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return rows.map((row: any) => ({
      runId: row.runId,
      provider: String(row.provider ?? ""),
      userId: String(row.userId ?? ""),
      currency: String(row.currency ?? "USD").toUpperCase(),
      cashCents: typeof row.cashCents === "number" ? Number(row.cashCents) : 0,
      subscriptionCreditCents:
        typeof row.subscriptionCreditCents === "number" ? Number(row.subscriptionCreditCents) : 0,
      status: String(row.status ?? ""),
      externalTransferId: typeof row.externalTransferId === "string" ? row.externalTransferId : undefined,
      externalBalanceTxnId:
        typeof row.externalBalanceTxnId === "string" ? row.externalBalanceTxnId : undefined,
      error: typeof row.error === "string" ? row.error : undefined,
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
    }));
  },
});

