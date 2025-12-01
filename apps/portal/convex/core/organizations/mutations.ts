import type { Id } from "@convex-config/_generated/dataModel";
import { v } from "convex/values";

import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";
import { getAuthenticatedUserId } from "../../lib/permissions/userAuth";
import {
  checkOrganizationLimit,
  generateInvitationToken,
  generateOrganizationSlug,
  grantCustomerAccess,
  validateInvitation,
  verifyOrganizationAccess,
} from "./helpers";

/**
 * Create a new organization
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    planId: v.optional(v.id("plans")), // Make planId optional for admin users
    isPublic: v.optional(v.boolean()),
    allowSelfRegistration: v.optional(v.boolean()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get user to check admin status
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check plan limits (admins bypass this check)
    await checkOrganizationLimit(ctx, userId);

    // Generate unique slug
    const slug = await generateOrganizationSlug(ctx, args.name);

    const now = Date.now();

    // For non-admin users, planId is required
    if (user.role !== "admin" && !args.planId) {
      throw new Error("Plan ID is required for non-admin users");
    }

    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      description: args.description,
      ownerId: userId,
      planId: args.planId, // Can be undefined for admin users
      isPublic: args.isPublic ?? false,
      allowSelfRegistration: args.allowSelfRegistration ?? false,
      subscriptionStatus: user.role === "admin" ? "active" : "trialing", // Admin orgs are immediately active
      updatedAt: now,
    });

    // Add owner to organization
    await ctx.db.insert("userOrganizations", {
      userId,
      organizationId,
      role: "owner",
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    });

    return organizationId;
  },
});

/**
 * Update organization details
 */
export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowSelfRegistration: v.optional(v.boolean()),
    planId: v.optional(v.id("plans")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Check if user is a global admin
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Admins can update any organization
    if (user.role === "admin") {
      // Admin bypass - can update any organization
    } else {
      // Non-admins must be organization owners or admins
      await verifyOrganizationAccess(ctx, args.organizationId, userId, [
        "owner",
        "admin",
      ]);
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Add fields that are being updated
    if (args.name !== undefined) {
      updates.name = args.name;
      // Regenerate slug if name changed
      updates.slug = await generateOrganizationSlug(ctx, args.name);
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.primaryColor !== undefined)
      updates.primaryColor = args.primaryColor;
    if (args.customDomain !== undefined)
      updates.customDomain = args.customDomain;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.allowSelfRegistration !== undefined)
      updates.allowSelfRegistration = args.allowSelfRegistration;
    if (args.planId !== undefined) updates.planId = args.planId;

    await ctx.db.patch(args.organizationId, updates);
    return null;
  },
});

/**
 * Invite user to organization
 */
export const inviteUser = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
  },
  returns: v.id("organizationInvitations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Verify admin access (only owners and admins can invite)
    await verifyOrganizationAccess(
      ctx,
      args.organizationId,
      userId as Id<"users">,
      ["owner", "admin"],
    );

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("userOrganizations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      const isAlreadyMember = existingMember.some(
        (m) => m.userId === existingUser._id,
      );
      if (isAlreadyMember) {
        throw new Error("User is already a member of this organization");
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await ctx.db
      .query("organizationInvitations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), args.email),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .unique();

    if (existingInvitation) {
      throw new Error("Invitation already sent to this email");
    }

    // Generate invitation
    const token = generateInvitationToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    return await ctx.db.insert("organizationInvitations", {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      invitedBy: userId as Id<"users">,
      token,
      expiresAt,
      status: "pending",
    });
  },
});

/**
 * Accept organization invitation
 */
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  returns: v.id("userOrganizations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate invitation
    const invitation = await validateInvitation(ctx, args.token);

    // Get user email to verify match
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.email !== invitation.email) {
      throw new Error("Invitation email does not match your account");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q
          .eq("userId", userId as Id<"users">)
          .eq("organizationId", invitation.organizationId),
      )
      .unique();

    if (existingMembership) {
      throw new Error("You are already a member of this organization");
    }

    const now = Date.now();

    // Create membership
    const membershipId = await ctx.db.insert("userOrganizations", {
      userId: userId as Id<"users">,
      organizationId: invitation.organizationId,
      role: invitation.role,
      isActive: true,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation._creationTime,
      joinedAt: now,
      updatedAt: now,
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      acceptedBy: userId as Id<"users">,
    });

    return membershipId;
  },
});

