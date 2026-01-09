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


