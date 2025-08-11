import { v } from "convex/values";
import { query } from "../_generated/server";
/**
 * List all global tags.
 */
export const listTags = query({
    args: {},
    returns: v.array(v.object({
        _id: v.id("tags"),
        _creationTime: v.number(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
    })),
    handler: async (ctx) => {
        return await ctx.db.query("tags").collect();
    },
});
