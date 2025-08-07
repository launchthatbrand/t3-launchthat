import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Address object definition (for user addresses)
const addressObject = v.object({
  fullName: v.string(),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  city: v.string(),
  stateOrProvince: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phoneNumber: v.optional(v.string()),
});

export const usersTable = defineTable({
  name: v.optional(v.string()),
  email: v.string(),
  role: v.optional(v.string()), // Changed to optional string to allow any role name
  // Field used by Convex built-in auth
  tokenIdentifier: v.optional(v.string()),
  // Username for mentions
  username: v.optional(v.string()),
  // Profile image URL
  image: v.optional(v.string()),
  // User addresses for shipping/billing
  addresses: v.optional(v.array(addressObject)),

  // Organization and billing fields
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  planId: v.optional(v.id("plans")), // Current subscription plan
  customerId: v.optional(v.string()), // External customer ID (Stripe, etc.)
  subscriptionId: v.optional(v.string()), // External subscription ID
  subscriptionStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("unpaid"),
    ),
  ),
})
  .index("by_email", ["email"])
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_plan", ["planId"])
  .index("by_subscription_status", ["subscriptionStatus"]);

// Marketing Tags table - separate from content tags
export const marketingTagsTable = defineTable({
  name: v.string(), // Display name (e.g., "Premium Member", "Beta User")
  slug: v.string(), // URL-friendly slug (e.g., "premium-member", "beta-user")
  description: v.optional(v.string()), // Description of what this tag represents
  color: v.optional(v.string()), // Hex color for UI display (e.g., "#3B82F6")
  category: v.optional(v.string()), // Category for organization (e.g., "membership", "behavior", "demographics")
  isActive: v.optional(v.boolean()), // Whether this tag is currently active/available
  createdBy: v.id("users"), // Who created this tag
  createdAt: v.number(), // Timestamp
  updatedAt: v.optional(v.number()), // Last update timestamp
})
  .index("by_name", ["name"])
  .index("by_slug", ["slug"])
  .index("by_category", ["category"])
  .index("by_active", ["isActive"])
  .searchIndex("search_name", { searchField: "name" });

// User Marketing Tags relationship table
export const userMarketingTagsTable = defineTable({
  userId: v.id("users"), // Reference to user
  marketingTagId: v.id("marketingTags"), // Reference to marketing tag
  assignedBy: v.optional(v.id("users")), // Who assigned this tag (null for automated assignments)
  assignedAt: v.number(), // When the tag was assigned
  source: v.optional(v.string()), // How it was assigned ("manual", "automation", "import", etc.)
  expiresAt: v.optional(v.number()), // Optional expiration timestamp
  isActive: v.optional(v.boolean()), // Whether this tag assignment is currently active
  metadata: v.optional(v.any()), // Additional metadata about the assignment
})
  .index("by_user", ["userId"])
  .index("by_tag", ["marketingTagId"])
  .index("by_user_tag", ["userId", "marketingTagId"]) // Compound index for unique constraints
  .index("by_user_active", ["userId", "isActive"])
  .index("by_assigned_by", ["assignedBy"])
  .index("by_source", ["source"])
  .index("by_expires", ["expiresAt"]);

// Marketing Tag Rules table - for automation rules
export const marketingTagRulesTable = defineTable({
  name: v.string(), // Rule name (e.g., "Premium Course Completion")
  description: v.optional(v.string()), // Description of what triggers this rule
  marketingTagId: v.id("marketingTags"), // Tag to assign when rule is triggered
  triggerType: v.union(
    v.literal("course_completion"),
    v.literal("product_purchase"),
    v.literal("login_frequency"),
    v.literal("email_engagement"),
    v.literal("manual"), // For manual assignments
    v.literal("api"), // For API-based assignments
    v.literal("custom"), // For custom logic
  ),
  triggerConditions: v.any(), // JSON object with conditions specific to the trigger type
  action: v.union(
    v.literal("add"), // Add the tag
    v.literal("remove"), // Remove the tag
    v.literal("toggle"), // Toggle the tag
  ),
  isActive: v.optional(v.boolean()), // Whether this rule is currently active
  priority: v.optional(v.number()), // Priority order when multiple rules apply
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  lastTriggeredAt: v.optional(v.number()), // Last time this rule was triggered
})
  .index("by_tag", ["marketingTagId"])
  .index("by_trigger_type", ["triggerType"])
  .index("by_active", ["isActive"])
  .index("by_priority", ["priority"]);

export const usersSchema = defineSchema({
  users: usersTable,
  marketingTags: marketingTagsTable,
  userMarketingTags: userMarketingTagsTable,
  marketingTagRules: marketingTagRulesTable,
});
