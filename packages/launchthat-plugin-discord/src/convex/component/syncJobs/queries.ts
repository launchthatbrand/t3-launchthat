import { v } from "convex/values";
import { query } from "../server";

export const listPendingJobs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.string(),
      organizationId: v.string(),
      userId: v.string(),
      reason: v.union(
        v.literal("purchase"),
        v.literal("tagChange"),
        v.literal("manual"),
      ),
      payload: v.any(),
      attempts: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    const rows = await ctx.db
      .query("syncJobs")
      .withIndex("by_status_and_createdAt", (q: any) => q.eq("status", "pending"))
      .order("asc")
      .take(limit);

    return rows.map((row: any) => ({
      _id: String(row._id),
      organizationId: row.organizationId,
      userId: row.userId,
      reason: row.reason,
      payload: row.payload,
      attempts: row.attempts,
      createdAt: row.createdAt,
    }));
  },
});


