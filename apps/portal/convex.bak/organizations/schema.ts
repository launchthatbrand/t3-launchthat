import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Plans table - defines subscription tiers and organization limits
export const plansTable = defineTable({
  name: v.union(
    v.literal("free"),
    v.literal("starter"),
    v.literal("business"),
    v.literal("agency"),
  ),
  displayName: v.string(), // "Free", "Starter", "Business", "Agency"
  description: v.string(),
  maxOrganizations: v.number(), // 1, 1, 3, -1 (unlimited)
  priceMonthly: v.number(), // Price in cents (0, 2900, 9900, 19900)
  priceYearly: v.optional(v.number()), // Optional yearly pricing
  features: v.optional(v.array(v.string())), // Array of feature descriptions
  isActive: v.boolean(), // Whether this plan is available for new subscriptions
  sortOrder: v.number(), // For display ordering
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_name", ["name"])
  .index("by_active", ["isActive"])
  .index("by_sort_order", ["sortOrder"]);

// Organizations table - tenant containers for content
export const organizationsTable = defineTable({
  name: v.string(),
  slug: v.string(), // URL-friendly identifier
  description: v.optional(v.string()),
  ownerId: v.id("users"), // Creator who owns this organization

  // Branding and customization
  logo: v.optional(v.string()), // Logo URL or storage ID
  primaryColor: v.optional(v.string()), // Hex color for branding
  customDomain: v.optional(v.string()), // Custom domain if configured

  // Settings
  isPublic: v.boolean(), // Whether organization's content is publicly accessible
  allowSelfRegistration: v.boolean(), // Whether users can register themselves

  // Subscription and billing
  planId: v.optional(v.id("plans")), // Current plan (optional for admin-created orgs)
  subscriptionStatus: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("unpaid"),
  ),
  subscriptionId: v.optional(v.string()), // External subscription ID (Stripe, etc.)
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["ownerId"])
  .index("by_slug", ["slug"])
  .index("by_plan", ["planId"])
  .index("by_subscription_status", ["subscriptionStatus"])
  .index("by_public", ["isPublic"])
  .searchIndex("search_name", { searchField: "name" });

// User-Organization relationships table
export const userOrganizationsTable = defineTable({
  userId: v.id("users"),
  organizationId: v.id("organizations"),
  role: v.union(
    v.literal("owner"), // Full control, billing access
    v.literal("admin"), // Full access except billing
    v.literal("editor"), // Can create/edit content
    v.literal("viewer"), // Read-only access
    v.literal("student"), // Access to purchased courses/content
  ),

  // Access control
  permissions: v.optional(v.array(v.string())), // Granular permissions if needed
  isActive: v.boolean(),

  // Invitation tracking
  invitedBy: v.optional(v.id("users")), // Who invited this user
  invitedAt: v.optional(v.number()),
  joinedAt: v.number(), // When they accepted/joined

  // Customer relationship (for end customers purchasing products)
  customerData: v.optional(
    v.object({
      accessGrantedBy: v.id("users"), // Which admin granted access
      accessType: v.union(
        v.literal("product_purchase"), // Purchased a product
        v.literal("course_enrollment"), // Enrolled in a course
        v.literal("manual_grant"), // Manually granted by admin
      ),
      accessSourceId: v.optional(
        v.union(
          v.id("products"),
          v.id("courses"),
          v.string(), // For manual grants, could be a reason
        ),
      ),
      expiresAt: v.optional(v.number()), // For time-limited access
    }),
  ),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_organization", ["organizationId"])
  .index("by_user_organization", ["userId", "organizationId"])
  .index("by_organization_role", ["organizationId", "role"])
  .index("by_user_active", ["userId", "isActive"])
  .index("by_invited_by", ["invitedBy"]);

// Organization invitations table - for pending invites
export const organizationInvitationsTable = defineTable({
  organizationId: v.id("organizations"),
  email: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
  ),
  invitedBy: v.id("users"),
  token: v.string(), // Unique invitation token
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedBy: v.optional(v.id("users")),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked"),
  ),
  createdAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_email", ["email"])
  .index("by_token", ["token"])
  .index("by_status", ["status"])
  .index("by_invited_by", ["invitedBy"]);

// Organization settings table - for flexible configuration
export const organizationSettingsTable = defineTable({
  organizationId: v.id("organizations"),
  key: v.string(), // Setting key (e.g., "email_notifications", "course_completion_certificate")
  value: v.any(), // Setting value (JSON)
  category: v.optional(v.string()), // Category for grouping (e.g., "notifications", "branding")
  description: v.optional(v.string()),
  isPublic: v.optional(v.boolean()), // Whether this setting is visible to non-admins
  updatedBy: v.id("users"),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_key", ["organizationId", "key"])
  .index("by_category", ["category"]);

// Export schema
export const organizationsSchema = defineSchema({
  plans: plansTable,
  organizations: organizationsTable,
  userOrganizations: userOrganizationsTable,
  organizationInvitations: organizationInvitationsTable,
  organizationSettings: organizationSettingsTable,
});
