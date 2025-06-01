import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define tables for the email parser application
const emailsTable = defineTable({
  subject: v.string(),
  sender: v.string(),
  receivedAt: v.number(),
  content: v.string(),
  userId: v.optional(v.string()),
  labels: v.optional(v.array(v.string())),
})
  .index("by_userId", ["userId"])
  .index("by_receivedAt", ["receivedAt"])
  .searchIndex("search_subject", { searchField: "subject" });

const templatesTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  userId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  isPublic: v.boolean(),
  currentVersion: v.optional(v.number()),
  versions: v.optional(
    v.array(
      v.object({
        id: v.number(),
        fields: v.array(
          v.object({
            name: v.string(),
            selector: v.string(),
            type: v.string(),
            config: v.optional(v.any()),
            previewValue: v.optional(v.string()),
          }),
        ),
        createdAt: v.number(),
      }),
    ),
  ),
})
  .index("by_userId", ["userId"])
  .index("by_isPublic", ["isPublic"]);

const templateVersionsTable = defineTable({
  templateId: v.id("templates"),
  versionNumber: v.number(),
  fields: v.array(
    v.object({
      name: v.string(),
      selector: v.string(),
      type: v.string(),
      config: v.optional(v.any()),
      previewValue: v.optional(v.string()),
    }),
  ),
  createdAt: v.number(),
})
  .index("by_templateId", ["templateId"])
  .index("by_templateId_versionNumber", ["templateId", "versionNumber"]);

const fieldsTable = defineTable({
  name: v.string(),
  value: v.string(),
  type: v.string(),
  emailId: v.id("emails"),
  userId: v.string(),
  createdAt: v.number(),
  config: v.optional(v.any()),
})
  .index("by_emailId", ["emailId"])
  .index("by_userId", ["userId"]);

const highlightsTable = defineTable({
  startIndex: v.number(),
  endIndex: v.number(),
  text: v.string(),
  emailId: v.id("emails"),
  userId: v.string(),
  createdAt: v.number(),
})
  .index("by_emailId", ["emailId"])
  .index("by_userId", ["userId"]);

const sharedResourcesTable = defineTable({
  resourceId: v.union(v.id("emails"), v.id("templates")),
  resourceType: v.string(),
  ownerId: v.string(),
  sharedWithUserId: v.string(),
  permissions: v.array(v.string()),
  createdAt: v.number(),
})
  .index("by_resourceId", ["resourceId"])
  .index("by_ownerId", ["ownerId"])
  .index("by_sharedWithUserId", ["sharedWithUserId"])
  .index("by_resourceType_sharedWithUserId", [
    "resourceType",
    "sharedWithUserId",
  ]);

const usersTable = defineTable({
  tokenIdentifier: v.string(),
  name: v.string(),
  email: v.string(),
  image: v.optional(v.string()),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_email", ["email"]);

export default defineSchema({
  emails: emailsTable,
  templates: templatesTable,
  templateVersions: templateVersionsTable,
  fields: fieldsTable,
  highlights: highlightsTable,
  sharedResources: sharedResourcesTable,
  users: usersTable,
});
