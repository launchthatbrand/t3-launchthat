import { ConvexError, v } from "convex/values";

// import type { Doc, Id } from "../_generated/dataModel"; // Not explicitly used in this file
import type { MutationCtx } from "../_generated/server";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserDocIdByToken } from "../core/lib/permissions";
import { validFileTypes } from "../lib/fileTypes";
import {
  throwForbidden,
  throwInvalidInput,
  throwNotFound,
} from "../shared/errors";
import {
  getFileExtension,
  getFileTypeFromExtension,
} from "./lib/fileTypeUtils";
import { checkDownloadAccess, prepareSearchText } from "./lib/helpers";

/**
 * Generate a URL for uploading a file
 */
export const generateUploadUrl = mutation({
  args: {
    filename: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx: MutationCtx, _args) => {
    await getAuthenticatedUserDocIdByToken(ctx);
    try {
      const postUrl = await ctx.storage.generateUploadUrl();
      if (!postUrl || typeof postUrl !== "string") {
        throw new ConvexError("Failed to generate valid upload URL");
      }
      return postUrl;
    } catch (error) {
      console.error("Error in generateUploadUrl:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Failed to generate upload URL: ${errorMessage}`);
    }
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
  handler: async (ctx: MutationCtx, args) => {
    const userDocId = await getAuthenticatedUserDocIdByToken(ctx);
    const file = await ctx.db.system.get(args.storageId);
    if (!file) {
      throwNotFound("File", args.storageId as string);
    }
    const fileName = args.title;
    const fileExtension = getFileExtension(file.contentType ?? "");
    const fileType = getFileTypeFromExtension(fileExtension);
    if (!validFileTypes.includes(fileType)) {
      throwInvalidInput(`Unsupported file type: ${fileType}`);
    }
    const searchText = prepareSearchText(
      args.title,
      args.description,
      fileName,
      args.tags,
    );
    return ctx.db.insert("downloads", {
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
      uploadedBy: userDocId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
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
  handler: async (ctx: MutationCtx, args) => {
    const userDocId = await getAuthenticatedUserDocIdByToken(ctx);
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId as string);
    }
    const hasAccess = await checkDownloadAccess(
      ctx,
      userDocId,
      args.downloadId,
    );
    if (!hasAccess) {
      throwForbidden("You don't have access to this download");
    }
    const url = await ctx.storage.getUrl(download.storageId);
    if (!url) {
      throwNotFound("File", download.storageId as string);
    }
    await ctx.db.insert("userDownloads", {
      userId: userDocId,
      downloadId: args.downloadId,
      downloadedAt: Date.now(),
    });
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
  handler: async (ctx: MutationCtx, args) => {
    const userDocId = await getAuthenticatedUserDocIdByToken(ctx);
    const results = [];
    for (const downloadId of args.downloadIds) {
      try {
        const download = await ctx.db.get(downloadId);
        if (!download) {
          results.push({ downloadId, error: "Download not found" });
          continue;
        }
        const hasAccess = await checkDownloadAccess(ctx, userDocId, downloadId);
        if (!hasAccess) {
          results.push({ downloadId, error: "Forbidden" });
          continue;
        }
        const url = await ctx.storage.getUrl(download.storageId);
        if (!url) {
          results.push({ downloadId, error: "File not found in storage" });
          continue;
        }
        await ctx.db.insert("userDownloads", {
          userId: userDocId,
          downloadId,
          downloadedAt: Date.now(),
        });
        await ctx.db.patch(downloadId, {
          downloadCount: download.downloadCount + 1,
        });
        results.push({ downloadId, url, fileName: download.fileName });
      } catch (e) {
        results.push({
          downloadId,
          error: e instanceof Error ? e.message : String(e),
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
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const userDocId = await getAuthenticatedUserDocIdByToken(ctx);
    const currentDownload = await ctx.db.get(args.downloadId);
    if (!currentDownload) {
      throwNotFound("Download", args.downloadId as string);
    }
    if (currentDownload.uploadedBy !== userDocId) {
      throwForbidden("You don't have permission to update this download");
    }
    const { downloadId: idToUpdate, ...updateFields } = args;
    const newSearchText = prepareSearchText(
      updateFields.title ?? currentDownload.title,
      updateFields.description ?? currentDownload.description,
      currentDownload.fileName,
      updateFields.tags ?? currentDownload.tags,
    );
    await ctx.db.patch(idToUpdate, {
      ...updateFields,
      searchText: newSearchText,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Delete a download
 */
export const deleteDownload = mutation({
  args: {
    downloadId: v.id("downloads"),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const userDocId = await getAuthenticatedUserDocIdByToken(ctx);
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throwNotFound("Download", args.downloadId as string);
    }
    if (download.uploadedBy !== userDocId) {
      throwForbidden("You don't have permission to delete this download");
    }
    await ctx.db.delete(args.downloadId);
    return null;
  },
});
