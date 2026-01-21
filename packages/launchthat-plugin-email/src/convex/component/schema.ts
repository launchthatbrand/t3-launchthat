import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared email schema (Resend provider) with org-scoped settings and domain verification state.
 *
 * Design decision:
 * - `organizations` and `users` are app-owned / live outside this component.
 * - Store cross-boundary identifiers (`orgId`, `updatedBy`, etc.) as strings.
 */
export default defineSchema({
  emailDomains: defineTable({
    orgId: v.string(),
    domain: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        value: v.string(),
      }),
    ),
    lastError: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"]),

  emailSettings: defineTable({
    orgId: v.string(),
    provider: v.literal("resend"),
    fromName: v.string(),
    // Sender selection: platform domain (default) vs org's verified domain.
    fromMode: v.union(v.literal("portal"), v.literal("custom")),
    fromLocalPart: v.string(),
    replyToEmail: v.optional(v.string()),
    designKey: v.optional(
      v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
    ),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_org", ["orgId"]),

  emailTemplates: defineTable({
    orgId: v.string(),
    templateKey: v.string(),
    subjectOverride: v.optional(v.string()),
    copyOverrides: v.optional(v.record(v.string(), v.string())),
    designOverrideKey: v.optional(
      v.union(
        v.literal("inherit"),
        v.literal("clean"),
        v.literal("bold"),
        v.literal("minimal"),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_org_and_key", ["orgId", "templateKey"]),

  emailOutbox: defineTable({
    orgId: v.string(),
    to: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    templateKey: v.optional(v.string()),
    subject: v.string(),
    htmlBody: v.string(),
    textBody: v.string(),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_org_and_createdAt", ["orgId", "createdAt"])
    .index("by_org_and_status", ["orgId", "status"]),
});

