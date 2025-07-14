import { v } from "convex/values";

import { query } from "../_generated/server";

// Generic getById query for any table
export const getById = query({
  args: {
    tableName: v.string(),
    id: v.string(), // We'll cast to v.id(tableName) at runtime
  },
  handler: async (ctx, args) => {
    // Validate id as a Convex id for the given table
    // Convex doesn't allow dynamic v.id(args.tableName), so we trust the input here
    // (You may want to add extra validation in the caller)
    // @ts-expect-error: dynamic table name
    const doc = await ctx.db.get(args.id);
    return doc ?? null;
  },
});
