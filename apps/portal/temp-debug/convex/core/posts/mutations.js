/**
 * Posts Mutations
 *
 * This module provides mutation endpoints for posts.
 */
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
/**
 * Create a new post
 */
export const createPost = mutation({
    args: {
        title: v.string(),
        content: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        slug: v.string(),
        status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
        category: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        featuredImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get current user if authenticated
        const identity = await ctx.auth.getUserIdentity();
        let authorId;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            if (user) {
                authorId = user._id;
            }
        }
        return await ctx.db.insert("posts", {
            title: args.title,
            content: args.content,
            excerpt: args.excerpt,
            slug: args.slug,
            status: args.status,
            category: args.category,
            tags: args.tags,
            featuredImage: args.featuredImage,
            authorId,
            createdAt: Date.now(),
        });
    },
});
/**
 * Update an existing post
 */
export const updatePost = mutation({
    args: {
        id: v.id("posts"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        slug: v.optional(v.string()),
        status: v.optional(v.union(v.literal("published"), v.literal("draft"), v.literal("archived"))),
        category: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        featuredImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const post = await ctx.db.get(id);
        if (!post) {
            throw new Error(`Post with ID ${id} not found`);
        }
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
        return id;
    },
});
/**
 * Delete a post
 */
export const deletePost = mutation({
    args: {
        id: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if (!post) {
            throw new Error(`Post with ID ${args.id} not found`);
        }
        await ctx.db.delete(args.id);
        return null;
    },
});
/**
 * Update post status
 */
export const updatePostStatus = mutation({
    args: {
        id: v.id("posts"),
        status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if (!post) {
            throw new Error(`Post with ID ${args.id} not found`);
        }
        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now(),
        });
        return args.id;
    },
});
/**
 * Bulk update post status
 */
export const bulkUpdatePostStatus = mutation({
    args: {
        ids: v.array(v.id("posts")),
        status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
    },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.ids) {
            const post = await ctx.db.get(id);
            if (post) {
                await ctx.db.patch(id, {
                    status: args.status,
                    updatedAt: Date.now(),
                });
                results.push(id);
            }
        }
        return results;
    },
});
