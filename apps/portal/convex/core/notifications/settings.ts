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
    emailDefaults: v.record(v.string(), v.boolean()),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    return {
      inAppDefaults: doc?.inAppDefaults ?? {},
      emailDefaults: doc?.emailDefaults ?? {},
    };
  },
});

export const setOrgDefaults = mutation({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    inAppDefaults: v.record(v.string(), v.boolean()),
    emailDefaults: v.optional(v.record(v.string(), v.boolean())),
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
      await ctx.db.patch(existing._id, {
        inAppDefaults: args.inAppDefaults,
        ...(args.emailDefaults ? { emailDefaults: args.emailDefaults } : {}),
      });
      return null;
    }

    await ctx.db.insert("notificationOrgDefaults", {
      orgId: args.orgId,
      inAppDefaults: args.inAppDefaults,
      emailDefaults: args.emailDefaults ?? {},
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
    emailEnabled: v.record(v.string(), v.boolean()),
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
      return { inAppEnabled: {}, emailEnabled: {} };
    }

    const prefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    return {
      inAppEnabled: prefs?.inAppEnabled ?? {},
      emailEnabled: prefs?.emailEnabled ?? {},
    };
  },
});

export const setUserEventPrefs = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    inAppEnabled: v.record(v.string(), v.boolean()),
    emailEnabled: v.optional(v.record(v.string(), v.boolean())),
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
      const user = await ctx.db.get(args.userId);
      const isPrimaryOrgMatch = user?.organizationId === args.orgId;
      if (!isPrimaryOrgMatch) {
        throwInvalidInput("Access denied: not a member of this organization");
      }
    }

    const existing = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        inAppEnabled: args.inAppEnabled,
        ...(args.emailEnabled ? { emailEnabled: args.emailEnabled } : {}),
      });
      return null;
    }

    await ctx.db.insert("notificationUserEventPrefs", {
      userId: args.userId,
      orgId: args.orgId,
      inAppEnabled: args.inAppEnabled,
      emailEnabled: args.emailEnabled ?? {},
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
            q
              .eq("userId", args.userId)
              .eq("orgId", args.orgId)
              .eq("eventKey", args.eventKey!),
          )
      : ctx.db
          .query("notificationSubscriptions")
          .withIndex("by_user_org", (q) =>
            q.eq("userId", args.userId).eq("orgId", args.orgId),
          );

    return await qBase.order("desc").collect();
  },
});

export const listKnownEventKeysForOrg = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership?.isActive) {
      // Fallback: some parts of the portal rely on users.organizationId rather than userOrganizations.
      // Allow showing notification settings when the user's primary org matches the tenant.
      const user = await ctx.db.get(args.userId);
      const isPrimaryOrgMatch = user?.organizationId === args.orgId;
      if (!isPrimaryOrgMatch) return [];
    }

    const keys = new Set<string>();

    const orgDefaults = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
    for (const key of Object.keys(orgDefaults?.inAppDefaults ?? {}))
      keys.add(key);
    for (const key of Object.keys(orgDefaults?.emailDefaults ?? {}))
      keys.add(key);

    const userPrefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();
    for (const key of Object.keys(userPrefs?.inAppEnabled ?? {})) keys.add(key);
    for (const key of Object.keys(userPrefs?.emailEnabled ?? {})) keys.add(key);

    const subs = await ctx.db
      .query("notificationSubscriptions")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .collect();
    for (const s of subs) {
      if (typeof s.eventKey === "string" && s.eventKey.trim())
        keys.add(s.eventKey);
    }

    const recent = await ctx.db
      .query("notifications")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .order("desc")
      .take(50);
    for (const n of recent) {
      if (typeof n.eventKey === "string" && n.eventKey.trim())
        keys.add(n.eventKey);
    }

    // Always include core LMS example key to ensure a stable initial UI.
    keys.add("lms.course.stepAdded");

    return Array.from(keys).sort((a, b) => a.localeCompare(b));
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
