import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";
import { getUserIdFromClerkId } from "./lib/helpers";
/**
 * Count pending invitations for a user based on their Clerk ID
 */
export const countPendingInvitationsByClerkId = query({
    args: {
        clerkId: v.string(),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        if (!args.clerkId) {
            return 0;
        }
        // Get user ID from Clerk ID
        const userId = await getUserIdFromClerkId(ctx, args.clerkId);
        if (!userId) {
            return 0; // User not found
        }
        // Count pending invitations
        const pendingInvitations = await ctx.db
            .query("groupInvitations")
            .withIndex("by_user_status", (q) => q.eq("invitedUserId", userId).eq("status", "pending"))
            .collect();
        return pendingInvitations.length;
    },
});
/**
 * List all groups with filtering and search functionality
 */
export const listGroups = query({
    args: {
        filters: v.object({
            privacy: v.optional(v.union(v.literal("public"), v.literal("private"), v.literal("restricted"))),
            categoryTags: v.optional(v.array(v.string())),
        }),
        search: v.optional(v.string()),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user (if any)
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity
            ? (await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first())?._id
            : null;
        // Construct our query
        let queryBuilder = ctx.db.query("groups");
        // Apply search if provided
        if (args.search && args.search.trim() !== "") {
            queryBuilder = queryBuilder.withSearchIndex("search_groups", (q) => {
                let search = q.search("name", args.search ?? "");
                // Only show non-archived groups
                search = search.eq("isArchived", false);
                // Apply privacy filter if provided
                if (args.filters.privacy) {
                    search = search.eq("privacy", args.filters.privacy);
                }
                return search;
            });
        }
        else {
            // Base filters without search
            // Only show non-archived groups
            queryBuilder = queryBuilder.filter((q) => q.eq(q.field("isArchived"), false));
            // Apply privacy filter if provided
            if (args.filters.privacy) {
                queryBuilder = queryBuilder.filter((q) => q.eq(q.field("privacy"), args.filters.privacy));
            }
        }
        // Order by creation time (newest first)
        queryBuilder = queryBuilder.order("desc");
        // Apply pagination
        const paginatedResults = args.paginationOpts
            ? await queryBuilder.paginate(args.paginationOpts)
            : {
                page: await queryBuilder.collect(),
                isDone: true,
                continueCursor: null,
            };
        // For each group, get the member count and user's membership if applicable
        const groupsWithDetails = await Promise.all(paginatedResults.page.map(async (group) => {
            // Get member count
            const members = await ctx.db
                .query("groupMembers")
                .withIndex("by_group", (q) => q.eq("groupId", group._id))
                .collect();
            const memberCount = members.length;
            // Check if the current user is a member of this group
            let userMembership = null;
            if (userId) {
                const membership = await ctx.db
                    .query("groupMembers")
                    .withIndex("by_group_user", (q) => q.eq("groupId", group._id).eq("userId", userId))
                    .first();
                if (membership) {
                    // Map the statuses from schema to the required format
                    let mappedStatus;
                    if (membership.status === "requested") {
                        mappedStatus = "pending";
                    }
                    else if (membership.status === "active" ||
                        membership.status === "invited" ||
                        membership.status === "blocked") {
                        mappedStatus = membership.status;
                    }
                    else {
                        // Default fallback
                        mappedStatus = "pending";
                    }
                    userMembership = {
                        role: membership.role,
                        status: mappedStatus,
                    };
                }
            }
            // Apply category tag filtering if provided
            if (args.filters.categoryTags &&
                args.filters.categoryTags.length > 0 &&
                (!group.categoryTags ||
                    !args.filters.categoryTags.some((tag) => group.categoryTags?.includes(tag)))) {
                return null; // Skip groups that don't match the category tags
            }
            // Make a type-safe copy of the group with required fields
            const groupWithDetails = {
                ...group,
                memberCount,
                userMembership,
            };
            return groupWithDetails;
        }));
        // Filter out null results (from category tag filtering)
        const filteredGroups = groupsWithDetails.filter((group) => group !== null);
        return {
            groups: filteredGroups,
            continueCursor: paginatedResults.continueCursor ?? undefined,
            isDone: paginatedResults.isDone,
        };
    },
});
/**
 * Get a specific group by ID
 */
