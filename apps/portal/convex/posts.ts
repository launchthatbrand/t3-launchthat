/**
 * @deprecated This file is deprecated. Use the new CMS module instead:
 * import { ... } from "@/convex/cms";
 */

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/**
 * Get all posts from the database.
 * @deprecated Use getAllPosts from the CMS module instead.
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    // Forward to the CMS module implementation
    const result = await ctx.db.query("posts").collect();
    return result;
  },
});

/**
 * Create a new post.
 * @deprecated Use createPost from the CMS module instead.
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Insert the new post document (with minimal fields)
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
    });
    return postId;
  },
});

/**
 * Delete a post by its ID.
 * @deprecated Use deletePost from the CMS module instead.
 */
export const deletePost = mutation({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Delete the post directly
    await ctx.db.delete(args.id);
  },
});
