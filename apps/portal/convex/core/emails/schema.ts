import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Portal-native transactional email tables (Resend provider; global API key).
 *
 * Notes:
 * - Settings and templates are org-scoped.
 * - Outbox is an append-only delivery log (status transitions via internal actions).
 */

export const emailSettingsTable = defineTable({
  orgId: v.id("organizations"),
  provider: v.literal("resend"),
  fromName: v.string(),
  fromEmail: v.string(),
  // Sender selection: portal domain (default) vs org's verified domain.
  // Optional for back-compat; will be backfilled on next save.
  fromMode: v.optional(v.union(v.literal("portal"), v.literal("custom"))),
  fromLocalPart: v.optional(v.string()),
  // Org-wide React Email design theme
  designKey: v.optional(
    v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
  ),
  replyToEmail: v.optional(v.string()),
  enabled: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.id("users")),
}).index("by_org", ["orgId"]);

export const emailTemplatesTable = defineTable({
  orgId: v.id("organizations"),
  templateKey: v.string(),
  // Overrides (React Email only)
  subjectOverride: v.optional(v.string()),
  copyOverrides: v.optional(v.record(v.string(), v.string())),
  // Optional per-template design override (otherwise inherits org design)
  designOverrideKey: v.optional(
    v.union(
      v.literal("inherit"),
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
  ),
  // Legacy fields kept temporarily for migration (no longer rendered as markdown)
  subject: v.optional(v.string()),
  markdownBody: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.id("users")),
}).index("by_org_and_key", ["orgId", "templateKey"]);

export const emailOutboxTable = defineTable({
  orgId: v.id("organizations"),
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
  .index("by_org_and_status", ["orgId", "status"]);

export const emailsSchema = {
  emailSettings: emailSettingsTable,
  emailTemplates: emailTemplatesTable,
  emailOutbox: emailOutboxTable,
};