export const getGroupById = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Get the authenticated user (if any)
        const identity = await ctx.auth.getUserIdentity();
        let userId = null;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .first();
            if (user) {
                userId = user._id;
                console.log("[getGroupById] Found user:", {
                    userId: user._id,
                    name: user.name,
                });
            }
            else {
                console.log("[getGroupById] No user found for token:", identity.tokenIdentifier);
            }
        }
        // Get member count
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        const memberCount = members.length;
        // Check if the current user is a member of this group
        let userMembership = null;
        if (userId) {
            const membership = await ctx.db
                .query("groupMembers")
                .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId).eq("userId", userId))
                .first();
            console.log("[getGroupById] User membership check:", {
                userId,
                groupId: args.groupId,
                found: !!membership,
                membershipDetails: membership
                    ? {
                        role: membership.role,
                        status: membership.status,
                    }
                    : "Not a member",
            });
            if (membership) {
                // Map the statuses from schema to the required format
                let mappedStatus;
                if (membership.status === "requested") {
                    mappedStatus = "pending";
                }
                else if (membership.status === "active" ||
                    membership.status === "invited" ||
                    membership.status === "blocked") {
                    mappedStatus = membership.status;
                }
                else {
                    // Default fallback
                    mappedStatus = "pending";
                }
                userMembership = {
                    role: membership.role,
                    status: mappedStatus,
                };
            }
        }
        // Create a type-safe GroupWithDetails object
        const groupWithDetails = {
            ...group,
            memberCount,
            userMembership,
            // Add missing field required by GroupWithDetails type
            createdBy: group.creator || null,
        };
        return groupWithDetails;
    },
});
/**
 * List members of a specific group
 */
export const listGroupMembers = query({
    args: {
        groupId: v.id("groups"),
        filter: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("pending"), v.literal("invited"), v.literal("blocked"))),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        // Check if the group exists
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Apply filter if provided
        let queryBuilder = ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId));
        if (args.filter && args.filter !== "all") {
            if (args.filter === "pending") {
                // Map "pending" to "requested" for the database query
                queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), "requested"));
            }
            else {
                queryBuilder = queryBuilder.filter((q) => q.eq(q.field("status"), args.filter));
            }
        }
        // Apply pagination
        const paginatedResults = args.paginationOpts
            ? await queryBuilder.paginate(args.paginationOpts)
            : {
                page: await queryBuilder.collect(),
                isDone: true,
                continueCursor: null,
            };
        // Fetch user details for each member
        const membersWithUserDetails = await Promise.all(paginatedResults.page.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            return {
                ...member,
                user: user
                    ? {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    }
                    : null,
                // Map "requested" status to "pending" for the API response
                status: member.status === "requested" ? "pending" : member.status,
            };
        }));
        return {
            members: membersWithUserDetails,
            continueCursor: paginatedResults.continueCursor ?? undefined,
            isDone: paginatedResults.isDone,
        };
    },
});
/**
 * Get members of a specific group (alias for listGroupMembers)
 * This function exists for backward compatibility with UI components
 */
export const getGroupMembers = query({
    args: {
        groupId: v.id("groups"),
        roleFilter: v.optional(v.union(v.literal("admin"), v.literal("moderator"), v.literal("member"))),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        // Check if the group exists
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Apply role filter if provided
        let queryBuilder = ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId));
        if (args.roleFilter) {
            queryBuilder = queryBuilder.filter((q) => q.eq(q.field("role"), args.roleFilter));
        }
        // Apply pagination
        const paginatedResults = args.paginationOpts
            ? await queryBuilder.paginate(args.paginationOpts)
            : {
                page: await queryBuilder.collect(),
                isDone: true,
                continueCursor: null,
            };
        // Fetch user details for each member
        const membersWithUserDetails = await Promise.all(paginatedResults.page.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            return {
                ...member,
                user: user
                    ? {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    }
                    : null,
            };
        }));
        return {
            members: membersWithUserDetails,
            continueCursor: paginatedResults.continueCursor ?? undefined,
            isDone: paginatedResults.isDone,
        };
    },
});
/**
 * Get groups that a user is a member of
 */
