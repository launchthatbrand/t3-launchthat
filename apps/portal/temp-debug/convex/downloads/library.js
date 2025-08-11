/**
 * Downloads library with metadata management
 */
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthenticatedUserDocIdByToken, getOptionalAuthenticatedUserIdentity, } from "../core/lib/permissions";
/**
 * Utility function to check if user can manage downloads (is an admin).
 * Returns the admin user document if authorized, otherwise throws.
 */
const ensureAdmin = async (ctx) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
        // This case should ideally not happen if getAuthenticatedUserDocIdByToken succeeded
        throw new ConvexError("User not found despite valid authentication token.");
    }
    if (user.role !== "admin") {
        // Assuming 'role' field exists on users table
        throw new ConvexError("Insufficient permissions: Admin role required.");
    }
    return user;
};
/**
 * Get all downloads for admin purposes
 */
export const getAllDownloads = query({
    args: {},
    returns: v.array(v.object({
        _id: v.id("downloads"),
        title: v.string(),
        description: v.optional(v.string()),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        downloadCount: v.number(),
        categoryId: v.optional(v.id("downloadCategories")),
        isPublic: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })),
    handler: async (ctx) => {
        await ensureAdmin(ctx);
        const downloads = await ctx.db.query("downloads").collect();
        // Cast the downloaded documents to match the return type
        return downloads.map((download) => ({
            _id: download._id,
            title: download.title,
            description: download.description,
            fileName: download.fileName,
            fileType: download.fileType,
            fileSize: download.fileSize,
            downloadCount: download.downloadCount,
            categoryId: download.categoryId,
            isPublic: download.isPublic,
            createdAt: download.createdAt,
            updatedAt: download.updatedAt,
        }));
    },
});
/**
 * Create a download category
 */
export const createDownloadCategory = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
    },
    returns: v.id("downloadCategories"),
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        return await ctx.db.insert("downloadCategories", {
            name: args.name,
            description: args.description,
            isPublic: args.isPublic,
            createdAt: Date.now(),
        });
    },
});
/**
 * Delete a download category
 */
export const deleteDownloadCategory = mutation({
    args: {
        categoryId: v.id("downloadCategories"),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        await ensureAdmin(ctx);
        // Get the category to verify it exists
        const category = await ctx.db.get(args.categoryId);
        if (!category) {
            throw new ConvexError("Category not found");
        }
        // Find all downloads in this category and remove the category reference
        const downloadsInCategory = await ctx.db
            .query("downloads")
            .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
            .collect();
        for (const download of downloadsInCategory) {
            await ctx.db.patch(download._id, { categoryId: undefined });
        }
        // Delete the category
        await ctx.db.delete(args.categoryId);
        return true;
    },
});
/**
 * Get download categories
 */
export const getDownloadCategories = query({
    args: {
        includePrivate: v.optional(v.boolean()),
    },
    returns: v.array(v.object({
        _id: v.id("downloadCategories"),
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
        _creationTime: v.number(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const identity = await getOptionalAuthenticatedUserIdentity(ctx);
        let categoriesQuery = ctx.db.query("downloadCategories");
        // If not requesting private categories, just return public ones
        if (!args.includePrivate) {
            categoriesQuery = categoriesQuery.filter((q) => q.eq(q.field("isPublic"), true));
        }
        else {
            // If requesting private categories, check authentication
            if (!identity) {
                // Instead of throwing an error immediately, just return public categories
                // with a console warning
                console.warn("Unauthorized: User requested private categories without authentication. Returning public categories only.");
                categoriesQuery = categoriesQuery.filter((q) => q.eq(q.field("isPublic"), true));
            }
            else {
                // Check if user is admin
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                    .first();
                if (!user || user.role !== "admin") {
                    // Not an admin, filter to show only public categories
                    categoriesQuery = categoriesQuery.filter((q) => q.eq(q.field("isPublic"), true));
                }
                // If admin, no additional filter, all categories are fetched by default query
            }
        }
        const categories = await categoriesQuery.collect();
        // Map the results to match the expected return type
        return categories.map((category) => ({
            _id: category._id,
            name: category.name,
            description: category.description,
            isPublic: category.isPublic,
            _creationTime: category._creationTime,
            createdAt: category.createdAt,
        }));
    },
});
/**
 * Search and filter downloads
 */
export const searchDownloads = query({
    args: {
        paginationOpts: paginationOptsValidator,
        searchTerm: v.optional(v.string()),
        categoryId: v.optional(v.id("downloadCategories")),
        fileType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getOptionalAuthenticatedUserIdentity(ctx);
        let isAdmin = false;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            if (user) {
                isAdmin = user.role === "admin";
            }
        }
        const queryBuilder = ctx.db
            .query("downloads")
            .withSearchIndex("search_downloads", (q) => {
            let search = q.search("searchText", args.searchTerm ?? "");
            if (args.categoryId) {
                search = search.eq("categoryId", args.categoryId);
            }
            if (args.fileType) {
                search = search.eq("fileType", args.fileType);
            }
            if (!isAdmin) {
                search = search.eq("isPublic", true);
            }
            return search;
        });
        return await queryBuilder.paginate(args.paginationOpts);
    },
});
/**
 * Search and filter downloads without pagination
 */
export const searchAllDownloads = query({
    args: {
        searchTerm: v.optional(v.string()),
        categoryId: v.optional(v.id("downloadCategories")),
        fileType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getOptionalAuthenticatedUserIdentity(ctx);
        let isAdmin = false;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            if (user) {
                isAdmin = user.role === "admin";
            }
        }
        const queryBuilder = ctx.db
            .query("downloads")
            .withSearchIndex("search_downloads", (q) => {
            let search = q.search("searchText", args.searchTerm ?? "");
            if (args.categoryId) {
                search = search.eq("categoryId", args.categoryId);
            }
            if (args.fileType) {
                search = search.eq("fileType", args.fileType);
            }
            if (!isAdmin) {
                search = search.eq("isPublic", true);
            }
            return search;
        });
        // Take a reasonable number of results without pagination
        const downloads = await queryBuilder.take(100);
        return { downloads };
    },
});
/**
 * Get user's recent downloads
 */
export const getRecentDownloads = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserDocIdByToken(ctx);
        // Get user's recent downloads with join to download info
        const recentDownloads = await ctx.db
            .query("userDownloads")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(args.limit ?? 5);
        // Fetch the associated download information
        const result = [];
        for (const download of recentDownloads) {
            const downloadInfo = await ctx.db.get(download.downloadId);
            if (downloadInfo) {
                result.push({
                    ...download,
                    download: downloadInfo,
                });
            }
        }
        return result;
    },
});
/**
 * Get download recommendations
 */
export const getDownloadRecommendations = query({
    args: {
        currentDownloadId: v.optional(v.id("downloads")),
        count: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // For now, we simply return the most popular downloads
        // In the future, this could be enhanced with more sophisticated recommendation logic
        const popularDownloads = await ctx.db
            .query("downloads")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .order("desc")
            .take(args.count ?? 5);
        // Exclude the current download if specified
        return popularDownloads.filter((download) => !args.currentDownloadId || download._id !== args.currentDownloadId);
    },
});
/**
 * Get featured downloads for homepage
 */
export const getFeaturedDownloads = query({
    args: {
        count: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Simple implementation: get the most recently added public downloads
        return await ctx.db
            .query("downloads")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .order("desc")
            .take(args.count ?? 4);
    },
});
