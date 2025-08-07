import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const rolesTable = defineTable({
  name: v.string(),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  permissions: v.optional(v.array(v.id("permissions"))),
  isSystem: v.boolean(),
  isDefault: v.optional(v.boolean()),
  // Backwards compatibility with existing data
  isAssignable: v.optional(v.boolean()),
  priority: v.optional(v.number()),
  scope: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_isSystem", ["isSystem"]);

export const rolesSchema = defineSchema({
  roles: rolesTable,
});
