"use node";

import { api } from "@convex-config/_generated/api";

import type { NotificationSink } from "../registry";

export const emailSink: NotificationSink = {
  id: "core.email",
  handle: async (ctx, payload) => {
    if (!payload.emailRecipients || payload.emailRecipients.length === 0) {
      return;
    }

    const actionUrl = payload.actionUrl ?? "";
    const content = payload.content ?? "";

    for (const recipient of payload.emailRecipients) {
      const to = recipient.email.trim();
      if (!to) continue;

      await ctx.runAction(
        api.core.emails.reactEmailRender.sendTransactionalEmail,
        {
          orgId: payload.orgId,
          to,
          templateKey: "core.notification.event",
          variables: {
            title: payload.title,
            content,
            actionUrl,
            eventKey: payload.eventKey,
          },
        },
      );
    }
  },
};
