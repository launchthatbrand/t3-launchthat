import { ConvexError, v } from "convex/values";

import type { GroupMemberRole, GroupMemberStatus } from "./schema/types";
import { mutation } from "../_generated/server";
import { getAuthenticatedUser, isGroupAdminOrModerator } from "./lib/helpers";

/**
 * Create a new group
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("restricted"),
    ),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    categoryTags: v.optional(v.array(v.string())),
    settings: v.object({
      allowMemberPosts: v.boolean(),
      allowMemberInvites: v.boolean(),
      showInDirectory: v.boolean(),
      moderationEnabled: v.optional(v.boolean()),
      autoApproveMembers: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Create the group
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      privacy: args.privacy,
      avatar: args.avatar,
      coverImage: args.coverImage,
      categoryTags: args.categoryTags,
      settings: args.settings,
      isArchived: false,
      creator: user._id,
    });

    // Add the creator as admin
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "admin" as GroupMemberRole,
      status: "active" as GroupMemberStatus,
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

/**
 * Update an existing group
 */
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    privacy: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("restricted"),
      ),
    ),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    categoryTags: v.optional(v.array(v.string())),
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
    ),
    settings: v.optional(
      v.object({
        allowMemberPosts: v.optional(v.boolean()),
        allowMemberInvites: v.optional(v.boolean()),
        showInDirectory: v.optional(v.boolean()),
        moderationEnabled: v.optional(v.boolean()),
        autoApproveMembers: v.optional(v.boolean()),
      }),
    ),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Check if the user is an admin or moderator
    const isAdminOrMod = await isGroupAdminOrModerator(
      ctx,
      user._id,
      args.groupId,
    );
    if (!isAdminOrMod) {
      throw new ConvexError({
        code: 403,
        message: "Not authorized to update this group",
      });
    }

    // Prepare the update object with only the fields that are being updated
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.privacy !== undefined) updates.privacy = args.privacy;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.categoryTags !== undefined)
      updates.categoryTags = args.categoryTags;
    if (args.headerItems !== undefined) updates.headerItems = args.headerItems;
    if (args.isArchived !== undefined) updates.isArchived = args.isArchived;

    // Handle settings updates
    if (args.settings) {
      const currentSettings = group.settings ?? {};
      updates.settings = {
        ...currentSettings,
        ...args.settings,
      };
    }

    // Update the group
    await ctx.db.patch(args.groupId, updates);

    return args.groupId;
  },
});

/**
 * Join a group
 */
export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Check if the user is already a member
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new ConvexError({
          code: 400,
          message: "Already a member of this group",
        });
      } else if (existingMembership.status === "blocked") {
        throw new ConvexError({
          code: 403,
          message: "You have been blocked from this group",
        });
      } else if (existingMembership.status === "requested") {
        throw new ConvexError({
          code: 400,
          message: "Membership request already pending",
        });
      }
    }

    // Set the initial status based on group privacy
    let initialStatus: GroupMemberStatus = "active";
    if (group.privacy === "restricted") {
      initialStatus = "requested";
    }

    // Add user as a member
    const membershipId = await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member" as GroupMemberRole,
      status: initialStatus,
      joinedAt: Date.now(),
    });

    return {
      membershipId,
      status: initialStatus,
    };
  },
});

/**
 * Leave a group
 */
export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the user is a member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new ConvexError({
        code: 400,
        message: "Not a member of this group",
      });
    }

    // Check if the user is the last admin
    if (membership.role === "admin") {
      const otherAdmins = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "admin"),
            q.neq(q.field("userId"), user._id),
          ),
        )
        .collect();

      if (otherAdmins.length === 0) {
        throw new ConvexError({
          code: 400,
          message:
            "Cannot leave group as the last admin. Transfer ownership first.",
        });
      }
    }

    // Remove the membership
    await ctx.db.delete(membership._id);

    return {
      success: true,
    };
  },
});

/**
 * Invite a user to a group
 */
export const inviteToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    invitedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Check if the inviter is an admin/moderator or if regular members can invite
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (!membership || membership.status !== "active") {
      throw new ConvexError({
        code: 403,
        message: "Not authorized to invite users to this group",
      });
    }

    // Check if regular members can invite
    if (membership.role === "member" && !group.settings?.allowMemberInvites) {
      throw new ConvexError({
        code: 403,
        message: "Only admins and moderators can invite users to this group",
      });
    }

    // Check if the invited user already has a relationship with the group
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.invitedUserId),
      )
      .first();

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new ConvexError({
          code: 400,
          message: "User is already a member of this group",
        });
      } else if (existingMembership.status === "invited") {
        throw new ConvexError({
          code: 400,
          message: "User has already been invited to this group",
        });
      }
    }

    // Check for existing invitation
    const existingInvitation = await ctx.db
      .query("groupInvitations")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("invitedUserId", args.invitedUserId),
      )
      .first();

    if (existingInvitation && existingInvitation.status === "pending") {
      throw new ConvexError({
        code: 400,
        message: "Invitation already pending for this user",
      });
    }

    // Create or update invitation
    let invitationId;
    if (existingInvitation) {
      await ctx.db.patch(existingInvitation._id, {
        status: "pending",
        invitedByUserId: user._id,
      });
      invitationId = existingInvitation._id;
    } else {
      invitationId = await ctx.db.insert("groupInvitations", {
        groupId: args.groupId,
        invitedUserId: args.invitedUserId,
        invitedByUserId: user._id,
        status: "pending",
        createdAt: Date.now(),
      });
    }

    return invitationId;
  },
});

