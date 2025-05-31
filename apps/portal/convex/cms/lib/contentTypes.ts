/**
 * Content Types Utility Functions
 *
 * This module provides helper functions for working with content types in the CMS.
 */
import { Id } from "../../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../../_generated/server";
import { FIELD_TYPES } from "../schema/contentTypesSchema";

/**
 * Field definition interface
 */
export interface ContentTypeField {
  name: string;
  key: string;
  type: string;
  description?: string;
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  defaultValue?: unknown;
  validationRules?: unknown;
  options?: unknown;
  isSystem?: boolean;
  isBuiltIn?: boolean;
  uiConfig?: unknown;
  order?: number;
}

/**
 * Get a content type by its slug
 */
export async function getContentTypeBySlug(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query("contentTypes")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

/**
 * Get a content type by its ID
 */
export async function getContentTypeById(
  ctx: QueryCtx,
  id: Id<"contentTypes">,
) {
  return await ctx.db.get(id);
}

/**
 * Get all fields for a content type
 */
export async function getContentTypeFields(
  ctx: QueryCtx,
  contentTypeId: Id<"contentTypes">,
  includeSystem = true,
) {
  const query = ctx.db
    .query("contentTypeFields")
    .withIndex("by_contentType", (q) => q.eq("contentTypeId", contentTypeId));

  if (!includeSystem) {
    return await query
      .filter((q) => q.eq(q.field("isSystem"), false))
      .collect();
  }

  return await query.collect();
}

/**
 * Get a field by its key within a content type
 */
export async function getFieldByKey(
  ctx: QueryCtx,
  contentTypeId: Id<"contentTypes">,
  key: string,
) {
  return await ctx.db
    .query("contentTypeFields")
    .withIndex("by_contentType_key", (q) =>
      q.eq("contentTypeId", contentTypeId).eq("key", key),
    )
    .unique();
}

/**
 * Create system fields for a content type
 * These are fields that every content type should have
 */
export async function createSystemFields(
  ctx: MutationCtx,
  contentTypeId: Id<"contentTypes">,
) {
  const timestamp = Date.now();
  const systemFields = [
    {
      contentTypeId,
      name: "ID",
      key: "_id",
      type: "text",
      required: true,
      isSystem: true,
      isBuiltIn: true,
      description: "Unique identifier",
      order: 0,
      createdAt: timestamp,
    },
    {
      contentTypeId,
      name: "Created At",
      key: "_creationTime",
      type: "datetime",
      required: true,
      isSystem: true,
      isBuiltIn: true,
      description: "Creation timestamp",
      order: 1,
      createdAt: timestamp,
    },
    {
      contentTypeId,
      name: "Last Updated",
      key: "updatedAt",
      type: "datetime",
      required: false,
      isSystem: true,
      isBuiltIn: true,
      description: "Last update timestamp",
      order: 2,
      createdAt: timestamp,
    },
  ];

  // Insert all system fields
  const promises = systemFields.map((field) =>
    ctx.db.insert("contentTypeFields", field),
  );

  await Promise.all(promises);
}

/**
 * Validate a field definition
 */
export function validateField(field: ContentTypeField) {
  // Check required properties
  if (!field.name) throw new Error("Field name is required");
  if (!field.key) throw new Error("Field key is required");
  if (!field.type) throw new Error("Field type is required");

  // Validate field type
  if (!FIELD_TYPES.includes(field.type)) {
    throw new Error(`Invalid field type: ${field.type}`);
  }

  // Validate key format (alphanumeric, underscores, no spaces)
  if (!/^[a-zA-Z0-9_]+$/.test(field.key)) {
    throw new Error(
      "Field key must contain only letters, numbers, and underscores",
    );
  }

  // Check for reserved keys
  const reservedKeys = ["_id", "_creationTime", "id", "createdAt", "updatedAt"];
  if (reservedKeys.includes(field.key)) {
    throw new Error(`Field key '${field.key}' is reserved for system use`);
  }

  return true;
}

/**
 * Update the field count for a content type
 */
export async function updateFieldCount(
  ctx: MutationCtx,
  contentTypeId: Id<"contentTypes">,
) {
  // Get the content type
  const contentType = await ctx.db.get(contentTypeId);
  if (!contentType) throw new Error("Content type not found");

  // Count all non-system fields
  const fields = await ctx.db
    .query("contentTypeFields")
    .withIndex("by_contentType_isSystem", (q) =>
      q.eq("contentTypeId", contentTypeId).eq("isSystem", false),
    )
    .collect();

  // Update the content type with the field count
  await ctx.db.patch(contentTypeId, {
    fieldCount: fields.length,
    updatedAt: Date.now(),
  });
}

/**
 * Generate table name for a content type
 */
export function generateTableName(slug: string) {
  // Remove any special characters and replace spaces with underscores
  return `content_${slug.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
}

/**
 * Update the entry count for a content type
 */
export async function updateEntryCount(
  ctx: MutationCtx,
  contentTypeSlug: string,
) {
  // Get the content type by slug
  const contentType = await getContentTypeBySlug(ctx, contentTypeSlug);
  if (!contentType)
    throw new Error(`Content type ${contentTypeSlug} not found`);

  // Count the entries based on the content type
  let entryCount = 0;
  let entries: unknown[] = [];

  // We need to check each collection based on the content type slug
  try {
    switch (contentTypeSlug) {
      case "downloads": {
        entries = await ctx.db.query("downloads").collect();
        entryCount = entries.length;
        console.log(`Found ${entryCount} downloads`);
        break;
      }
      case "blog-posts":
      case "posts": {
        // Handle both slugs for backward compatibility
        entries = await ctx.db.query("posts").collect();
        entryCount = entries.length;
        break;
      }
      case "events": {
        entries = await ctx.db.query("events").collect();
        entryCount = entries.length;
        break;
      }
      case "groups": {
        entries = await ctx.db.query("groups").collect();
        entryCount = entries.length;
        break;
      }
      case "products": {
        entries = await ctx.db.query("products").collect();
        entryCount = entries.length;
        break;
      }
      case "courses": {
        entries = await ctx.db.query("courses").collect();
        entryCount = entries.length;
        break;
      }
      case "lessons": {
        entries = await ctx.db.query("lessons").collect();
        entryCount = entries.length;
        break;
      }
      case "topics": {
        entries = await ctx.db.query("topics").collect();
        entryCount = entries.length;
        break;
      }
      default: {
        // For custom content types, we'd need a more generic approach
        // This could be by querying a dynamic table name or using a registry
        console.log(
          `No specific count handler for content type: ${contentTypeSlug}`,
        );
        break;
      }
    }
  } catch (error) {
    console.error(`Error counting entries for ${contentTypeSlug}:`, error);
  }

  // Update the content type with the entry count
  await ctx.db.patch(contentType._id, {
    entryCount,
    updatedAt: Date.now(),
  });

  return entryCount;
}
