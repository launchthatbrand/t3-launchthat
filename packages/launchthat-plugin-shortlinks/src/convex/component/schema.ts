import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared shortlinks schema.
 *
 * Design decision:
 * - Shortlinks must store only relative app paths (no protocol/host).
 * - Cross-app routing is handled by the mounting app (via `appKey` + settings).
 */
export default defineSchema({
  shortlinks: defineTable({
    code: v.string(),
    appKey: v.string(),
    path: v.string(),
    // Use empty string to represent "unset" so we can safely index these fields.
    kind: v.string(),
    targetId: v.string(),
    createdAt: v.number(),
    createdByUserId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),

    // Optional analytics.
    clickCount: v.optional(v.number()),
    lastAccessAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_appKey_and_code", ["appKey", "code"])
    .index("by_appKey_and_path", ["appKey", "path"])
    .index("by_appKey_and_kind_and_targetId", ["appKey", "kind", "targetId"]),

  shortlinkSettings: defineTable({
    appKey: v.string(),
    domain: v.string(),
    enabled: v.boolean(),
    codeLength: v.number(),
    alphabet: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedByUserId: v.optional(v.string()),
  }).index("by_appKey", ["appKey"]),
});

