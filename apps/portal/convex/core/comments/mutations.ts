import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";

const assertNonEmpty = (value: string, label: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ConvexError(`${label} is required`);
  }
};

const deleteSubtree = async (
  ctx: Parameters<Parameters<typeof mutation>[0]["handler"]>[0],
  rootId: Id<"comments">,
) => {
  const stack: Id<"comments">[] = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const children = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", current))
      .collect();

    children.forEach((child) => stack.push(child._id));
    await ctx.db.delete(current);
  }
};

export const create = mutation({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    assertNonEmpty(args.postId, "postId");
    assertNonEmpty(args.content, "content");

    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new ConvexError("Parent comment not found");
      }
      const orgA = parent.organizationId ?? undefined;
      const orgB = args.organizationId ?? undefined;
      if (parent.postId !== args.postId || orgA !== orgB) {
        throw new ConvexError("Parent comment does not belong to this post");
      }
    }

    const id = await ctx.db.insert("comments", {
      postId: args.postId,
      organizationId: args.organizationId ?? undefined,
      authorId: user._id,
      parentId: args.parentId ?? undefined,
      content: args.content.trim(),
      createdAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    assertNonEmpty(args.content, "content");

    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    const user = await getAuthenticatedUser(ctx);
    const viewerIsAdmin = await isAdmin(ctx);
    const isOwner = comment.authorId === user._id;
    if (!viewerIsAdmin && !isOwner) {
      throw new ConvexError("Not allowed to edit this comment");
    }

    await ctx.db.patch(args.id, {
      content: args.content.trim(),
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const remove = mutation({
  args: {
    id: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      return true;
    }

    const user = await getAuthenticatedUser(ctx);
    const viewerIsAdmin = await isAdmin(ctx);
    const isOwner = comment.authorId === user._id;
    if (!viewerIsAdmin && !isOwner) {
      throw new ConvexError("Not allowed to delete this comment");
    }

    await deleteSubtree(ctx, args.id);
    return true;
  },
});


