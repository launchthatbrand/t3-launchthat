import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Simple test table for integration module registration
export const testTable = defineTable({
  name: v.string(),
  description: v.string(),
}).index("by_name", ["name"]);

export default defineSchema({
  test: testTable,
});
