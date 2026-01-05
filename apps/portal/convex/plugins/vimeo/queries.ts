/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { query } from "../../_generated/server";

const queryAny = query as any;
const componentsAny = components as any;

export const listVideos = queryAny({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: v.any(),
  // NOTE: We intentionally cast ctx/args to any to avoid TS "type instantiation is excessively deep"
  // in large Convex schemas, while still enforcing runtime validation via `args`/`returns`.
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_node_type_and_owner", (q: any) =>
        q.eq("nodeType", "vimeo").eq("ownerId", args.organizationId),
      )
      .unique();

    if (!connection) {
      return { page: [], isDone: true, continueCursor: null };
    }
    return await ctx.runQuery(
      componentsAny.launchthat_vimeo.videos.queries
        .listVideosByConnectionPaginated,
      {
        connectionId: String(connection._id),
        paginationOpts: args.paginationOpts,
        search: args.search,
      },
    );
  },
});

export const getVideoByExternalId = queryAny({
  args: { connectionId: v.string(), videoId: v.string() },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    return await ctx.runQuery(
      componentsAny.launchthat_vimeo.videos.queries.getVideoByExternalId,
      args,
    );
  },
});
