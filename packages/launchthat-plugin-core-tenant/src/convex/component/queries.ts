import { v } from "convex/values";

import { query } from "./server";

/**
 * Resolve the current Convex user from auth identity, or fall back to Clerk subject lookup.
 * Kept intentionally small vs Portal's full core/users module.
 */
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
      organizationId: v.optional(v.id("organizations")),
      tokenIdentifier: v.optional(v.string()),
      clerkId: v.optional(v.string()),
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

export const listMyOrganizationsByClerkId = query({
  args: { clerkId: v.string() },
  returns: v.array(
    v.object({
      organizationId: v.id("organizations"),
      role: v.string(),
      isActive: v.boolean(),
      org: v.object({
        _id: v.id("organizations"),
        name: v.string(),
        slug: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .first();
    if (!me) return [];

    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user", (q: any) => q.eq("userId", me._id))
      .collect();

    const orgIds = memberships.map((m: any) => m.organizationId);
    const orgs = await Promise.all(orgIds.map((id: any) => ctx.db.get(id)));
    const orgById = new Map<string, any>();
    for (const org of orgs) {
      if (org) orgById.set(String(org._id), org);
    }

    return memberships
      .map((m: any) => {
        const org = orgById.get(String(m.organizationId));
        if (!org) return null;
        return {
          organizationId: m.organizationId,
          role: String(m.role ?? "viewer"),
          isActive: Boolean(m.isActive),
          org: { _id: org._id, name: org.name, slug: org.slug },
        };
      })
      .filter(Boolean) as any;
  },
});

