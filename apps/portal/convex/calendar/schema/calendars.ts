import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  color: v.optional(v.string()), // Default display color for events

  // Ownership
  ownerId: v.id("users"), // Calendar owner
  ownerType: v.union(
    v.literal("user"), // Personal calendar
    v.literal("group"), // Group calendar
    v.literal("course"), // Course calendar
    v.literal("organization"), // Organization calendar
  ),

  // Related entities
  groupId: v.optional(v.id("groups")), // If owner type is group
  courseId: v.optional(v.id("courses")), // If owner type is course
  organizationId: v.optional(v.id("organizations")), // If owner type is organization

  // Visibility and sharing
  isDefault: v.optional(v.boolean()), // Is this the default calendar
  isPublic: v.optional(v.boolean()), // Publicly visible

  // Administrative
  createdAt: v.number(), // Creation timestamp
  updatedAt: v.optional(v.number()), // Last update timestamp
})
  .index("by_owner", ["ownerId", "ownerType"])
  .index("by_group", ["groupId"])
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"]);
