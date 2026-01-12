import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import { internal } from "../../../_generated/api";
import { internalMutation } from "../../../_generated/server";
import { throwInvalidInput } from "../../../shared/errors";

/**
 * Internal: dispatch a notification event to subscribed users in an org.
 *
 * Recipients are resolved from `notificationSubscriptions` for:
 * - exact (orgId,eventKey,scopeKind,scopeId)
 * - any-scope (orgId,eventKey,scopeKind,scopeId=null)
 *
 * Delivery is in-app + pluggable sinks (e.g. email, discord). `notificationUserEventPrefs`
 * and `notificationOrgDefaults` are applied as toggles for in-app/email.
 */
export const dispatchEvent = internalMutation({
  args: {
    orgId: v.id("organizations"),
    eventKey: v.string(),
    tabKey: v.optional(v.string()),
    scopeKind: v.optional(v.string()),
    scopeId: v.optional(v.string()),

    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    actionData: v.optional(v.record(v.string(), v.string())),
    sourceUserId: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tabKey = (args.tabKey ?? "system").trim() || "system";
    const scopeKind = (args.scopeKind ?? "").trim();
    const scopeId = (args.scopeId ?? "").trim();

    if (!scopeKind) {
      throwInvalidInput('dispatchEvent requires scopeKind (use e.g. "course")');
    }

    console.log("[notifications.internal.dispatchEvent] start", {
      orgId: args.orgId,
      eventKey: args.eventKey,
      scopeKind,
      scopeId: scopeId || null,
      title: args.title,
    });

    // Lookup subscriptions for exact scope and any-scope.
    const exactSubs = await ctx.db
      .query("notificationSubscriptions")
      .withIndex("by_org_event_scope", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("eventKey", args.eventKey)
          .eq("scopeKind", scopeKind)
          .eq("scopeId", scopeId || null),
      )
      .collect();

    const anySubs = await ctx.db
      .query("notificationSubscriptions")
      .withIndex("by_org_event_scope", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("eventKey", args.eventKey)
          .eq("scopeKind", scopeKind)
          .eq("scopeId", null),
      )
      .collect();

    console.log("[notifications.internal.dispatchEvent] subscriptions", {
      exact: exactSubs.length,
      any: anySubs.length,
      exactEnabled: exactSubs.filter((s) => s.enabled).length,
      anyEnabled: anySubs.filter((s) => s.enabled).length,
    });

    const recipientIds = new Set<Id<"users">>();
    for (const sub of [...exactSubs, ...anySubs]) {
      if (sub.enabled) recipientIds.add(sub.userId);
    }

    const orgDefaults = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    console.log("[notifications.internal.dispatchEvent] recipients", {
      count: recipientIds.size,
      sample: Array.from(recipientIds).slice(0, 5),
      hasOrgDefaults: !!orgDefaults,
    });

    const emailRecipients: { userId: Id<"users">; email: string }[] = [];
    const createdAt = Date.now();

    for (const userId of recipientIds) {
      const userPrefs = await ctx.db
        .query("notificationUserEventPrefs")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", userId).eq("orgId", args.orgId),
        )
        .first();

      const userInAppOverride = userPrefs?.inAppEnabled?.[args.eventKey];
      const orgInAppDefault = orgDefaults?.inAppDefaults?.[args.eventKey];

      const inAppEnabled =
        typeof userInAppOverride === "boolean"
          ? userInAppOverride
          : typeof orgInAppDefault === "boolean"
            ? orgInAppDefault
            : true;

      const userEmailOverride = userPrefs?.emailEnabled?.[args.eventKey];
      const orgEmailDefault = orgDefaults?.emailDefaults?.[args.eventKey];
      // Email is opt-in by default.
      const emailEnabled =
        typeof userEmailOverride === "boolean"
          ? userEmailOverride
          : typeof orgEmailDefault === "boolean"
            ? orgEmailDefault
            : false;

      if (emailEnabled) {
        const user = await ctx.db.get(userId);
        if (user?.email) {
          emailRecipients.push({ userId, email: user.email });
        }
      }

      if (inAppEnabled) {
        await ctx.db.insert("notifications", {
          userId,
          orgId: args.orgId,
          eventKey: args.eventKey,
          tabKey,
          scopeKind,
          scopeId: scopeId || undefined,
          title: args.title,
          content: args.content,
          read: false,
          actionUrl: args.actionUrl,
          actionData: args.actionData,
          sourceUserId: args.sourceUserId,
          expiresAt: args.expiresAt,
          createdAt,
        });
      }
    }

    // Always run sinks (e.g. Discord announcements) even if there are no in-app recipients.
    await ctx.scheduler.runAfter(
      0,
      internal.core.notifications.delivery.runSinks.runSinks,
      {
        payload: {
          orgId: args.orgId,
          eventKey: args.eventKey,
          tabKey,
          scopeKind,
          scopeId: scopeId || null,
          title: args.title,
          content: args.content ?? null,
          actionUrl: args.actionUrl ?? null,
          actionData: args.actionData ?? null,
          sourceUserId: args.sourceUserId ?? null,
          expiresAt: args.expiresAt ?? null,
          createdAt,
          emailRecipients,
        },
      },
    );

    console.log("[notifications.internal.dispatchEvent] done");
    return null;
  },
});
