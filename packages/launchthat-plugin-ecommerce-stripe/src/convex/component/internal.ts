import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getStripeCustomerIdForUser = internalQuery({
  args: { userId: v.string() },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const row = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    return row ? String(row.customerId ?? "") : null;
  },
});

export const upsertStripeCustomerForUser = internalMutation({
  args: { userId: v.string(), customerId: v.string() },
  returns: v.object({ ok: v.boolean(), created: v.boolean() }),
  handler: async (ctx: any, args: any) => {
    const userId = String(args.userId ?? "").trim();
    const customerId = String(args.customerId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    if (!customerId) throw new Error("Missing customerId");

    const now = Date.now();
    const existing = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { customerId, updatedAt: now });
      return { ok: true, created: false };
    }
    await ctx.db.insert("stripeCustomers", { userId, customerId, createdAt: now, updatedAt: now });
    return { ok: true, created: true };
  },
});

export const getUserIdForStripeCustomerId = internalQuery({
  args: { customerId: v.string() },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx: any, args: any) => {
    const customerId = String(args.customerId ?? "").trim();
    if (!customerId) return null;
    const row = await ctx.db
      .query("stripeCustomers")
      .withIndex("by_customerId", (q: any) => q.eq("customerId", customerId))
      .first();
    return row ? String(row.userId ?? "") : null;
  },
});

