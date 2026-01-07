import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";
import { throwInvalidInput } from "../../shared/errors";

/**
 * Org-level defaults (admin/owner).
 */
export const getOrgDefaults = query({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    inAppDefaults: v.record(v.string(), v.boolean()),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    return {
      inAppDefaults: doc?.inAppDefaults ?? {},
    };
  },
});

export const setOrgDefaults = mutation({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    inAppDefaults: v.record(v.string(), v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require admin/owner for org defaults.
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.actorUserId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) {
      throwInvalidInput("Access denied: not a member of this organization");
    }
    if (membership.role !== "owner" && membership.role !== "admin") {
      throwInvalidInput("Access denied: admin role required");
    }

    const existing = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { inAppDefaults: args.inAppDefaults });
      return null;
    }

    await ctx.db.insert("notificationOrgDefaults", {
      orgId: args.orgId,
      inAppDefaults: args.inAppDefaults,
    });
    return null;
  },
});

/**
 * Per-user per-event prefs in org.
 */
export const getUserEventPrefs = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.object({
    inAppEnabled: v.record(v.string(), v.boolean()),
  }),
  handler: async (ctx, args) => {
    // Ensure membership (any role).
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) {
      return { inAppEnabled: {} };
    }

    const prefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    return { inAppEnabled: prefs?.inAppEnabled ?? {} };
  },
});

export const setUserEventPrefs = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    inAppEnabled: v.record(v.string(), v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) {
      throwInvalidInput("Access denied: not a member of this organization");
    }

    const existing = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { inAppEnabled: args.inAppEnabled });
      return null;
    }

    await ctx.db.insert("notificationUserEventPrefs", {
      userId: args.userId,
      orgId: args.orgId,
      inAppEnabled: args.inAppEnabled,
    });
    return null;
  },
});

/**
 * Subscriptions (per scope).
 */
export const listSubscriptions = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    eventKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notificationSubscriptions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      orgId: v.id("organizations"),
      eventKey: v.string(),
      scopeKind: v.string(),
      scopeId: v.union(v.string(), v.null()),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) return [];

    const qBase = args.eventKey
      ? ctx.db
          .query("notificationSubscriptions")
          .withIndex("by_user_org_event", (q) =>
            q.eq("userId", args.userId).eq("orgId", args.orgId).eq("eventKey", args.eventKey!),
          )
      : ctx.db
          .query("notificationSubscriptions")
          .withIndex("by_user_org", (q) =>
            q.eq("userId", args.userId).eq("orgId", args.orgId),
          );

    return await qBase.order("desc").collect();
  },
});

export const upsertSubscription = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    eventKey: v.string(),
    scopeKind: v.string(),
    scopeId: v.union(v.string(), v.null()),
    enabled: v.boolean(),
  },
  returns: v.id("notificationSubscriptions"),
  handler: async (ctx, args) => {
    console.log("[notifications.settings.upsertSubscription] start", {
      orgId: args.orgId,
      userId: args.userId,
      eventKey: args.eventKey,
      scopeKind: args.scopeKind,
      scopeId: args.scopeId,
      enabled: args.enabled,
    });

    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) {
      console.log("[notifications.settings.upsertSubscription] denied", {
        hasMembership: !!membership,
        isActive: membership?.isActive,
        role: membership?.role,
      });
      throwInvalidInput("Access denied: not a member of this organization");
    }

    const existing = await ctx.db
      .query("notificationSubscriptions")
      .withIndex("by_user_org_event_scope", (q) =>
        q
          .eq("userId", args.userId)
          .eq("orgId", args.orgId)
          .eq("eventKey", args.eventKey)
          .eq("scopeKind", args.scopeKind)
          .eq("scopeId", args.scopeId),
      )
      .unique();

    if (existing) {
      console.log("[notifications.settings.upsertSubscription] patch", {
        id: existing._id,
        enabled: args.enabled,
      });
      await ctx.db.patch(existing._id, { enabled: args.enabled });
      return existing._id;
    }

    console.log("[notifications.settings.upsertSubscription] insert", {
      enabled: args.enabled,
    });
    return await ctx.db.insert("notificationSubscriptions", {
      userId: args.userId,
      orgId: args.orgId,
      eventKey: args.eventKey,
      scopeKind: args.scopeKind,
      scopeId: args.scopeId,
      enabled: args.enabled,
    });
  },
});


