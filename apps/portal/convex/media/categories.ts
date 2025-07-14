import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

export const listMediaCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mediaCategories").collect();
  },
});

export const createMediaCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mediaCategories", {
      name: args.name,
      description: args.description,
    });
  },
});

export const updateMediaCategory = mutation({
  args: {
    categoryId: v.id("mediaCategories"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.categoryId, {
      name: args.name,
      description: args.description,
    });
    return args.categoryId;
  },
});

export const deleteMediaCategory = mutation({
  args: {
    categoryId: v.id("mediaCategories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.categoryId);
    return args.categoryId;
  },
});
