import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "./server";

const resolveUserIdByClerkId = async (
  ctx: any,
  clerkId: string,
): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.tokenIdentifier) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    return user ? String(user._id) : null;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
  return user ? String(user._id) : null;
};

export const paginateByClerkIdAndOrgId = query({
  args: {
    clerkId: v.string(),
    orgId: v.id("organizations"),
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
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    const eventKeyRaw =
      typeof args.filters?.eventKey === "string"
        ? args.filters.eventKey.trim()
        : undefined;

    const qBase = eventKeyRaw
      ? ctx.db
          .query("notifications")
          .withIndex("by_user_org_eventKey", (q: any) =>
            q
              .eq("userId", userId as any)
              .eq("orgId", args.orgId)
              .eq("eventKey", eventKeyRaw),
          )
      : ctx.db
          .query("notifications")
          .withIndex("by_user_org_createdAt", (q: any) =>
            q.eq("userId", userId as any).eq("orgId", args.orgId),
          );

    const result = await qBase.order("desc").paginate(args.paginationOpts);
    const tabKey = typeof args.filters?.tabKey === "string" ? args.filters.tabKey : undefined;
    const page = tabKey ? result.page.filter((n: any) => n.tabKey === tabKey) : result.page;
    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

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
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    // For now, filter by tabKey/eventKey in-memory to avoid extra indexes.
    const result = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", userId as any))
      .order("desc")
      .paginate(args.paginationOpts);

    const eventKey =
      typeof args.filters?.eventKey === "string"
        ? args.filters.eventKey.trim()
        : undefined;
    const tabKey = typeof args.filters?.tabKey === "string" ? args.filters.tabKey : undefined;

    const page = result.page.filter((n: any) => {
      if (eventKey && n.eventKey !== eventKey) return false;
      if (tabKey && n.tabKey !== tabKey) return false;
      return true;
    });

    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

