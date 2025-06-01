import { ConvexError, v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Batch import emails
export const importEmails = mutation({
  args: {
    emails: v.array(
      v.object({
        subject: v.string(),
        sender: v.string(),
        receivedAt: v.optional(v.number()),
        content: v.string(),
        labels: v.optional(v.array(v.string())),
      }),
    ),
  },
  returns: v.array(v.id("emails")),
  handler: async (ctx, args) => {
    try {
      // Require authentication for importing emails
      const userId = await requireUser(ctx);

      const { emails } = args;
      const now = Date.now();
      const emailIds: Id<"emails">[] = [];

      // Insert each email
      for (const email of emails) {
        const emailId = await ctx.db.insert("emails", {
          ...email,
          userId,
          receivedAt: email.receivedAt ?? now,
        });
        emailIds.push(emailId);
      }

      return emailIds;
    } catch (error) {
      console.error("Error in batch import emails:", error);
      throw error;
    }
  },
});

// Batch import templates
export const importTemplates = mutation({
  args: {
    templates: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
        fields: v.optional(
          v.array(
            v.object({
              name: v.string(),
              description: v.optional(v.string()),
              order: v.optional(v.number()),
            }),
          ),
        ),
      }),
    ),
  },
  returns: v.array(v.id("templates")),
  handler: async (ctx, args) => {
    try {
      // Require authentication for importing templates
      const userId = await requireUser(ctx);

      const { templates } = args;
      const now = Date.now();
      const templateIds: Id<"templates">[] = [];

      // Insert each template and its fields
      for (const template of templates) {
        const { fields, ...templateData } = template;

        // Insert the template
        const templateId = await ctx.db.insert("templates", {
          ...templateData,
          userId,
          createdAt: now,
          updatedAt: now,
          isPublic: template.isPublic ?? false,
        });

        // Insert fields if provided
        if (fields && fields.length > 0) {
          for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            await ctx.db.insert("fields", {
              name: field.name,
              description: field.description,
              templateId,
              order: field.order ?? i,
            });
          }
        }

        templateIds.push(templateId);
      }

      return templateIds;
    } catch (error) {
      console.error("Error in batch import templates:", error);
      throw error;
    }
  },
});

