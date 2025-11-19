import { query } from "../_generated/server";
import { v } from "convex/values";

export const getData = query({
  args: {
    pageIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("puckEditor")
      .withIndex("by_pageIdentifier", (q) =>
        q.eq("pageIdentifier", args.pageIdentifier),
      )
      .first();

    return record?.data ?? null;
  },
});

