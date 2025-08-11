import { v } from "convex/values";
import { mutation } from "../_generated/server";
export const createCategory = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        postTypes: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("categories", args);
    },
});
export const deleteCategory = mutation({
    args: {
        categoryId: v.id("categories"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.categoryId);
        return args.categoryId;
    },
});
export const updateCategory = mutation({
    args: {
        categoryId: v.id("categories"),
        name: v.string(),
        description: v.optional(v.string()),
        postTypes: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.categoryId, {
            name: args.name,
            description: args.description,
            postTypes: args.postTypes,
        });
        return args.categoryId;
    },
});
