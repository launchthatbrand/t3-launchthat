import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { components } from "../../_generated/api";

const SINK_IN_APP = "inApp" as const;
const SINK_EMAIL = "email" as const;
const SINK_DISCORD_ANNOUNCEMENTS = "discord.announcements" as const;

const ALLOWED_SINKS = [SINK_IN_APP, SINK_EMAIL, SINK_DISCORD_ANNOUNCEMENTS] as const;
type AllowedSinkId = (typeof ALLOWED_SINKS)[number];

const BROADCAST_STATUS = [
  "scheduled",
  "running",
  "complete",
  "failed",
] as const;
type BroadcastStatus = (typeof BROADCAST_STATUS)[number];

const requireOrgAdmin = async (
  ctx: { db: any },
  args: { orgId: Id<"organizations">; actorUserId: Id<"users"> },
) => {
  // Allow global admins (users.role) if present.
  const actor = await ctx.db.get(args.actorUserId);
  const actorRole = (actor?.role ?? "").toString().trim().toLowerCase();
  if (actorRole === "admin" || actorRole === "administrator") return;

  // Or allow org-scoped owner/admin membership.
  const membership = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_organization", (q: any) =>
      q.eq("userId", args.actorUserId).eq("organizationId", args.orgId),
    )
    .first();
  const role = membership?.role;
  if (!membership?.isActive || (role !== "owner" && role !== "admin")) {
    throw new Error("Forbidden: organization admin privileges required");
  }
};

const normalizeSinkIds = (sinkIds: string[]): AllowedSinkId[] => {
  const out: AllowedSinkId[] = [];
  for (const sinkId of sinkIds) {
    if (sinkId === SINK_IN_APP || sinkId === SINK_EMAIL || sinkId === SINK_DISCORD_ANNOUNCEMENTS) {
      if (!out.includes(sinkId)) out.push(sinkId);
    }
  }
  return out;
};

export const createManualBroadcast = mutation({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    sinkIds: v.array(v.string()),
  },
  returns: v.id("manualNotificationBroadcasts"),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, { orgId: args.orgId, actorUserId: args.actorUserId });

    const sinks = normalizeSinkIds(args.sinkIds);
    if (sinks.length === 0) {
      throw new Error("Select at least one delivery sink");
    }

    const now = Date.now();
    const sinkStatus: Record<
      string,
      { status: BroadcastStatus; error?: string; sent?: number }
    > = {};
    for (const sinkId of sinks) {
      sinkStatus[sinkId] = { status: "scheduled" };
    }

    const broadcastId = await ctx.db.insert("manualNotificationBroadcasts", {
      orgId: args.orgId,
      createdByUserId: args.actorUserId,
      title: args.title.trim(),
      content: args.content?.trim() ? args.content.trim() : undefined,
      actionUrl: args.actionUrl?.trim() ? args.actionUrl.trim() : undefined,
      sinkIds: sinks,
      status: "scheduled",
      cursor: null,
      totalMembers: undefined,
      inAppSent: 0,
      emailSent: 0,
      sinkStatus,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.core.notifications.broadcasts.processManualBroadcast, {
      broadcastId,
    });

    return broadcastId;
  },
});

export const listManualBroadcastsForOrg = query({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("manualNotificationBroadcasts"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      createdByUserId: v.id("users"),
      title: v.string(),
      content: v.optional(v.string()),
      actionUrl: v.optional(v.string()),
      sinkIds: v.array(v.string()),
      status: v.union(
        v.literal("scheduled"),
        v.literal("running"),
        v.literal("complete"),
        v.literal("failed"),
      ),
      totalMembers: v.optional(v.number()),
      inAppSent: v.optional(v.number()),
      emailSent: v.optional(v.number()),
      sinkStatus: v.optional(
        v.record(
          v.string(),
          v.object({
            status: v.union(
              v.literal("scheduled"),
              v.literal("running"),
              v.literal("complete"),
              v.literal("failed"),
            ),
            error: v.optional(v.string()),
            sent: v.optional(v.number()),
          }),
        ),
      ),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, { orgId: args.orgId, actorUserId: args.actorUserId });

    const limit = Math.max(1, Math.min(100, args.limit ?? 50));
    return await ctx.db
      .query("manualNotificationBroadcasts")
      .withIndex("by_org_createdAt", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);
  },
});

