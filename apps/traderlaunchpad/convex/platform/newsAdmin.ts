/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

export const listSources = action({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(componentsUntyped.launchthat_news.sources.queries.listSources, {
      limit: args.limit,
    });
  },
});

export const createSource = action({
  args: {
    sourceKey: v.string(),
    kind: v.string(),
    label: v.optional(v.string()),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
    config: v.any(),
  },
  returns: v.object({ sourceId: v.any() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(componentsUntyped.launchthat_news.sources.mutations.createSource, args);
  },
});

export const updateSource = action({
  args: {
    sourceId: v.any(),
    label: v.optional(v.string()),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
    config: v.optional(v.any()),
    cursor: v.optional(v.any()),
    nextRunAt: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(componentsUntyped.launchthat_news.sources.mutations.updateSource, args);
  },
});

export const deleteSource = action({
  args: { sourceId: v.any() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(componentsUntyped.launchthat_news.sources.mutations.deleteSource, args);
  },
});

export const runSourceNow = action({
  args: { sourceId: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const supportedSymbols: string[] = await ctx.runQuery(
      internal.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
      { limitPerSource: 5000 },
    );
    return await ctx.runAction(componentsUntyped.launchthat_news.ingest.actions.ingestSource, {
      sourceId: args.sourceId,
      nowMs: Date.now(),
      supportedSymbols,
    });
  },
});

