import { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG } from "../../constants";
import {
  postTypeAdminMenuValidator,
  postTypeFrontendVisibilityValidator,
  postTypeMetaBoxValidator,
  postTypeRewriteValidator,
  postTypeStorageKindValidator,
  postTypeStorageTablesValidator,
  postTypeSupportsValidator,
} from "./schema";

import type { Id } from "../../_generated/dataModel";
import {
  getScopedPostTypeByArchiveSlugKey,
  getScopedPostTypeBySingleSlugKey,
  getScopedPostTypeBySlug,
} from "./lib/contentTypes";
import { query } from "../../_generated/server";
/**
 * Content Types Queries
 *
 * This module provides query endpoints for content types.
 */
import { v } from "convex/values";

const enabledOrgIdValidator = v.union(
  v.id("organizations"),
  v.literal(PORTAL_TENANT_SLUG),
);

const matchesOrganizationId = (
  stored: Id<"organizations"> | typeof PORTAL_TENANT_SLUG,
  requested: Id<"organizations">,
) =>
  stored === requested ||
  (stored === PORTAL_TENANT_SLUG && requested === PORTAL_TENANT_ID);

const isGlobalBuiltIn = (type: {
  isBuiltIn: boolean;
  organizationId?: Id<"organizations"> | typeof PORTAL_TENANT_SLUG;
}) =>
  type.isBuiltIn &&
  (type.organizationId === undefined ||
    type.organizationId === PORTAL_TENANT_SLUG);

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
      singleSlugKey: v.optional(v.string()),
      archiveSlugKey: v.optional(v.string()),
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
      organizationId: v.optional(enabledOrgIdValidator),
      enabledOrganizationIds: v.optional(v.array(enabledOrgIdValidator)),
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      frontendVisibility: v.optional(postTypeFrontendVisibilityValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const { includeBuiltIn = true, organizationId } = args;
    const allPostTypes = await ctx.db.query("postTypes").collect();

    const filtered = allPostTypes.filter((type) => {
      if (organizationId) {
        if (
          type.organizationId &&
          !matchesOrganizationId(type.organizationId, organizationId)
        ) {
          console.info("[postTypes:list] skipping due to org mismatch", {
            slug: type.slug,
            typeOrganizationId: type.organizationId,
            requestedOrganizationId: organizationId,
          });
          return false;
        }

        if (type.enabledOrganizationIds) {
          const builtInBypass = isGlobalBuiltIn(type);
          if (type.enabledOrganizationIds.length === 0) {
            if (!builtInBypass) {
              console.info(
                "[postTypes:list] skipping due to empty enabledOrganizationIds",
                {
                  slug: type.slug,
                  requestedOrganizationId: organizationId,
                },
              );
              return false;
            }
          } else {
            const isEnabled = type.enabledOrganizationIds.some((candidate) =>
              matchesOrganizationId(candidate, organizationId),
            );
            if (!isEnabled && !builtInBypass) {
              console.info(
                "[postTypes:list] skipping because org not enabled for type",
                {
                  slug: type.slug,
                  enabledOrganizationIds: type.enabledOrganizationIds,
                  requestedOrganizationId: organizationId,
                },
              );
              return false;
            }
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
      singleSlugKey: v.optional(v.string()),
      archiveSlugKey: v.optional(v.string()),
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
      organizationId: v.optional(enabledOrgIdValidator),
      enabledOrganizationIds: v.optional(v.array(enabledOrgIdValidator)),
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      frontendVisibility: v.optional(postTypeFrontendVisibilityValidator),
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

    if (args.organizationId && postType.enabledOrganizationIds) {
      const builtInBypass = isGlobalBuiltIn(postType);
      if (postType.enabledOrganizationIds.length === 0 && !builtInBypass) {
        return null;
      }
      if (
        postType.enabledOrganizationIds.length > 0 &&
        !postType.enabledOrganizationIds.includes(args.organizationId) &&
        !builtInBypass
      ) {
        return null;
      }
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
      singleSlugKey: v.optional(v.string()),
      archiveSlugKey: v.optional(v.string()),
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
      organizationId: v.optional(enabledOrgIdValidator),
      enabledOrganizationIds: v.optional(v.array(enabledOrgIdValidator)),
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      frontendVisibility: v.optional(postTypeFrontendVisibilityValidator),
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
      postType.organizationId !== args.organizationId
    ) {
      const builtInBypass = isGlobalBuiltIn(postType);
      if (postType.enabledOrganizationIds.length === 0 && !builtInBypass) {
        return null;
      }
      if (
        postType.enabledOrganizationIds.length > 0 &&
        !postType.enabledOrganizationIds.includes(args.organizationId) &&
        !builtInBypass
      ) {
        return null;
      }
    }

    return postType;
  },
});

export const getBySingleSlugKey = query({
  args: {
    singleSlugKey: v.string(),
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
      organizationId: v.optional(enabledOrgIdValidator),
      enabledOrganizationIds: v.optional(v.array(enabledOrgIdValidator)),
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      frontendVisibility: v.optional(postTypeFrontendVisibilityValidator),
      singleSlugKey: v.optional(v.string()),
      archiveSlugKey: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const postType = await getScopedPostTypeBySingleSlugKey(
      ctx,
      args.singleSlugKey,
      args.organizationId,
    );
    return postType;
  },
});

export const getByArchiveSlugKey = query({
  args: {
    archiveSlugKey: v.string(),
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
      organizationId: v.optional(enabledOrgIdValidator),
      enabledOrganizationIds: v.optional(v.array(enabledOrgIdValidator)),
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      frontendVisibility: v.optional(postTypeFrontendVisibilityValidator),
      singleSlugKey: v.optional(v.string()),
      archiveSlugKey: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const postType = await getScopedPostTypeByArchiveSlugKey(
      ctx,
      args.archiveSlugKey,
      args.organizationId,
    );
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
      postType.organizationId !== args.organizationId
    ) {
      const builtInBypass = isGlobalBuiltIn(postType);
      if (postType.enabledOrganizationIds.length === 0 && !builtInBypass) {
        return [];
      }
      if (
        postType.enabledOrganizationIds.length > 0 &&
        !postType.enabledOrganizationIds.includes(args.organizationId) &&
        !builtInBypass
      ) {
        return [];
      }
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
