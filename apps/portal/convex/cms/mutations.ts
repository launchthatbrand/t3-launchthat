import { ConvexError, v } from "convex/values";
import { generateUniqueSlug, sanitizeSlug } from "../lib/slugs";

import { api } from "../_generated/api";
import { mutation } from "../_generated/server";

/**
 * Create a new post with automatic slug generation
 */
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.optional(v.id("users")),
    status: v.optional(v.string()), // "published", "draft", or "archived"
    category: v.string(),
    excerpt: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    featuredImageId: v.optional(v.id("mediaItems")), // Link to media item
    featured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    customSlug: v.optional(v.string()), // Optional custom slug
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const { title, customSlug, ...otherArgs } = args;
    const timestamp = Date.now();

    // Generate a unique slug from the title or use a custom slug if provided
    let slug;
    if (customSlug) {
      // Sanitize the custom slug if provided
      const sanitizedSlug = sanitizeSlug(customSlug);
      slug = await generateUniqueSlug(ctx.db, "posts", sanitizedSlug);
    } else {
      // Generate a slug from the title
      slug = await generateUniqueSlug(ctx.db, "posts", title);
    }

    // Create the post
    const postId = await ctx.db.insert("posts", {
      title,
      slug,
      status: args.status ?? "draft", // Default to draft
      createdAt: timestamp,
      updatedAt: timestamp,
      readTime: calculateReadTime(args.content), // Estimate reading time
      ...otherArgs,
    });

    return postId;
  },
});

/**
 * Update post featured image using media item ID
 */
export const updatePostFeaturedImage = mutation({
  args: {
    postId: v.id("posts"),
    mediaItemId: v.optional(v.id("mediaItems")),
  },
  returns: v.object({
    postId: v.id("posts"),
    featuredImageUrl: v.optional(v.string()),
    featuredImageId: v.optional(v.id("mediaItems")),
  }),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    let featuredImageUrl: string | undefined = undefined;

    if (args.mediaItemId) {
      // Get the media item and its URL
      const mediaItem = await ctx.db.get(args.mediaItemId);
      if (!mediaItem) {
        throw new ConvexError("Media item not found");
      }

      if (mediaItem.storageId) {
        featuredImageUrl =
          (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
      } else if (mediaItem.externalUrl) {
        featuredImageUrl = mediaItem.externalUrl;
      }
    }

    // Update the post
    await ctx.db.patch(args.postId, {
      featuredImageId: args.mediaItemId,
      featuredImageUrl,
      updatedAt: Date.now(),
    });

    return {
      postId: args.postId,
      featuredImageUrl,
      featuredImageId: args.mediaItemId,
    };
  },
});

/**
 * Create post with media upload in a single operation
 */
export const createPostWithMedia = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    category: v.string(),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    customSlug: v.optional(v.string()),
    // Media data
    featuredImageStorageId: v.optional(v.id("_storage")),
    featuredImageTitle: v.optional(v.string()),
    featuredImageAlt: v.optional(v.string()),
  },
  returns: v.object({
    postId: v.id("posts"),
    mediaItemId: v.optional(v.id("mediaItems")),
    featuredImageUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const {
      featuredImageStorageId,
      featuredImageTitle,
      featuredImageAlt,
      ...postArgs
    } = args;

    let mediaItemId: Id<"mediaItems"> | undefined = undefined;
    let featuredImageUrl: string | undefined = undefined;

    // Create media item if storage ID is provided
    if (featuredImageStorageId) {
      // Get URL for the uploaded file
      featuredImageUrl =
        (await ctx.storage.getUrl(featuredImageStorageId)) ?? undefined;

      if (featuredImageUrl) {
        // Create media item
        mediaItemId = await ctx.db.insert("mediaItems", {
          storageId: featuredImageStorageId,
          title: featuredImageTitle,
          alt: featuredImageAlt,
          status: "published",
          uploadedAt: Date.now(),
        });
      }
    }

    // Create the post with media references
    const timestamp = Date.now();
    const { title, customSlug, ...otherArgs } = postArgs;

    // Generate slug
    let slug;
    if (customSlug) {
      const sanitizedSlug = sanitizeSlug(customSlug);
      slug = await generateUniqueSlug(ctx.db, "posts", sanitizedSlug);
    } else {
      slug = await generateUniqueSlug(ctx.db, "posts", title);
    }

    // Create the post directly
    const postId = await ctx.db.insert("posts", {
      title,
      slug,
      status: postArgs.status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      readTime: calculateReadTime(postArgs.content ?? ""),
      featuredImageId: mediaItemId,
      featuredImageUrl,
      ...otherArgs,
    });

    return {
      postId,
      mediaItemId,
      featuredImageUrl,
    };
  },
});

