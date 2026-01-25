import { v } from "convex/values";

import { mutation } from "../server";

export const setUserStreamingEnabled = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("userStreamingPrefs")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const patch = {
      organizationId: args.organizationId,
      userId: args.userId,
      enabled: args.enabled,
      enabledAt: args.enabled ? now : (existing as any)?.enabledAt,
      disabledAt: args.enabled ? undefined : now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, patch);
    } else {
      await ctx.db.insert("userStreamingPrefs", patch);
    }
    return null;
  },
});

