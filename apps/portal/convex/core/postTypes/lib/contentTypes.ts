/**
 * Content Types Utility Functions
 *
 * This module provides helper functions for working with content types in the CMS.
 */
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "@convex-config/_generated/server";
import {
  PORTAL_TENANT_ID,
  PORTAL_TENANT_SLUG,
  isPortalOrganizationValue,
} from "../../../constants";

import { FIELD_TYPES } from "../schema";

/**
 * Field definition interface
 */
export interface PostTypeField {
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
export type ConvexCtx = QueryCtx | MutationCtx;

export const resolveScopedOrganizationId = (
  organizationId?: Id<"organizations"> | typeof PORTAL_TENANT_SLUG,
) => {
  if (!organizationId || isPortalOrganizationValue(organizationId)) {
    return undefined;
  }
  return organizationId as Id<"organizations">;
};

export async function getScopedPostTypeBySlug(
  ctx: ConvexCtx,
  slug: string,
  organizationId?: Id<"organizations">,
): Promise<Doc<"postTypes"> | null> {
  const resolvedOrgId = resolveScopedOrganizationId(organizationId);

  if (resolvedOrgId) {
    const orgSpecific = await ctx.db
      .query("postTypes")
      .withIndex("by_slug_organization", (q) =>
        q.eq("slug", slug).eq("organizationId", resolvedOrgId),
      )
      .unique();
    if (orgSpecific) {
      return orgSpecific;
    }
  }

  const matches = await ctx.db
    .query("postTypes")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .collect();

  if (matches.length === 0) {
    return null;
  }

  const global = matches.find((type) => type.organizationId === undefined);
  if (global) {
    return global;
  }

  // No global definition. If we were looking for a specific org and still
  // didn't find one, treat as not found.
  if (resolvedOrgId) {
    return null;
  }

  // Fallback to the first match (should only happen when no org-specific
  // context was requested).
  return matches[0] ?? null;
}

export async function getPostTypeBySlug(ctx: QueryCtx, slug: string) {
  return await getScopedPostTypeBySlug(ctx, slug);
}

/**
 * Get a content type by its ID
 */
export async function getPostTypeById(ctx: QueryCtx, id: Id<"postTypes">) {
  return await ctx.db.get(id);
}

/**
 * Get all fields for a content type
 */
export async function getPostTypeFields(
  ctx: QueryCtx,
  postTypeId: Id<"postTypes">,
  includeSystem = true,
) {
  const query = ctx.db
    .query("postTypeFields")
    .withIndex("by_postType", (q) => q.eq("postTypeId", postTypeId));

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
export async function getPostTypeFieldByKey(
  ctx: QueryCtx,
  postTypeId: Id<"postTypes">,
  key: string,
) {
  return await ctx.db
    .query("postTypeFields")
    .withIndex("by_postType_key", (q) =>
      q.eq("postTypeId", postTypeId).eq("key", key),
    )
    .unique();
}

/**
 * Create system fields for a content type
 * These are fields that every content type should have
 */
export async function createSystemFields(
  ctx: MutationCtx,
  postTypeId: Id<"postTypes">,
) {
  const timestamp = Date.now();
  const systemFields = [
    {
      postTypeId,
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
      postTypeId,
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
      postTypeId,
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
    ctx.db.insert("postTypeFields", field),
  );

  await Promise.all(promises);
}

/**
 * Validate a field definition
 */
export function validateField(field: PostTypeField) {
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
  postTypeId: Id<"postTypes">,
) {
  // Get the content type
  const postType = await ctx.db.get(postTypeId);
  if (!postType) throw new Error("Post type not found");

  // Count all non-system fields
  const fields = await ctx.db
    .query("postTypeFields")
    .withIndex("by_postType_isSystem", (q) =>
      q.eq("postTypeId", postTypeId).eq("isSystem", false),
    )
    .collect();

  // Update the content type with the field count
  await ctx.db.patch(postTypeId, {
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
export async function updateEntryCount(ctx: MutationCtx, postTypeSlug: string) {
  // Get the content type by slug
  const postType = await getPostTypeBySlug(ctx, postTypeSlug);
  if (!postType) throw new Error(`Post type ${postTypeSlug} not found`);

  // Count the entries based on the content type
  let entryCount = 0;
  let entries: unknown[] = [];

  // We need to check each collection based on the content type slug
  try {
    switch (postTypeSlug) {
      case "downloads": {
        entryCount = 0;
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
      case "contact":
      case "contacts": {
        entries = await ctx.db.query("contacts").collect();
        entryCount = entries.length;
        break;
      }
      case "groups": {
        entryCount = 0;
        break;
      }
      case "products": {
        entries = await ctx.db.query("products").collect();
        entryCount = entries.length;
        break;
      }
      default: {
        // For custom content types, we'd need a more generic approach
        // This could be by querying a dynamic table name or using a registry
        console.log(`No specific count handler for post type: ${postTypeSlug}`);
        break;
      }
    }
  } catch (error) {
    console.error(`Error counting entries for ${postTypeSlug}:`, error);
  }

  // Update the content type with the entry count
  await ctx.db.patch(postType._id, {
    entryCount,
    updatedAt: Date.now(),
  });

  return entryCount;
}
