import { v } from "convex/values";

import { components } from "../../_generated/api";
import { query } from "../../_generated/server";
import {
  getOrganizationBySlug,
  getUserOrganizations,
  getUserPlan,
  verifyOrganizationAccess,
  verifyOrganizationAccessWithClerkContext,
} from "./helpers";
import {
  organizationInvitationValidator,
  organizationMemberValidator,
  organizationValidator,
  planLimitResultValidator,
  planValidator,
} from "./types";

// Convex validators do not accept `null` for optional fields (they must be `undefined` / omitted).
// Some existing data may contain explicit `null`s (e.g. logo: null), so normalize at the API boundary.
const normalizeOrgForValidator = (org: any) => ({
  ...org,
  description: org.description ?? undefined,
  clerkOrganizationId: org.clerkOrganizationId ?? undefined,
  logo: org.logo ?? undefined,
  primaryColor: org.primaryColor ?? undefined,

  customDomain: org.customDomain ?? undefined,
  customDomainLastError: org.customDomainLastError ?? undefined,
  customDomainRecords: org.customDomainRecords ?? undefined,
  customDomainStatus: org.customDomainStatus ?? undefined,
  customDomainUpdatedAt: org.customDomainUpdatedAt ?? undefined,
  customDomainVerifiedAt: org.customDomainVerifiedAt ?? undefined,

  emailDomain: org.emailDomain ?? undefined,
  emailDomainLastError: org.emailDomainLastError ?? undefined,
  emailDomainRecords: org.emailDomainRecords ?? undefined,
  emailDomainStatus: org.emailDomainStatus ?? undefined,
  emailDomainUpdatedAt: org.emailDomainUpdatedAt ?? undefined,
  emailDomainVerifiedAt: org.emailDomainVerifiedAt ?? undefined,

  planId: org.planId ?? undefined,
  subscriptionId: org.subscriptionId ?? undefined,
  currentPeriodStart: org.currentPeriodStart ?? undefined,
  currentPeriodEnd: org.currentPeriodEnd ?? undefined,
  cancelAtPeriodEnd: org.cancelAtPeriodEnd ?? undefined,
});

/**
 * Get all organizations the current user has access to
 */
export const myOrganizations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return []; // Return empty array if user not found
    }

    return await getUserOrganizations(ctx, user._id);
  },
});

/**
 * Get organization details by ID
 */
export const getById = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.union(organizationValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Return null if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null; // Return null if user not found
    }

    // Verify user has access to this organization
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      user._id,
    );

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      return null;
    }

    // Get organization with additional details
    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const memberCount = memberships.length;
    const userMembership = memberships.find((m) => m.userId === user._id);

    return {
      ...normalizeOrgForValidator(organization),
      memberCount,
      userRole: userMembership?.role ?? "viewer",
    };
  },
});

/**
 * Get organization by slug (public)
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(organizationValidator, v.null()),
  handler: async (ctx, args) => {
    // No authentication required for public organizations
    const org = await getOrganizationBySlug(ctx, args.slug);
    return org ? normalizeOrgForValidator(org) : null;
  },
});

/**
 * Get organization by custom domain (public)
 */
export const getByCustomDomain = query({
  args: {
    hostname: v.string(),
  },
  returns: v.union(organizationValidator, v.null()),
  handler: async (ctx, args) => {
    const normalized = args.hostname
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
    if (!normalized) return null;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_customDomain", (q) => q.eq("customDomain", normalized))
      .unique();
    if (!org) return null;
    // Only allow routing to verified custom domains.
    // Back-compat: orgs that predate domain verification may not have customDomainStatus set.
    if (org.customDomainStatus && org.customDomainStatus !== "verified") {
      return null;
    }
    return normalizeOrgForValidator(org);
  },
});

/**
 * Get current user's plan details
 */
export const getUserPlanDetails = query({
  args: {},
  returns: v.union(planValidator, v.null()),
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Return null if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null; // Return null if user not found
    }

    return await getUserPlan(ctx, user._id);
  },
});

