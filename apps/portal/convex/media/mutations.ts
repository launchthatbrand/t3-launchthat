import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

export const upsertMediaMeta = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  returns: v.id("mediaItems"),
  handler: async (ctx, args) => {
    // Check if meta exists
    const existing = await ctx.db
      .query("mediaItems")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        caption: args.caption,
        alt: args.alt,
        categories: args.categories,
        status: args.status,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("mediaItems", {
      storageId: args.storageId,
      title: args.title,
      caption: args.caption,
      alt: args.alt,
      categories: args.categories,
      status: args.status ?? "draft",
    });
    return id;
  },
});
