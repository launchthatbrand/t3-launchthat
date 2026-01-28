/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-assignment
*/

import { query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

export const listRecentRuns = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(componentsUntyped.launchthat_news.runs.queries.listRecentRuns, {
      limit: args.limit,
    });
  },
});

