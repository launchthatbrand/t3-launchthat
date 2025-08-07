/**
 * Content Types API
 *
 * This module provides API endpoints for managing content types.
 */
import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  createSystemFields,
  getContentTypeById,
  getContentTypeBySlug,
  getContentTypeFields,
  updateEntryCount,
  updateFieldCount,
  validateField,
} from "./lib/contentTypes";

/**
 * List all content types
 */
export const list = query({
  args: {
    includeBuiltIn: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("contentTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
    }),
  ),
  handler: async (ctx, args) => {
    const { includeBuiltIn = true } = args;

    if (!includeBuiltIn) {
      // Filter out built-in content types
      return await ctx.db
        .query("contentTypes")
        .withIndex("by_isBuiltIn", (q) => q.eq("isBuiltIn", false))
        .collect();
    }

    // Return all content types
    return await ctx.db.query("contentTypes").collect();
  },
});

/**
 * Get a content type by ID
 */
export const get = query({
  args: {
    id: v.id("contentTypes"),
  },
  returns: v.object({
    contentType: v.object({
      _id: v.id("contentTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
    }),
    fields: v.array(
      v.object({
        _id: v.id("contentTypeFields"),
        _creationTime: v.number(),
        contentTypeId: v.id("contentTypes"),
        name: v.string(),
        key: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        required: v.boolean(),
        searchable: v.optional(v.boolean()),
        filterable: v.optional(v.boolean()),
        defaultValue: v.optional(v.any()),
        validationRules: v.optional(v.any()),
        options: v.optional(v.any()),
        isSystem: v.boolean(),
        isBuiltIn: v.boolean(),
        uiConfig: v.optional(v.any()),
        order: v.number(),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const contentType = await getContentTypeById(ctx, args.id);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.id} not found`);
    }

    const fields = await getContentTypeFields(ctx, args.id);

    return {
      contentType,
      fields,
    };
  },
});

/**
 * Get a content type by slug
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.object({
    contentType: v.object({
      _id: v.id("contentTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
    }),
    fields: v.array(
      v.object({
        _id: v.id("contentTypeFields"),
        _creationTime: v.number(),
        contentTypeId: v.id("contentTypes"),
        name: v.string(),
        key: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        required: v.boolean(),
        searchable: v.optional(v.boolean()),
        filterable: v.optional(v.boolean()),
        defaultValue: v.optional(v.any()),
        validationRules: v.optional(v.any()),
        options: v.optional(v.any()),
        isSystem: v.boolean(),
        isBuiltIn: v.boolean(),
        uiConfig: v.optional(v.any()),
        order: v.number(),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const contentType = await getContentTypeBySlug(ctx, args.slug);

    if (!contentType) {
      throw new Error(`Content type with slug ${args.slug} not found`);
    }

    const fields = await getContentTypeFields(ctx, contentType._id);

    return {
      contentType,
      fields,
    };
  },
});

/**
 * Create a new content type
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    enableVersioning: v.optional(v.boolean()),
    enableApi: v.optional(v.boolean()),
    includeTimestamps: v.optional(v.boolean()),
  },
  returns: v.id("contentTypes"),
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await getContentTypeBySlug(ctx, args.slug);

    if (existing) {
      throw new Error(`Content type with slug ${args.slug} already exists`);
    }

    // Create the content type
    const timestamp = Date.now();

    // Get current user if authenticated
    let createdBy: Id<"users"> | undefined;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      // Find the user by identity subject
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first();

      if (user) {
        createdBy = user._id;
      }
    }

    const contentTypeId = await ctx.db.insert("contentTypes", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      isBuiltIn: false,
      isPublic: args.isPublic ?? true,
      enableVersioning: args.enableVersioning ?? false,
      enableApi: args.enableApi ?? true,
      includeTimestamps: args.includeTimestamps ?? true,
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
      createdBy,
    });

    // Create system fields
    await createSystemFields(ctx, contentTypeId);

    return contentTypeId;
  },
});

/**
 * Update a content type
 */
export const update = mutation({
  args: {
    id: v.id("contentTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    enableVersioning: v.optional(v.boolean()),
    enableApi: v.optional(v.boolean()),
    includeTimestamps: v.optional(v.boolean()),
  },
  returns: v.id("contentTypes"),
  handler: async (ctx, args) => {
    const contentType = await getContentTypeById(ctx, args.id);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.id} not found`);
    }

    // Don't allow updating built-in content types
    if (contentType.isBuiltIn) {
      throw new Error("Cannot update built-in content types");
    }

    // Update the content type
    await ctx.db.patch(args.id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
      ...(args.enableVersioning !== undefined && {
        enableVersioning: args.enableVersioning,
      }),
      ...(args.enableApi !== undefined && { enableApi: args.enableApi }),
      ...(args.includeTimestamps !== undefined && {
        includeTimestamps: args.includeTimestamps,
      }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete a content type
 */
export const remove = mutation({
  args: {
    id: v.id("contentTypes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contentType = await getContentTypeById(ctx, args.id);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.id} not found`);
    }

    // Don't allow deleting built-in content types
    if (contentType.isBuiltIn) {
      throw new Error("Cannot delete built-in content types");
    }

    // Delete all fields for this content type
    const fields = await getContentTypeFields(ctx, args.id);

    for (const field of fields) {
      await ctx.db.delete(field._id);
    }

    // Delete the content type
    await ctx.db.delete(args.id);

    return null;
  },
});

/**
 * Add a field to a content type
 */
export const addField = mutation({
  args: {
    contentTypeId: v.id("contentTypes"),
    field: v.object({
      name: v.string(),
      key: v.string(),
      type: v.string(),
      description: v.optional(v.string()),
      required: v.optional(v.boolean()),
      searchable: v.optional(v.boolean()),
      filterable: v.optional(v.boolean()),
      defaultValue: v.optional(v.any()),
      validationRules: v.optional(v.any()),
      options: v.optional(v.any()),
      uiConfig: v.optional(v.any()),
      order: v.optional(v.number()),
    }),
  },
  returns: v.id("contentTypeFields"),
  handler: async (ctx, args) => {
    const contentType = await getContentTypeById(ctx, args.contentTypeId);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.contentTypeId} not found`);
    }

    // Validate the field
    validateField(args.field);

    // Check if field with this key already exists
    const existingField = await ctx.db
      .query("contentTypeFields")
      .withIndex("by_contentType_key", (q) =>
        q.eq("contentTypeId", args.contentTypeId).eq("key", args.field.key),
      )
      .unique();

    if (existingField) {
      throw new Error(
        `Field with key ${args.field.key} already exists for this content type`,
      );
    }

    // Get the highest order value for existing fields
    const fields = await getContentTypeFields(ctx, args.contentTypeId);
    const maxOrder = fields.reduce(
      (max, field) => Math.max(max, field.order || 0),
      0,
    );

    // Insert the field
    const timestamp = Date.now();
    const fieldId = await ctx.db.insert("contentTypeFields", {
      contentTypeId: args.contentTypeId,
      name: args.field.name,
      key: args.field.key,
      description: args.field.description,
      type: args.field.type,
      required: args.field.required ?? false,
      searchable: args.field.searchable ?? false,
      filterable: args.field.filterable ?? false,
      defaultValue: args.field.defaultValue,
      validationRules: args.field.validationRules,
      options: args.field.options,
      isSystem: false,
      isBuiltIn: false,
      uiConfig: args.field.uiConfig,
      order: args.field.order ?? maxOrder + 1,
      createdAt: timestamp,
    });

    // Update the field count for the content type
    await updateFieldCount(ctx, args.contentTypeId);

    return fieldId;
  },
});

/**
 * Update a field
 */
export const updateField = mutation({
  args: {
    id: v.id("contentTypeFields"),
    field: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      required: v.optional(v.boolean()),
      searchable: v.optional(v.boolean()),
      filterable: v.optional(v.boolean()),
      defaultValue: v.optional(v.any()),
      validationRules: v.optional(v.any()),
      options: v.optional(v.any()),
      uiConfig: v.optional(v.any()),
      order: v.optional(v.number()),
    }),
  },
  returns: v.id("contentTypeFields"),
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id);

    if (!field) {
      throw new Error(`Field with ID ${args.id} not found`);
    }

    // Don't allow updating system fields
    if (field.isSystem) {
      throw new Error("Cannot update system fields");
    }

    // Update the field
    await ctx.db.patch(args.id, {
      ...(args.field.name !== undefined && { name: args.field.name }),
      ...(args.field.description !== undefined && {
        description: args.field.description,
      }),
      ...(args.field.required !== undefined && {
        required: args.field.required,
      }),
      ...(args.field.searchable !== undefined && {
        searchable: args.field.searchable,
      }),
      ...(args.field.filterable !== undefined && {
        filterable: args.field.filterable,
      }),
      ...(args.field.defaultValue !== undefined && {
        defaultValue: args.field.defaultValue,
      }),
      ...(args.field.validationRules !== undefined && {
        validationRules: args.field.validationRules,
      }),
      ...(args.field.options !== undefined && { options: args.field.options }),
      ...(args.field.uiConfig !== undefined && {
        uiConfig: args.field.uiConfig,
      }),
      ...(args.field.order !== undefined && { order: args.field.order }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Remove a field
 */
export const removeField = mutation({
  args: {
    id: v.id("contentTypeFields"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id);

    if (!field) {
      throw new Error(`Field with ID ${args.id} not found`);
    }

    // Don't allow removing system fields
    if (field.isSystem) {
      throw new Error("Cannot remove system fields");
    }

    // Delete the field
    await ctx.db.delete(args.id);

    // Update the field count for the content type
    await updateFieldCount(ctx, field.contentTypeId);

    return null;
  },
});

/**
 * Update all content type entry counts
 * This will count entries for each content type and update the entryCount field
 */
export const updateEntryCounts = mutation({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      entryCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Get all content types
    const contentTypes = await ctx.db.query("contentTypes").collect();

    const results = [];

    // Update entry count for each content type
    for (const contentType of contentTypes) {
      try {
        const count = await updateEntryCount(ctx, contentType.slug);
        results.push({
          slug: contentType.slug,
          entryCount: count,
        });
      } catch (error) {
        console.error(
          `Error updating entry count for ${contentType.slug}:`,
          error,
        );
        results.push({
          slug: contentType.slug,
          entryCount: -1, // Indicate error
        });
      }
    }

    return results;
  },
});
