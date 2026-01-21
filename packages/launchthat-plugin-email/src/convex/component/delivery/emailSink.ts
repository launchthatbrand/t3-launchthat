import { v } from "convex/values";

import { internalMutation, mutation } from "../server";
import { enqueueEmailImpl } from "../mutations";
import { renderTemplate } from "./templates";

/**
 * Minimal notifications -> email sink.
 *
 * The notifications system can call this with the standard "core.notification.event"
 * variables and the plugin will enqueue outbox rows for delivery.
 */

export const sendTransactionalEmail = mutation({
  args: {
    orgId: v.string(),
    to: v.string(),
    templateKey: v.string(),
    variables: v.record(v.string(), v.string()),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const overrides = await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q: any) =>
        q.eq("orgId", args.orgId).eq("templateKey", args.templateKey),
      )
      .first();

    const rendered = renderTemplate({
      templateKey: args.templateKey,
      variables: args.variables,
      subjectOverride: overrides?.subjectOverride,
      copyOverrides: overrides?.copyOverrides,
    });

    return await enqueueEmailImpl(ctx, {
      orgId: args.orgId,
      to: args.to.trim(),
      subject: rendered.subject,
      htmlBody: rendered.html,
      textBody: rendered.text,
      templateKey: args.templateKey,
    });
  },
});

export const sendNotificationEmail = internalMutation({
  args: {
    orgId: v.string(),
    to: v.string(),
    title: v.string(),
    content: v.string(),
    actionUrl: v.string(),
    eventKey: v.string(),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const rendered = renderTemplate({
      templateKey: "core.notification.event",
      variables: {
        title: args.title,
        content: args.content,
        actionUrl: args.actionUrl,
        eventKey: args.eventKey,
      },
    });

    return await enqueueEmailImpl(ctx, {
      orgId: args.orgId,
      to: args.to.trim(),
      subject: rendered.subject,
      htmlBody: rendered.html,
      textBody: rendered.text,
      templateKey: "core.notification.event",
    });
  },
});

