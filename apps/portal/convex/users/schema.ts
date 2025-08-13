/**
 * Users Schema
 *
 * Table definitions for the users feature.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

import { userSettingsTable } from "./settings/schema";

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

/**
 * User table schema
 */
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
  trialEndsAt: v.optional(v.number()), // Unix timestamp

  // Profile and personal information
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  phoneNumber: v.optional(v.string()),
  website: v.optional(v.string()),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  timezone: v.optional(v.string()),

  // Social media links
  socialLinks: v.optional(
    v.object({
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
    }),
  ),

  // User preferences
  preferences: v.optional(
    v.object({
      theme: v.optional(v.string()),
      language: v.optional(v.string()),
      emailNotifications: v.optional(v.boolean()),
      pushNotifications: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
    }),
  ),

  // User status and activity tracking
  lastActiveAt: v.optional(v.number()), // Unix timestamp
  isEmailVerified: v.optional(v.boolean()),
  isPhoneVerified: v.optional(v.boolean()),
  status: v.optional(
    v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("pending"),
      v.literal("deleted"),
    ),
  ),

  // Internal admin fields
  notes: v.optional(v.string()), // Admin notes about the user
  tags: v.optional(v.array(v.string())), // User tags for organization
  createdBy: v.optional(v.id("users")), // Admin who created this user
  lastModifiedBy: v.optional(v.id("users")), // Admin who last modified this user

  // Clerk specific fields
  clerkId: v.optional(v.string()),
  externalId: v.optional(v.string()),

  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  // Add indexes for common query patterns
  .index("by_email", ["email"])
  .index("by_token", ["tokenIdentifier"])
  .index("by_clerk_id", ["clerkId"])
  .index("by_username", ["username"])
  .index("by_organization", ["organizationId"])
  .index("by_plan", ["planId"])
  .index("by_customer_id", ["customerId"])
  .index("by_subscription_id", ["subscriptionId"])
  .index("by_status", ["status"])
  .index("by_role", ["role"])
  .index("by_last_active", ["lastActiveAt"])
  .index("by_created_at", ["createdAt"])
  .searchIndex("search_name_username", {
    searchField: "name",
    filterFields: ["name", "username"],
  });

// Export for use in main schema.ts
export const usersSchema = {
  users: usersTable,
  userSettings: userSettingsTable,
};
