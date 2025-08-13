import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

export const listMediaCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("postTypes"), ["media"]))
      .collect();
  },
});

export const createMediaCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      postTypes: ["media"],
      name: args.name,
      description: args.description,
      slug: args.name.toLowerCase().replace(/ /g, "-"),
    });
  },
});

export const updateMediaCategory = mutation({
  args: {
    categoryId: v.id("categories"),
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
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.categoryId);
    return args.categoryId;
  },
});
