import { ConvexError, v } from "convex/values";
import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";

import { Id } from "./_generated/dataModel";

// SUBTASK 4: VERSION CONTROL FOR UPLOADED FILES

/**
 * Utility function to check if user can manage a download's versions
 */
const canManageVersions = async (
  ctx: MutationCtx | QueryCtx,
  downloadId: Id<"downloads">,
) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  // Get user from database based on token identifier
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  // Get the download
  const download = await ctx.db.get(downloadId);
  if (!download) {
    throw new ConvexError("Download not found");
  }

  // For now, only the uploader can manage versions
  // TODO: Add role-based checks here to allow admins/managers
  if (download.uploadedBy !== user._id) {
    throw new ConvexError("Permission denied");
  }

  return { user, download };
};

// Type for version history entry
export type VersionHistoryEntry = {
  version: string;
  storageId: Id<"_storage">;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
  notes?: string;
};

/**
 * Add a new version to an existing download
 */
export const addFileVersion = mutation({
  args: {
    downloadId: v.id("downloads"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    version: v.string(),
    notes: v.optional(v.string()),
    makeActive: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check permissions
    const { user, download } = await canManageVersions(ctx, args.downloadId);

    // Get storage URL from storage ID
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new ConvexError("Storage file not found");
    }

    // Create version history entry
    const newVersion: VersionHistoryEntry = {
      version: args.version,
      storageId: args.storageId,
      fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
      notes: args.notes,
    };

    // Get existing version history or initialize if not present
    const versionHistory = download.versionHistory || [];

    // Check if version already exists
    if (versionHistory.some((v) => v.version === args.version)) {
      throw new ConvexError(`Version ${args.version} already exists`);
    }

    // Add new version to history
    const updatedVersionHistory = [...versionHistory, newVersion];

    // Updates to apply
    const updates: Record<string, unknown> = {
      versionHistory: updatedVersionHistory,
    };

    // Set as the active version if specified
    if (args.makeActive) {
      updates.version = args.version;
      updates.storageId = args.storageId;
      updates.fileUrl = fileUrl;
      updates.fileName = args.fileName;
      updates.fileSize = args.fileSize;
    }

    // Update the download
    await ctx.db.patch(args.downloadId, updates);

    return true;
  },
});

/**
 * Change the active version of a download
 */
export const switchActiveVersion = mutation({
  args: {
    downloadId: v.id("downloads"),
    version: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check permissions
    const { user, download } = await canManageVersions(ctx, args.downloadId);

    // Check if version exists
    const versionHistory = download.versionHistory || [];
    const targetVersion = versionHistory.find(
      (v) => v.version === args.version,
    );

    if (!targetVersion) {
      throw new ConvexError(`Version ${args.version} not found`);
    }

    // Update the download with the target version info
    await ctx.db.patch(args.downloadId, {
      version: targetVersion.version,
      storageId: targetVersion.storageId,
      fileUrl: targetVersion.fileUrl,
      fileName: targetVersion.fileName,
      fileSize: targetVersion.fileSize,
    });

    return true;
  },
});

/**
 * Delete a version from a download's version history
 */
export const deleteVersion = mutation({
  args: {
    downloadId: v.id("downloads"),
    version: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check permissions
    const { user, download } = await canManageVersions(ctx, args.downloadId);

    // Cannot delete the current active version
    if (download.version === args.version) {
      throw new ConvexError(
        "Cannot delete the active version. Switch to another version first.",
      );
    }

    // Get version history
    const versionHistory = download.versionHistory || [];

    // Check if version exists
    const targetVersionIndex = versionHistory.findIndex(
      (v) => v.version === args.version,
    );

    if (targetVersionIndex === -1) {
      throw new ConvexError(`Version ${args.version} not found`);
    }

    // Get the target version for storage deletion
    const targetVersion = versionHistory[targetVersionIndex];

    // Remove version from history
    const updatedVersionHistory = [
      ...versionHistory.slice(0, targetVersionIndex),
      ...versionHistory.slice(targetVersionIndex + 1),
    ];

    // Update the download
    await ctx.db.patch(args.downloadId, {
      versionHistory: updatedVersionHistory,
    });

    // Delete the file from storage if it's not used by other versions
    // Only if the storageId is different from the current active version
    if (
      download.storageId !== targetVersion.storageId &&
      !updatedVersionHistory.some(
        (v) => v.storageId === targetVersion.storageId,
      )
    ) {
      try {
        await ctx.storage.delete(targetVersion.storageId);
      } catch (error) {
        // Log error but don't fail the operation
        console.error("Failed to delete storage file:", error);
      }
    }

    return true;
  },
});

