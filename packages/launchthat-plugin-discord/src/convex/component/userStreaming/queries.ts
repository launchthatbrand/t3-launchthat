import { v } from "convex/values";

import { query } from "../server";

export const getUserStreamingPrefs = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
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
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;
    const row = await ctx.db
      .query("userStreamingPrefs")
      .withIndex(
        scope === "org" ? "by_organizationId_and_userId" : "by_scope_and_userId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("userId", args.userId)
            : q.eq("scope", scope).eq("userId", args.userId),
      )
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