export const getBroadcastInternal = internalQuery({
  args: { broadcastId: v.id("manualNotificationBroadcasts") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("manualNotificationBroadcasts"),
      orgId: v.id("organizations"),
      createdByUserId: v.id("users"),
      title: v.string(),
      content: v.union(v.string(), v.null()),
      actionUrl: v.union(v.string(), v.null()),
      sinkIds: v.array(v.string()),
      status: v.union(
        v.literal("scheduled"),
        v.literal("running"),
        v.literal("complete"),
        v.literal("failed"),
      ),
      cursor: v.union(v.string(), v.null()),
      totalMembers: v.union(v.number(), v.null()),
      inAppSent: v.union(v.number(), v.null()),
      emailSent: v.union(v.number(), v.null()),
      sinkStatus: v.union(v.any(), v.null()),
      startedAt: v.union(v.number(), v.null()),
      completedAt: v.union(v.number(), v.null()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.broadcastId);
    if (!row) return null;
    return {
      _id: row._id,
      orgId: row.orgId,
      createdByUserId: row.createdByUserId,
      title: row.title,
      content: typeof row.content === "string" ? row.content : null,
      actionUrl: typeof row.actionUrl === "string" ? row.actionUrl : null,
      sinkIds: Array.isArray(row.sinkIds) ? row.sinkIds.map(String) : [],
      status: row.status as any,
      cursor: row.cursor ?? null,
      totalMembers: typeof row.totalMembers === "number" ? row.totalMembers : null,
      inAppSent: typeof row.inAppSent === "number" ? row.inAppSent : null,
      emailSent: typeof row.emailSent === "number" ? row.emailSent : null,
      sinkStatus: (row as any).sinkStatus ?? null,
      startedAt: typeof row.startedAt === "number" ? row.startedAt : null,
      completedAt: typeof row.completedAt === "number" ? row.completedAt : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
});

export const getOrgMemberPageInternal = internalQuery({
  args: {
    orgId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    memberships: v.array(
      v.object({
        userId: v.id("users"),
        isActive: v.boolean(),
      }),
    ),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
    totalInPage: v.number(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("userOrganizations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.orgId))
      .paginate(args.paginationOpts);

    const memberships = page.page.map((m: any) => ({
      userId: m.userId as Id<"users">,
      isActive: Boolean(m.isActive),
    }));

    return {
      memberships,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      totalInPage: memberships.length,
    };
  },
});

export const getUserPrefsAndEmailInternal = internalQuery({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.object({
    email: v.union(v.string(), v.null()),
    inAppOverride: v.union(v.boolean(), v.null()),
    emailOverride: v.union(v.boolean(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const email =
      typeof user?.email === "string" && user.email.trim().length > 0
        ? user.email.trim()
        : null;

    const prefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q) => q.eq("userId", args.userId).eq("orgId", args.orgId))
      .first();

    const eventKey = "manual.broadcast";
    const inAppOverride =
      typeof prefs?.inAppEnabled?.[eventKey] === "boolean"
        ? Boolean(prefs.inAppEnabled[eventKey])
        : null;
    const emailOverride =
      typeof prefs?.emailEnabled?.[eventKey] === "boolean"
        ? Boolean(prefs.emailEnabled[eventKey])
        : null;

    return { email, inAppOverride, emailOverride };
  },
});

export const getOrgDefaultsInternal = internalQuery({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    inAppDefault: v.union(v.boolean(), v.null()),
    emailDefault: v.union(v.boolean(), v.null()),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
    const eventKey = "manual.broadcast";
    const inAppDefault =
      typeof row?.inAppDefaults?.[eventKey] === "boolean"
        ? Boolean(row.inAppDefaults[eventKey])
        : null;
    const emailDefault =
      typeof row?.emailDefaults?.[eventKey] === "boolean"
        ? Boolean(row.emailDefaults[eventKey])
        : null;
    return { inAppDefault, emailDefault };
  },
});

export const updateBroadcastInternal = internalMutation({
  args: {
    broadcastId: v.id("manualNotificationBroadcasts"),
    patch: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.broadcastId, {
      ...(args.patch as any),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const incrementBroadcastCountsInternal = internalMutation({
  args: {
    broadcastId: v.id("manualNotificationBroadcasts"),
    inAppDelta: v.number(),
    emailDelta: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.broadcastId);
    if (!row) return null;
    await ctx.db.patch(args.broadcastId, {
      inAppSent: (row.inAppSent ?? 0) + args.inAppDelta,
      emailSent: (row.emailSent ?? 0) + args.emailDelta,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const insertInAppInternal = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    broadcastId: v.id("manualNotificationBroadcasts"),
    actorUserId: v.id("users"),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      orgId: args.orgId,
      eventKey: "manual.broadcast",
      tabKey: "system",
      scopeKind: "manualBroadcast",
      scopeId: String(args.broadcastId),
      title: args.title,
      content: args.content,
      read: false,
      actionUrl: args.actionUrl,
      actionData: undefined,
      sourceUserId: args.actorUserId,
      createdAt: Date.now(),
      expiresAt: undefined,
    });
    return null;
  },
});

export const processManualBroadcast = internalAction({
  args: {
    broadcastId: v.id("manualNotificationBroadcasts"),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const broadcast = await ctx.runQuery(internal.core.notifications.broadcasts.getBroadcastInternal, {
      broadcastId: args.broadcastId,
    });
    if (!broadcast) return null;
    if (broadcast.status === "complete" || broadcast.status === "failed") return null;

    const sinkIds = normalizeSinkIds(broadcast.sinkIds);
    const now = Date.now();

    // Initialize status on first run.
    if (broadcast.status === "scheduled") {
      await ctx.runMutation(internal.core.notifications.broadcasts.updateBroadcastInternal, {
        broadcastId: broadcast._id,
        patch: {
          status: "running",
          startedAt: now,
          cursor: broadcast.cursor ?? null,
          sinkStatus: {
            ...(typeof broadcast.sinkStatus === "object" && broadcast.sinkStatus ? broadcast.sinkStatus : {}),
            ...(sinkIds.includes(SINK_IN_APP) ? { [SINK_IN_APP]: { status: "running" } } : {}),
            ...(sinkIds.includes(SINK_EMAIL) ? { [SINK_EMAIL]: { status: "running" } } : {}),
            ...(sinkIds.includes(SINK_DISCORD_ANNOUNCEMENTS)
              ? { [SINK_DISCORD_ANNOUNCEMENTS]: { status: "running" } }
              : {}),
          },
        },
      });
    }

    // Post Discord announcement once (if selected) on the first page.
    if (sinkIds.includes(SINK_DISCORD_ANNOUNCEMENTS) && !args.cursor) {
      try {
        await ctx.runAction(internal.plugins.discord.notificationsSink.sendManualAnnouncement, {
          orgId: broadcast.orgId,
          title: broadcast.title,
          content: broadcast.content ?? undefined,
          actionUrl: broadcast.actionUrl ?? undefined,
        });
        await ctx.runMutation(internal.core.notifications.broadcasts.updateBroadcastInternal, {
          broadcastId: broadcast._id,
          patch: {
            sinkStatus: {
              ...(typeof broadcast.sinkStatus === "object" && broadcast.sinkStatus ? broadcast.sinkStatus : {}),
              [SINK_DISCORD_ANNOUNCEMENTS]: { status: "complete", sent: 1 },
            },
          },
        });
      } catch (err) {
        await ctx.runMutation(internal.core.notifications.broadcasts.updateBroadcastInternal, {
          broadcastId: broadcast._id,
          patch: {
            sinkStatus: {
              ...(typeof broadcast.sinkStatus === "object" && broadcast.sinkStatus ? broadcast.sinkStatus : {}),
              [SINK_DISCORD_ANNOUNCEMENTS]: {
                status: "failed",
                error: err instanceof Error ? err.message : "Discord send failed",
              },
            },
          },
        });
      }
    }

    const orgDefaults = await ctx.runQuery(internal.core.notifications.broadcasts.getOrgDefaultsInternal, {
      orgId: broadcast.orgId,
    });

    const page = await ctx.runQuery(internal.core.notifications.broadcasts.getOrgMemberPageInternal, {
      orgId: broadcast.orgId,
      paginationOpts: {
        numItems: 25,
        cursor: args.cursor ?? null,
      },
    });

    let inAppDelta = 0;
    let emailDelta = 0;
    let emailError: string | null = null;
    let emailErrorCount = 0;

    for (const membership of page.memberships) {
      if (!membership.isActive) continue;

      const prefs = await ctx.runQuery(internal.core.notifications.broadcasts.getUserPrefsAndEmailInternal, {
        orgId: broadcast.orgId,
        userId: membership.userId,
      });

      const shouldInApp =
        sinkIds.includes(SINK_IN_APP) &&
        (typeof prefs.inAppOverride === "boolean"
          ? prefs.inAppOverride
          : typeof orgDefaults.inAppDefault === "boolean"
            ? orgDefaults.inAppDefault
            : true);

      const shouldEmail =
        sinkIds.includes(SINK_EMAIL) &&
        (typeof prefs.emailOverride === "boolean"
          ? prefs.emailOverride
          : typeof orgDefaults.emailDefault === "boolean"
            ? orgDefaults.emailDefault
            : true);

      if (shouldInApp) {
        await ctx.runMutation(internal.core.notifications.broadcasts.insertInAppInternal, {
          orgId: broadcast.orgId,
          userId: membership.userId,
          broadcastId: broadcast._id,
          actorUserId: broadcast.createdByUserId,
          title: broadcast.title,
          content: broadcast.content ?? undefined,
          actionUrl: broadcast.actionUrl ?? undefined,
        });
        inAppDelta += 1;
      }

      if (shouldEmail && prefs.email) {
        try {
          await ctx.runAction(api.core.emails.reactEmailRender.sendTransactionalEmail, {
            orgId: broadcast.orgId,
            to: prefs.email,
            templateKey: "core.notification.event",
            variables: {
              title: broadcast.title,
              content: broadcast.content ?? "",
              actionUrl: broadcast.actionUrl ?? "",
              eventKey: "manual.broadcast",
            },
          });
          emailDelta += 1;
        } catch (err) {
          emailErrorCount += 1;
          if (!emailError) {
            emailError = err instanceof Error ? err.message : "Email send failed";
          }
        }
      }
    }

    if (inAppDelta !== 0 || emailDelta !== 0) {
      await ctx.runMutation(internal.core.notifications.broadcasts.incrementBroadcastCountsInternal, {
        broadcastId: broadcast._id,
        inAppDelta,
        emailDelta,
      });
    }

    if (!page.isDone) {
      await ctx.runMutation(internal.core.notifications.broadcasts.updateBroadcastInternal, {
        broadcastId: broadcast._id,
        patch: { cursor: page.continueCursor },
      });
      await ctx.scheduler.runAfter(0, internal.core.notifications.broadcasts.processManualBroadcast, {
        broadcastId: broadcast._id,
        cursor: page.continueCursor,
      });
      return null;
    }

    const finalSinkStatus: Record<string, any> =
      typeof broadcast.sinkStatus === "object" && broadcast.sinkStatus
        ? (broadcast.sinkStatus as any)
        : {};
    if (sinkIds.includes(SINK_IN_APP)) {
      finalSinkStatus[SINK_IN_APP] = { status: "complete" };
    }
    if (sinkIds.includes(SINK_EMAIL)) {
      finalSinkStatus[SINK_EMAIL] =
        emailErrorCount > 0
          ? { status: "failed", error: emailError ?? "Email send failed", sent: emailDelta }
          : { status: "complete", sent: emailDelta };
    }

    await ctx.runMutation(internal.core.notifications.broadcasts.updateBroadcastInternal, {
      broadcastId: broadcast._id,
      patch: {
        status: "complete",
        completedAt: Date.now(),
        cursor: null,
        sinkStatus: finalSinkStatus,
      },
    });

    // Mirror into unified logs (best-effort).
    try {
      const anyFailed = Object.values(finalSinkStatus).some(
        (s: any) => s?.status === "failed",
      );
      const metadata = Object.fromEntries(
        Object.entries({
          notificationType: "manual",
          eventKey: "manual.broadcast",
          broadcastId: String(broadcast._id),
          sinkIds,
          sinkStatus: finalSinkStatus,
          inAppSent: typeof broadcast.inAppSent === "number" ? broadcast.inAppSent : undefined,
          emailSent: typeof broadcast.emailSent === "number" ? broadcast.emailSent : undefined,
        }).filter(([, v]) => v !== undefined),
      );

      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        components.launchthat_logs.entries.mutations.insertLogEntry as any,
        {
          organizationId: String(broadcast.orgId),
          pluginKey: "notifications",
          kind: "notification.broadcast",
          level: anyFailed ? "error" : "info",
          status: anyFailed ? "failed" : "complete",
          message: broadcast.title,
          actionUrl: broadcast.actionUrl ?? undefined,
          scopeKind: "manualBroadcast",
          scopeId: String(broadcast._id),
          metadata: Object.keys(metadata).length ? metadata : undefined,
          createdAt: Date.now(),
        },
      );
    } catch (error) {
      console.error("[notifications.broadcasts.processManualBroadcast] log mirror failed:", error);
    }

    return null;
  },
});


