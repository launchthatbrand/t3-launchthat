import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const marketingTagsTable = defineTable({
  organizationId: v.optional(v.string()),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  color: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  slug: v.optional(v.string()),
})
  .index("by_org", ["organizationId"])
  .index("by_org_and_slug", ["organizationId", "slug"])
  .index("by_slug", ["slug"])
  .index("by_name", ["name"]);

const contactMarketingTagsTable = defineTable({
  organizationId: v.optional(v.string()),
  contactId: v.id("contacts"),
  marketingTagId: v.id("marketingTags"),
  source: v.optional(v.string()),
  assignedBy: v.optional(v.string()),
  assignedAt: v.number(),
  expiresAt: v.optional(v.number()),
  notes: v.optional(v.string()),
})
  .index("by_org", ["organizationId"])
  .index("by_contact", ["contactId"])
  .index("by_tag", ["marketingTagId"])
  .index("by_contact_tag", ["contactId", "marketingTagId"])
  .index("by_org_and_contact", ["organizationId", "contactId"])
  .index("by_org_and_contact_tag", [
    "organizationId",
    "contactId",
    "marketingTagId",
  ]);

const contactsTable = defineTable({
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  // Plugin-defined post statuses (e.g. "sent", "signed") are stored here as well.
  status: v.string(),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featuredImageUrl: v.optional(v.string()),
  postTypeSlug: v.string(),
  organizationId: v.optional(v.string()),
  authorId: v.optional(v.string()),
  userId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_postTypeSlug", ["postTypeSlug"])
  .index("by_org", ["organizationId"])
  .index("by_org_slug", ["organizationId", "slug"])
  .index("by_org_postTypeSlug", ["organizationId", "postTypeSlug"])
  .index("by_userId", ["userId"])
  .index("by_org_and_userId", ["organizationId", "userId"]);

const contactMetaTable = defineTable({
  contactId: v.id("contacts"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_contact", ["contactId"])
  .index("by_contact_and_key", ["contactId", "key"]);

export default defineSchema({
  marketingTags: marketingTagsTable,
  contactMarketingTags: contactMarketingTagsTable,
  contacts: contactsTable,
  contact_meta: contactMetaTable,
});
