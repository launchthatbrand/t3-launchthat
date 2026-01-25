import type { FunctionReference } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

interface NotificationsQueries {
  paginateByUserIdAcrossOrgs: FunctionReference<
    "query",
    "public",
    {
      userId: string;
      filters?: { eventKey?: string; tabKey?: string };
      paginationOpts: {
        numItems: number;
        cursor: string | null;
      };
    },
    unknown
  >;
  getUnreadCountByUserIdAcrossOrgs: FunctionReference<
    "query",
    "public",
    { userId: string },
    unknown
  >;

  getEventsAnalyticsSummary?: FunctionReference<
    "query",
    "public",
    { daysBack?: number; maxRows?: number },
    unknown
  >;
}

const notificationsQueries = (() => {
  const componentsAny = components as unknown as {
    launchthat_notifications?: { queries?: unknown };
  };
  return (componentsAny.launchthat_notifications?.queries ?? {}) as NotificationsQueries;
})();

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const resolveUserIdByClerkId = async (ctx: any, clerkId: string): Promise<string | null> => {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
  if (!isRecord(user)) return null;
  const id = user._id;
  return typeof id === "string" ? id : null;
};

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
};

export const paginateByClerkIdAcrossOrgs = query({
  args: {
    clerkId: v.string(),
    filters: v.optional(
      v.object({
        eventKey: v.optional(v.string()),
        tabKey: v.optional(v.string()),
      }),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await resolveUserIdByClerkId(ctx, args.clerkId);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: null };
    }
    const res = (await ctx.runQuery(
      notificationsQueries.paginateByUserIdAcrossOrgs,
      {
        userId,
        filters: args.filters,
        paginationOpts: args.paginationOpts,
      },
    )) as any;
    return {
      page: Array.isArray(res?.page) ? res.page : [],
      isDone: Boolean(res?.isDone),
      continueCursor:
        typeof res?.continueCursor === "string" || res?.continueCursor === null
          ? res.continueCursor
          : null,
    };
  },
});

export const getUnreadCountByClerkIdAcrossOrgs = query({
  args: { clerkId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await resolveUserIdByClerkId(ctx, args.clerkId);
    if (!userId) return 0;
    const count = await ctx.runQuery(
      notificationsQueries.getUnreadCountByUserIdAcrossOrgs,
      { userId },
    );
    return typeof count === "number" ? count : 0;
  },
});

export const getPlatformNotificationsAnalyticsSummary = query({
  args: {
    daysBack: v.optional(v.number()),
    maxRows: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (!notificationsQueries.getEventsAnalyticsSummary) return null;
    return await ctx.runQuery(notificationsQueries.getEventsAnalyticsSummary, {
      daysBack: args.daysBack,
      maxRows: args.maxRows,
    });
  },
});

