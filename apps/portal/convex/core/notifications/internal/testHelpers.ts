import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import { internalMutation, internalQuery } from "../../../_generated/server";

export const getOrgAdminMembership = internalQuery({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      isActive: v.boolean(),
      role: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.orgId),
      )
      .first();
    if (!membership) return null;
    return { isActive: Boolean(membership.isActive), role: String(membership.role) };
  },
});

export const getToggleInfoForUser = internalQuery({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    eventKey: v.string(),
  },
  returns: v.object({
    userEmail: v.union(v.string(), v.null()),
    userInAppOverride: v.union(v.boolean(), v.null()),
    userEmailOverride: v.union(v.boolean(), v.null()),
    orgInAppDefault: v.union(v.boolean(), v.null()),
    orgEmailDefault: v.union(v.boolean(), v.null()),
  }),
  handler: async (ctx, args) => {
    const eventKey = args.eventKey.trim();

    const user = await ctx.db.get(args.userId);
    const userEmail =
      typeof user?.email === "string" && user.email.trim().length > 0
        ? user.email.trim()
        : null;

    const orgDefaults = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const userPrefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    const userInAppOverride =
      typeof userPrefs?.inAppEnabled?.[eventKey] === "boolean"
        ? Boolean(userPrefs?.inAppEnabled?.[eventKey])
        : null;
    const userEmailOverride =
      typeof userPrefs?.emailEnabled?.[eventKey] === "boolean"
        ? Boolean(userPrefs?.emailEnabled?.[eventKey])
        : null;

    const orgInAppDefault =
      typeof orgDefaults?.inAppDefaults?.[eventKey] === "boolean"
        ? Boolean(orgDefaults?.inAppDefaults?.[eventKey])
        : null;
    const orgEmailDefault =
      typeof orgDefaults?.emailDefaults?.[eventKey] === "boolean"
        ? Boolean(orgDefaults?.emailDefaults?.[eventKey])
        : null;

    return {
      userEmail,
      userInAppOverride,
      userEmailOverride,
      orgInAppDefault,
      orgEmailDefault,
    };
  },
});

export const insertNotificationForUser = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    eventKey: v.string(),
    tabKey: v.string(),
    scopeKind: v.string(),
    scopeId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    sourceUserId: v.id("users"),
    createdAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      orgId: args.orgId,
      eventKey: args.eventKey,
      tabKey: args.tabKey,
      scopeKind: args.scopeKind,
      scopeId: args.scopeId,
      title: args.title,
      content: args.content,
      read: false,
      actionUrl: args.actionUrl,
      actionData: undefined,
      sourceUserId: args.sourceUserId as Id<"users">,
      createdAt: args.createdAt,
    });
    return null;
  },
});


