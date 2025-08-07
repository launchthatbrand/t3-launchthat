import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";

// Template version interface
export const templateVersionValidator = v.object({
  version: v.number(),
  fields: v.array(
    v.object({
      name: v.string(),
      fieldId: v.id("fieldsStore"),
    }),
  ),
  createdAt: v.number(),
});

// List templates
export const list = query({
  args: {
    includePublic: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("templates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      isPublic: v.boolean(),
      currentVersion: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { includePublic = false } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      let templatesQuery = ctx.db.query("templates");

      if (userId) {
        // If userId is available, filter by that user
        templatesQuery = templatesQuery.filter((q) =>
          includePublic
            ? q.or(
                q.eq(q.field("userId"), userId),
                q.eq(q.field("isPublic"), true),
              )
            : q.eq(q.field("userId"), userId),
        );
      } else if (includePublic) {
        // If no userId, just get public templates
        templatesQuery = templatesQuery.filter((q) =>
          q.eq(q.field("isPublic"), true),
        );
      } else {
        // If unauthenticated and not including public, return empty array
        return [];
      }

      // Sort by update time (newest first)
      const templates = await templatesQuery.order("desc").collect();
      return templates;
    } catch (error) {
      console.error("Error in list templates:", error);
      throw error;
    }
  },
});

// Get a single template by ID
export const get = query({
  args: { id: v.id("templates") },
  returns: v.union(
    v.object({
      _id: v.id("templates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      isPublic: v.boolean(),
      currentVersion: v.optional(v.number()),
      versions: v.optional(v.array(templateVersionValidator)),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      const template = await ctx.db.get(args.id);

      // If template doesn't exist, return null
      if (!template) {
        return null;
      }

      // If template is public, allow access
      if (template.isPublic) {
        return template;
      }

      // If authenticated and template belongs to user, allow access
      if (userId && template.userId === userId) {
        return template;
      }

      // Otherwise, deny access
      return null;
    } catch (error) {
      console.error("Error in get template:", error);
      throw error;
    }
  },
});

// Create a new template
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    fields: v.optional(
      v.array(
        v.object({
          name: v.string(),
          fieldId: v.id("fieldsStore"),
        }),
      ),
    ),
  },
  returns: v.id("templates"),
  handler: async (ctx, args) => {
    try {
      const { name, description, isPublic = false, fields = [] } = args;

      // Require authentication for creating templates
      const userId = await requireUser(ctx);

      // Validate field names - must be unique
      const fieldNames = new Set();
      for (const field of fields) {
        if (fieldNames.has(field.name)) {
          throw new ConvexError(`Duplicate field name: ${field.name}`);
        }
        fieldNames.add(field.name);
      }

      // Check if fields exist and belong to the user
      for (const field of fields) {
        const fieldDoc = await ctx.db.get(field.fieldId);
        if (!fieldDoc) {
          throw new ConvexError(`Field with ID ${field.fieldId} not found`);
        }
        if (fieldDoc.userId !== userId) {
          throw new ConvexError(
            `You don't have permission to use field: ${field.name}`,
          );
        }
      }

      const now = Date.now();

      // Create versions array if fields are provided
      const versions =
        fields.length > 0
          ? [
              {
                version: 1,
                fields,
                createdAt: now,
              },
            ]
          : undefined;

      // Insert a new template into the database
      const templateId = await ctx.db.insert("templates", {
        name,
        description,
        userId,
        createdAt: now,
        updatedAt: now,
        isPublic,
        currentVersion: fields.length > 0 ? 1 : undefined,
        versions,
      });

      return templateId;
    } catch (error) {
      console.error("Error in create template:", error);
      throw error;
    }
  },
});

// Update an existing template
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.id("templates"),
  handler: async (ctx, args) => {
    try {
      const { id, ...updates } = args;

      // Require authentication for updating templates
      const userId = await requireUser(ctx);

      // Get the current template
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== userId) {
        throw new ConvexError(
          `You don't have permission to update this template.`,
        );
      }

      // Update the template with new values
      await ctx.db.patch(id, {
        ...updates,
        updatedAt: Date.now(),
      });

      return id;
    } catch (error) {
      console.error("Error in update template:", error);
      throw error;
    }
  },
});

