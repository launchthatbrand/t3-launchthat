/**
 * Content Types Queries
 *
 * This module provides query endpoints for content types.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";
import { getScopedPostTypeBySlug } from "./lib/contentTypes";
import {
  postTypeAdminMenuValidator,
  postTypeRewriteValidator,
  postTypeSupportsValidator,
} from "./schema";

/**
 * List all content types
 */
export const list = query({
  args: {
    includeBuiltIn: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(
    v.object({
      _id: v.id("postTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      supports: v.optional(postTypeSupportsValidator),
      rewrite: v.optional(postTypeRewriteValidator),
      adminMenu: v.optional(postTypeAdminMenuValidator),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
      organizationId: v.optional(v.id("organizations")),
      enabledOrganizationIds: v.optional(v.array(v.id("organizations"))),
    }),
  ),
  handler: async (ctx, args) => {
    const { includeBuiltIn = true, organizationId } = args;
    const allPostTypes = await ctx.db.query("postTypes").collect();

    const filtered = allPostTypes.filter((type) => {
      if (organizationId) {
        if (type.organizationId && type.organizationId !== organizationId) {
          return false;
        }

        if (type.enabledOrganizationIds) {
          if (type.enabledOrganizationIds.length === 0) {
            return false;
          }
          if (!type.enabledOrganizationIds.includes(organizationId)) {
            return false;
          }
        }
      }

      if (!includeBuiltIn && type.isBuiltIn) {
        return false;
      }

      return true;
    });

    return filtered;
  },
});

/**
 * Get a content type by ID (simplified)
 */
export const get = query({
  args: {
    id: v.id("postTypes"),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.object({
      _id: v.id("postTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      supports: v.optional(postTypeSupportsValidator),
      rewrite: v.optional(postTypeRewriteValidator),
      adminMenu: v.optional(postTypeAdminMenuValidator),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
      organizationId: v.optional(v.id("organizations")),
      enabledOrganizationIds: v.optional(v.array(v.id("organizations"))),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const postType = await ctx.db.get(args.id);
    if (!postType) {
      return null;
    }

    if (
      args.organizationId &&
      postType.organizationId &&
      postType.organizationId !== args.organizationId
    ) {
      return null;
    }

    if (
      args.organizationId &&
      postType.enabledOrganizationIds &&
      (!postType.enabledOrganizationIds.includes(args.organizationId) ||
        postType.enabledOrganizationIds.length === 0)
    ) {
      return null;
    }

    return postType;
  },
});

/**
 * Get a post type by slug
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.object({
      _id: v.id("postTypes"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      isBuiltIn: v.boolean(),
      isPublic: v.boolean(),
      enableVersioning: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      supports: v.optional(postTypeSupportsValidator),
      rewrite: v.optional(postTypeRewriteValidator),
      adminMenu: v.optional(postTypeAdminMenuValidator),
      fieldCount: v.optional(v.number()),
      entryCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
      organizationId: v.optional(v.id("organizations")),
      enabledOrganizationIds: v.optional(v.array(v.id("organizations"))),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const postType = await getScopedPostTypeBySlug(
      ctx,
      args.slug,
      args.organizationId,
    );

    if (
      postType &&
      args.organizationId &&
      postType.enabledOrganizationIds &&
      !postType.enabledOrganizationIds.includes(args.organizationId) &&
      postType.organizationId !== args.organizationId
    ) {
      return null;
    }

    return postType;
  },
});

export const fieldsBySlug = query({
  args: {
    slug: v.string(),
    includeSystem: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(
    v.object({
      _id: v.id("postTypeFields"),
      _creationTime: v.number(),
      postTypeId: v.id("postTypes"),
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
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.optional(v.id("users")),
    }),
  ),
  handler: async (ctx, args) => {
    const postType = await getScopedPostTypeBySlug(
      ctx,
      args.slug,
      args.organizationId,
    );

    if (!postType) {
      return [];
    }

    if (
      args.organizationId &&
      postType.enabledOrganizationIds &&
      !postType.enabledOrganizationIds.includes(args.organizationId) &&
      postType.organizationId !== args.organizationId
    ) {
      return [];
    }

    const includeSystem = args.includeSystem ?? true;
    const fieldQuery = ctx.db
      .query("postTypeFields")
      .withIndex("by_postType", (q) => q.eq("postTypeId", postType._id));

    if (includeSystem) {
      return await fieldQuery.collect();
    }

    return await fieldQuery
      .filter((q) => q.eq(q.field("isSystem"), false))
      .collect();
  },
});
