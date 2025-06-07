import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Base group schema with creation, privacy, and description fields
export const groupsTable = defineTable({
  name: v.string(),
  description: v.string(),
  privacy: v.union(
    v.literal("public"), // Anyone can see and join
    v.literal("private"), // Only visible and joinable via invitation
    v.literal("restricted"), // Visible to all, but requires approval to join
  ),
  creator: v.id("users"),
  avatar: v.optional(v.string()), // URL to group avatar image
  coverImage: v.optional(v.string()), // URL to group cover image
  headerItems: v.optional(
    v.array(
      v.object({
        id: v.string(),
        title: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        imageUrl: v.string(),
        template: v.union(
          v.literal("inline"),
          v.literal("stacked"),
          v.literal("overlay"),
        ),
        textAlign: v.optional(
          v.union(v.literal("left"), v.literal("center"), v.literal("right")),
        ),
        verticalAlign: v.optional(
          v.union(v.literal("top"), v.literal("middle"), v.literal("bottom")),
        ),
        padding: v.optional(
          v.object({
            top: v.optional(v.number()),
            right: v.optional(v.number()),
            bottom: v.optional(v.number()),
            left: v.optional(v.number()),
          }),
        ),
        blogPostId: v.optional(v.string()),
      }),
    ),
  ), // Carousel items for group header
  dashboardData: v.optional(v.any()), // Data for customized group dashboard
  isArchived: v.optional(v.boolean()),
  settings: v.optional(
    v.object({
      allowMemberPosts: v.boolean(),
      moderationEnabled: v.optional(v.boolean()),
      autoApproveMembers: v.optional(v.boolean()),
      showInDirectory: v.boolean(),
      allowMemberInvites: v.optional(v.boolean()),
    }),
  ),
  categoryTags: v.optional(v.array(v.string())),
})
  .index("by_name", ["name"])
  .index("by_creator", ["creator"])
  .index("by_privacy", ["privacy"])
  .searchIndex("search_groups", {
    searchField: "name",
    filterFields: ["privacy", "isArchived"],
  });

// Group members with role management
export const groupMembersTable = defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  role: v.union(
    v.literal("admin"), // Can manage group settings and members
    v.literal("moderator"), // Can moderate content and members
    v.literal("member"), // Regular member
  ),
  status: v.union(
    v.literal("active"),
    v.literal("invited"), // Invited but not yet joined
    v.literal("requested"), // Requested to join
    v.literal("blocked"), // Blocked from group
  ),
  joinedAt: v.number(), // Timestamp when joined
  invitedBy: v.optional(v.id("users")),
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"])
  .index("by_group_status", ["groupId", "status"])
  .index("by_group_role", ["groupId", "role"])
  .index("by_group_user", ["groupId", "userId"])
  .index("by_user_status", ["userId", "status"]);

// Group invitations for users to join groups
export const groupInvitationsTable = defineTable({
  groupId: v.id("groups"),
  invitedUserId: v.id("users"),
  invitedByUserId: v.id("users"),
  message: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("declined"),
    v.literal("expired"),
  ),
  createdAt: v.number(), // Timestamp when invitation was created
  respondedAt: v.optional(v.number()), // Timestamp when invitation was responded to
})
  .index("by_group", ["groupId"])
  .index("by_invited_user", ["invitedUserId"])
  .index("by_group_user", ["groupId", "invitedUserId"])
  .index("by_user_status", ["invitedUserId", "status"]);

// Join requests for users requesting to join groups
export const groupJoinRequestsTable = defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  message: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  createdAt: v.number(), // Timestamp when request was created
  respondedAt: v.optional(v.number()), // Timestamp when request was responded to
  respondedBy: v.optional(v.id("users")), // User who responded to the request
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"])
  .index("by_group_user", ["groupId", "userId"])
  .index("by_group_status", ["groupId", "status"]);

// Group posts for discussions
export const groupPostsTable = defineTable({
  groupId: v.id("groups"),
  authorId: v.id("users"),
  title: v.optional(v.string()), // Adding title field for posts
  content: v.string(),
  attachments: v.optional(
    v.array(
      v.object({
        type: v.union(
          v.literal("image"),
          v.literal("video"),
          v.literal("file"),
        ),
        url: v.string(),
        name: v.optional(v.string()),
        size: v.optional(v.number()),
      }),
    ),
  ),
  pinnedAt: v.optional(v.number()), // Timestamp if post is pinned
  isHidden: v.optional(v.boolean()),
  moderatedBy: v.optional(v.id("users")),
  moderationReason: v.optional(v.string()),
  moderatedAt: v.optional(v.number()),
})
  .index("by_group", ["groupId"])
  .index("by_author", ["authorId"])
  .index("by_group_author", ["groupId", "authorId"])
  .index("by_pinned", ["groupId", "pinnedAt"]);

// Comments on group posts
export const groupCommentsTable = defineTable({
  postId: v.id("groupPosts"),
  authorId: v.id("users"),
  content: v.string(),
  parentCommentId: v.optional(v.id("groupComments")), // For replies to comments
  attachments: v.optional(
    v.array(
      v.object({
        type: v.union(v.literal("image"), v.literal("file")),
        url: v.string(),
        name: v.optional(v.string()),
      }),
    ),
  ),
  isHidden: v.optional(v.boolean()),
  moderatedBy: v.optional(v.id("users")),
  moderationReason: v.optional(v.string()),
  moderatedAt: v.optional(v.number()),
})
  .index("by_post", ["postId"])
  .index("by_author", ["authorId"])
  .index("by_parent", ["parentCommentId"]);

// Group events table
export const groupEventsTable = defineTable({
  groupId: v.id("groups"),
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  startTime: v.number(), // Timestamp for event start
  endTime: v.number(), // Timestamp for event end
  creatorId: v.id("users"), // User who created the event
  coverImage: v.optional(v.string()), // URL to event cover image
  isPublic: v.optional(v.boolean()), // Whether event is visible to non-members
  maxAttendees: v.optional(v.number()), // Maximum number of attendees
  isOnline: v.optional(v.boolean()), // Whether event is online
  meetingLink: v.optional(v.string()), // Link for online meeting
  isCancelled: v.optional(v.boolean()), // Whether event is cancelled
  createdAt: v.number(), // Timestamp when event was created
})
  .index("by_group", ["groupId"])
  .index("by_creator", ["creatorId"]);

// Group activity tracking table
export const groupActivityTable = defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  activityType: v.union(
    v.literal("view"),
    v.literal("post"),
    v.literal("comment"),
    v.literal("rsvp"),
    v.literal("join"),
    v.literal("invite"),
  ),
  timestamp: v.number(), // When the activity occurred
  resourceId: v.optional(v.string()), // ID of related resource (post, comment, etc.)
})
  .index("by_user", ["userId"])
  .index("by_group", ["groupId"])
  .index("by_group_user", ["groupId", "userId"]);

// Export a proper Convex schema using defineSchema
export const groupsSchema = defineSchema({
  groups: groupsTable,
  groupMembers: groupMembersTable,
  groupInvitations: groupInvitationsTable,
  groupJoinRequests: groupJoinRequestsTable,
  groupPosts: groupPostsTable,
  groupComments: groupCommentsTable,
  groupEvents: groupEventsTable,
  groupActivity: groupActivityTable,
});