// Batch delete emails
export const deleteEmails = mutation({
  args: {
    emailIds: v.array(v.id("emails")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    try {
      // Require authentication for batch deleting emails
      const userId = await requireUser(ctx);

      const { emailIds } = args;
      let deletedCount = 0;

      // Delete each email if it belongs to the user
      for (const emailId of emailIds) {
        const email = await ctx.db.get(emailId);

        // Skip if email doesn't exist
        if (!email) {
          continue;
        }

        // Skip if email doesn't belong to the user
        if (email.userId !== userId) {
          continue;
        }

        // Delete the email
        await ctx.db.delete(emailId);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error("Error in batch delete emails:", error);
      throw error;
    }
  },
});

// Batch delete templates
export const deleteTemplates = mutation({
  args: {
    templateIds: v.array(v.id("templates")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    try {
      // Require authentication for batch deleting templates
      const userId = await requireUser(ctx);

      const { templateIds } = args;
      let deletedCount = 0;

      // Delete each template and its fields if it belongs to the user
      for (const templateId of templateIds) {
        const template = await ctx.db.get(templateId);

        // Skip if template doesn't exist
        if (!template) {
          continue;
        }

        // Skip if template doesn't belong to the user
        if (template.userId !== userId) {
          continue;
        }

        // Find and delete all associated fields
        const fields = await ctx.db
          .query("fields")
          .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
          .collect();

        for (const field of fields) {
          await ctx.db.delete(field._id);
        }

        // Delete the template
        await ctx.db.delete(templateId);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error("Error in batch delete templates:", error);
      throw error;
    }
  },
});

// Batch update emails (e.g., adding labels)
export const updateEmails = mutation({
  args: {
    emailIds: v.array(v.id("emails")),
    update: v.object({
      labels: v.optional(v.array(v.string())),
    }),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    try {
      // Require authentication for batch updating emails
      const userId = await requireUser(ctx);

      const { emailIds, update } = args;
      let updatedCount = 0;

      // Update each email if it belongs to the user
      for (const emailId of emailIds) {
        const email = await ctx.db.get(emailId);

        // Skip if email doesn't exist
        if (!email) {
          continue;
        }

        // Skip if email doesn't belong to the user
        if (email.userId !== userId) {
          continue;
        }

        // Update the email
        await ctx.db.patch(emailId, update);
        updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error("Error in batch update emails:", error);
      throw error;
    }
  },
});

// Export templates with their fields
export const exportTemplates = query({
  args: {
    templateIds: v.array(v.id("templates")),
  },
  returns: v.array(
    v.object({
      _id: v.id("templates"),
      name: v.string(),
      description: v.optional(v.string()),
      isPublic: v.boolean(),
      fields: v.array(
        v.object({
          _id: v.id("fields"),
          name: v.string(),
          description: v.optional(v.string()),
          order: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      // Get the authenticated user's ID
      const userId = await requireUser(ctx);

      const { templateIds } = args;
      const result = [];

      // Get each template with its fields
      for (const templateId of templateIds) {
        const template = await ctx.db.get(templateId);

        // Skip if template doesn't exist
        if (!template) {
          continue;
        }

        // Skip if template doesn't belong to the user and is not public
        if (template.userId !== userId && !template.isPublic) {
          continue;
        }

        // Get all fields for the template
        const fields = await ctx.db
          .query("fields")
          .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
          .order("asc")
          .collect();

        // Add to result
        result.push({
          _id: template._id,
          name: template.name,
          description: template.description,
          isPublic: template.isPublic,
          fields,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in export templates:", error);
      throw error;
    }
  },
});

// Batch apply template to multiple emails
export const applyTemplateToEmails = mutation({
  args: {
    templateId: v.id("templates"),
    emailIds: v.array(v.id("emails")),
  },
  returns: v.array(v.id("parsedResults")),
  handler: async (ctx, args) => {
    try {
      // Require authentication
      const userId = await requireUser(ctx);

      const { templateId, emailIds } = args;
      const now = Date.now();
      const resultIds: Id<"parsedResults">[] = [];

      // Check if the template exists
      const template = await ctx.db.get(templateId);
      if (!template) {
        throw new ConvexError(`Template with ID ${templateId} not found`);
      }

      // Process each email
      for (const emailId of emailIds) {
        const email = await ctx.db.get(emailId);

        // Skip if email doesn't exist
        if (!email) {
          continue;
        }

        // Skip if email doesn't belong to the user
        if (email.userId && email.userId !== userId) {
          continue;
        }

        // Create a new parsed result with "processing" status
        const parsedResultId = await ctx.db.insert("parsedResults", {
          templateId,
          emailId,
          userId,
          result: "{}",
          createdAt: now,
          status: "processing",
        });

        resultIds.push(parsedResultId);
      }

      return resultIds;
    } catch (error) {
      console.error("Error in apply template to emails:", error);
      throw error;
    }
  },
});

// Duplicate a template with all its fields
export const duplicateTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    newName: v.optional(v.string()),
  },
  returns: v.id("templates"),
  handler: async (ctx, args) => {
    try {
      // Require authentication
      const userId = await requireUser(ctx);

      const { templateId, newName } = args;

      // Get the template to duplicate
      const template = await ctx.db.get(templateId);
      if (!template) {
        throw new ConvexError(`Template with ID ${templateId} not found`);
      }

      // Check if user has access to the template
      if (template.userId !== userId && !template.isPublic) {
        throw new ConvexError(
          "You don't have permission to duplicate this template",
        );
      }

      const now = Date.now();

      // Create the new template
      const newTemplateId = await ctx.db.insert("templates", {
        name: newName ?? `${template.name} (copy)`,
        description: template.description,
        userId,
        createdAt: now,
        updatedAt: now,
        isPublic: false, // Default to private for duplicated templates
      });

      // Get all fields from the original template
      const fields = await ctx.db
        .query("fields")
        .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
        .order("asc")
        .collect();

      // Create duplicate fields for the new template
      for (const field of fields) {
        await ctx.db.insert("fields", {
          name: field.name,
          description: field.description,
          templateId: newTemplateId,
          order: field.order,
        });
      }

      return newTemplateId;
    } catch (error) {
      console.error("Error in duplicate template:", error);
      throw error;
    }
  },
});
