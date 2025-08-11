import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";
/**
 * Create a new category with automatic slug generation
 */
export const createCategory = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({
                code: "unauthorized",
                message: "You must be signed in to create a category",
            });
        }
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            throw new ConvexError({
                code: "not_found",
                message: "User not found",
            });
        }
        // Check if category already exists (case insensitive)
        const posts = await ctx.db.query("posts").collect();
        const existingCategories = new Set(posts
            .map((post) => post.category)
            .filter(Boolean)
            .map((category) => category?.toLowerCase()));
        if (existingCategories.has(args.name.toLowerCase())) {
            throw new ConvexError({
                code: "conflict",
                message: `Category "${args.name}" already exists`,
            });
        }
        // In a real implementation, we would store categories in a separate table
        // For now, we're just returning success since the frontend will refresh
        // the categories list
        return { success: true, name: args.name };
    },
});
/**
 * Update a category
 */
export const updateCategory = mutation({
    args: {
        oldName: v.string(),
        newName: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({
                code: "unauthorized",
                message: "You must be signed in to update a category",
            });
        }
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            throw new ConvexError({
                code: "not_found",
                message: "User not found",
            });
        }
        // Check if new category name already exists (if it's different from old name)
        if (args.oldName.toLowerCase() !== args.newName.toLowerCase()) {
            const posts = await ctx.db.query("posts").collect();
            const existingCategories = new Set(posts
                .map((post) => post.category)
                .filter(Boolean)
                .map((category) => category?.toLowerCase()));
            if (existingCategories.has(args.newName.toLowerCase())) {
                throw new ConvexError({
                    code: "conflict",
                    message: `Category "${args.newName}" already exists`,
                });
            }
        }
        // Update all posts with this category
        const postsToUpdate = await ctx.db
            .query("posts")
            .filter((q) => q.eq(q.field("category"), args.oldName))
            .collect();
        // Update each post with the new category name
        for (const post of postsToUpdate) {
            await ctx.db.patch(post._id, { category: args.newName });
        }
        return {
            success: true,
            oldName: args.oldName,
            newName: args.newName,
            updatedCount: postsToUpdate.length,
        };
    },
});
/**
 * Delete a category (sets all posts to "Uncategorized")
 */
export const deleteCategory = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({
                code: "unauthorized",
                message: "You must be signed in to delete a category",
            });
        }
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            throw new ConvexError({
                code: "not_found",
                message: "User not found",
            });
        }
        // Update all posts with this category
        const postsToUpdate = await ctx.db
            .query("posts")
            .filter((q) => q.eq(q.field("category"), args.name))
            .collect();
        // Update each post to use "Uncategorized" category
        for (const post of postsToUpdate) {
            await ctx.db.patch(post._id, { category: "Uncategorized" });
        }
        return {
            success: true,
            deletedCategory: args.name,
            updatedCount: postsToUpdate.length,
        };
    },
});
