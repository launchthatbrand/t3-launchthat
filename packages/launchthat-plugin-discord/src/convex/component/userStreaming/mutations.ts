import { v } from "convex/values";

import { mutation } from "../server";

export const setUserStreamingEnabled = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    userId: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("userStreamingPrefs")
      .withIndex(
        scope === "org" ? "by_organizationId_and_userId" : "by_scope_and_userId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("userId", args.userId)
            : q.eq("scope", scope).eq("userId", args.userId),
      )
      .unique();

    const patch = {
      scope,
      organizationId,
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

