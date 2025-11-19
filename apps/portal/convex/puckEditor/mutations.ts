import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateData = mutation({
  args: {
    pageIdentifier: v.string(),
    data: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("puckEditor")
      .withIndex("by_pageIdentifier", (q) =>
        q.eq("pageIdentifier", args.pageIdentifier),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data });
      return existing._id;
    }

    return ctx.db.insert("puckEditor", {
      pageIdentifier: args.pageIdentifier,
      data: args.data,
    });
  },
});

