/**
 * @deprecated Use groups/posts.ts instead
 *
 * This file is maintained for backward compatibility during the refactoring.
 * All group posts functionality has been moved to the groups/posts.ts file.
 */

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { isGroupMember } from "./groups/lib/helpers";

// Basic implementation for backward compatibility
export const getGroupPosts = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.array(
    v.object({
      _id: v.id("groupPosts"),
      _creationTime: v.number(),
      groupId: v.id("groups"),
      authorId: v.id("users"),
      content: v.string(),
      authorName: v.string(),
      likesCount: v.number(),
      commentsCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get posts
    const posts = await ctx.db
      .query("groupPosts")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    // Enhance posts with basic info
    const enhancedPosts = [];
    for (const post of posts) {
      const author = await ctx.db.get(post.authorId);
      enhancedPosts.push({
        ...post,
        authorName: author?.name || "Unknown User",
        likesCount: 0, // Default
        commentsCount: 0, // Default
      });
    }

    return enhancedPosts;
  },
});