/**
 * Remove user from organization
 */
export const removeUser = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const currentUserId = identity.subject;

    // Verify admin access or self-removal
    if (currentUserId !== args.userId) {
      await verifyOrganizationAccess(
        ctx,
        args.organizationId,
        currentUserId as Id<"users">,
        ["owner", "admin"],
      );
    }

    // Find membership
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .unique();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    // Cannot remove the owner
    if (membership.role === "owner") {
      throw new Error("Cannot remove organization owner");
    }

    // Deactivate membership
    await ctx.db.patch(membership._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update user role in organization
 */
export const updateUserRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const currentUserId = identity.subject;

    // Only owners and admins can update roles
    await verifyOrganizationAccess(
      ctx,
      args.organizationId,
      currentUserId as Id<"users">,
      ["owner", "admin"],
    );

    // Find membership
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .unique();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    // Cannot change owner role
    if (membership.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Grant customer access after product purchase
 */
export const grantCustomerAccessMutation = mutation({
  args: {
    organizationId: v.id("organizations"),
    customerUserId: v.id("users"),
    accessType: v.union(
      v.literal("product_purchase"),
      v.literal("course_enrollment"),
      v.literal("manual_grant"),
    ),
    sourceId: v.optional(v.union(v.id("products"), v.string())),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("userOrganizations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const currentUserId = identity.subject;

    // Verify admin access
    await verifyOrganizationAccess(
      ctx,
      args.organizationId,
      currentUserId as Id<"users">,
      ["owner", "admin", "editor"],
    );

    return await grantCustomerAccess(ctx, {
      organizationId: args.organizationId,
      customerUserId: args.customerUserId,
      grantedBy: currentUserId as Id<"users">,
      accessType: args.accessType,
      sourceId: args.sourceId,
      expiresAt: args.expiresAt,
    });
  },
});

/**
 * Delete organization (owner only)
 */
export const deleteOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Check if user is a global admin
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Admins can delete any organization
    if (user.role === "admin") {
      // Admin bypass - can delete any organization
    } else {
      // Non-admins must be organization owners
      await verifyOrganizationAccess(ctx, args.organizationId, userId, [
        "owner",
      ]);
    }

    // TODO: In production, you might want to:
    // 1. Cancel subscriptions
    // 2. Archive/soft delete instead of hard delete
    // 3. Handle data cleanup properly

    // For now, just delete the organization
    // Note: This will cascade to delete related data due to foreign key constraints
    await ctx.db.delete(args.organizationId);

    return null;
  },
});

/**
 * Add existing user to organization
 */
export const addUser = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
  },
  returns: v.id("userOrganizations"),
  handler: async (ctx, args) => {
    const actorUserId = await getAuthenticatedUserId(ctx);
    await ensureCanManageMembers(ctx, args.organizationId, actorUserId);

    return await addOrReactivateMembership(ctx, {
      organizationId: args.organizationId,
      targetUserId: args.userId,
      role: args.role,
      invitedBy: actorUserId,
    });
  },
});

export const addUserByEmail = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
  },
  returns: v.id("userOrganizations"),
  handler: async (ctx, args) => {
    const actorUserId = await getAuthenticatedUserId(ctx);
    await ensureCanManageMembers(ctx, args.organizationId, actorUserId);

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!targetUser) {
      throw new Error("No user found with that email address");
    }

    return await addOrReactivateMembership(ctx, {
      organizationId: args.organizationId,
      targetUserId: targetUser._id,
      role: args.role,
      invitedBy: actorUserId,
    });
  },
});

/**
 * Plan Management Mutations
 */

/**
 * Create a new plan
 */
