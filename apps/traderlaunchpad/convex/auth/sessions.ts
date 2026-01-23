import { v } from "convex/values";

import { mutation, query } from "../_generated/server";

export const createTenantSession = mutation({
  args: {
    sessionIdHash: v.string(),
    organizationId: v.string(),
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

/**
 * Resolve a tenant session from a hashed cookie value.
 *
 * Used by Next route handlers (e.g. `/api/convex-token`) to mint short-lived Convex JWTs
 * for tenant/custom hosts that do not run Clerk.
 */
export const getTenantSessionByIdHash = query({
  args: { sessionIdHash: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("tenantSessions"),
      organizationId: v.string(),
      clerkUserId: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      revokedAt: v.optional(v.number()),
      lastSeenAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tenantSessions")
      .withIndex("by_session_id_hash", (q) => q.eq("sessionIdHash", args.sessionIdHash))
      .unique();

    if (!row) return null;
    if (row.revokedAt !== undefined) return null;
    if (Date.now() >= row.expiresAt) return null;

    return {
      _id: row._id,
      organizationId: row.organizationId,
      clerkUserId: row.clerkUserId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      lastSeenAt: row.lastSeenAt,
    };
  },
});

export const touchTenantSession = mutation({
  args: { sessionIdHash: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tenantSessions")
      .withIndex("by_session_id_hash", (q) => q.eq("sessionIdHash", args.sessionIdHash))
      .unique();
    if (!row) return null;
    if (row.revokedAt !== undefined) return null;
    await ctx.db.patch(row._id, { lastSeenAt: Date.now() });
    return null;
  },
});

export const revokeTenantSession = mutation({
  args: { sessionIdHash: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tenantSessions")
      .withIndex("by_session_id_hash", (q) => q.eq("sessionIdHash", args.sessionIdHash))
      .unique();
    if (!row) return null;
    if (row.revokedAt !== undefined) return null;
    await ctx.db.patch(row._id, { revokedAt: Date.now() });
    return null;
  },
});

