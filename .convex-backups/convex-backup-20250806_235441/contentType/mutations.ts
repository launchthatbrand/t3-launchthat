import { v } from "convex/values";

import { mutation } from "../_generated/server";

// Generic create mutation
export const create = mutation({
  args: {
    tableName: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, args) => {
    // @ts-expect-error: dynamic table name
    const id = await ctx.db.insert(args.tableName, args.doc);
    // @ts-expect-error: dynamic table name
    const created = await ctx.db.get(id);
    return created ?? null;
  },
});

// Generic update mutation
export const update = mutation({
  args: {
    tableName: v.string(),
    id: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    // @ts-expect-error: dynamic table name
    await ctx.db.patch(args.id, args.updates);
    // @ts-expect-error: dynamic table name
    const updated = await ctx.db.get(args.id);
    return updated ?? null;
  },
});

// Generic delete mutation
export const remove = mutation({
  args: {
    tableName: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // @ts-expect-error: dynamic table name
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    // @ts-expect-error: dynamic table name
    await ctx.db.delete(args.id);
    return doc;
  },
});
