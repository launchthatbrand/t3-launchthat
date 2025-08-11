import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
/**
 * Get notifications by Clerk ID with optional filters and pagination
 */
export const getNotificationsByClerkId = query({
    args: {
        clerkId: v.string(),
        filters: v.optional(v.object({})),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        // Resolve Convex user via users.getUserByClerkId
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user)
            return [];
        let q = ctx.db
            .query("notifications")
            .withIndex("by_user", (x) => x.eq("userId", user._id));
        // Optional single-type filter
        if (args.filters && args.filters.type) {
            const type = args.filters.type;
            q = ctx.db
                .query("notifications")
                .withIndex("by_user_type", (x) => x.eq("userId", user._id).eq("type", type));
        }
        // Apply pagination if provided
        if (args.paginationOpts) {
            const page = await q.order("desc").paginate(args.paginationOpts);
            return page.page;
        }
        return await q.order("desc").take(10);
    },
});
/**
 * Lightweight list by Clerk ID (no filters/pagination)
 */
export const listNotificationsByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user)
            return [];
        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(10);
    },
});
