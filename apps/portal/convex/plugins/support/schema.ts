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
})
  .index("by_session", ["organizationId", "sessionId"])
  .index("by_organization", ["organizationId"]);

export const supportSchema = {
  supportKnowledge: supportKnowledgeTable,
  supportMessages: supportMessagesTable,
};
