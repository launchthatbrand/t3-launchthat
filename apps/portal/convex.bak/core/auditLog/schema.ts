import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const auditLogsTable = defineTable({
  action: v.string(),
  resource: v.string(),
  resourceId: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  details: v.optional(v.record(v.string(), v.any())),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_action", ["action"])
  .index("by_resource", ["resource"])
  .index("by_userId", ["userId"])
  .index("by_timestamp", ["timestamp"]);

export const auditLogSchema = defineSchema({
  auditLogs: auditLogsTable,
});