/**
 * Get version history for a download
 */
export const getVersionHistory = query({
  args: {
    downloadId: v.id("downloads"),
  },
  returns: v.array(
    v.object({
      version: v.string(),
      fileName: v.string(),
      fileSize: v.number(),
      uploadedAt: v.number(),
      notes: v.optional(v.string()),
      isActive: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the download
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throw new ConvexError("Download not found");
    }

    // Check if user has access to this download
    // TODO: Use the access control function from the previous file
    const isOwner = download.uploadedBy === user._id;
    const isPublic = download.isPublic;
    const hasExplicitAccess =
      download.accessibleUserIds?.includes(user._id) || false;

    if (!isOwner && !isPublic && !hasExplicitAccess && user.role !== "admin") {
      throw new ConvexError("Access denied");
    }

    // Get version history
    const versionHistory = download.versionHistory || [];
    const activeVersion = download.version;

    // Format the result
    return versionHistory.map((v) => ({
      version: v.version,
      fileName: v.fileName,
      fileSize: v.fileSize,
      uploadedAt: v.uploadedAt,
      notes: v.notes,
      isActive: v.version === activeVersion,
    }));
  },
});

/**
 * Compare two versions of a download
 * Note: This is a simplified version that just provides metadata comparison.
 * For actual file content comparison, you would need additional processing.
 */
export const compareVersions = query({
  args: {
    downloadId: v.id("downloads"),
    version1: v.string(),
    version2: v.string(),
  },
  returns: v.object({
    version1: v.object({
      version: v.string(),
      fileName: v.string(),
      fileSize: v.number(),
      uploadedAt: v.number(),
    }),
    version2: v.object({
      version: v.string(),
      fileName: v.string(),
      fileSize: v.number(),
      uploadedAt: v.number(),
    }),
    differences: v.object({
      fileNameChanged: v.boolean(),
      fileSizeDiff: v.number(), // positive means version2 is larger
      timeBetweenVersions: v.number(), // in milliseconds
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the download
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throw new ConvexError("Download not found");
    }

    // Check if user has access to this download
    const isOwner = download.uploadedBy === user._id;
    const isPublic = download.isPublic;
    const hasExplicitAccess =
      download.accessibleUserIds?.includes(user._id) || false;

    if (!isOwner && !isPublic && !hasExplicitAccess && user.role !== "admin") {
      throw new ConvexError("Access denied");
    }

    // Get version history
    const versionHistory = download.versionHistory || [];

    // Find the two versions
    const v1 = versionHistory.find((v) => v.version === args.version1);
    const v2 = versionHistory.find((v) => v.version === args.version2);

    if (!v1 || !v2) {
      throw new ConvexError("One or both versions not found");
    }

    // Calculate differences
    const fileNameChanged = v1.fileName !== v2.fileName;
    const fileSizeDiff = v2.fileSize - v1.fileSize;
    const timeBetweenVersions = v2.uploadedAt - v1.uploadedAt;

    return {
      version1: {
        version: v1.version,
        fileName: v1.fileName,
        fileSize: v1.fileSize,
        uploadedAt: v1.uploadedAt,
      },
      version2: {
        version: v2.version,
        fileName: v2.fileName,
        fileSize: v2.fileSize,
        uploadedAt: v2.uploadedAt,
      },
      differences: {
        fileNameChanged,
        fileSizeDiff,
        timeBetweenVersions,
      },
    };
  },
});
