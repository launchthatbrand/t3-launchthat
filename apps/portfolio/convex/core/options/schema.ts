import { defineTable } from "convex/server";
import { v } from "convex/values";

export const optionsTable = defineTable({
  metaKey: v.string(),
  metaValue: v.any(), // Can store strings, numbers, booleans, objects, arrays
  orgId: v.optional(v.id("organizations")), // Optional organization ID
  type: v.optional(v.union(v.literal("store"), v.literal("site"))), // store | site | undefined
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.string()), // Clerk user ID
  updatedBy: v.optional(v.string()), // Clerk user ID
})
  .index("by_meta_key", ["metaKey"])
  .index("by_org_and_type", ["orgId", "type"])
  .index("by_org_key_type", ["orgId", "metaKey", "type"])
  .index("by_type", ["type"]);

export const optionsSchema = {
  options: optionsTable,
};