/**
 * Calculate estimated reading time for a post
 * @param content Post content
 * @returns Estimated reading time in minutes
 */
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes > 1 ? `${minutes} min read` : "1 min read";
}

/**
 * Update an existing post.
 */
export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    slug: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to update a post",
      });
    }

    // Get user from tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new ConvexError({
        code: "not_found",
        message: `Post with ID ${args.id} not found`,
      });
    }

    // Check if user is the author or has admin permissions
    if (post.authorId && post.authorId !== user._id) {
      // In a real app, check for admin permissions here
      throw new ConvexError({
        code: "forbidden",
        message: "You don't have permission to update this post",
      });
    }

    // Check if slug is being updated and ensure it's unique
    if (args.slug && args.slug !== post.slug) {
      // Use sanitizeSlug to clean up the provided slug
      const sanitizedSlug = sanitizeSlug(args.slug);

      // Use generateUniqueSlug to ensure uniqueness, passing the current post ID
      // to exclude it from the uniqueness check
      const uniqueSlug = await generateUniqueSlug(
        ctx.db,
        "posts",
        sanitizedSlug,
        args.id,
      );

      // Update args.slug with the sanitized, unique slug
      args.slug = uniqueSlug;
    }

    // Update the post
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Only include fields that are actually being updated
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.status !== undefined) updates.status = args.status;
    if (args.category !== undefined) updates.category = args.category;
    if (args.featuredImageUrl !== undefined)
      updates.featuredImageUrl = args.featuredImageUrl;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.featured !== undefined) updates.featured = args.featured;
    if (args.readTime !== undefined) updates.readTime = args.readTime;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * Delete a post.
 */
export const deletePost = mutation({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to delete a post",
      });
    }

    // Get user from tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new ConvexError({
        code: "not_found",
        message: `Post with ID ${args.id} not found`,
      });
    }

    // Check if user is the author or has admin permissions
    if (post.authorId && post.authorId !== user._id) {
      // In a real app, check for admin permissions here
      throw new ConvexError({
        code: "forbidden",
        message: "You don't have permission to delete this post",
      });
    }

    // Delete the post
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Change the post status (publish, unpublish, archive)
 */
export const updatePostStatus = mutation({
  args: {
    id: v.id("posts"),
    status: v.string(), // "published", "draft", or "archived"
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to update a post",
      });
    }

    // Get user from tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new ConvexError({
        code: "not_found",
        message: `Post with ID ${args.id} not found`,
      });
    }

    // Check if user is the author or has admin permissions
    if (post.authorId && post.authorId !== user._id) {
      // In a real app, check for admin permissions here
      throw new ConvexError({
        code: "forbidden",
        message: "You don't have permission to update this post",
      });
    }

    // Update the post status
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true, status: args.status };
  },
});

/**
 * Bulk update posts status
 */
export const bulkUpdatePostStatus = mutation({
  args: {
    ids: v.array(v.id("posts")),
    status: v.string(), // "published", "draft", or "archived"
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to update posts",
      });
    }

    // Get user from tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // In a real app, check for admin permissions here

    // Update each post's status
    const now = Date.now();
    const updatePromises = args.ids.map(async (id) => {
      await ctx.db.patch(id, {
        status: args.status,
        updatedAt: now,
      });
    });

    await Promise.all(updatePromises);

    return { success: true, updatedCount: args.ids.length };
  },
});
