/**
 * Topics Queries
 *
 * Contains all read operations for the topics feature.
 */
import { filter } from "convex-helpers/server/filter";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query } from "../../_generated/server";
/**
 * Get available topics not attached to a specific lesson
 */
export const getAvailable = query({
    args: {
        lessonId: v.id("lessons"),
    },
    returns: v.array(v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        wp_id: v.optional(v.float64()),
        featuredImage: v.optional(v.string()),
        featuredMedia: v.optional(v.union(v.object({
            type: v.literal("convex"),
            mediaItemId: v.id("mediaItems"),
        }), v.object({
            type: v.literal("vimeo"),
            vimeoId: v.string(),
            vimeoUrl: v.string(),
        }), v.string())),
        contentType: v.optional(v.union(v.literal("text"), v.literal("video"), v.literal("quiz"))),
        content: v.optional(v.string()),
        order: v.optional(v.number()),
        menuOrder: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
    })),
    handler: async (ctx, args) => {
        // Get all topics that are not attached to this lesson
        const topics = await filter(ctx.db.query("topics"), (topic) => topic.lessonId !== args.lessonId).collect();
        return topics;
    },
});
/**
 * List all topics with optional filtering
 */
export const listTopics = query({
    args: {
        searchTitle: v.optional(v.string()),
        lessonId: v.optional(v.id("lessons")),
        isPublished: v.optional(v.boolean()),
    },
    returns: v.array(v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        wp_id: v.optional(v.float64()),
        featuredImage: v.optional(v.string()),
        featuredMedia: v.optional(v.union(v.object({
            type: v.literal("convex"),
            mediaItemId: v.id("mediaItems"),
        }), v.object({
            type: v.literal("vimeo"),
            vimeoId: v.string(),
            vimeoUrl: v.string(),
        }), v.string())),
        contentType: v.optional(v.union(v.literal("text"), v.literal("video"), v.literal("quiz"))),
        content: v.optional(v.string()),
        order: v.optional(v.number()),
        menuOrder: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
    })),
    handler: async (ctx, args) => {
        let topics = await ctx.db.query("topics").collect();
        if (args.lessonId !== undefined) {
            topics = topics.filter((topic) => topic.lessonId === args.lessonId);
        }
        if (args.searchTitle) {
            const searchRegex = new RegExp(args.searchTitle, "i");
            topics = topics.filter((topic) => searchRegex.test(topic.title));
        }
        if (args.isPublished !== undefined) {
            topics = topics.filter((topic) => topic.isPublished === args.isPublished);
        }
        // Sort by menuOrder if available, otherwise by creationTime
        topics.sort((a, b) => {
            if (a.menuOrder !== undefined && b.menuOrder !== undefined) {
                return a.menuOrder - b.menuOrder;
            }
            return a._creationTime - b._creationTime;
        });
        return topics;
    },
});
/**
 * Get a single topic by ID
 */
export const getTopic = query({
    args: {
        id: v.id("topics"),
    },
    returns: v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        wp_id: v.optional(v.float64()),
        featuredImage: v.optional(v.string()),
        featuredMedia: v.optional(v.union(v.object({
            type: v.literal("convex"),
            mediaItemId: v.id("mediaItems"),
        }), v.object({
            type: v.literal("vimeo"),
            vimeoId: v.string(),
            vimeoUrl: v.string(),
        }), v.string())),
        contentType: v.optional(v.union(v.literal("text"), v.literal("video"), v.literal("quiz"))),
        content: v.optional(v.string()),
        order: v.optional(v.number()),
        menuOrder: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.id);
        if (!topic) {
            throw new ConvexError("Topic not found");
        }
        return topic;
    },
});
/**
 * Paginate topics by lessonId
 */
export const paginateTopicsByLessonId = query({
    args: {
        lessonId: v.id("lessons"),
        paginationOpts: paginationOptsValidator,
    },
    returns: v.object({
        page: v.array(v.object({
            _id: v.id("topics"),
            _creationTime: v.number(),
            lessonId: v.optional(v.id("lessons")),
            title: v.string(),
            description: v.optional(v.string()),
            excerpt: v.optional(v.string()),
            categories: v.optional(v.array(v.string())),
            tagIds: v.optional(v.array(v.id("tags"))),
            wp_id: v.optional(v.float64()),
            featuredImage: v.optional(v.string()),
            featuredMedia: v.optional(v.union(v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
            }), v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
            }), v.string())),
            contentType: v.optional(v.union(v.literal("text"), v.literal("video"), v.literal("quiz"))),
            content: v.optional(v.string()),
            order: v.optional(v.number()),
            menuOrder: v.optional(v.number()),
            isPublished: v.optional(v.boolean()),
        })),
        isDone: v.boolean(),
        continueCursor: v.string(),
    }),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("topics")
            .withIndex("by_lessonId_menuOrder", (q) => q.eq("lessonId", args.lessonId))
            .order("asc")
            .paginate(args.paginationOpts);
    },
});
