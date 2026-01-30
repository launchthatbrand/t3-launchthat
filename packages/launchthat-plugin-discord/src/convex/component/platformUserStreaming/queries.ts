import { v } from "convex/values";

import { query } from "../server";

export const getUserStreamingPrefs = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      enabled: v.boolean(),
      enabledAt: v.optional(v.number()),
      disabledAt: v.optional(v.number()),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("platformUserStreamingPrefs")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .unique();
    if (!row) return null;
    return {
      enabled: Boolean((row as any).enabled),
      enabledAt:
        typeof (row as any).enabledAt === "number"
          ? ((row as any).enabledAt as number)
          : undefined,
      disabledAt:
        typeof (row as any).disabledAt === "number"
          ? ((row as any).disabledAt as number)
          : undefined,
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});
