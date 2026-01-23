import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

const domainStatusValidator = v.union(
  v.literal("unconfigured"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("error"),
);

export const listOrganizationsByUserId = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      role: v.string(),
      isActive: v.boolean(),
      org: v.object({
        _id: v.string(),
        name: v.string(),
        slug: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.runQuery(
      components.launchthat_core_tenant.queries.listOrganizationsByUserId,
      { userId: args.userId },
    );
    return rows;
  },
});

// Portal parity: list organizations for the currently-authenticated user.
// Works on tenant hosts because the Convex JWT subject is the Clerk user id.
export const myOrganizations = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.string(),
      name: v.string(),
      slug: v.string(),
      customDomain: v.union(v.string(), v.null()),
      userRole: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId =
      typeof identity?.subject === "string" ? identity.subject.trim() : "";
    if (!userId) return [];

    const memberships = await ctx.runQuery(
      components.launchthat_core_tenant.queries.listOrganizationsByUserId,
      { userId },
    );

    const result: Array<{
      _id: string;
      name: string;
      slug: string;
      customDomain: string | null;
      userRole: string;
    }> = [];

    for (const membership of memberships) {
      const org = membership.org;
      const organizationId = org._id;

      const domains = await ctx.runQuery(
        components.launchthat_core_tenant.queries.listDomainsForOrg,
        { organizationId, appKey: "traderlaunchpad" },
      );

      const verified = domains.find((d) => d.status === "verified");
      const customDomain =
        verified && typeof verified.hostname === "string" && verified.hostname.trim()
          ? verified.hostname.trim()
          : null;

      result.push({
        _id: String(organizationId),
        name: org.name,
        slug: org.slug,
        customDomain,
        userRole: membership.role,
      });
    }

    return result;
  },
});

const requirePlatformAdmin = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthorized");

  // Prefer tokenIdentifier (convex auth) when available.
  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new ConvexError("Unauthorized");
  if (!viewer.isAdmin) throw new ConvexError("Forbidden: admin access required.");

  return { viewer, identity };
};

export const listAllOrganizations = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      ownerId: v.string(),
      clerkOrganizationId: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const rows = await ctx.runQuery(
      components.launchthat_core_tenant.queries.listOrganizations,
      { search: args.search, limit: args.limit },
    );
    return rows.map((row) => ({
      _id: String(row._id),
      _creationTime: row._creationTime,
      name: row.name,
      slug: row.slug,
      ownerId: row.ownerId,
      clerkOrganizationId: row.clerkOrganizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const createOrganizationAsViewer = mutation({
  args: { name: v.string(), slug: v.optional(v.string()) },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { identity } = await requirePlatformAdmin(ctx);
    const userId = typeof identity.subject === "string" ? identity.subject.trim() : "";
    if (!userId) {
      throw new ConvexError("Unauthorized");
    }
    const id = await ctx.runMutation(
      components.launchthat_core_tenant.mutations.createOrganization,
      { userId, name: args.name, slug: args.slug },
    );
    return String(id);
  },
});

export const createOrganization = mutation({
  args: { userId: v.string(), name: v.string(), slug: v.optional(v.string()) },
  returns: v.string(),
  handler: async (ctx, args) => {
    const id = await ctx.runMutation(
      components.launchthat_core_tenant.mutations.createOrganization,
      { userId: args.userId, name: args.name, slug: args.slug },
    );
    return id;
  },
});

export const updateOrganization = mutation({
  args: {
    organizationId: v.string(),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Allow platform admins, or org owner/admin members.
    const { identity } = await requirePlatformAdmin(ctx).catch(async (err) => {
      // Not platform admin: fall back to membership check.
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw err;
      return { identity };
    });

    const userId = typeof identity.subject === "string" ? identity.subject.trim() : "";
    if (!userId) throw new ConvexError("Unauthorized");

    // If not platform admin, ensure membership role is owner/admin.
    try {
      await requirePlatformAdmin(ctx);
    } catch {
      const memberships = await ctx.runQuery(
        components.launchthat_core_tenant.queries.listOrganizationsByUserId,
        { userId },
      );
      const match = memberships.find((m) => String(m.org._id) === String(args.organizationId));
      const role = match ? String(match.role) : "";
      if (role !== "owner" && role !== "admin") {
        throw new ConvexError("Forbidden: admin access required.");
      }
    }

    await ctx.runMutation(components.launchthat_core_tenant.mutations.updateOrganization, {
      organizationId: args.organizationId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      logo: args.logo ?? null,
    });

    return null;
  },
});

export const setActiveOrganizationForUser = mutation({
  args: { userId: v.string(), organizationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      components.launchthat_core_tenant.mutations.setActiveOrganizationForUser,
      { userId: args.userId, organizationId: args.organizationId },
    );
    return null;
  },
});

// Tenant resolution helpers (for Next middleware / server-side tenant routing).
export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      name: v.string(),
      slug: v.string(),
      ownerId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(
      components.launchthat_core_tenant.queries.getOrganizationBySlug,
      { slug: args.slug },
    );
    if (!org) return null;
    return { _id: org._id, name: org.name, slug: org.slug, ownerId: org.ownerId };
  },
});

