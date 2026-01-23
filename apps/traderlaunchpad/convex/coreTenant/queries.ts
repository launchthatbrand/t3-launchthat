import { v } from "convex/values";

import { query } from "../_generated/server";

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      organizationId: v.optional(v.string()),
      tokenIdentifier: v.optional(v.string()),
      clerkId: v.optional(v.string()),
      // Portal parity: expose a simple role string for UI decisions.
      role: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const project = (user: any | null) => {
      if (!user) return null;
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        organizationId: user.organizationId ?? undefined,
        tokenIdentifier: user.tokenIdentifier ?? undefined,
        clerkId: user.clerkId ?? undefined,
        role: user.isAdmin ? ("admin" as const) : undefined,
      };
    };

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      return project(user ?? null);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .first();
    return project(user ?? null);
  },
});

