import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get all helpdesk articles with optional filtering
export const getHelpdeskArticles = query({
  args: {
    categoryFilter: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("helpdeskArticles"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      category: v.string(),
      summary: v.string(),
      content: v.string(),
      author: v.id("users"),
      authorName: v.string(),
      published: v.boolean(),
      featured: v.boolean(),
      lastUpdated: v.number(),
      views: v.number(),
      tags: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const { categoryFilter, searchQuery, limit = 50 } = args;

    // Start with a base query
    let articlesQuery = ctx.db.query("helpdeskArticles");

    // Apply category filter if provided
    if (categoryFilter) {
      articlesQuery = articlesQuery.withIndex("by_category", (q) =>
        q.eq("category", categoryFilter),
      );
    }

    // Apply search filter if provided
    if (searchQuery) {
      articlesQuery = articlesQuery.withSearchIndex("search_title", (q) =>
        q.search("title", searchQuery),
      );
    } else {
      // If no search query, use regular indexing and filtering
      articlesQuery = articlesQuery.filter((q) =>
        q.eq(q.field("published"), true),
      );
    }

    // Order by creation time (newest first)
    articlesQuery = articlesQuery.order("desc");

    // Get the articles
    const articles = await articlesQuery.take(limit);
    return articles;
  },
});

// Get a single helpdesk article by slug
export const getHelpdeskArticleBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("helpdeskArticles"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      category: v.string(),
      summary: v.string(),
      content: v.string(),
      author: v.id("users"),
      authorName: v.string(),
      published: v.boolean(),
      featured: v.boolean(),
      lastUpdated: v.number(),
      views: v.number(),
      tags: v.array(v.string()),
      relatedArticles: v.array(
        v.object({
          _id: v.id("helpdeskArticles"),
          title: v.string(),
          slug: v.string(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { slug } = args;

    // Find the article by slug
    const article = await ctx.db
      .query("helpdeskArticles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!article) {
      return null;
    }

    // Note: We're removing the view increment from here because
    // we can't use ctx.db.patch in a query function.
    // Instead, we'll use a separate mutation to increment the view count.

    // Get related articles (same category or shared tags)
    const relatedArticlesData = await ctx.db
      .query("helpdeskArticles")
      .withIndex("by_category", (q) => q.eq("category", article.category))
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), article._id),
          q.eq(q.field("published"), true),
        ),
      )
      .order("desc")
      .take(3);

    // Format related articles with only the fields we need
    const relatedArticles = relatedArticlesData.map((related) => ({
      _id: related._id,
      title: related.title,
      slug: related.slug,
    }));

    return {
      ...article,
      relatedArticles,
    };
  },
});

// Increment the view count for an article
export const incrementArticleViews = mutation({
  args: {
    id: v.id("helpdeskArticles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id } = args;

    // Get the current article
    const article = await ctx.db.get(id);
    if (!article) {
      return false;
    }

    // Increment the views
    await ctx.db.patch(id, {
      views: (article.views || 0) + 1,
    });

    return true;
  },
});

// Get all categories with article counts
export const getHelpdeskCategories = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      count: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Get all published articles
    const articles = await ctx.db
      .query("helpdeskArticles")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();

    // Count articles by category
    const categoryMap = new Map<string, number>();

    for (const article of articles) {
      const count = categoryMap.get(article.category) ?? 0;
      categoryMap.set(article.category, count + 1);
    }

    // Convert to array of objects
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  },
});

// Get featured articles for the helpdesk homepage
export const getFeaturedHelpdeskArticles = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("helpdeskArticles"),
      title: v.string(),
      slug: v.string(),
      summary: v.string(),
      category: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const { limit = 3 } = args;

    const featuredArticlesData = await ctx.db
      .query("helpdeskArticles")
      .filter((q) =>
        q.and(
          q.eq(q.field("published"), true),
          q.eq(q.field("featured"), true),
        ),
      )
      .order("desc")
      .take(limit);

    // Map to return format with only the fields we need
    return featuredArticlesData.map((article) => ({
      _id: article._id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      category: article.category,
    }));
  },
});

// Create a new helpdesk article
export const createHelpdeskArticle = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    summary: v.string(),
    content: v.string(),
    published: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("helpdeskArticles"),
  handler: async (ctx, args) => {
    const {
      title,
      category,
      summary,
      content,
      published = false,
      featured = false,
      tags = [],
    } = args;

    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Find the user record
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");

    // Create the article with a fallback for authorName if user.name is undefined
    const articleId = await ctx.db.insert("helpdeskArticles", {
      title,
      slug,
      category,
      summary,
      content,
      author: user._id,
      authorName: user.name ?? "Unknown Author",
      published,
      featured,
      lastUpdated: Date.now(),
      views: 0,
      tags,
    });

    return articleId;
  },
});

// Update an existing helpdesk article
export const updateHelpdeskArticle = mutation({
  args: {
    id: v.id("helpdeskArticles"),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    summary: v.optional(v.string()),
    content: v.optional(v.string()),
    published: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("helpdeskArticles"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the article
    const article = await ctx.db.get(id);
    if (!article) {
      throw new Error("Article not found");
    }

    // Check if user is the author
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user || (article.author !== user._id && user.role !== "admin")) {
      throw new Error("Not authorized to edit this article");
    }

    // Update slug if title is changing
    const updatedFields: Record<string, unknown> = {
      ...updates,
      lastUpdated: Date.now(),
    };

    if (updates.title) {
      const slug = updates.title
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "-");

      updatedFields.slug = slug;
    }

    // Update the article
    await ctx.db.patch(id, updatedFields);

    return id;
  },
});

// Delete a helpdesk article
export const deleteHelpdeskArticle = mutation({
  args: {
    id: v.id("helpdeskArticles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id } = args;

    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the article
    const article = await ctx.db.get(id);
    if (!article) {
      throw new Error("Article not found");
    }

    // Check if user is the author or an admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user || (article.author !== user._id && user.role !== "admin")) {
      throw new Error("Not authorized to delete this article");
    }

    // Delete the article
    await ctx.db.delete(id);

    return true;
  },
});
