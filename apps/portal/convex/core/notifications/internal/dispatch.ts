import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import { internalMutation } from "../../../_generated/server";
import { throwInvalidInput } from "../../../shared/errors";

/**
 * Internal: dispatch a notification event to subscribed users in an org.
 *
 * Recipients are resolved from `notificationSubscriptions` for:
 * - exact (orgId,eventKey,scopeKind,scopeId)
 * - any-scope (orgId,eventKey,scopeKind,scopeId=null)
 *
 * Delivery is in-app only for this iteration. `notificationUserEventPrefs` and
 * `notificationOrgDefaults` are applied as toggles.
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

    if (recipientIds.size === 0) {
      console.log("[notifications.internal.dispatchEvent] no recipients");
      return null;
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

    for (const userId of recipientIds) {
      const userPrefs = await ctx.db
        .query("notificationUserEventPrefs")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", userId).eq("orgId", args.orgId),
        )
        .first();

      const userOverride = userPrefs?.inAppEnabled?.[args.eventKey];
      const orgDefault = orgDefaults?.inAppDefaults?.[args.eventKey];

      const enabled =
        typeof userOverride === "boolean"
          ? userOverride
          : typeof orgDefault === "boolean"
            ? orgDefault
            : true;

      if (!enabled) {
        console.log(
          "[notifications.internal.dispatchEvent] skipped (disabled)",
          {
            userId,
            userOverride,
            orgDefault,
          },
        );
        continue;
      }

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
        createdAt: Date.now(),
      });
    }

    console.log("[notifications.internal.dispatchEvent] done");
    return null;
  },
});
