/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-assignment
*/

import { v } from "convex/values";
import { query } from "../_generated/server";
import { internal } from "../_generated/api";

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

export const listSupportedSymbols = query({
  args: { limitPerSource: v.optional(v.number()) },
  returns: v.array(v.string()),
  handler: async (ctx, args): Promise<string[]> => {
    await requirePlatformAdmin(ctx);
    const res: string[] = await ctx.runQuery(
      internal.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
      { limitPerSource: args.limitPerSource },
    );
    return res;
  },
});

