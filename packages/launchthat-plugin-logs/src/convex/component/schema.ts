import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  logEntries: defineTable({
    organizationId: v.string(),

    pluginKey: v.string(), // e.g. "core.emails", "discord", "ecommerce"
    kind: v.string(), // e.g. "email.sent", "discord.api"

    // Optional “subject” of the log entry when it relates to a user identity (e.g. emails).
    email: v.optional(v.string()),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
    ),

    // For workflow-ish logs (optional)
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("running"),
        v.literal("complete"),
        v.literal("failed"),
      ),
    ),

    message: v.string(),
    actionUrl: v.optional(v.string()),

    scopeKind: v.optional(v.string()),
    scopeId: v.optional(v.string()),

    actorUserId: v.optional(v.string()),

    // Arbitrary extra data (provider ids, timings, error payloads, etc)
    metadata: v.optional(v.any()),

    createdAt: v.number(),
  })
    .index("by_organizationId_and_createdAt", ["organizationId", "createdAt"])
    .index("by_organizationId_and_email_and_createdAt", [
      "organizationId",
      "email",
      "createdAt",
    ])
    .index("by_organizationId_and_pluginKey_and_createdAt", [
      "organizationId",
      "pluginKey",
      "createdAt",
    ])
    .index("by_organizationId_and_kind_and_createdAt", [
      "organizationId",
      "kind",
      "createdAt",
    ])
    .index("by_organizationId_and_level_and_createdAt", [
      "organizationId",
      "level",
      "createdAt",
    ])
    .index("by_organizationId_and_status_and_createdAt", [
      "organizationId",
      "status",
      "createdAt",
    ]),
});
