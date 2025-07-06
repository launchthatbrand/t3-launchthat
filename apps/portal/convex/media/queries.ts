import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

export const listImages = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("_storage"),
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const files = await ctx.db.system.query("_storage").collect();

    const images: {
      _id: Id<"_storage">;
      url: string;
      contentType?: string;
      size: number;
    }[] = [];

    for (const file of files) {
      // file has contentType and size
      // Type casting due to system table generic
      const meta = file as unknown as {
        _id: Id<"_storage">;
        contentType?: string;
        size: number;
      };

      if (meta.contentType?.startsWith("image/")) {
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
export const getImageById = query({
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