/**
 * Get all available plans (public data)
 */
export const getPlans = query({
  args: {},
  returns: v.array(planValidator),
  handler: async (ctx, _args) => {
    return (await ctx.runQuery(
      components.launchthat_ecommerce.plans.queries.getPlans as any,
      { isActive: true },
    )) as any;
  },
});

/**
 * Check if current user can create a new organization
 */
export const canCreateOrganization = query({
  args: {},
  returns: planLimitResultValidator,
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        canCreate: false,
        reason: "Not authenticated",
        currentCount: 0,
        maxAllowed: 1,
        planName: "None",
      };
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return {
        canCreate: false,
        reason: "User not found",
        currentCount: 0,
        maxAllowed: 1,
        planName: "None",
      };
    }

    // Get user's plan
    if (!user.planId) {
      return {
        canCreate: false,
        reason: "No plan assigned",
        currentCount: 0,
        maxAllowed: 1,
        planName: "None",
      };
    }

    const plan = (await ctx.runQuery(
      components.launchthat_ecommerce.plans.queries.getPlanById as any,
      { planId: String(user.planId) },
    )) as any | null;
    if (!plan) {
      return {
        canCreate: false,
        reason: "Plan not found",
        currentCount: 0,
        maxAllowed: 1,
        planName: "None",
      };
    }

    // Count current organizations owned by user
    const currentOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const currentCount = currentOrgs.length;
    const maxAllowed = plan.maxOrganizations;
    const canCreate = maxAllowed === -1 || currentCount < maxAllowed;

    return {
      canCreate,
      currentCount,
      maxAllowed,
      planName: plan.displayName,
      reason: canCreate ? undefined : "Organization limit reached",
    };
  },
});

/**
 * Search organizations (for admins or public orgs)
 */
export const searchOrganizations = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(organizationValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return []; // Return empty array if user not found
    }

    const limit = args.limit ?? 10;

    // Search in public organizations or user-owned ones
    const organizations = await ctx.db
      .query("organizations")
      .filter((q) =>
        q.or(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("ownerId"), user._id),
        ),
      )
      .take(limit);

    // Filter by search query
    return organizations
      .filter(
        (org) =>
          org.name.toLowerCase().includes(args.query.toLowerCase()) ||
          org.description?.toLowerCase().includes(args.query.toLowerCase()),
      )
      .map((org) => normalizeOrgForValidator(org));
  },
});

/**
 * Get organization members
 */
export const getOrganizationMembers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(organizationMemberValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return []; // Return empty array if user not found
    }

    // Verify user has access to this organization
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      user._id,
      ["owner", "admin", "editor"],
    );

    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user details for each member
    const members = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        members.push({
          ...membership,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        });
      }
    }

    return members;
  },
});

/**
 * Get pending invitations for an organization
 */
export const getPendingInvitations = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(organizationInvitationValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array if not authenticated
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return []; // Return empty array if user not found
    }

    // Only admins can see pending invitations
    await verifyOrganizationAccess(ctx, args.organizationId, user._id, [
      "owner",
      "admin",
    ]);

    return await ctx.db
      .query("organizationInvitations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

/**
 * Get invitation details by token (for accepting invitations)
 */
export const getInvitationByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(v.null(), organizationInvitationValidator),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("organizationInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation || invitation.status !== "pending") {
      return null;
    }

    if (invitation.expiresAt < Date.now()) {
      return null;
    }

    // Get organization details
    const organization = await ctx.db.get(invitation.organizationId);
    if (!organization) {
      return null;
    }

    // Get inviter details
    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      ...invitation,
      organization: {
        name: organization.name,
        description: organization.description,
        logo: organization.logo,
      },
      inviter: inviter
        ? {
            name: inviter.name,
            email: inviter.email,
          }
        : null,
    };
  },
});
