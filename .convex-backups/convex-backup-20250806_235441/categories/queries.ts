import { v } from "convex/values";

import { query } from "../_generated/server";

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const listCategoriesByPostType = query({
  args: { postType: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("categories").collect();
    return all.filter((cat) => cat.postTypes.includes(args.postType));
  },
});
