import { PORTAL_TENANT_SLUG } from "../../constants";
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const supportOrganizationIdValidator = v.union(
  v.id("organizations"),
  v.literal(PORTAL_TENANT_SLUG),
);

const supportMessagesTable = defineTable({
  organizationId: supportOrganizationIdValidator,
  sessionId: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
  contactId: v.optional(v.id("contacts")),
  contactEmail: v.optional(v.string()),
  contactName: v.optional(v.string()),
  agentUserId: v.optional(v.string()),
  agentName: v.optional(v.string()),
  source: v.optional(
    v.union(v.literal("agent"), v.literal("admin"), v.literal("system")),
  ),
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
  htmlBody: v.optional(v.string()),
  textBody: v.optional(v.string()),
})
  .index("by_session", ["organizationId", "sessionId"])
  .index("by_organization", ["organizationId"]);

const supportConversationsTable = defineTable({
  organizationId: supportOrganizationIdValidator,
  sessionId: v.string(),
  origin: v.union(v.literal("chat"), v.literal("email")),
  status: v.optional(
    v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
  ),
  mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
  subject: v.optional(v.string()),
  emailThreadId: v.optional(v.string()),
  inboundAlias: v.optional(v.string()),
  contactId: v.optional(v.id("contacts")),
  contactName: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  assignedAgentId: v.optional(v.string()),
  assignedAgentName: v.optional(v.string()),
  agentThreadId: v.optional(v.string()),
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
  organizationId: supportOrganizationIdValidator,
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

const ragFieldSelection = v.union(
  v.literal("title"),
  v.literal("excerpt"),
  v.literal("content"),
);

const supportRagSourcesTable = defineTable({
  organizationId: supportOrganizationIdValidator,
  sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
  postTypeSlug: v.string(),
  fields: v.array(ragFieldSelection),
  includeTags: v.boolean(),
  metaFieldKeys: v.optional(v.array(v.string())),
  additionalMetaKeys: v.optional(v.string()),
  displayName: v.optional(v.string()),
  isEnabled: v.boolean(),
  useCustomBaseInstructions: v.optional(v.boolean()),
  baseInstructions: v.optional(v.string()),
  lastIndexedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org_type", ["organizationId", "sourceType"])
  .index("by_org_postType", ["organizationId", "postTypeSlug"])
  .index("by_org_type_and_postTypeSlug", [
    "organizationId",
    "sourceType",
    "postTypeSlug",
  ]);

const supportRagIndexStatusTable = defineTable({
  organizationId: supportOrganizationIdValidator,
  sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
  postTypeSlug: v.string(),
  postId: v.string(),
  entryKey: v.string(),
  lastStatus: v.string(),
  lastAttemptAt: v.number(),
  lastSuccessAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
  lastEntryId: v.optional(v.string()),
  lastEntryStatus: v.optional(
    v.union(v.literal("pending"), v.literal("ready"), v.literal("replaced")),
  ),
})
  .index("by_org_post", ["organizationId", "postTypeSlug", "postId"])
  .index("by_org_entryKey", ["organizationId", "entryKey"]);

const supportAgentPresenceTable = defineTable({
  organizationId: supportOrganizationIdValidator,
  sessionId: v.string(),
  agentUserId: v.string(),
  agentName: v.string(),
  status: v.union(v.literal("typing"), v.literal("idle")),
  updatedAt: v.number(),
}).index("by_org_session", ["organizationId", "sessionId"]);

export const supportSchema = {
  supportMessages: supportMessagesTable,
  supportConversations: supportConversationsTable,
  supportEmailSettings: supportEmailSettingsTable,
  supportAgentPresence: supportAgentPresenceTable,
  supportRagSources: supportRagSourcesTable,
  supportRagIndexStatus: supportRagIndexStatusTable,
};
