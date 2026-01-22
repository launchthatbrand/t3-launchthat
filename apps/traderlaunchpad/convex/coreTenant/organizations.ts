import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

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

