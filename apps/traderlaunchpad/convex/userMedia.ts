import { v } from "convex/values";
import { ConvexError } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const requireViewer = async (
  ctx: QueryCtx | MutationCtx,
): Promise<{ userId: string }> => {
  const identity = await ctx.auth.getUserIdentity();
  const userId = typeof identity?.subject === "string" ? identity.subject.trim() : "";
  if (!userId) {
    throw new ConvexError("Unauthorized");
  }
  return { userId };
};

export const generateUserMediaUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createUserMedia = mutation({
  args: {
    storageId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    filename: v.optional(v.string()),
  },
  returns: v.id("userMedia"),
  handler: async (ctx, args) => {
    const { userId } = await requireViewer(ctx);
    const now = Date.now();
    return await ctx.db.insert("userMedia", {
      uploadedByUserId: userId,
      storageId: args.storageId,
      contentType: args.contentType,
      size: args.size,
      filename: typeof args.filename === "string" && args.filename.trim() ? args.filename.trim() : undefined,
      createdAt: now,
    });
  },
});

export const listMyUserMedia = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("userMedia"),
      _creationTime: v.number(),
      uploadedByUserId: v.string(),
      storageId: v.id("_storage"),
      url: v.union(v.string(), v.null()),
      contentType: v.string(),
      size: v.number(),
      filename: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { userId } = await requireViewer(ctx);
    const limit = Math.max(1, Math.min(Number(args.limit ?? 50), 200));
    const rows = await ctx.db
      .query("userMedia")
      .withIndex("by_uploader_createdAt", (q) => q.eq("uploadedByUserId", userId))
      .order("desc")
      .take(limit);

    const result: {
      _id: Id<"userMedia">;
      _creationTime: number;
      uploadedByUserId: string;
      storageId: Id<"_storage">;
      url: string | null;
      contentType: string;
      size: number;
      filename?: string;
      createdAt: number;
    }[] = [];

    for (const row of rows) {
      const url = await ctx.storage.getUrl(row.storageId);
      result.push({
        _id: row._id,
        _creationTime: row._creationTime,
        uploadedByUserId: row.uploadedByUserId,
        storageId: row.storageId,
        url,
        contentType: row.contentType,
        size: row.size,
        filename: row.filename,
        createdAt: row.createdAt,
      });
    }

    return result;
  },
});

export const deleteUserMedia = mutation({
  args: { mediaId: v.id("userMedia") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireViewer(ctx);
    const row = await ctx.db.get(args.mediaId);
    if (!row) return null;
    if (row.uploadedByUserId !== userId) {
      throw new ConvexError("Forbidden");
    }
    await ctx.db.delete(row._id);
    return null;
  },
});

