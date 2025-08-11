/**
 * Content Types Queries
 *
 * This module provides query endpoints for content types.
 */
import { v } from "convex/values";
import { query } from "../../_generated/server";
/**
 * List all content types
 */
export const list = query({
    args: {
        includeBuiltIn: v.optional(v.boolean()),
    },
    returns: v.array(v.object({
        _id: v.id("contentTypes"),
        _creationTime: v.number(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        isBuiltIn: v.boolean(),
        isPublic: v.boolean(),
        enableVersioning: v.optional(v.boolean()),
        enableApi: v.optional(v.boolean()),
        includeTimestamps: v.optional(v.boolean()),
        fieldCount: v.optional(v.number()),
        entryCount: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
        createdBy: v.optional(v.id("users")),
    })),
    handler: async (ctx, args) => {
        const { includeBuiltIn = true } = args;
        if (!includeBuiltIn) {
            // Filter out built-in content types
            return await ctx.db
                .query("contentTypes")
                .withIndex("by_isBuiltIn", (q) => q.eq("isBuiltIn", false))
                .collect();
        }
        // Return all content types
        return await ctx.db.query("contentTypes").collect();
    },
});
/**
 * Get a content type by ID (simplified)
 */
export const get = query({
    args: {
        id: v.id("contentTypes"),
    },
    returns: v.union(v.object({
        _id: v.id("contentTypes"),
        _creationTime: v.number(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        isBuiltIn: v.boolean(),
        isPublic: v.boolean(),
        enableVersioning: v.optional(v.boolean()),
        enableApi: v.optional(v.boolean()),
        includeTimestamps: v.optional(v.boolean()),
        fieldCount: v.optional(v.number()),
        entryCount: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
        createdBy: v.optional(v.id("users")),
    }), v.null()),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
