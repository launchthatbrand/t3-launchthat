import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define a simple test schema
export default defineSchema({
  test: defineTable({
    name: v.string(),
    value: v.number(),
  }),
});
