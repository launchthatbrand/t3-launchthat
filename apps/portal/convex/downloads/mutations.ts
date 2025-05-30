import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { validFileTypes } from "../lib/fileTypes";
import {
  throwForbidden,
  throwInternal,
  throwInvalidInput,
  throwNotFound,
} from "../shared/errors";
import {
  getFileExtension,
  getFileTypeFromExtension,
} from "./lib/fileTypeUtils";
import {
  checkDownloadAccess,
  getAuthenticatedUser,
  prepareSearchText,
} from "./lib/helpers";

/**
 * Generate a URL for uploading a file
 */
export const generateUploadUrl = mutation({
  args: {
    filename: v.optional(v.string()), // filename (args.filename) is used by Convex internally if provided
  },
  returns: v.object({
    uploadUrl: v.string(),
    fileId: v.id("_storage"),
  }),
  handler: async (ctx, _args) => {
    // Check authentication
    await getAuthenticatedUser(ctx);

    // Generate the upload URL
    const fileId = await ctx.storage.generateUploadUrl();
    const uploadUrl = await ctx.storage.getUrl(fileId);

    if (!uploadUrl) {
      throwInternal("Failed to generate upload URL");
    }

    // Cast fileId to match the expected return type
    return {
      uploadUrl,
      fileId: fileId as Id<"_storage">,
    };
  },
});

/**
 * Create a download entry from an uploaded file
 */
export const createFileDownload = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("downloadCategories")),
    tags: v.optional(v.array(v.string())),
    requiredProductId: v.optional(v.id("products")),
    requiredCourseId: v.optional(v.id("courses")),
    isPublic: v.boolean(),
    accessibleUserIds: v.optional(v.array(v.id("users"))),
  },
  returns: v.id("downloads"),
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getAuthenticatedUser(ctx);

    // Get file metadata
    const file = await ctx.db.system.get(args.storageId);
    if (!file) {
      throwNotFound("File", args.storageId);
    }

    // Get file details
    const fileName = args.title;
    const fileExtension = getFileExtension(file.contentType ?? "");
    const fileType = getFileTypeFromExtension(fileExtension);

    // Validate file type
    if (!validFileTypes.includes(fileType)) {
      throwInvalidInput(`Unsupported file type: ${fileType}`);
    }

    // Prepare searchText content
    const searchText = prepareSearchText(
      args.title,
      args.description,
      fileName,
      args.tags,
    );

    // Create download record
    const downloadId = await ctx.db.insert("downloads", {
      title: args.title,
      description: args.description,
      fileName,
      fileExtension,
      fileType,
      fileSize: file.size,
      storageId: args.storageId,
      searchText,
      categoryId: args.categoryId,
      tags: args.tags,
      downloadCount: 0,
      isPublic: args.isPublic,
      requiredProductId: args.requiredProductId,
      requiredCourseId: args.requiredCourseId,
      accessibleUserIds: args.accessibleUserIds,
      uploadedBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return downloadId;
  },
});

/**
 * Generate a URL for downloading a file
 */
export const generateDownloadUrl = mutation({
  args: {
    downloadId: v.id("downloads"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getAuthenticatedUser(ctx);

    // Get download from database
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId);
    }

    // Check if user has access to this download
    const hasAccess = await checkDownloadAccess(ctx, user._id, args.downloadId);
    if (!hasAccess) {
      throwForbidden("You don't have access to this download");
    }

    // Get file URL
    const url = await ctx.storage.getUrl(download.storageId);
    if (!url) {
      throwNotFound("File", download.storageId);
    }

    // Log this download
    await ctx.db.insert("userDownloads", {
      userId: user._id,
      downloadId: args.downloadId,
      downloadedAt: Date.now(),
    });

    // Update download count
    await ctx.db.patch(args.downloadId, {
      downloadCount: download.downloadCount + 1,
    });

    return url;
  },
});

/**
 * Generate URLs for multiple downloads at once
 */
export const generateMultipleDownloadUrls = mutation({
  args: {
    downloadIds: v.array(v.id("downloads")),
  },
  returns: v.array(
    v.object({
      downloadId: v.id("downloads"),
      url: v.optional(v.string()),
      fileName: v.optional(v.string()),
      error: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getAuthenticatedUser(ctx);

    // Process each download and collect results
    const results = [];

    for (const downloadId of args.downloadIds) {
      try {
        // Get download from database
        const download = await ctx.db.get(downloadId);
        if (!download) {
          results.push({
            downloadId,
            error: "Download not found",
          });
          continue;
        }

        // Check if user has access to this download
        const hasAccess = await checkDownloadAccess(ctx, user._id, downloadId);
        if (!hasAccess) {
          results.push({
            downloadId,
            error: "Access denied",
          });
          continue;
        }

        // Get file URL
        const url = await ctx.storage.getUrl(download.storageId);
        if (!url) {
          results.push({
            downloadId,
            error: "File not found",
          });
          continue;
        }

        // Log this download
        await ctx.db.insert("userDownloads", {
          userId: user._id,
          downloadId,
          downloadedAt: Date.now(),
        });

        // Update download count
        await ctx.db.patch(downloadId, {
          downloadCount: download.downloadCount + 1,
        });

        results.push({
          downloadId,
          url,
          fileName: download.fileName,
        });
      } catch (error) {
        results.push({
          downloadId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Update a download's metadata
 */
export const updateDownload = mutation({
  args: {
    downloadId: v.id("downloads"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("downloadCategories")),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    accessibleUserIds: v.optional(v.array(v.id("users"))),
  },
  returns: v.id("downloads"),
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getAuthenticatedUser(ctx);

    // Get download from database
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId);
    }

    // Only the uploader or an admin can update a download
    if (download.uploadedBy !== user._id) {
      // In a real app, we'd check if the user is an admin here
      throwForbidden("You don't have permission to update this download");
    }

    // Prepare update object
    const update: Record<string, any> = {
      updatedAt: Date.now(),
    };

    // Add fields to update if provided
    if (args.title !== undefined) update.title = args.title;
    if (args.description !== undefined) update.description = args.description;
    if (args.categoryId !== undefined) update.categoryId = args.categoryId;
    if (args.tags !== undefined) update.tags = args.tags;
    if (args.isPublic !== undefined) update.isPublic = args.isPublic;
    if (args.accessibleUserIds !== undefined)
      update.accessibleUserIds = args.accessibleUserIds;

    // Update searchText if title or description changed
    if (args.title !== undefined || args.description !== undefined) {
      update.searchText = prepareSearchText(
        args.title ?? download.title,
        args.description ?? download.description,
        download.fileName,
        args.tags ?? download.tags,
      );
    }

    // Update the download
    await ctx.db.patch(args.downloadId, update);

    return args.downloadId;
  },
});

/**
 * Delete a download
 */
export const deleteDownload = mutation({
  args: {
    downloadId: v.id("downloads"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check authentication
    const user = await getAuthenticatedUser(ctx);

    // Get download from database
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId);
    }

    // Only the uploader or an admin can delete a download
    if (download.uploadedBy !== user._id) {
      // In a real app, we'd check if the user is an admin here
      throwForbidden("You don't have permission to delete this download");
    }

    // Delete the download
    await ctx.db.delete(args.downloadId);

    // Delete the file from storage
    // Note: In a real app, we might want to keep the file for a certain period
    // in case of accidental deletion
    try {
      await ctx.storage.delete(download.storageId);
    } catch (error) {
      // Log error but don't fail the operation
      console.error("Failed to delete file from storage:", error);
    }

    return true;
  },
});
