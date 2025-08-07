/**
 * Content Types Mutations
 *
 * This module provides mutation endpoints for content types.
 */
import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";

// Define reusable field value validators
const fieldDefaultValue = v.optional(
  v.union(v.string(), v.number(), v.boolean(), v.null()),
);

const fieldValidationRules = v.optional(
  v.record(
    v.string(),
    v.union(
      v.string(),
      v.number(),
      v.boolean(),
      v.array(v.union(v.string(), v.number())),
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        required: v.optional(v.boolean()),
        message: v.optional(v.string()),
      }),
    ),
  ),
);

const fieldOptions = v.optional(
  v.array(
    v.object({
      label: v.string(),
      value: v.union(v.string(), v.number()),
      description: v.optional(v.string()),
      disabled: v.optional(v.boolean()),
    }),
  ),
);

const fieldUiConfig = v.optional(
  v.union(
    v.record(
      v.string(),
      v.union(
        v.string(),
        v.number(),
        v.boolean(),
        v.object({
          component: v.optional(v.string()),
          props: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
          ),
          layout: v.optional(v.string()),
          validation: v.optional(v.boolean()),
          helpText: v.optional(v.string()),
        }),
      ),
    ),
    v.null(),
  ),
);

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
    // Check if slug already exists (simplified check)
    const existing = await ctx.db
      .query("contentTypes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

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
    const contentType = await ctx.db.get(args.id);

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
    const contentType = await ctx.db.get(args.id);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.id} not found`);
    }

    // Don't allow deleting built-in content types
    if (contentType.isBuiltIn) {
      throw new Error("Cannot delete built-in content types");
    }

    // Delete all fields for this content type (simplified)
    const fields = await ctx.db
      .query("contentTypeFields")
      .withIndex("by_contentType", (q) => q.eq("contentTypeId", args.id))
      .collect();

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
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("text"),
      v.literal("textarea"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("date"),
      v.literal("datetime"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("relation"),
      v.literal("file"),
      v.literal("image"),
      v.literal("richtext"),
      v.literal("json"),
      v.literal("array"),
      v.string(), // Allow custom types as fallback
    ),
    required: v.optional(v.boolean()),
    searchable: v.optional(v.boolean()),
    filterable: v.optional(v.boolean()),
    defaultValue: fieldDefaultValue,
    validationRules: fieldValidationRules,
    options: fieldOptions,
    uiConfig: fieldUiConfig,
    order: v.optional(v.number()),
  },
  returns: v.id("contentTypeFields"),
  handler: async (ctx, args) => {
    const contentType = await ctx.db.get(args.contentTypeId);

    if (!contentType) {
      throw new Error(`Content type with ID ${args.contentTypeId} not found`);
    }

    // Check if field key already exists
    const existingField = await ctx.db
      .query("contentTypeFields")
      .withIndex("by_contentType_key", (q) =>
        q.eq("contentTypeId", args.contentTypeId).eq("key", args.key),
      )
      .first();

    if (existingField) {
      throw new Error(`Field with key ${args.key} already exists`);
    }

    // Get the next order value
    const existingFields = await ctx.db
      .query("contentTypeFields")
      .withIndex("by_contentType", (q) =>
        q.eq("contentTypeId", args.contentTypeId),
      )
      .collect();

    const nextOrder = args.order ?? existingFields.length;

    // Create the field
    const timestamp = Date.now();

    const fieldId = await ctx.db.insert("contentTypeFields", {
      contentTypeId: args.contentTypeId,
      name: args.name,
      key: args.key,
      description: args.description,
      type: args.type,
      required: args.required ?? false,
      searchable: args.searchable ?? false,
      filterable: args.filterable ?? false,
      defaultValue: args.defaultValue,
      validationRules: args.validationRules,
      options: args.options,
      isSystem: false,
      isBuiltIn: false,
      uiConfig: args.uiConfig,
      order: nextOrder,
      createdAt: timestamp,
    });

    // Update field count
    await ctx.db.patch(args.contentTypeId, {
      fieldCount: existingFields.length + 1,
      updatedAt: timestamp,
    });

    return fieldId;
  },
});

/**
 * Update a field in a content type
 */
export const updateField = mutation({
  args: {
    fieldId: v.id("contentTypeFields"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("number"),
        v.literal("boolean"),
        v.literal("date"),
        v.literal("datetime"),
        v.literal("select"),
        v.literal("multiselect"),
        v.literal("relation"),
        v.literal("file"),
        v.literal("image"),
        v.literal("richtext"),
        v.literal("json"),
        v.literal("array"),
        v.string(), // Allow custom types as fallback
      ),
    ),
    required: v.optional(v.boolean()),
    searchable: v.optional(v.boolean()),
    filterable: v.optional(v.boolean()),
    defaultValue: fieldDefaultValue,
    validationRules: fieldValidationRules,
    options: fieldOptions,
    uiConfig: fieldUiConfig,
    order: v.optional(v.number()),
  },
  returns: v.id("contentTypeFields"),
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);

    if (!field) {
      throw new Error(`Field with ID ${args.fieldId} not found`);
    }

    // Don't allow updating built-in fields
    if (field.isBuiltIn) {
      throw new Error("Cannot update built-in fields");
    }

    // Update the field
    await ctx.db.patch(args.fieldId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.type !== undefined && { type: args.type }),
      ...(args.required !== undefined && { required: args.required }),
      ...(args.searchable !== undefined && { searchable: args.searchable }),
      ...(args.filterable !== undefined && { filterable: args.filterable }),
      ...(args.defaultValue !== undefined && {
        defaultValue: args.defaultValue,
      }),
      ...(args.validationRules !== undefined && {
        validationRules: args.validationRules,
      }),
      ...(args.options !== undefined && { options: args.options }),
      ...(args.uiConfig !== undefined && { uiConfig: args.uiConfig as any }),
      ...(args.order !== undefined && { order: args.order }),
      updatedAt: Date.now(),
    });

    return args.fieldId;
  },
});

/**
 * Remove a field from a content type
 */
export const removeField = mutation({
  args: {
    fieldId: v.id("contentTypeFields"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);

    if (!field) {
      throw new Error(`Field with ID ${args.fieldId} not found`);
    }

    // Don't allow deleting built-in fields
    if (field.isBuiltIn) {
      throw new Error("Cannot delete built-in fields");
    }

    const contentType = await ctx.db.get(field.contentTypeId);
    if (!contentType) {
      throw new Error(`Content type not found`);
    }

    // Delete the field
    await ctx.db.delete(args.fieldId);

    // Update field count
    await ctx.db.patch(field.contentTypeId, {
      fieldCount: Math.max(0, (contentType.fieldCount ?? 0) - 1),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Update entry counts for content types
 */
export const updateEntryCounts = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log("Updating entry counts for all content types...");

    const contentTypes = await ctx.db.query("contentTypes").collect();
    let updatedCount = 0;

    for (const contentType of contentTypes) {
      // For now, just reset to 0 since we don't have entries table yet
      await ctx.db.patch(contentType._id, {
        entryCount: 0,
        updatedAt: Date.now(),
      });
      updatedCount++;
    }

    console.log(`Updated entry counts for ${updatedCount} content types`);
    return `Updated entry counts for ${updatedCount} content types`;
  },
});

/**
 * Initialize built-in content types
 */
async function initializeBuiltInContentTypes(ctx: any) {
  const timestamp = Date.now();

  // Create Posts content type
  const postsContentType = await ctx.db
    .query("contentTypes")
    .withIndex("by_slug", (q) => q.eq("slug", "posts"))
    .first();

  if (!postsContentType) {
    const postsId = await ctx.db.insert("contentTypes", {
      name: "Posts",
      slug: "posts",
      description: "Blog posts and articles",
      isBuiltIn: true,
      isPublic: true,
      enableVersioning: true,
      enableApi: true,
      includeTimestamps: true,
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
    });

    // Add built-in fields for posts
    const postFields = [
      { name: "Title", key: "title", type: "text", required: true, order: 0 },
      { name: "Slug", key: "slug", type: "text", required: true, order: 1 },
      {
        name: "Content",
        key: "content",
        type: "richtext",
        required: false,
        order: 2,
      },
      {
        name: "Excerpt",
        key: "excerpt",
        type: "textarea",
        required: false,
        order: 3,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        order: 4,
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
          { label: "Archived", value: "archived" },
        ],
      },
      {
        name: "Featured Image",
        key: "featuredImage",
        type: "image",
        required: false,
        order: 5,
      },
      {
        name: "Category",
        key: "category",
        type: "text",
        required: false,
        order: 6,
      },
      { name: "Tags", key: "tags", type: "array", required: false, order: 7 },
    ];

    for (const field of postFields) {
      await ctx.db.insert("contentTypeFields", {
        contentTypeId: postsId,
        name: field.name,
        key: field.key,
        type: field.type,
        required: field.required,
        searchable: field.key === "title" || field.key === "content",
        filterable: field.key === "status" || field.key === "category",
        isBuiltIn: true,
        isSystem: false,
        order: field.order,
        options: field.options,
        createdAt: timestamp,
      });
    }

    // Update field count
    await ctx.db.patch(postsId, {
      fieldCount: postFields.length,
    });
  }

  // Create Downloads content type
  const downloadsContentType = await ctx.db
    .query("contentTypes")
    .withIndex("by_slug", (q) => q.eq("slug", "downloads"))
    .first();

  if (!downloadsContentType) {
    const downloadsId = await ctx.db.insert("contentTypes", {
      name: "Downloads",
      slug: "downloads",
      description: "Downloadable files and resources",
      isBuiltIn: true,
      isPublic: true,
      enableVersioning: false,
      enableApi: true,
      includeTimestamps: true,
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
    });

    // Add built-in fields for downloads
    const downloadFields = [
      { name: "Name", key: "name", type: "text", required: true, order: 0 },
      {
        name: "Description",
        key: "description",
        type: "textarea",
        required: false,
        order: 1,
      },
      { name: "File", key: "file", type: "file", required: true, order: 2 },
      {
        name: "Category",
        key: "category",
        type: "text",
        required: false,
        order: 3,
      },
      {
        name: "Version",
        key: "version",
        type: "text",
        required: false,
        order: 4,
      },
      { name: "Size", key: "size", type: "number", required: false, order: 5 },
    ];

    for (const field of downloadFields) {
      await ctx.db.insert("contentTypeFields", {
        contentTypeId: downloadsId,
        name: field.name,
        key: field.key,
        type: field.type,
        required: field.required,
        searchable: field.key === "name" || field.key === "description",
        filterable: field.key === "category",
        isBuiltIn: true,
        isSystem: false,
        order: field.order,
        createdAt: timestamp,
      });
    }

    // Update field count
    await ctx.db.patch(downloadsId, {
      fieldCount: downloadFields.length,
    });
  }
}

/**
 * Initialize the CMS system with built-in content types
 */
export const initSystem = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log("Initializing CMS system...");

    try {
      // Initialize built-in content types
      await initializeBuiltInContentTypes(ctx);

      console.log("CMS system initialization complete");
      return "CMS system initialized successfully";
    } catch (error) {
      console.error("Error initializing CMS system:", error);
      throw new Error(
        `Failed to initialize CMS system: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});

/**
 * Reset and re-initialize the CMS system (for development only)
 * WARNING: This will delete all content types and their fields
 */
export const resetSystem = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log("Resetting CMS system...");

    try {
      // Delete all content type fields
      const fields = await ctx.db.query("contentTypeFields").collect();
      for (const field of fields) {
        await ctx.db.delete(field._id);
      }

      // Delete all content types
      const contentTypes = await ctx.db.query("contentTypes").collect();
      for (const contentType of contentTypes) {
        await ctx.db.delete(contentType._id);
      }

      // Re-initialize built-in content types
      await initializeBuiltInContentTypes(ctx);

      console.log("CMS system reset and re-initialization complete");
      return "CMS system reset and re-initialized successfully";
    } catch (error) {
      console.error("Error resetting CMS system:", error);
      throw new Error(
        `Failed to reset CMS system: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