// Update template fields and create a new version
export const updateFields = mutation({
  args: {
    id: v.id("templates"),
    fields: v.array(
      v.object({
        name: v.string(),
        fieldId: v.id("fieldsStore"),
      }),
    ),
  },
  returns: v.object({
    templateId: v.id("templates"),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      const { id, fields } = args;

      // Require authentication for updating templates
      const userId = await requireUser(ctx);

      // Get the current template
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== userId) {
        throw new ConvexError(
          `You don't have permission to update this template.`,
        );
      }

      // Validate field names - must be unique
      const fieldNames = new Set();
      for (const field of fields) {
        if (fieldNames.has(field.name)) {
          throw new ConvexError(`Duplicate field name: ${field.name}`);
        }
        fieldNames.add(field.name);
      }

      // Check if fields exist and belong to the user
      for (const field of fields) {
        const fieldDoc = await ctx.db.get(field.fieldId);
        if (!fieldDoc) {
          throw new ConvexError(`Field with ID ${field.fieldId} not found`);
        }
        if (fieldDoc.userId !== userId) {
          throw new ConvexError(
            `You don't have permission to use field: ${field.name}`,
          );
        }
      }

      const now = Date.now();

      // Calculate the next version number
      const currentVersion = template.currentVersion ?? 0;
      const nextVersion = currentVersion + 1;

      // Create a new version entry
      const newVersion = {
        version: nextVersion,
        fields,
        createdAt: now,
      };

      // Update the template with the new version
      await ctx.db.patch(id, {
        updatedAt: now,
        currentVersion: nextVersion,
        versions: [...(template.versions ?? []), newVersion],
      });

      return {
        templateId: id,
        version: nextVersion,
      };
    } catch (error) {
      console.error("Error in update template fields:", error);
      throw error;
    }
  },
});

// Get a specific version of a template
export const getVersion = query({
  args: {
    id: v.id("templates"),
    version: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      templateId: v.id("templates"),
      version: v.number(),
      fields: v.array(
        v.object({
          name: v.string(),
          fieldId: v.id("fieldsStore"),
        }),
      ),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const { id, version } = args;

      // Get the authenticated user's ID
      const userId = await getUser(ctx, true);

      // Get the template
      const template = await ctx.db.get(id);

      // If template doesn't exist, return null
      if (!template) {
        return null;
      }

      // Check access permissions
      const hasAccess =
        template.isPublic || (userId && template.userId === userId);
      if (!hasAccess) {
        return null;
      }

      // If no versions, return null
      if (!template.versions || template.versions.length === 0) {
        return null;
      }

      // Get the requested version or the current version
      const requestedVersion = version ?? template.currentVersion;
      if (!requestedVersion) {
        return null;
      }

      // Find the version in the versions array
      const versionData = template.versions.find(
        (v) => v.version === requestedVersion,
      );
      if (!versionData) {
        return null;
      }

      return {
        templateId: id,
        ...versionData,
      };
    } catch (error) {
      console.error("Error in get template version:", error);
      throw error;
    }
  },
});

// Generate JSON template from a template version
export const generateJson = query({
  args: {
    id: v.id("templates"),
    version: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      templateName: v.string(),
      version: v.number(),
      data: v.any(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const { id, version } = args;

      // Get the authenticated user's ID
      const userId = await getUser(ctx, true);

      // Get the template
      const template = await ctx.db.get(id);

      // If template doesn't exist, return null
      if (!template) {
        return null;
      }

      // Check access permissions
      const hasAccess =
        template.isPublic || (userId && template.userId === userId);
      if (!hasAccess) {
        return null;
      }

      // If no versions, return null
      if (!template.versions || template.versions.length === 0) {
        return null;
      }

      // Get the requested version or the current version
      const requestedVersion = version ?? template.currentVersion;
      if (!requestedVersion) {
        return null;
      }

      // Find the version in the versions array
      const versionData = template.versions.find(
        (v) => v.version === requestedVersion,
      );
      if (!versionData) {
        return null;
      }

      // Build the JSON template
      const jsonTemplate: Record<string, string> = {};

      // Fetch all field data
      for (const field of versionData.fields) {
        // Get the field document to get the highlightId
        const fieldDoc = await ctx.db.get(field.fieldId);
        if (!fieldDoc) {
          continue;
        }

        // Get the highlight to get the text
        const highlight = await ctx.db.get(fieldDoc.highlightId);
        if (!highlight) {
          continue;
        }

        // Add the field to the JSON template
        jsonTemplate[field.name] = highlight.text;
      }

      return {
        templateName: template.name,
        version: requestedVersion,
        data: jsonTemplate,
      };
    } catch (error) {
      console.error("Error generating JSON template:", error);
      throw error;
    }
  },
});

