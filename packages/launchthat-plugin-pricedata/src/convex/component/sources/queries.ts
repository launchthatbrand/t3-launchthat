import { v } from "convex/values";
import { query } from "../server";

export const getDefaultSource = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("priceSources"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      provider: v.union(v.literal("tradelocker")),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      baseUrlHost: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
      seedRef: v.optional(
        v.object({ organizationId: v.string(), userId: v.string() }),
      ),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Prefer explicit default flag; otherwise return the most recently updated source.
    const explicit = await ctx.db
      .query("priceSources")
      .withIndex("by_isDefault_and_updatedAt", (q) =>
        q.eq("isDefault", true),
      )
      .order("desc")
      .first();
    if (explicit) return explicit;

    const any = await ctx.db
      .query("priceSources")
      .withIndex("by_updatedAt")
      .order("desc")
      .first();
    return any ?? null;
  },
});

export const getSourceByKey = query({
  args: { sourceKey: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("priceSources"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      provider: v.union(v.literal("tradelocker")),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      baseUrlHost: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
      seedRef: v.optional(
        v.object({ organizationId: v.string(), userId: v.string() }),
      ),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("priceSources")
      .withIndex("by_sourceKey", (q) => q.eq("sourceKey", args.sourceKey))
      .first();
    return doc ?? null;
  },
});

