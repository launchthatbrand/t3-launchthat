import { v } from "convex/values";

import { query } from "./server";

/**
 * List organizations for a user.
 *
 * NOTE: `userId` is a string because `users` is app-owned (root table).
 */
export const listOrganizationsByUserId = query({
  args: { userId: v.string() },
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
    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
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