export const getOrganizationByHostname = query({
  args: {
    hostname: v.string(),
    requireVerified: v.optional(v.boolean()),
    appKey: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      name: v.string(),
      slug: v.string(),
      ownerId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(
      components.launchthat_core_tenant.queries.getOrganizationByHostname,
      {
        hostname: args.hostname,
        requireVerified: args.requireVerified ?? true,
        appKey: args.appKey ?? "traderlaunchpad",
      },
    );
    if (!org) return null;
    return { _id: org._id, name: org.name, slug: org.slug, ownerId: org.ownerId };
  },
});

export const listDomainsForOrg = query({
  args: { organizationId: v.string(), appKey: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      organizationId: v.string(),
      appKey: v.string(),
      hostname: v.string(),
      status: domainStatusValidator,
      records: v.optional(
        v.array(v.object({ type: v.string(), name: v.string(), value: v.string() })),
      ),
      verifiedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.runQuery(
      components.launchthat_core_tenant.queries.listDomainsForOrg,
      { organizationId: args.organizationId, appKey: args.appKey },
    );
    return rows;
  },
});

export const upsertOrganizationDomain = mutation({
  args: {
    organizationId: v.string(),
    appKey: v.string(),
    hostname: v.string(),
    status: v.optional(domainStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      components.launchthat_core_tenant.mutations.upsertOrganizationDomain,
      {
        organizationId: args.organizationId,
        appKey: args.appKey,
        hostname: args.hostname,
        status: args.status,
      },
    );
    return null;
  },
});

export const removeOrganizationDomain = mutation({
  args: { organizationId: v.string(), appKey: v.string(), hostname: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      components.launchthat_core_tenant.mutations.removeOrganizationDomain,
      { organizationId: args.organizationId, appKey: args.appKey, hostname: args.hostname },
    );
    return null;
  },
});

export const getOrganizationById = query({
  args: { organizationId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      name: v.string(),
      slug: v.string(),
      ownerId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.runQuery(
      components.launchthat_core_tenant.queries.getOrganizationById,
      { organizationId: args.organizationId },
    );
    if (!org) return null;
    return { _id: org._id, name: org.name, slug: org.slug, ownerId: org.ownerId };
  },
});

export const listMembersByOrganizationId = query({
  args: { organizationId: v.string() },
  returns: v.array(
    v.object({
      userId: v.string(),
      role: v.string(),
      isActive: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.runQuery(
      components.launchthat_core_tenant.queries.listMembersByOrganizationId,
      { organizationId: args.organizationId },
    );
    return rows;
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.launchthat_core_tenant.mutations.ensureMembership, {
      userId: args.userId,
      organizationId: args.organizationId,
      role: args.role,
    });
    return null;
  },
});

export const removeMembership = mutation({
  args: { userId: v.string(), organizationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.launchthat_core_tenant.mutations.removeMembership, {
      userId: args.userId,
      organizationId: args.organizationId,
    });
    return null;
  },
});

