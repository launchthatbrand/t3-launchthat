import type { FunctionReference } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

interface NotificationsQueries {
  paginateByClerkIdAcrossOrgs: FunctionReference<
    "query",
    "public",
    {
      clerkId: string;
      filters?: { eventKey?: string; tabKey?: string };
      paginationOpts: {
        numItems: number;
        cursor: string | null;
      };
    },
    unknown
  >;
}

const notificationsQueries = (() => {
  const componentsAny = components as unknown as {
    launchthat_notifications?: { queries?: unknown };
  };
  return (componentsAny.launchthat_notifications?.queries ?? {}) as NotificationsQueries;
})();

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
    const res = (await ctx.runQuery(
      notificationsQueries.paginateByClerkIdAcrossOrgs,
      {
        clerkId: args.clerkId,
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

