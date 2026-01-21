import { api, components } from "../_generated/api";

import type { Id } from "../_generated/dataModel";
import type { NotificationsTestSinkId } from "launchthat-plugin-notifications/server";
import { makeNotificationsTestHarness } from "launchthat-plugin-notifications/server";
import { mutation } from "../_generated/server";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";
import { v } from "convex/values";

interface HarnessResult {
  inAppInserted: boolean;
  emailAttempted: boolean;
  emailSucceeded: boolean;
  discordAttempted: boolean;
  discordSucceeded: boolean;
  errors: string[];
}

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sendTestNotificationToUser = mutation({
  args: {
    eventKey: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("forceAll"), v.literal("respectPreferences"))),
    sinkIds: v.optional(
      v.array(v.union(v.literal("inApp"), v.literal("email"))),
    ),
  },
  returns: v.object({
    inAppInserted: v.boolean(),
    emailAttempted: v.boolean(),
    emailSucceeded: v.boolean(),
    discordAttempted: v.boolean(),
    discordSucceeded: v.boolean(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<HarnessResult> => {
    // Ensure a signed-in user exists in the root `users` table.
    const userId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (typeof userId !== "string" || !userId) {
      return {
        inAppInserted: false,
        emailAttempted: false,
        emailSucceeded: false,
        discordAttempted: false,
        discordSucceeded: false,
        errors: ["auth: not signed in"],
      };
    }

    const user: unknown = await ctx.db.get(userId as Id<"users">);
    const userEmail =
      isRecord(user) && typeof user.email === "string" && user.email.trim().length > 0
        ? user.email.trim()
        : null;

    const orgId: string = resolveOrganizationId();

    const sinkIds: NotificationsTestSinkId[] = Array.isArray(args.sinkIds)
      ? (args.sinkIds as NotificationsTestSinkId[])
      : ["inApp", "email"];
    const emailSelected = sinkIds.includes("email");
    let canAttemptEmail = emailSelected && Boolean(userEmail);

    if (canAttemptEmail) {
      const settings: unknown = await ctx.runQuery(
        components.launchthat_email.queries.getEmailSettings,
        { orgId },
      );
      const enabled = isRecord(settings) && settings.enabled === true;
      if (!enabled) {
        canAttemptEmail = false;
      } else if (isRecord(settings) && settings.fromMode === "custom") {
        const domain: unknown = await ctx.runQuery(
          components.launchthat_email.queries.getEmailDomain,
          { orgId },
        );
        if (!isRecord(domain) || domain.status !== "verified") {
          canAttemptEmail = false;
        }
      }
    }

    const refs = {
      createNotification: components.launchthat_notifications.mutations.createNotification,
      sendTransactionalEmail: components.launchthat_email.delivery.emailSink.sendTransactionalEmail,
    };

    const harness = makeNotificationsTestHarness(refs);
    return await harness.sendTestNotificationToUser(ctx, {
      orgId,
      actorUserId: userId,
      targetUserId: userId,
      targetUserEmail: canAttemptEmail ? userEmail : null,
      eventKey: args.eventKey,
      title: args.title,
      content: args.content,
      actionUrl: args.actionUrl,
      mode: args.mode,
      sinkIds: sinkIds.filter((s) => s !== "email" || canAttemptEmail),
    });
  },
});

