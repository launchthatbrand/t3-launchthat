import { v } from "convex/values";

import { mutation, query } from "../_generated/server";

export const createTenantSession = mutation({
  args: {
    sessionIdHash: v.string(),
    organizationId: v.id("organizations"),
    clerkUserId: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("tenantSessions", {
      sessionIdHash: args.sessionIdHash,
      organizationId: args.organizationId,
      clerkUserId: args.clerkUserId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

export const getTenantSessionByIdHash = query({
  args: {
    sessionIdHash: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tenantSessions"),
      organizationId: v.id("organizations"),
      clerkUserId: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      revokedAt: v.optional(v.number()),
      lastSeenAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("tenantSessions")
      .withIndex("by_sessionIdHash", (q) =>
        q.eq("sessionIdHash", args.sessionIdHash),
      )
      .unique();

    if (!session) return null;
    if (session.revokedAt !== undefined) return null;
    if (Date.now() >= session.expiresAt) return null;

    // IMPORTANT: Only return fields declared in the validator.
    // Returning the full document (e.g. `_creationTime`, `sessionIdHash`) will
    // fail returns validation.
    return {
      _id: session._id,
      organizationId: session.organizationId,
      clerkUserId: session.clerkUserId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      lastSeenAt: session.lastSeenAt,
    };
  },
});

export const touchTenantSession = mutation({
  args: {
    sessionIdHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("tenantSessions")
      .withIndex("by_sessionIdHash", (q) =>
        q.eq("sessionIdHash", args.sessionIdHash),
      )
      .unique();

    if (!session) return null;
    if (session.revokedAt !== undefined) return null;

    await ctx.db.patch(session._id, { lastSeenAt: Date.now() });
    return null;
  },
});

export const revokeTenantSession = mutation({
  args: {
    sessionIdHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("tenantSessions")
      .withIndex("by_sessionIdHash", (q) =>
        q.eq("sessionIdHash", args.sessionIdHash),
      )
      .unique();

    if (!session) return null;
    if (session.revokedAt !== undefined) return null;

    await ctx.db.patch(session._id, { revokedAt: Date.now() });
    return null;
  },
});