/**
 * Accept a group invitation
 */
export const acceptInvitation = mutation({
  args: {
    invitationId: v.id("groupInvitations"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Get the invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new ConvexError({
        code: 404,
        message: "Invitation not found",
      });
    }

    // Verify the invitation is for the current user
    if (invitation.invitedUserId !== user._id) {
      throw new ConvexError({
        code: 403,
        message: "Not authorized to accept this invitation",
      });
    }

    // Check if the invitation is still pending
    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: 400,
        message: `Invitation is ${invitation.status}`,
      });
    }

    // Check if the group still exists
    const group = await ctx.db.get(invitation.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Mark the invitation as accepted
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Add the user as a member of the group
    const membershipId = await ctx.db.insert("groupMembers", {
      groupId: invitation.groupId,
      userId: user._id,
      role: "member" as GroupMemberRole,
      status: "active" as GroupMemberStatus,
      joinedAt: Date.now(),
      invitedBy: invitation.invitedByUserId,
    });

    return {
      membershipId,
      groupId: invitation.groupId,
    };
  },
});

/**
 * Decline a group invitation
 */
export const declineInvitation = mutation({
  args: {
    invitationId: v.id("groupInvitations"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Get the invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new ConvexError({
        code: 404,
        message: "Invitation not found",
      });
    }

    // Verify the invitation is for the current user
    if (invitation.invitedUserId !== user._id) {
      throw new ConvexError({
        code: 403,
        message: "Not authorized to decline this invitation",
      });
    }

    // Check if the invitation is still pending
    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: 400,
        message: `Invitation is ${invitation.status}`,
      });
    }

    // Mark the invitation as declined
    await ctx.db.patch(args.invitationId, {
      status: "declined",
      respondedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});

/**
 * Remove a member from a group
 */
export const removeGroupMember = mutation({
  args: {
    groupId: v.id("groups"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Check if the user is an admin or moderator
    const userMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (!userMembership || userMembership.status !== "active") {
      throw new ConvexError({
        code: 403,
        message: "Not authorized to remove members from this group",
      });
    }

    if (
      userMembership.role !== "admin" &&
      userMembership.role !== "moderator"
    ) {
      throw new ConvexError({
        code: 403,
        message: "Only admins and moderators can remove members",
      });
    }

    // Get the member to remove
    const memberToRemove = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.memberId),
      )
      .first();

    if (!memberToRemove) {
      throw new ConvexError({
        code: 404,
        message: "Member not found in this group",
      });
    }

    // Moderators can't remove admins
    if (
      userMembership.role === "moderator" &&
      memberToRemove.role === "admin"
    ) {
      throw new ConvexError({
        code: 403,
        message: "Moderators cannot remove admins",
      });
    }

    // Check if removing the last admin
    if (memberToRemove.role === "admin") {
      const otherAdmins = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "admin"),
            q.neq(q.field("userId"), args.memberId),
          ),
        )
        .collect();

      if (otherAdmins.length === 0) {
        throw new ConvexError({
          code: 400,
          message: "Cannot remove the last admin. Transfer ownership first.",
        });
      }
    }

    // Remove the member
    await ctx.db.delete(memberToRemove._id);

    return {
      success: true,
    };
  },
});

/**
 * Update a group member's role
 */
export const updateGroupMemberRole = mutation({
  args: {
    groupId: v.id("groups"),
    memberId: v.id("users"),
    newRole: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member"),
    ),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);

    // Check if the group exists
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new ConvexError({
        code: 404,
        message: "Group not found",
      });
    }

    // Check if the user is an admin
    const userMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (
      !userMembership ||
      userMembership.status !== "active" ||
      userMembership.role !== "admin"
    ) {
      throw new ConvexError({
        code: 403,
        message: "Only group admins can update member roles",
      });
    }

    // Get the member to update
    const memberToUpdate = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.memberId),
      )
      .first();

    if (!memberToUpdate) {
      throw new ConvexError({
        code: 404,
        message: "Member not found in this group",
      });
    }

    // Check if demoting the last admin
    if (memberToUpdate.role === "admin" && args.newRole !== "admin") {
      const otherAdmins = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "admin"),
            q.neq(q.field("userId"), args.memberId),
          ),
        )
        .collect();

      if (otherAdmins.length === 0) {
        throw new ConvexError({
          code: 400,
          message:
            "Cannot demote the last admin. Transfer ownership to another member first.",
        });
      }
    }

    // Update the member's role
    await ctx.db.patch(memberToUpdate._id, {
      role: args.newRole,
    });

    return {
      success: true,
      memberId: args.memberId,
      newRole: args.newRole,
    };
  },
});

// Add this mutation to update the dashboard data
export const updateDashboardData = mutation({
  args: {
    groupId: v.id("groups"),
    dashboardData: v.string(),
  },
  returns: v.id("groups"),
  handler: async (ctx, args) => {
    const { groupId, dashboardData } = args;

    // Check if the group exists
    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }

    // Update the group with the new dashboard data
    await ctx.db.patch(groupId, {
      dashboardData,
    });

    return groupId;
  },
});