export const getUserGroups = query({
    args: {
        userId: v.union(v.id("users"), v.null()),
    },
    handler: async (ctx, args) => {
        // If no user ID provided, return empty array
        if (!args.userId) {
            return [];
        }
        const userId = args.userId; // This helps TypeScript understand we've checked for null
        // Find all group memberships for the user that are active
        const memberships = await ctx.db
            .query("groupMembers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();
        // Fetch group details for each membership
        const groups = await Promise.all(memberships.map(async (membership) => {
            const group = await ctx.db.get(membership.groupId);
            if (!group)
                return null;
            return {
                _id: group._id,
                name: group.name,
                avatar: group.avatar,
                privacy: group.privacy,
                role: membership.role,
            };
        }));
        // Filter out any null values and return the groups
        return groups.filter((group) => group !== null);
    },
});
/**
 * Get latest posts for a group
 */
export const getLatestPosts = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify group exists
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Get the latest posts
        const posts = await ctx.db
            .query("groupPosts")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .order("desc")
            .take(args.limit ?? 5);
        // Enrich posts with author details
        const enrichedPosts = await Promise.all(posts.map(async (post) => {
            let author = null;
            if (post.authorId) {
                const user = await ctx.db.get(post.authorId);
                author = user
                    ? {
                        name: user.name,
                        profileImageUrl: user.image ?? null,
                    }
                    : null;
            }
            return {
                ...post,
                author,
            };
        }));
        return enrichedPosts;
    },
});
/**
 * Get upcoming events for a group
 */
export const getUpcomingEvents = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify group exists
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        const now = Date.now();
        // Get upcoming events
        const events = await ctx.db
            .query("groupEvents")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .filter((q) => q.gt(q.field("startTime"), now))
            .order("asc")
            .take(args.limit ?? 3);
        return events;
    },
});
/**
 * Get active members for a group
 */
export const getActiveMembers = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify group exists
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new ConvexError("Group not found");
        }
        // Get active members
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_status", (q) => q.eq("groupId", args.groupId).eq("status", "active"))
            .take(args.limit ?? 5);
        // Enrich with user details
        const enrichedMembers = await Promise.all(members.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            return user
                ? {
                    _id: user._id,
                    name: user.name,
                    profileImageUrl: user.image ?? null,
                    role: member.role,
                }
                : null;
        }));
        // Filter out nulls (in case any users were deleted)
        return enrichedMembers.filter((member) => member !== null);
    },
});
/**
 * Get group statistics
 */
export const getGroupStats = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const { groupId } = args;
        // Count members
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_status", (q) => q.eq("groupId", groupId).eq("status", "active"))
            .collect();
        const memberCount = members.length;
        // Count posts
        const posts = await ctx.db
            .query("groupPosts")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .collect();
        const postCount = posts.length;
        // Count events
        const now = Date.now();
        const events = await ctx.db
            .query("groupEvents")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .filter((q) => q.gte(q.field("startTime"), now))
            .collect();
        const eventCount = events.length;
        // Count active members (members who have posted in the last 30 days)
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const recentPosts = await ctx.db
            .query("groupPosts")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .filter((q) => q.gte(q.field("_creationTime"), thirtyDaysAgo))
            .collect();
        const activeAuthorIds = new Set(recentPosts.map((post) => post.authorId.toString()));
        const activeMembers = activeAuthorIds.size;
        return {
            memberCount,
            postCount,
            eventCount,
            activeMembers,
        };
    },
});
/**
 * Get the current user's membership in a specific group
 * This is used to ensure we have the latest membership data
 */
