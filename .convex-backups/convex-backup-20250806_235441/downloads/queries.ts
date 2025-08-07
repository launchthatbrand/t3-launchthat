import { v } from "convex/values";

import { query } from "../_generated/server";
import { fileTypeDetails, validFileTypes } from "../lib/fileTypes";
import { throwForbidden, throwNotFound } from "../shared/errors";
import { checkDownloadAccess, getAuthenticatedUser } from "./lib/helpers";
import { type DownloadPreviewInfo } from "./schema/types";

/**
 * Get a download by ID
 */
export const getDownload = query({
  args: {
    downloadId: v.id("downloads"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId);
    }

    // Check if user has access to this download
    const hasAccess = await checkDownloadAccess(ctx, user._id, args.downloadId);
    if (!hasAccess) {
      throwForbidden("You don't have access to this download");
    }

    return download;
  },
});

/**
 * List all available downloads for the current user
 */
export const listDownloads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit ?? 50;

    // Get public downloads
    const publicDownloads = await ctx.db
      .query("downloads")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    // Get user-specific downloads (ones where user has explicit access)
    // Note: This is an inefficient approach as Convex doesn't support array contains natively
    // In a real app, we'd need a better access control model
    const allDownloads = await ctx.db
      .query("downloads")
      .order("desc")
      .take(limit);

    // Combine and filter downloads
    const combinedDownloads = [...publicDownloads];

    // Add non-public downloads where user has access
    for (const download of allDownloads) {
      // Skip if already included (public)
      if (download.isPublic) continue;

      // Check if user has explicit access
      if (
        Array.isArray(download.accessibleUserIds) &&
        download.accessibleUserIds.includes(user._id)
      ) {
        combinedDownloads.push(download);
      }
    }

    // Sort by creation time (newest first) and limit
    return combinedDownloads
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * List downloads by category
 */
export const listDownloadsByCategory = query({
  args: {
    categoryId: v.id("downloadCategories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit ?? 50;

    // Get public downloads in this category
    const publicDownloads = await ctx.db
      .query("downloads")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);

    // Get all downloads in this category
    const allCategoryDownloads = await ctx.db
      .query("downloads")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .order("desc")
      .take(limit);

    // Combine and filter downloads
    const combinedDownloads = [...publicDownloads];

    // Add non-public downloads where user has access
    for (const download of allCategoryDownloads) {
      // Skip if already included (public)
      if (download.isPublic) continue;

      // Check if user has explicit access
      if (
        Array.isArray(download.accessibleUserIds) &&
        download.accessibleUserIds.includes(user._id)
      ) {
        combinedDownloads.push(download);
      }
    }

    // Sort by creation time (newest first) and limit
    return combinedDownloads
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * Search downloads by title or description
 */
export const searchDownloads = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit ?? 50;

    if (!args.query || args.query.trim().length < 2) {
      return [];
    }

    // Use search index to find downloads
    const searchResults = await ctx.db
      .query("downloads")
      .withSearchIndex("search_downloads", (q) =>
        q.search("searchText", args.query),
      )
      .take(limit);

    // Filter for access
    const accessibleResults = searchResults.filter((download) => {
      return (
        download.isPublic ||
        (Array.isArray(download.accessibleUserIds) &&
          download.accessibleUserIds.includes(user._id))
      );
    });

    return accessibleResults;
  },
});

/**
 * Get information/data for file preview
 */
export const getDownloadPreviewInfo = query({
  args: { downloadId: v.id("downloads") },
  returns: v.union(
    v.object({
      status: v.literal("url_preview"),
      url: v.string(),
      fileType: v.string(),
      fileName: v.string(),
    }),
    v.object({
      status: v.literal("content_preview"),
      content: v.string(),
      fileType: v.string(),
      fileName: v.string(),
    }),
    v.object({
      status: v.literal("no_preview"),
      fileType: v.string(),
      fileName: v.string(),
      message: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get download from database
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId);
    }

    // Check if user has access to this download
    const hasAccess = await checkDownloadAccess(ctx, user._id, args.downloadId);
    if (!hasAccess) {
      throwForbidden("Access denied");
    }

    // Define which file types can have previews
    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    // Text types aren't used in the preview logic yet
    const pdfTypes = ["pdf"];

    // Get file extension and determine preview type
    const fileType = download.fileType;
    const fileExtension = download.fileExtension?.toLowerCase();
    const fileName = download.fileName || "Unnamed file";

    // For image files
    if (fileExtension && imageTypes.includes(fileExtension)) {
      const url = await ctx.storage.getUrl(download.storageId);
      if (!url) {
        return {
          status: "no_preview" as const,
          fileType,
          fileName,
          message: "Image file not found",
        };
      }
      return {
        status: "url_preview" as const,
        url,
        fileType,
        fileName,
      };
    }

    // For PDF files
    if (fileExtension && pdfTypes.includes(fileExtension)) {
      const url = await ctx.storage.getUrl(download.storageId);
      if (!url) {
        return {
          status: "no_preview" as const,
          fileType,
          fileName,
          message: "PDF file not found",
        };
      }
      return {
        status: "url_preview" as const,
        url,
        fileType,
        fileName,
      };
    }

    // No preview available for other file types
    return {
      status: "no_preview" as const,
      fileType,
      fileName,
      message: "No preview available for this file type",
    };
  },
});

/**
 * Get all available file types for filtering downloads
 */
export const getAvailableFileTypes = query({
  args: {},
  returns: v.array(
    v.object({
      type: v.string(),
      description: v.string(),
      icon: v.string(),
      extensions: v.array(v.string()),
    }),
  ),
  handler: (_ctx) => {
    // Return all valid file types in a format suitable for UI display
    return validFileTypes.map((fileType) => {
      const details = fileTypeDetails[fileType as keyof typeof fileTypeDetails];
      return {
        type: details.type,
        description: details.description,
        icon: details.icon,
        extensions: details.extensions,
      };
    });
  },
});
