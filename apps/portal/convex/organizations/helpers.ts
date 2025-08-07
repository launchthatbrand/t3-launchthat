import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Verify that a user has access to an organization with a specific role
 */
export const verifyOrganizationAccess = async (
  ctx: MutationCtx | QueryCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  requiredRoles?: Array<"owner" | "admin" | "editor" | "viewer" | "student">,
) => {
  const membership = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_organization", (q) =>
      q.eq("userId", userId).eq("organizationId", organizationId),
    )
    .filter((q) => q.eq(q.field("isActive"), true))
    .unique();

  if (!membership) {
    throw new Error("Access denied: User not a member of this organization");
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    throw new Error(
      `Access denied: User role '${membership.role}' insufficient. Required: ${requiredRoles.join(", ")}`,
    );
  }

  return membership;
};

/**
 * Get all organizations a user has access to
 */
export const getUserOrganizations = async (
  ctx: QueryCtx,
  userId: Id<"users">,
  activeOnly: boolean = true,
) => {
  const memberships = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) =>
      activeOnly
        ? q.eq(q.field("isActive"), true)
        : q.gte(q.field("isActive"), false),
    )
    .collect();

  const organizations = await Promise.all(
    memberships.map(async (membership) => {
      const org = await ctx.db.get(membership.organizationId);
      return org ? { ...org, userRole: membership.role } : null;
    }),
  );

  return organizations.filter(Boolean);
};

/**
 * Check if user can create more organizations based on their plan
 * Admins bypass all restrictions
 */
export const checkOrganizationLimit = async (
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
) => {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Admins bypass all plan restrictions
  if (user.role === "admin") {
    return; // Allow unlimited organization creation for admins
  }

  // Regular users need a plan
  if (!user.planId) {
    throw new Error("User has no plan assigned");
  }

  const plan = await ctx.db.get(user.planId);
  if (!plan) {
    throw new Error("User plan not found");
  }

  const userOrgs = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) =>
      q.and(q.eq(q.field("isActive"), true), q.eq(q.field("role"), "owner")),
    )
    .collect();

  if (
    plan.maxOrganizations !== -1 &&
    userOrgs.length >= plan.maxOrganizations
  ) {
    throw new Error(
      `Organization limit reached. Your ${plan.displayName} plan allows ${plan.maxOrganizations} organization${plan.maxOrganizations === 1 ? "" : "s"}.`,
    );
  }

  return {
    canCreate: true,
    used: userOrgs.length,
    limit: plan.maxOrganizations,
  };
};

/**
 * Get user's plan information
 */
export const getUserPlan = async (ctx: QueryCtx, userId: Id<"users">) => {
  const user = await ctx.db.get(userId);
  if (!user?.planId) {
    return null;
  }

  return await ctx.db.get(user.planId);
};

/**
 * Create slug from organization name
 */
export const generateOrganizationSlug = async (
  ctx: MutationCtx | QueryCtx,
  name: string,
): Promise<string> => {
  // Convert to lowercase, replace spaces and special chars with hyphens
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 1;

  // Check for uniqueness
  while (true) {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate invitation token
 */
export const generateInvitationToken = (): string => {
  // Generate a random token (in production, use crypto.randomUUID or similar)
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
};

/**
 * Check if invitation is valid
 */
export const validateInvitation = async (ctx: QueryCtx, token: string) => {
  const invitation = await ctx.db
    .query("organizationInvitations")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  if (invitation.status !== "pending") {
    throw new Error(`Invitation is ${invitation.status}`);
  }

  if (invitation.expiresAt < Date.now()) {
    throw new Error("Invitation has expired");
  }

  return invitation;
};

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = async (ctx: QueryCtx, slug: string) => {
  return await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
};

/**
 * Grant customer access to organization
 */
export const grantCustomerAccess = async (
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    customerUserId: Id<"users">;
    grantedBy: Id<"users">;
    accessType: "product_purchase" | "course_enrollment" | "manual_grant";
    sourceId?: Id<"products"> | Id<"courses"> | string;
    expiresAt?: number;
  },
) => {
  // Check if user already has access
  const existing = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_organization", (q) =>
      q
        .eq("userId", args.customerUserId)
        .eq("organizationId", args.organizationId),
    )
    .unique();

  if (existing) {
    // Update existing membership
    await ctx.db.patch(existing._id, {
      isActive: true,
      updatedAt: Date.now(),
      customerData: {
        accessGrantedBy: args.grantedBy,
        accessType: args.accessType,
        accessSourceId: args.sourceId,
        expiresAt: args.expiresAt,
      },
    });
    return existing._id;
  } else {
    // Create new membership
    return await ctx.db.insert("userOrganizations", {
      userId: args.customerUserId,
      organizationId: args.organizationId,
      role: "student",
      isActive: true,
      joinedAt: Date.now(),
      customerData: {
        accessGrantedBy: args.grantedBy,
        accessType: args.accessType,
        accessSourceId: args.sourceId,
        expiresAt: args.expiresAt,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
};

/**
 * Helper to check if user has admin access (owner or admin role)
 */
export const isOrganizationAdmin = (userRole: string): boolean => {
  return userRole === "owner" || userRole === "admin";
};

/**
 * Helper to check if user can edit content (owner, admin, or editor role)
 */
export const canEditContent = (userRole: string): boolean => {
  return userRole === "owner" || userRole === "admin" || userRole === "editor";
};

/**
 * Helper to check if organization is active
 */
export const isOrganizationActive = (subscriptionStatus: string): boolean => {
  return ["active", "trialing"].includes(subscriptionStatus);
};
