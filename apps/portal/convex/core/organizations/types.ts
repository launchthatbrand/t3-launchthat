import type { Doc, Id } from "@/convex/_generated/dataModel";
/**
 * Organizations Type Definitions
 *
 * TypeScript types and Convex validators for organizations feature.
 */
import { v } from "convex/values";

// Plan types
export const planValidator = v.object({
  _id: v.id("plans"),
  _creationTime: v.number(),
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
  features: v.optional(v.array(v.string())),
  isActive: v.boolean(),
  sortOrder: v.number(),
  updatedAt: v.number(),
});

// Organization types
export const organizationValidator = v.object({
  _id: v.id("organizations"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  ownerId: v.id("users"),
  logo: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  customDomain: v.optional(v.string()),
  isPublic: v.boolean(),
  allowSelfRegistration: v.boolean(),
  planId: v.optional(v.id("plans")),
  subscriptionStatus: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("unpaid"),
  ),
  subscriptionId: v.optional(v.string()),
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  updatedAt: v.number(),
  // Optional computed fields that certain queries may append
  memberCount: v.optional(v.number()),
  userRole: v.optional(
    v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
  ),
});

// User organization relationship types
export const userOrganizationValidator = v.object({
  _id: v.id("userOrganizations"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
  ),
  permissions: v.optional(v.array(v.string())),
  isActive: v.boolean(),
  invitedBy: v.optional(v.id("users")),
  invitedAt: v.optional(v.number()),
  joinedAt: v.number(),
  customerData: v.optional(
    v.object({
      accessGrantedBy: v.id("users"),
      accessType: v.union(
        v.literal("product_purchase"),
        v.literal("course_enrollment"),
        v.literal("manual_grant"),
      ),
      accessSourceId: v.optional(v.union(v.id("products"), v.id("courses"))),
      expiresAt: v.optional(v.number()),
      purchaseDate: v.optional(v.number()),
      metadata: v.optional(v.any()), // Keep as any for flexible metadata
    }),
  ),
});

// Organization invitation types
export const organizationInvitationValidator = v.object({
  _id: v.id("organizationInvitations"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  email: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
  ),
  invitedBy: v.id("users"),
  token: v.string(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedBy: v.optional(v.id("users")),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked"),
  ),
});

// Organization settings types
export const organizationSettingValidator = v.object({
  _id: v.id("organizationSettings"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  key: v.string(),
  value: v.any(), // Keep as any for flexible setting values
  category: v.optional(v.string()),
  description: v.optional(v.string()),
  isPublic: v.optional(v.boolean()),
  updatedBy: v.id("users"),
  updatedAt: v.number(),
});

// Enhanced organization with user role information
export const organizationWithRoleValidator = v.object({
  _id: v.id("organizations"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  ownerId: v.id("users"),
  logo: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  customDomain: v.optional(v.string()),
  isPublic: v.boolean(),
  allowSelfRegistration: v.boolean(),
  planId: v.optional(v.id("plans")),
  subscriptionStatus: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("unpaid"),
  ),
  subscriptionId: v.optional(v.string()),
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  updatedAt: v.number(),
  // Additional role information
  userRole: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
  ),
  userPermissions: v.optional(v.array(v.string())),
  isActive: v.boolean(),
});

// Member information for organization member list
export const organizationMemberValidator = v.object({
  _id: v.id("userOrganizations"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
  ),
  permissions: v.optional(v.array(v.string())),
  isActive: v.boolean(),
  invitedBy: v.optional(v.id("users")),
  invitedAt: v.optional(v.number()),
  joinedAt: v.number(),
  updatedAt: v.number(),
  // User information
  user: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
  }),
});

// TypeScript interfaces (for better development experience)
export type PlanDoc = Doc<"plans">;
export type OrganizationDoc = Doc<"organizations">;
export type UserOrganizationDoc = Doc<"userOrganizations">;
export type OrganizationInvitationDoc = Doc<"organizationInvitations">;
export type OrganizationSettingDoc = Doc<"organizationSettings">;

// Enhanced types with computed fields
export interface OrganizationWithRole extends OrganizationDoc {
  userRole: UserOrganizationDoc["role"];
  userPermissions?: string[];
  isActive: boolean;
}

export interface OrganizationMember extends UserOrganizationDoc {
  user: {
    _id: Id<"users">;
    name?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

// Plan limit check result type
export const planLimitResultValidator = v.object({
  canCreate: v.boolean(),
  reason: v.optional(v.string()),
  currentCount: v.number(),
  maxAllowed: v.number(),
  planName: v.string(),
});

export interface PlanLimitResult {
  canCreate: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
  planName: string;
}
