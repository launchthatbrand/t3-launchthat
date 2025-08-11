import { v } from "convex/values";
import { mutation } from "../_generated/server";
/**
 * Update or insert Puck editor data for a specific page
 */
export const updateData = mutation({
    args: {
        pageIdentifier: v.string(),
        data: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("puckEditor")
            .withIndex("by_pageIdentifier", (q) => q.eq("pageIdentifier", args.pageIdentifier))
            .first();
        if (existing) {
            // If data exists, patch it
            await ctx.db.patch(existing._id, { data: args.data });
            return existing._id;
        }
        else {
            // Otherwise, insert a new document
            return await ctx.db.insert("puckEditor", {
                pageIdentifier: args.pageIdentifier,
                data: args.data,
            });
        }
    },
});
