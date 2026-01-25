import { v } from "convex/values";

import { internalQuery } from "../../_generated/server";

export const getOrganizationClerkOrganizationId = internalQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.object({ clerkOrganizationId: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    return { clerkOrganizationId: org?.clerkOrganizationId ?? null };
  },
});

export const getUserClerkId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({ clerkUserId: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return { clerkUserId: user?.clerkId ?? null };
  },
});

export const getOrganizationHostInfo = internalQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.object({
    slug: v.union(v.string(), v.null()),
    customDomain: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    return {
      slug: org?.slug ?? null,
      customDomain: org?.customDomain ?? null,
    };
  },
});

export const listOrganizationIds = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.id("organizations")),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));
    const rows = await ctx.db.query("organizations").take(limit);
    return rows.map((o) => o._id);
  },
});


