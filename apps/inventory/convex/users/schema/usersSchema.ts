import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const usersTable = defineTable({
  name: v.optional(v.string()),
  email: v.string(),
  role: v.union(v.literal("admin"), v.literal("user")),
  // Field used by Convex built-in auth
  tokenIdentifier: v.optional(v.string()),
  // Username for mentions
  username: v.optional(v.string()),
  // Profile image URL
  image: v.optional(v.string()),
  // Monday.com specific fields
  mondayUserId: v.optional(v.string()),
  title: v.optional(v.string()),
  provider: v.optional(v.string()), // "monday", "clerk", etc.
  // Add other user profile fields as needed
})
  .index("by_email", ["email"])
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_monday_id", ["mondayUserId"]);

export const usersSchema = defineSchema({
  users: usersTable,
});
