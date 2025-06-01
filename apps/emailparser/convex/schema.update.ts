import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * This is an update to the existing schema to add Gmail-specific fields
 * This should be merged into the main schema.ts file
 */

// Update the emails table to include Gmail-specific fields
const emailsTable = defineTable({
  userId: v.string(),
  labels: v.optional(v.array(v.string())),
  subject: v.string(),
  sender: v.string(),
  receivedAt: v.number(),
  content: v.string(),
  // Gmail specific fields
  gmailId: v.optional(v.string()),
  threadId: v.optional(v.string()),
  // Fields for tracking sync status
  lastSynced: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_and_time", ["userId", "receivedAt"])
  .index("by_gmail_id", ["gmailId"]);

// Define a table for Gmail user settings
const gmailSettingsTable = defineTable({
  userId: v.string(),
  lastSyncTime: v.optional(v.number()),
  syncEnabled: v.boolean(),
  syncFrequency: v.number(), // in minutes
  selectedLabels: v.optional(v.array(v.string())),
  maxEmailsPerSync: v.number(),
}).index("by_user", ["userId"]);

// Define a table for Gmail labels
const gmailLabelsTable = defineTable({
  userId: v.string(),
  labelId: v.string(),
  name: v.string(),
  type: v.string(), // "system" or "user"
  messagesTotal: v.optional(v.number()),
  messagesUnread: v.optional(v.number()),
  color: v.optional(v.string()),
  selected: v.boolean(), // Whether this label is selected for syncing
})
  .index("by_user", ["userId"])
  .index("by_user_and_label", ["userId", "labelId"]);

// Define a table for sync jobs
const gmailSyncJobsTable = defineTable({
  userId: v.string(),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  status: v.string(), // "running", "completed", "failed"
  emailsProcessed: v.number(),
  error: v.optional(v.string()),
  labelIds: v.optional(v.array(v.string())),
})
  .index("by_user", ["userId"])
  .index("by_user_and_status", ["userId", "status"]);

// Define a table for email parsing templates
const templatesTable = defineTable({
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  fields: v.array(
    v.object({
      name: v.string(),
      type: v.string(), // "text", "date", "number", "currency", "boolean", "list"
      required: v.boolean(),
      description: v.optional(v.string()),
      extractionRules: v.optional(
        v.object({
          // For regex extraction
          regex: v.optional(v.string()),
          flags: v.optional(v.string()),
          group: v.optional(v.number()),

          // For position-based extraction
          before: v.optional(v.string()),
          after: v.optional(v.string()),
          maxLength: v.optional(v.number()),

          // For boolean extraction
          contains: v.optional(v.string()),

          // For list extraction
          itemPrefix: v.optional(v.string()),
        }),
      ),
    }),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_name", ["userId", "name"]);

// Define a table for parsed results
const parsedResultsTable = defineTable({
  userId: v.string(),
  emailId: v.id("emails"),
  templateId: v.optional(v.id("templates")),
  data: v.any(), // Extracted data
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_email", ["emailId"]);

export default {
  emailsTable,
  gmailSettingsTable,
  gmailLabelsTable,
  gmailSyncJobsTable,
  templatesTable,
  parsedResultsTable,
};
