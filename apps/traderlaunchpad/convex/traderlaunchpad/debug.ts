/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { components } from "../_generated/api";
import { internalMutation, internalQuery } from "../_generated/server";

const tradeIdeasIdeas = (components.launchthat_traderlaunchpad.tradeIdeas as any)
  .ideas as any;

export const listRecentTradeIdeaPairs = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      userId: v.string(),
      ideas: v.number(),
      groups: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tradeIdeasIdeas.debugListRecentTradeIdeaPairs, {
      limit: args.limit,
    });
  },
});

export const explainTradeIdeaGroupingForUser = internalQuery({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    scanCap: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tradeIdeasIdeas.debugExplainTradeIdeaGroupingForUser, {
      organizationId: args.organizationId,
      userId: args.userId,
      scanCap: args.scanCap,
    });
  },
});

export const reconcileTradeIdeasForUser = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    scanCap: v.optional(v.number()),
  },
  returns: v.object({
    ideasScanned: v.number(),
    ideasPatched: v.number(),
    groupsReassigned: v.number(),
    ideasDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(tradeIdeasIdeas.reconcileIdeasForUser, {
      organizationId: args.organizationId,
      userId: args.userId,
      scanCap: args.scanCap,
    });
  },
});

