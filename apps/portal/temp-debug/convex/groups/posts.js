import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { isGroupMember } from "./lib/helpers";
/**
 * Get posts for a specific group
 */
export const getGroupPosts = query({
    args: {
        groupId: v.id("groups"),
        paginationOpts: paginationOptsValidator,
    },
    returns: v.object({
        posts: v.array(v.object({
            _id: v.id("groupPosts"),
            _creationTime: v.number(),
            groupId: v.id("groups"),
            authorId: v.id("users"),
            content: v.string(),
            authorName: v.string(),
            authorImageUrl: v.optional(v.string()),
            pinnedAt: v.optional(v.number()),
            attachments: v.optional(v.array(v.object({
                type: v.union(v.literal("image"), v.literal("video"), v.literal("file")),
                url: v.string(),
                name: v.optional(v.string()),
                size: v.optional(v.number()),
            }))),
            isHidden: v.optional(v.boolean()),
            likesCount: v.number(),
            commentsCount: v.number(),
            hasLiked: v.boolean(),
        })),
        cursor: v.optional(v.string()),
        hasMore: v.boolean(),
    }),
    handler: async (ctx, args) => {
        // Get authenticated user
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Not authenticated");
        }
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            throw new ConvexError("User not found");
        }
        // Get group to check if it exists and get privacy settings
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Check if user is a member of the group
        const isMember = await isGroupMember(ctx, user._id, args.groupId);
        // For private and restricted groups, enforce membership
        if (!isMember &&
            (group.privacy === "private" || group.privacy === "restricted")) {
            throw new ConvexError("Not a member of this group");
        }
        // Get posts with pagination
        const postsQuery = ctx.db
            .query("groupPosts")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .order("desc");
        // Apply pagination
        const paginationResult = await postsQuery.paginate(args.paginationOpts);
        const { page: posts, continueCursor, isDone } = paginationResult;
        // Enhance posts with author info and engagement counts
        const enhancedPosts = [];
        for (const post of posts) {
            // Get author info
            const author = await ctx.db.get(post.authorId);
            // For now, use placeholder values for likes and comments since we don't have those tables yet
            // In a real implementation, you'd query the appropriate tables here
            enhancedPosts.push({
                ...post,
                authorName: author?.name ?? "Unknown User",
                authorImageUrl: author?.image, // Use the correct field from the user schema
                likesCount: 0, // Placeholder until likes table is implemented
                commentsCount: 0, // Placeholder until comments table is implemented
                hasLiked: false, // Placeholder until likes table is implemented
            });
        }
        return {
            posts: enhancedPosts,
            cursor: continueCursor,
            hasMore: !isDone,
        };
    },
});
/**
 * Create a new post in a group
 */
export const createGroupPost = mutation({
    args: {
        groupId: v.id("groups"),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            type: v.union(v.literal("image"), v.literal("video"), v.literal("file")),
            url: v.string(),
            name: v.optional(v.string()),
            size: v.optional(v.number()),
        }))),
    },
    returns: v.id("groupPosts"),
    handler: async (ctx, args) => {
        // Get authenticated user
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Not authenticated");
        }
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            throw new ConvexError("User not found");
        }
        // Check if user is a member of the group
        const isMember = await isGroupMember(ctx, user._id, args.groupId);
        if (!isMember) {
            throw new ConvexError("Not a member of this group");
        }
        // Create the post
        const postId = await ctx.db.insert("groupPosts", {
            groupId: args.groupId,
            authorId: user._id,
            content: args.content,
            attachments: args.attachments,
        });
        return postId;
    },
});
