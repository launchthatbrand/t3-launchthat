import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Generate upload URL for media files
 * This is step 1 of the 3-step upload process
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // You can add authentication/authorization here if needed
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new ConvexError("Authentication required");
    // }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save media metadata after successful upload
 * This is step 3 of the 3-step upload process
 */
export const saveMedia = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))), // New global category IDs
    categories: v.optional(v.array(v.string())), // Legacy field for backward compatibility
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  returns: v.object({
    _id: v.id("mediaItems"),
    storageId: v.id("_storage"),
    url: v.string(),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categories: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("published")),
  }),
  handler: async (ctx, args) => {
    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get URL for uploaded file");
    }

    // Save metadata to mediaItems table
    const mediaId = await ctx.db.insert("mediaItems", {
      storageId: args.storageId,
      title: args.title,
      caption: args.caption,
      alt: args.alt,
      categoryIds: args.categoryIds,
      categories: args.categories,
      status: args.status ?? "draft",
    });

    return {
      _id: mediaId,
      storageId: args.storageId,
      url,
      title: args.title,
      caption: args.caption,
      alt: args.alt,
      categoryIds: args.categoryIds,
      categories: args.categories,
      status: args.status ?? "draft",
    };
  },
});

/**
 * Update existing media metadata
 */
export const updateMedia = mutation({
  args: {
    id: v.id("mediaItems"),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  returns: v.id("mediaItems"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete media file and its metadata
 */
export const deleteMedia = mutation({
  args: {
    id: v.id("mediaItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the media item to find the storage ID
    const mediaItem = await ctx.db.get(args.id);
    if (!mediaItem) {
      throw new Error("Media item not found");
    }

    // Delete the file from storage if it exists
    if (mediaItem.storageId) {
      await ctx.storage.delete(mediaItem.storageId);
    }

    // Delete the metadata record
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Legacy upsertMediaMeta function - kept for backward compatibility
 * @deprecated Use saveMedia instead
 */
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
