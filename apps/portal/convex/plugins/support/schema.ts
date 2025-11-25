import { defineTable } from "convex/server";
import { v } from "convex/values";

const supportKnowledgeTable = defineTable({
  organizationId: v.id("organizations"),
  title: v.string(),
  slug: v.string(),
  content: v.string(),
  tags: v.optional(v.array(v.string())),
  type: v.optional(v.string()),
  matchMode: v.optional(
    v.union(v.literal("contains"), v.literal("exact"), v.literal("regex")),
  ),
  matchPhrases: v.optional(v.array(v.string())),
  priority: v.optional(v.number()),
  isActive: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_slug", ["organizationId", "slug"]);

const supportMessagesTable = defineTable({
  organizationId: v.id("organizations"),
  sessionId: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
  contactId: v.optional(v.id("contacts")),
  contactEmail: v.optional(v.string()),
  contactName: v.optional(v.string()),
  messageType: v.optional(
    v.union(
      v.literal("chat"),
      v.literal("email_inbound"),
      v.literal("email_outbound"),
    ),
  ),
  subject: v.optional(v.string()),
  emailMessageId: v.optional(v.string()),
  inReplyToId: v.optional(v.string()),
  attachments: v.optional(v.array(v.id("_storage"))),
})
  .index("by_session", ["organizationId", "sessionId"])
  .index("by_organization", ["organizationId"]);

const supportConversationsTable = defineTable({
  organizationId: v.id("organizations"),
  sessionId: v.string(),
  origin: v.union(v.literal("chat"), v.literal("email")),
  status: v.optional(
    v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
  ),
  subject: v.optional(v.string()),
  emailThreadId: v.optional(v.string()),
  inboundAlias: v.optional(v.string()),
  contactId: v.optional(v.id("contacts")),
  contactName: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  lastMessageSnippet: v.optional(v.string()),
  lastMessageAuthor: v.optional(
    v.union(v.literal("user"), v.literal("assistant")),
  ),
  firstMessageAt: v.number(),
  lastMessageAt: v.number(),
  totalMessages: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_org_session", ["organizationId", "sessionId"]);

const dnsRecordValidator = v.object({
  type: v.string(),
  host: v.string(),
  value: v.string(),
});

const supportEmailSettingsTable = defineTable({
  organizationId: v.id("organizations"),
  defaultAlias: v.string(),
  defaultAliasLocalPart: v.string(),
  allowEmailIntake: v.boolean(),
  customDomain: v.optional(v.string()),
  resendDomainId: v.optional(v.string()),
  verificationStatus: v.optional(
    v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed"),
    ),
  ),
  dnsRecords: v.optional(v.array(dnsRecordValidator)),
  lastSyncedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_alias_local_part", ["defaultAliasLocalPart"]);

export const supportSchema = {
  supportKnowledge: supportKnowledgeTable,
  supportMessages: supportMessagesTable,
  supportConversations: supportConversationsTable,
  supportEmailSettings: supportEmailSettingsTable,
};