// Delete a template and its associated fields
export const remove = mutation({
  args: {
    id: v.id("templates"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Require authentication for deleting templates
      const userId = await requireUser(ctx);

      // Get the template to check if it exists
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== userId) {
        throw new ConvexError(
          `You don't have permission to delete this template.`,
        );
      }

      // Find all associated fields
      const fields = await ctx.db
        .query("fields")
        .withIndex("by_templateId", (q) => q.eq("templateId", id))
        .collect();

      // Delete all associated fields
      for (const field of fields) {
        await ctx.db.delete(field._id);
      }

      // Delete the template
      await ctx.db.delete(id);

      return true;
    } catch (error) {
      console.error("Error in delete template:", error);
      throw error;
    }
  },
});

// Switch to a different template version
export const switchVersion = mutation({
  args: {
    id: v.id("templates"),
    version: v.number(),
  },
  returns: v.object({
    templateId: v.id("templates"),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      const { id, version } = args;

      // Require authentication for switching template versions
      const userId = await requireUser(ctx);

      // Get the template to check if it exists
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== userId) {
        throw new ConvexError(
          `You don't have permission to modify this template.`,
        );
      }

      // Check if the requested version exists
      if (!template.versions?.some((v) => v.version === version)) {
        throw new ConvexError(
          `Version ${version} does not exist for this template.`,
        );
      }

      // Update the current version
      await ctx.db.patch(id, {
        currentVersion: version,
        updatedAt: Date.now(),
      });

      return {
        templateId: id,
        version: version,
      };
    } catch (error) {
      console.error("Error in switch template version:", error);
      throw error;
    }
  },
});

// Share template with other users
export const shareTemplate = mutation({
  args: {
    id: v.id("templates"),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id, userId, email, permissions } = args;

      // Require authentication for sharing templates
      const currentUserId = await requireUser(ctx);

      // Get the template to check if it exists
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== currentUserId) {
        throw new ConvexError(
          `You don't have permission to share this template.`,
        );
      }

      // Validate that either userId or email is provided
      if (!userId && !email) {
        throw new ConvexError(`Either userId or email is required.`);
      }

      let targetUserId = userId;

      // If email is provided, find the user by email
      if (email && !userId) {
        // Find user by email
        const users = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .collect();

        if (users.length === 0) {
          throw new ConvexError(`User with email ${email} not found.`);
        }

        targetUserId = users[0].userId;
      }

      // Make sure we're not sharing with ourselves
      if (targetUserId === currentUserId) {
        throw new ConvexError(`You cannot share a template with yourself.`);
      }

      // Check if sharing already exists
      const existingShare = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q
            .eq("resourceType", "templates")
            .eq("resourceId", id)
            .eq("sharedWithUserId", targetUserId!),
        )
        .first();

      if (existingShare) {
        // Update existing share
        await ctx.db.patch(existingShare._id, {
          permissions,
          // updatedAt field doesn't exist in the schema
        });
      } else if (targetUserId) {
        // Create new share
        await ctx.db.insert("sharedResources", {
          resourceType: "templates",
          resourceId: id,
          userId: currentUserId,
          sharedWithUserId: targetUserId,
          sharedAt: Date.now(),
          permissions,
        });
      } else {
        throw new ConvexError("Failed to determine target user for sharing.");
      }

      // Update the template's lastUpdated time
      await ctx.db.patch(id, {
        updatedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Error in share template:", error);
      throw error;
    }
  },
});

