import { v } from "convex/values";

import { mutation } from "../_generated/server";

export const createExchangeCode = mutation({
  args: {
    codeHash: v.string(),
    organizationId: v.id("organizations"),
    clerkUserId: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("authExchangeCodes", {
      codeHash: args.codeHash,
      organizationId: args.organizationId,
      clerkUserId: args.clerkUserId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

export const consumeExchangeCode = mutation({
  args: {
    codeHash: v.string(),
  },
  returns: v.union(
    v.object({
      organizationId: v.id("organizations"),
      clerkUserId: v.string(),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const codeDoc = await ctx.db
      .query("authExchangeCodes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", args.codeHash))
      .unique();

    if (!codeDoc) return null;
    if (codeDoc.usedAt !== undefined) return null;
    if (Date.now() >= codeDoc.expiresAt) return null;

    await ctx.db.patch(codeDoc._id, { usedAt: Date.now() });
    return {
      organizationId: codeDoc.organizationId,
      clerkUserId: codeDoc.clerkUserId,
      expiresAt: codeDoc.expiresAt,
    };
  },
});
