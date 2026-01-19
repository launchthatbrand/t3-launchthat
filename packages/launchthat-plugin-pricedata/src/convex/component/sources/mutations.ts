import { v } from "convex/values";
import { mutation } from "../server";

export const upsertSource = mutation({
  args: {
    sourceKey: v.string(),
    provider: v.union(v.literal("tradelocker")),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
    baseUrlHost: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    seedRef: v.optional(v.object({ organizationId: v.string(), userId: v.string() })),
  },
  returns: v.object({ sourceId: v.id("priceSources") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("priceSources")
      .withIndex("by_sourceKey", (q) => q.eq("sourceKey", args.sourceKey))
      .first();

    // If this source is being set as default, unset other defaults.
    if (args.isDefault) {
      const currentDefaults = await ctx.db
        .query("priceSources")
        .withIndex("by_isDefault_and_updatedAt", (q) => q.eq("isDefault", true))
        .take(50);
      for (const d of currentDefaults) {
        if (d.sourceKey === args.sourceKey) continue;
        await ctx.db.patch(d._id, { isDefault: false, updatedAt: now });
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: args.provider,
        environment: args.environment,
        server: args.server,
        jwtHost: args.jwtHost,
        baseUrlHost: args.baseUrlHost,
        isDefault: args.isDefault,
        seedRef: args.seedRef,
        updatedAt: now,
      });
      return { sourceId: existing._id };
    }

    const sourceId = await ctx.db.insert("priceSources", {
      provider: args.provider,
      environment: args.environment,
      server: args.server,
      jwtHost: args.jwtHost,
      baseUrlHost: args.baseUrlHost,
      sourceKey: args.sourceKey,
      isDefault: args.isDefault,
      seedRef: args.seedRef,
      updatedAt: now,
      createdAt: now,
    });

    return { sourceId };
  },
});

