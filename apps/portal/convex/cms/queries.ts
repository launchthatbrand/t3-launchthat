import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { query } from "../_generated/server";
import { getUserById } from "../users";

/**
 * Helper function to add author information to a post
 */
async function addAuthorToPost(
  ctx: any,
  post: {
    _id: any;
    authorId?: any;
    [key: string]: any;
  } | null,
) {
  if (!post) return null;

  let author = null;
  if (post.authorId) {
    author = await ctx.db.get(post.authorId);
  }

  return {
    ...post,
    author: author
      ? {
          _id: author._id,
          name: author.name,
          imageUrl: author.imageUrl,
        }
      : null,
  };
}

/**
 * Get all posts with pagination support.
 */
export const getAllPosts = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    filters: v.optional(
      v.object({
        status: v.optional(v.string()),
        authorId: v.optional(v.id("users")),
        category: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        featured: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let postsQuery = ctx.db.query("posts");

    // Apply filters if provided
    if (args.filters) {
      if (args.filters.status !== undefined) {
        postsQuery = postsQuery.withIndex("by_status", (q) =>
          q.eq("status", args.filters.status),
        );
      }

      if (args.filters.authorId) {
        postsQuery = postsQuery.withIndex("by_author", (q) =>
          q.eq("authorId", args.filters.authorId),
        );
      }

      if (args.filters.category !== undefined) {
        postsQuery = postsQuery.withIndex("by_category", (q) =>
          q.eq("category", args.filters.category),
        );
      }

      if (args.filters.featured !== undefined) {
        postsQuery = postsQuery.withIndex("by_featured", (q) =>
          q.eq("featured", args.filters.featured),
        );
      }

      // Filter by tags if provided
      if (args.filters.tags && args.filters.tags.length > 0) {
        postsQuery = postsQuery.filter((post) => {
          const postTags = post.field("tags") ?? [];
          // Check if the post has at least one of the requested tags
          return v.or(
            ...args.filters.tags.map((tag) => v.includes(postTags, tag)),
          );
        });
      }
    }

    // Order posts by creationTime descending (newest first)
    postsQuery = postsQuery.order("desc");

    // If pagination options are provided, use them
    if (args.paginationOpts) {
      const paginationResult = await postsQuery.paginate(args.paginationOpts);

      // Add author information to each post
      const postsWithAuthors = await Promise.all(
        paginationResult.page.map((post) => addAuthorToPost(ctx, post)),
      );

      return {
        posts: postsWithAuthors,
        hasMore: !paginationResult.isDone,
        cursor: paginationResult.continueCursor,
      };
    }

    // Otherwise, collect all posts (with a reasonable limit)
    const posts = await postsQuery.take(50);

    // Add author information to each post
    const postsWithAuthors = await Promise.all(
      posts.map((post) => addAuthorToPost(ctx, post)),
    );

    return {
      posts: postsWithAuthors,
      hasMore: posts.length === 50,
      cursor: null,
    };
  },
});

/**
 * Get a specific post by ID.
 */
export const getPostById = query({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);

    if (!post) {
      throw new ConvexError({
        code: "not_found",
        message: `Post with ID ${args.id} not found`,
      });
    }

    return addAuthorToPost(ctx, post);
  },
});

/**
 * Get a post by its slug.
 */
export const getPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post) {
      throw new ConvexError({
        code: "not_found",
        message: `Post with slug "${args.slug}" not found`,
      });
    }

    return addAuthorToPost(ctx, post);
  },
});

/**
 * Search posts by title or content.
 */
export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    paginationOpts: v.optional(paginationOptsValidator),
    filters: v.optional(
      v.object({
        status: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Start with a base query
    let postsQuery = ctx.db.query("posts");

    // Apply status filter if provided
    if (args.filters?.status !== undefined) {
      postsQuery = postsQuery.withIndex("by_status", (q) =>
        q.eq("status", args.filters.status),
      );
    }

    // Apply category filter if provided
    if (args.filters?.category !== undefined) {
      postsQuery = postsQuery.withIndex("by_category", (q) =>
        q.eq("category", args.filters.category),
      );
    }

    // Add text search filter
    postsQuery = postsQuery.filter((post) => {
      const title = post.field("title");
      const content = post.field("content");
      const excerpt = post.field("excerpt") ?? "";

      // Check if any of the fields contain the search term
      return v.or(
        v.contains(title, args.searchTerm),
        v.contains(content, args.searchTerm),
        v.contains(excerpt, args.searchTerm),
      );
    });

    // Order by creationTime descending
    postsQuery = postsQuery.order("desc");

    // Use pagination if options are provided
    if (args.paginationOpts) {
      const paginationResult = await postsQuery.paginate(args.paginationOpts);

      return {
        posts: paginationResult.page,
        hasMore: !paginationResult.isDone,
        cursor: paginationResult.continueCursor,
      };
    }

    // Otherwise, collect search results with a reasonable limit
    const posts = await postsQuery.take(20);
    return {
      posts,
      hasMore: posts.length === 20,
      cursor: null,
    };
  },
});

/**
 * Get available tags from posts.
 */
export const getPostTags = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();

    // Extract all tags from posts
    const tagsSet = new Set<string>();
    posts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet);
  },
});

/**
 * Get available categories from posts.
 */
export const getPostCategories = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();

    // Extract all categories from posts and count their usage
    const categoryCounts: Record<string, number> = {};
    posts.forEach((post) => {
      // Use empty string as fallback for proper counting
      const category = post.category || "Uncategorized";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Return categories with counts
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name: name || "Uncategorized", // Default to "Uncategorized" for empty keys
      count,
    }));
  },
});
