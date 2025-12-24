import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

const metaValueValidator = v.union(v.string(), v.number(), v.boolean(), v.null());

export const listMediaItemMeta = query({
  args: {
    organizationId: v.id("organizations"),
    mediaItemId: v.id("mediaItems"),
  },
  returns: v.array(
    v.object({
      _id: v.id("mediaItemsMeta"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      mediaItemId: v.id("mediaItems"),
      key: v.string(),
      value: v.optional(metaValueValidator),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mediaItemsMeta")
      .withIndex("by_org_and_mediaItem", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("mediaItemId", args.mediaItemId),
      )
      .collect();
  },
});

export const upsertMediaItemMeta = mutation({
  args: {
    organizationId: v.id("organizations"),
    mediaItemId: v.id("mediaItems"),
    meta: v.record(v.string(), metaValueValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const mediaItem = await ctx.db.get(args.mediaItemId);
    if (!mediaItem) {
      throw new Error("Media item not found");
    }

    for (const [key, value] of Object.entries(args.meta)) {
      const existing = await ctx.db
        .query("mediaItemsMeta")
        .withIndex("by_org_mediaItem_and_key", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("mediaItemId", args.mediaItemId)
            .eq("key", key),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
      } else {
        await ctx.db.insert("mediaItemsMeta", {
          organizationId: args.organizationId,
          mediaItemId: args.mediaItemId,
          key,
          value,
          createdAt: timestamp,
        });
      }
    }

    return null;
  },
});


