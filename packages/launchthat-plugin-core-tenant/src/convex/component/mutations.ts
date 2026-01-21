import { v } from "convex/values";

import { internalMutation, mutation } from "./server";

const normalizeSlug = (raw: string): string => {
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized;
};

export const createOrganization = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const slugBase = typeof args.slug === "string" && args.slug.trim()
      ? args.slug.trim()
      : args.name;
    const slug = normalizeSlug(slugBase);
    if (!slug) {
      throw new Error("Organization slug cannot be empty");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error("Organization slug already exists");
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      ownerId: args.userId,
      createdAt: now,
      updatedAt: now,
    } as any);

    await ctx.db.insert("userOrganizations", {
      userId: args.userId,
      organizationId: orgId,
      role: "owner",
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    } as any);

    return String(orgId);
  },
});

export const ensureMembership = mutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    role: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("editor"),
        v.literal("viewer"),
        v.literal("student"),
      ),
    ),
    setActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q: any) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId as any),
      )
      .first();

    const now = Date.now();
    if (!membership) {
      await ctx.db.insert("userOrganizations", {
        userId: args.userId,
        organizationId: args.organizationId as any,
        role: args.role ?? "viewer",
        isActive: args.setActive ?? false,
        joinedAt: now,
        updatedAt: now,
      } as any);
      return null;
    }

    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.setActive === true && membership.isActive !== true) {
      patch.isActive = true;
    }
    if (args.role && membership.role !== args.role) {
      patch.role = args.role;
    }
    if (Object.keys(patch).length > 1) {
      await ctx.db.patch(membership._id, patch as any);
    }
    return null;
  },
});