export const createPlan = mutation({
  args: {
    name: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("business"),
      v.literal("agency"),
    ),
    displayName: v.string(),
    description: v.string(),
    maxOrganizations: v.number(),
    priceMonthly: v.number(),
    priceYearly: v.optional(v.number()),
    features: v.array(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  returns: v.id("plans"),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Only admins can create plans
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Only administrators can create plans");
    }

    // Check if plan name already exists
    const existingPlan = await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingPlan) {
      throw new Error(`Plan with name '${args.name}' already exists`);
    }

    const now = Date.now();

    const planId = await ctx.db.insert("plans", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      maxOrganizations: args.maxOrganizations,
      priceMonthly: args.priceMonthly,
      priceYearly: args.priceYearly,
      features: args.features,
      isActive: args.isActive ?? true,
      sortOrder: args.sortOrder ?? 0,
      updatedAt: now,
    });

    return planId;
  },
});

/**
 * Update an existing plan
 */
export const updatePlan = mutation({
  args: {
    planId: v.id("plans"),
    name: v.optional(
      v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("business"),
        v.literal("agency"),
      ),
    ),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    maxOrganizations: v.optional(v.number()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Only admins can update plans
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Only administrators can update plans");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Add fields that are being updated
    if (args.name !== undefined) updates.name = args.name;
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.description !== undefined) updates.description = args.description;
    if (args.maxOrganizations !== undefined)
      updates.maxOrganizations = args.maxOrganizations;
    if (args.priceMonthly !== undefined)
      updates.priceMonthly = args.priceMonthly;
    if (args.priceYearly !== undefined) updates.priceYearly = args.priceYearly;
    if (args.features !== undefined) updates.features = args.features;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.planId, updates);
    return null;
  },
});

/**
 * Delete a plan
 */
export const deletePlan = mutation({
  args: {
    planId: v.id("plans"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Only admins can delete plans
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Only administrators can delete plans");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Check if any users are currently on this plan
    const usersOnPlan = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("planId"), args.planId))
      .collect();

    if (usersOnPlan.length > 0) {
      throw new Error(
        `Cannot delete plan. ${usersOnPlan.length} user(s) are currently assigned to this plan.`,
      );
    }

    // Check if any organizations reference this plan
    const orgsOnPlan = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("planId"), args.planId))
      .collect();

    if (orgsOnPlan.length > 0) {
      throw new Error(
        `Cannot delete plan. ${orgsOnPlan.length} organization(s) are currently using this plan.`,
      );
    }

    await ctx.db.delete(args.planId);
    return null;
  },
});

type MemberRole = "admin" | "editor" | "viewer" | "student";

async function ensureCanManageMembers(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  actorUserId: Id<"users">,
) {
  const currentUser = await ctx.db.get(actorUserId);
  if (!currentUser) {
    throw new Error("User not found");
  }

  if (currentUser.role !== "admin") {
    await verifyOrganizationAccess(ctx, organizationId, actorUserId, [
      "owner",
      "admin",
    ]);
  }
}

async function addOrReactivateMembership(
  ctx: MutationCtx,
  params: {
    organizationId: Id<"organizations">;
    targetUserId: Id<"users">;
    role: MemberRole;
    invitedBy: Id<"users">;
  },
) {
  const existingMembership = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_organization", (q) =>
      q
        .eq("userId", params.targetUserId)
        .eq("organizationId", params.organizationId),
    )
    .unique();

  if (existingMembership) {
    if (existingMembership.isActive) {
      throw new Error("User is already a member of this organization");
    }

    await ctx.db.patch(existingMembership._id, {
      role: params.role,
      isActive: true,
      updatedAt: Date.now(),
    });
    return existingMembership._id;
  }

  const now = Date.now();
  return await ctx.db.insert("userOrganizations", {
    userId: params.targetUserId,
    organizationId: params.organizationId,
    role: params.role,
    isActive: true,
    joinedAt: now,
    invitedBy: params.invitedBy,
    updatedAt: now,
  });
}
