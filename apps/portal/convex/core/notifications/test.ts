"use node";

import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api, components, internal } from "../../_generated/api";
import { action } from "../../_generated/server";
import { throwInvalidInput } from "../../shared/errors";

type InternalQueryRef = FunctionReference<"query", "internal">;
type InternalMutationRef = FunctionReference<"mutation", "internal">;
type InternalActionRef = FunctionReference<"action", "internal">;
type PublicActionRef = FunctionReference<"action", "public">;

const internalRefs = internal as unknown as {
  core: {
    notifications: {
      internal: {
        testHelpers: {
          getOrgAdminMembership: InternalQueryRef;
          getToggleInfoForUser: InternalQueryRef;
          insertNotificationForUser: InternalMutationRef;
        };
      };
      delivery: {
        runSinks: {
          runSinks: InternalActionRef;
        };
      };
    };
  };
  plugins: {
    discord: {
      notificationsSink: {
        sendAnnouncementsForEvent: InternalActionRef;
      };
    };
  };
};

const apiRefs = api as unknown as {
  core: {
    emails: {
      reactEmailRender: {
        sendTransactionalEmail: PublicActionRef;
      };
    };
  };
};

export const sendTestNotificationToUser = action({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    eventKey: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    mode: v.optional(
      v.union(v.literal("forceAll"), v.literal("respectPreferences")),
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
  handler: async (ctx, args) => {
    const mode = args.mode ?? "forceAll";
    const targetUserId = (args.targetUserId ?? args.actorUserId) as Id<"users">;
    const membership = (await ctx.runQuery(
      internalRefs.core.notifications.internal.testHelpers
        .getOrgAdminMembership,
      { orgId: args.orgId, userId: args.actorUserId },
    )) as { isActive: boolean; role: string } | null;
    if (!membership?.isActive) {
      throwInvalidInput("Access denied: not a member of this organization");
    }
    if (membership.role !== "owner" && membership.role !== "admin") {
      throwInvalidInput("Access denied: admin role required");
    }

    const toggleInfo = (await ctx.runQuery(
      internalRefs.core.notifications.internal.testHelpers.getToggleInfoForUser,
      {
        orgId: args.orgId,
        userId: targetUserId,
        eventKey: args.eventKey,
      },
    )) as {
      userEmail: string | null;
      userInAppOverride: boolean | null;
      userEmailOverride: boolean | null;
      orgInAppDefault: boolean | null;
      orgEmailDefault: boolean | null;
    };

    const userInAppOverride = toggleInfo.userInAppOverride;
    const orgInAppDefault = toggleInfo.orgInAppDefault;
    const inAppEnabled =
      mode === "forceAll"
        ? true
        : typeof userInAppOverride === "boolean"
          ? userInAppOverride
          : typeof orgInAppDefault === "boolean"
            ? orgInAppDefault
            : true;

    const userEmailOverride = toggleInfo.userEmailOverride;
    const orgEmailDefault = toggleInfo.orgEmailDefault;
    const emailEnabled =
      mode === "forceAll"
        ? true
        : typeof userEmailOverride === "boolean"
          ? userEmailOverride
          : typeof orgEmailDefault === "boolean"
            ? orgEmailDefault
            : false;

    const createdAt = Date.now();
    // NOTE: this is an action; actions cannot access `ctx.db` directly.
    // Fetch org data via query so we can use the org logo for the test notification image.
    const org = (await ctx.runQuery(api.core.organizations.queries.getById, {
      organizationId: args.orgId,
    })) as { logo?: string | null } | null;
    const imageUrl =
      typeof org?.logo === "string" && org.logo.trim().length > 0
        ? org.logo.trim()
        : null;
    const payload = {
      orgId: args.orgId,
      eventKey: args.eventKey.trim(),
      tabKey: "system",
      scopeKind: "test",
      scopeId: "manual",
      title: args.title.trim(),
      content: args.content?.trim() ? args.content.trim() : null,
      actionUrl: args.actionUrl?.trim() ? args.actionUrl.trim() : null,
      imageUrl,
      actionData: null,
      sourceUserId: args.actorUserId,
      expiresAt: null,
      createdAt,
      emailRecipients:
        emailEnabled &&
        typeof toggleInfo.userEmail === "string" &&
        toggleInfo.userEmail.trim()
          ? [{ userId: targetUserId, email: toggleInfo.userEmail.trim() }]
          : [],
    };

    let inAppInserted = false;
    if (inAppEnabled) {
      await ctx.runMutation(
        internalRefs.core.notifications.internal.testHelpers
          .insertNotificationForUser,
        {
          orgId: args.orgId,
          userId: targetUserId,
          eventKey: payload.eventKey,
          tabKey: payload.tabKey,
          scopeKind: payload.scopeKind,
          scopeId: payload.scopeId,
          title: payload.title,
          content: payload.content ?? undefined,
          actionUrl: payload.actionUrl ?? undefined,
          sourceUserId: args.actorUserId,
          createdAt,
        },
      );
      inAppInserted = true;
    }

    const errors: string[] = [];

    let emailSucceeded = false;
    const emailAttempted = payload.emailRecipients.length > 0;
    if (emailAttempted) {
      try {
        const to = payload.emailRecipients[0]?.email;
        if (!to) {
          throwInvalidInput("Email recipient missing email address");
        }
        await ctx.runAction(
          apiRefs.core.emails.reactEmailRender.sendTransactionalEmail,
          {
            orgId: payload.orgId,
            to,
            templateKey: "core.notification.event",
            variables: {
              title: payload.title,
              content: payload.content ?? "",
              actionUrl: payload.actionUrl ?? "",
              eventKey: payload.eventKey,
            },
          },
        );
        emailSucceeded = true;
      } catch (e) {
        errors.push(
          e instanceof Error ? `email: ${e.message}` : `email: ${String(e)}`,
        );
      }
    }

    let discordSucceeded = false;
    const discordAttempted = true;
    try {
      await ctx.runAction(
        internalRefs.plugins.discord.notificationsSink
          .sendAnnouncementsForEvent,
        { payload },
      );
      discordSucceeded = true;
    } catch (e) {
      errors.push(
        e instanceof Error ? `discord: ${e.message}` : `discord: ${String(e)}`,
      );
    }

    // Mirror into unified logs so test notifications show up under /admin/logs and the Notifications logs tab.
    try {
      const sinkStatus = {
        inApp: {
          status: inAppInserted ? ("complete" as const) : ("failed" as const),
        },
        email: {
          status: emailAttempted
            ? emailSucceeded
              ? ("complete" as const)
              : ("failed" as const)
            : ("scheduled" as const),
        },
        "discord.announcements": {
          status: discordAttempted
            ? discordSucceeded
              ? ("complete" as const)
              : ("failed" as const)
            : ("scheduled" as const),
        },
      } as const;

      const anyFailed =
        (emailAttempted && !emailSucceeded) ||
        (discordAttempted && !discordSucceeded);

      const email =
        typeof toggleInfo.userEmail === "string" && toggleInfo.userEmail.trim()
          ? toggleInfo.userEmail.trim().toLowerCase()
          : undefined;

      const metadata = Object.fromEntries(
        Object.entries({
          notificationType: "test",
          eventKey: payload.eventKey,
          mode,
          sinkIds: ["inApp", "email", "discord.announcements"],
          sinkStatus,
        }).filter(([, v]) => v !== undefined),
      );

      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        components.launchthat_logs.entries.mutations.insertLogEntry as any,
        {
          organizationId: String(args.orgId),
          pluginKey: "notifications",
          kind: "notification.test",
          email,
          level: anyFailed ? "error" : "info",
          status: anyFailed ? "failed" : "complete",
          message: payload.title,
          actionUrl: payload.actionUrl ?? undefined,
          scopeKind: "test",
          scopeId: "manual",
          metadata: Object.keys(metadata).length ? metadata : undefined,
          createdAt: Date.now(),
        },
      );
    } catch (e) {
      console.error(
        "[notifications.test.sendTestNotificationToUser] log mirror failed:",
        e,
      );
    }

    // NOTE: We intentionally do NOT schedule the sink runner here.
    // This test endpoint should send exactly one Discord message and one email.
    // Scheduling `runSinks` would cause duplicates (since this test already calls sinks directly).

    return {
      inAppInserted,
      emailAttempted,
      emailSucceeded,
      discordAttempted,
      discordSucceeded,
      errors,
    };
  },
});