export const getUserMembershipInGroup = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user (if any)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null; // Not authenticated
        }
        // Get the user ID from the token
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!user) {
            console.log("[getUserMembershipInGroup] No user found for token:", identity.tokenIdentifier);
            return null;
        }
        console.log("[getUserMembershipInGroup] Found user:", {
            userId: user._id,
            name: user.name,
        });
        // Check if the user is a member of this group
        const membership = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId).eq("userId", user._id))
            .first();
        console.log("[getUserMembershipInGroup] User membership check:", {
            userId: user._id,
            groupId: args.groupId,
            found: !!membership,
            membershipDetails: membership
                ? {
                    role: membership.role,
                    status: membership.status,
                }
                : "Not a member",
        });
        if (!membership) {
            return null;
        }
        // Map the statuses from schema to the required format
        let mappedStatus;
        if (membership.status === "requested") {
            mappedStatus = "pending";
        }
        else if (membership.status === "active" ||
            membership.status === "invited" ||
            membership.status === "blocked") {
            mappedStatus = membership.status;
        }
        else {
            // Default fallback
            mappedStatus = "pending";
        }
        return {
            role: membership.role,
            status: mappedStatus,
        };
    },
});
/**
 * Get latest posts for a group
 */
export const getLatestGroupPosts = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        const { groupId } = args;
        // Handle both pagination styles for backward compatibility
        let limitValue = 5; // Default
        if (args.paginationOpts) {
            limitValue = args.paginationOpts.numItems;
        }
        else if (args.limit !== undefined) {
            limitValue = args.limit;
        }
        const posts = await ctx.db
            .query("groupPosts")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .order("desc")
            .take(limitValue);
        // Fetch author information for each post
        const postsWithAuthors = await Promise.all(posts.map(async (post) => {
            let author = null;
            if (post.authorId) {
                const user = await ctx.db.get(post.authorId);
                if (user) {
                    author = {
                        name: user.name ?? "Anonymous User",
                        profileImageUrl: user.image ?? null,
                    };
                }
            }
            return { ...post, author };
        }));
        return postsWithAuthors;
    },
});
/**
 * Get upcoming events for a group
 */
export const getUpcomingGroupEvents = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        const { groupId } = args;
        const now = Date.now();
        // Handle both pagination styles for backward compatibility
        let limitValue = 3; // Default
        if (args.paginationOpts) {
            limitValue = args.paginationOpts.numItems;
        }
        else if (args.limit !== undefined) {
            limitValue = args.limit;
        }
        const events = await ctx.db
            .query("groupEvents")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("asc")
            .take(limitValue);
        return events;
    },
});
/**
 * Get active members for a group
 */
export const getActiveGroupMembers = query({
    args: {
        groupId: v.id("groups"),
        limit: v.optional(v.number()),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        const { groupId } = args;
        // Handle both pagination styles for backward compatibility
        let limitValue = 5; // Default
        if (args.paginationOpts) {
            limitValue = args.paginationOpts.numItems;
        }
        else if (args.limit !== undefined) {
            limitValue = args.limit;
        }
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_status", (q) => q.eq("groupId", groupId).eq("status", "active"))
            .take(limitValue);
        // Fetch user information for each member
        const membersWithInfo = await Promise.all(members.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            if (!user) {
                return null;
            }
            return {
                _id: user._id,
                name: user.name ?? "Anonymous User",
                profileImageUrl: user.image ?? null,
                role: member.role,
            };
        }));
        // Filter out any null values (in case a user was deleted)
        return membersWithInfo.filter(Boolean);
    },
});
/**
 * Get the dashboard data for a specific group
 */
export const getDashboardData = query({
    args: {
        groupId: v.id("groups"),
    },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        const { groupId } = args;
        // Get the group
        const group = await ctx.db.get(groupId);
        if (!group) {
            return null;
        }
        // Return the dashboard data if it exists, otherwise null
        return typeof group.dashboardData === "string" ? group.dashboardData : null;
    },
});
