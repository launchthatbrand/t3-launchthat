import { v } from "convex/values";
import { query } from "../_generated/server";
/**
 * Get Puck editor data for a specific page
 */
export const getData = query({
    args: {
        pageIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const puckData = await ctx.db
            .query("puckEditor")
            .withIndex("by_pageIdentifier", (q) => q.eq("pageIdentifier", args.pageIdentifier))
            .first();
        return puckData?.data ?? null;
    },
});
