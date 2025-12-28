import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const postsTable = defineTable({
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
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_postTypeSlug", ["postTypeSlug"])
  .index("by_org", ["organizationId"])
  .index("by_org_slug", ["organizationId", "slug"])
  .index("by_org_postTypeSlug", ["organizationId", "postTypeSlug"]);

const postsMetaTable = defineTable({
  postId: v.id("posts"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_post", ["postId"])
  .index("by_post_and_key", ["postId", "key"]);

const disclaimerIssuesTable = defineTable({
  organizationId: v.optional(v.string()),
  issuePostId: v.optional(v.id("posts")),
  templatePostId: v.id("posts"),
  templateVersion: v.number(),
  status: v.union(v.literal("incomplete"), v.literal("complete")),
  recipientUserId: v.optional(v.string()),
  recipientEmail: v.string(),
  recipientName: v.optional(v.string()),
  magicTokenHash: v.string(),
  lastSentAt: v.optional(v.number()),
  sendCount: v.number(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org_and_status", ["organizationId", "status"])
  .index("by_org_and_recipientEmail", ["organizationId", "recipientEmail"])
  .index("by_org_and_recipientUserId", ["organizationId", "recipientUserId"])
  .index("by_token_hash", ["magicTokenHash"])
  .index("by_org_template_and_recipientEmail", [
    "organizationId",
    "templatePostId",
    "recipientEmail",
  ]);

const disclaimerSignaturesTable = defineTable({
  organizationId: v.optional(v.string()),
  issueId: v.id("disclaimerIssues"),
  signedByUserId: v.optional(v.string()),
  signedName: v.string(),
  signedEmail: v.string(),
  signaturePngFileId: v.optional(v.id("_storage")),
  signedPdfFileId: v.id("_storage"),
  pdfSha256: v.string(),
  ip: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  consentText: v.string(),
  createdAt: v.number(),
}).index("by_org_and_issue", ["organizationId", "issueId"]);

export default defineSchema({
  posts: postsTable,
  postsMeta: postsMetaTable,
  disclaimerIssues: disclaimerIssuesTable,
  disclaimerSignatures: disclaimerSignaturesTable,
});