// Remove a share from a template
export const removeShare = mutation({
  args: {
    id: v.id("templates"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id, userId } = args;

      // Require authentication for modifying shares
      const currentUserId = await requireUser(ctx);

      // Get the template to check if it exists
      const template = await ctx.db.get(id);

      if (!template) {
        throw new ConvexError(`Template with ID ${id.toString()} not found.`);
      }

      // Ensure the template belongs to the user
      if (template.userId !== currentUserId) {
        throw new ConvexError(
          `You don't have permission to modify shares for this template.`,
        );
      }

      // Find the shared resource
      const sharedResource = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q
            .eq("resourceType", "templates")
            .eq("resourceId", id)
            .eq("sharedWithUserId", userId),
        )
        .first();

      if (!sharedResource) {
        throw new ConvexError(`This template is not shared with that user.`);
      }

      // Delete the shared resource
      await ctx.db.delete(sharedResource._id);

      // Update the template's lastUpdated time
      await ctx.db.patch(id, {
        updatedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Error in remove share:", error);
      throw error;
    }
  },
});

// Get the shared templates for the current user
export const listShared = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("templates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      isPublic: v.boolean(),
      currentVersion: v.optional(v.number()),
      permissions: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    try {
      // Get the authenticated user's ID
      const userId = await requireUser(ctx);

      // Find all templates shared with the user
      const sharedResources = await ctx.db
        .query("sharedResources")
        .withIndex("by_sharedWithUserId", (q) =>
          q.eq("sharedWithUserId", userId),
        )
        .collect();

      // Filter for only template resources
      const templateShares = sharedResources.filter(
        (share) => share.resourceType === "templates",
      );

      // Get all public templates
      const publicTemplates = await ctx.db
        .query("templates")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .collect();

      // Array to hold our final result with the correct type
      const sharedTemplates: {
        _id: Id<"templates">;
        _creationTime: number;
        name: string;
        description?: string;
        userId: string;
        createdAt: number;
        updatedAt: number;
        isPublic: boolean;
        currentVersion?: number;
        permissions: string[];
      }[] = [];

      // Get templates shared directly with the user
      for (const share of templateShares) {
        // Skip if resourceId is missing or not a template ID
        if (!share.resourceId) continue;

        // Since we know resourceType is "templates", we can safely cast
        const templateId = share.resourceId as Id<"templates">;

        // Get the template document
        const template = await ctx.db.get(templateId);

        // Skip if template doesn't exist or doesn't have required fields
        if (!template || !isValidTemplate(template)) continue;

        sharedTemplates.push({
          _id: template._id,
          _creationTime: template._creationTime,
          name: template.name,
          description: template.description,
          userId: template.userId,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          isPublic: template.isPublic,
          currentVersion: template.currentVersion,
          permissions: share.permissions,
        });
      }

      // Add public templates with read permissions
      for (const template of publicTemplates) {
        // Skip if we already have this template from direct sharing
        if (
          sharedTemplates.some(
            (t) => t._id.toString() === template._id.toString(),
          )
        ) {
          continue;
        }

        // Skip if template doesn't have required fields
        if (!isValidTemplate(template)) continue;

        sharedTemplates.push({
          _id: template._id,
          _creationTime: template._creationTime,
          name: template.name,
          description: template.description,
          userId: template.userId,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          isPublic: template.isPublic,
          currentVersion: template.currentVersion,
          permissions: ["read"],
        });
      }

      return sharedTemplates;
    } catch (error) {
      console.error("Error in list shared templates:", error);
      throw error;
    }
  },
});

// Type guard to ensure we have a valid template object
function isValidTemplate(template: unknown): template is {
  _id: Id<"templates">;
  _creationTime: number;
  name: string;
  description?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  currentVersion?: number;
} {
  if (!template || typeof template !== "object") return false;

  const obj = template as Record<string, unknown>;

  return (
    "_id" in obj &&
    "_creationTime" in obj &&
    "name" in obj &&
    "userId" in obj &&
    "createdAt" in obj &&
    "updatedAt" in obj &&
    "isPublic" in obj &&
    typeof obj.name === "string" &&
    typeof obj.userId === "string" &&
    typeof obj.createdAt === "number" &&
    typeof obj.updatedAt === "number" &&
    typeof obj.isPublic === "boolean"
  );
}
