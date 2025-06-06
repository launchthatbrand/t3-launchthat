import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Simplified apps table with just the essential fields and indexes
export const appsTable = defineTable({
  name: v.string(),
  description: v.string(),
  type: v.string(),
  authType: v.union(
    v.literal("oauth2"),
    v.literal("apiKey"),
    v.literal("basic"),
    v.literal("none"),
  ),
})
  .index("by_name", ["name"])
  .index("by_type", ["type"]);

// Define a minimal schema with just the apps table
export const testSchema = defineSchema({
  apps: appsTable,
});

export default testSchema;
