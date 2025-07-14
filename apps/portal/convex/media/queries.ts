import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

// List all mediaItems records
export const listMediaItemsWithUrl = query({
  args: {
    categoryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all mediaItems, optionally filter by category
    let items = await ctx.db.query("mediaItems").collect();
    if (args.categoryId) {
      items = items.filter(
        (item) =>
          Array.isArray(item.categories) &&
          item.categories.includes(args.categoryId),
      );
    }

    // For each item, get the storage URL if storageId exists
    const result = [];
    for (const item of items) {
      let url: string | null = null;
      if (item.storageId) {
        url = await ctx.storage.getUrl(item.storageId);
      }
      result.push({
        ...item,
        url, // null if not a storage-backed item
      });
    }
    return result;
  },
});

export const listMedia = query({
  args: {
    categoryId: v.optional(v.string()), // Accept optional categoryId
  },
  returns: v.array(
    v.object({
      _id: v.id("_storage"),
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all files from storage
    const files = await ctx.db.system.query("_storage").collect();

    // If categoryId is provided, get all mediaItems with that categoryId
    let allowedStorageIds: Id<"_storage">[] | undefined = undefined;
    if (args.categoryId) {
      // Assume mediaItems table has a categoryId or categories field
      // Try categories: v.optional(v.array(v.string()))
      const mediaItems = await ctx.db.query("mediaItems").collect();
      allowedStorageIds = mediaItems
        .filter((item) => {
          // Support both categoryId and categories array
          if (Array.isArray(item.categories) && args.categoryId) {
            return item.categories.includes(args.categoryId);
          }
          // If you use categoryId: v.string(), use this:
          // return item.categoryId === args.categoryId;
          return false;
        })
        .map((item) => item.storageId);
    }

    const images: {
      _id: Id<"_storage">;
      url: string;
      contentType?: string;
      size: number;
    }[] = [];

    for (const file of files) {
      const meta = file as unknown as {
        _id: Id<"_storage">;
        contentType?: string;
        size: number;
      };

      if (meta.contentType?.startsWith("image/")) {
        // If filtering by category, skip if not in allowedStorageIds
        if (allowedStorageIds && !allowedStorageIds.includes(meta._id))
          continue;
        const url = await ctx.storage.getUrl(meta._id);
        if (url) {
          images.push({
            _id: meta._id,
            url,
            contentType: meta.contentType,
            size: meta.size,
          });
        }
      }
    }

    return images;
  },
});

// Get single image metadata and URL by storage ID
export const getMediaById = query({
  args: { id: v.id("_storage") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("_storage"),
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Fetch metadata from system table
    const meta = await ctx.db.system.get(args.id);
    if (!meta) return null;

    const metaTyped = meta as unknown as {
      _id: Id<"_storage">;
      contentType?: string;
      size: number;
    };

    const url = await ctx.storage.getUrl(args.id);
    if (!url) return null;

    return {
      _id: metaTyped._id,
      url,
      contentType: metaTyped.contentType,
      size: metaTyped.size,
    };
  },
});
