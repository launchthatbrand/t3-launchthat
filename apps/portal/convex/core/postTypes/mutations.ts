import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { v } from "convex/values";

import type { MutationCtx } from "../../_generated/server";
import type { PostTypeField } from "./lib/contentTypes";
import { mutation } from "../../_generated/server";
import { PORTAL_TENANT_ID } from "../../constants";
import { seedDefaultTaxonomies } from "../taxonomies/mutations";
import {
  createSystemFields,
  getPostTypeFieldByKey,
  getScopedPostTypeBySlug,
  resolveScopedOrganizationId,
  updateEntryCount,
  updateFieldCount,
  validateField,
} from "./lib/contentTypes";
import {
  postTypeAdminMenuValidator,
  postTypeRewriteValidator,
  postTypeSupportsValidator,
} from "./schema";

const DEFAULT_POST_TYPES = [
  {
    name: "Posts",
    slug: "posts",
    description: "Standard blog posts with categories, tags, comments.",
    isPublic: true,
    supports: {
      title: true,
      editor: true,
      excerpt: true,
      featuredImage: true,
      comments: true,
      revisions: true,
      taxonomy: true,
    },
    rewrite: {
      hasArchive: true,
      archiveSlug: "blog",
      singleSlug: "post",
      withFront: true,
      feeds: true,
      pages: true,
    },
    adminMenu: {
      enabled: true,
      label: "Posts",
      slug: "posts",
      icon: "FileText",
      position: 20,
    },
  },
  {
    name: "Pages",
    slug: "pages",
    description: "Static pages with hierarchical parent/child support.",
    isPublic: true,
    supports: {
      title: true,
      editor: true,
      featuredImage: true,
      revisions: true,
    },
    rewrite: {
      hasArchive: false,
      singleSlug: "page",
      withFront: true,
      feeds: false,
      pages: true,
    },
    adminMenu: {
      enabled: true,
      label: "Pages",
      slug: "pages",
      icon: "File",
      position: 21,
    },
  },
  {
    name: "Attachments",
    slug: "attachments",
    description:
      "Media files uploaded to the media library (stored as attachments).",
    isPublic: false,
    supports: {
      title: true,
      featuredImage: true,
      customFields: true,
      postMeta: true,
    },
    rewrite: {
      hasArchive: false,
      singleSlug: "attachment",
      withFront: true,
      feeds: false,
      pages: true,
    },
    adminMenu: {
      enabled: true,
      label: "Media",
      slug: "media",
      icon: "Image",
      position: 30,
    },
  },
  {
    name: "Revisions",
    slug: "revisions",
    description: "System-managed revisions of posts and pages.",
    isPublic: false,
    supports: {
      title: true,
      editor: true,
      revisions: true,
    },
    rewrite: {
      hasArchive: false,
      withFront: false,
      feeds: false,
      pages: false,
    },
    adminMenu: {
      enabled: false,
    },
  },
  {
    name: "Nav Menu Item",
    slug: "nav-menu-items",
    description:
      "Menu items used by the Appearance → Menus system (nav_menu_item).",
    isPublic: false,
    supports: {
      title: true,
      customFields: true,
      postMeta: true,
    },
    rewrite: {
      hasArchive: false,
      withFront: false,
      feeds: false,
      pages: false,
    },
    adminMenu: {
      enabled: false,
    },
  },
  {
    name: "Templates",
    slug: "templates",
    description:
      "Reusable Puck templates that control single and archive layouts.",
    isPublic: false,
    supports: {
      title: true,
      customFields: true,
      revisions: true,
      postMeta: true,
    },
    rewrite: {
      hasArchive: false,
      withFront: false,
      feeds: false,
      pages: false,
    },
    adminMenu: {
      enabled: true,
      label: "Templates",
      slug: "templates",
      icon: "LayoutTemplate",
      position: 25,
    },
  },
];

async function seedDefaultPostTypes(ctx: MutationCtx) {
  const now = Date.now();
  const created: string[] = [];

  for (const type of DEFAULT_POST_TYPES) {
    const existing = await ctx.db
      .query("postTypes")
      .withIndex("by_slug", (q) => q.eq("slug", type.slug))
      .unique();

    if (!existing) {
      const id = await ctx.db.insert("postTypes", {
        name: type.name,
        slug: type.slug,
        description: type.description,
        isPublic: type.isPublic,
        isBuiltIn: true,
        enableApi: true,
        enableVersioning: false,
        includeTimestamps: true,
        supports: type.supports,
        rewrite: type.rewrite,
        adminMenu: {
          ...type.adminMenu,
          enabled: type.adminMenu.enabled,
        },
        fieldCount: 0,
        entryCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      await createSystemFields(ctx, id);
      created.push(type.slug);
    }
  }

  return created;
}

export const initSystem = mutation({
  args: {},
  handler: async (ctx) => {
    const created = await seedDefaultPostTypes(ctx);
    const taxonomiesCreated = await seedDefaultTaxonomies(ctx);
    return { created, taxonomiesCreated };
  },
});

export const resetSystem = mutation({
  args: {},
  handler: async (ctx) => {
    const allTypes = await ctx.db.query("postTypes").collect();
    for (const type of allTypes) {
      await ctx.db.delete(type._id);
    }
    await seedDefaultPostTypes(ctx);
    await seedDefaultTaxonomies(ctx);
    return true;
  },
});

export const ensureDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const created = await seedDefaultPostTypes(ctx);
    return { created };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    enableApi: v.optional(v.boolean()),
    includeTimestamps: v.optional(v.boolean()),
    enableVersioning: v.optional(v.boolean()),
    supports: v.optional(postTypeSupportsValidator),
    rewrite: v.optional(postTypeRewriteValidator),
    adminMenu: v.optional(postTypeAdminMenuValidator),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const resolvedOrgId = resolveScopedOrganizationId(args.organizationId);

    if (resolvedOrgId) {
      const existingScoped = await ctx.db
        .query("postTypes")
        .withIndex("by_slug_organization", (q) =>
          q.eq("slug", args.slug).eq("organizationId", resolvedOrgId),
        )
        .unique();
      if (existingScoped) {
        throw new Error(
          `Post type with slug ${args.slug} already exists for this organization`,
        );
      }
    } else {
      const existingGlobal = await fetchScopedPostType(ctx, args.slug);
      if (existingGlobal && existingGlobal.organizationId === undefined) {
        throw new Error(`Post type with slug ${args.slug} already exists`);
      }
    }

    const timestamp = Date.now();
    const id = await ctx.db.insert("postTypes", {
      organizationId: resolvedOrgId,
      enabledOrganizationIds: resolvedOrgId ? [resolvedOrgId] : undefined,
      name: args.name,
      slug: args.slug,
      description: args.description,
      isPublic: args.isPublic,
      isBuiltIn: false,
      enableApi: args.enableApi ?? true,
      includeTimestamps: args.includeTimestamps ?? true,
      enableVersioning: args.enableVersioning ?? false,
      supports: args.supports,
      rewrite: args.rewrite,
      adminMenu:
        args.adminMenu ??
        ({
          enabled: false,
          label: args.name,
          slug: args.slug,
        } satisfies Doc<"postTypes">["adminMenu"]),
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createSystemFields(ctx, id);
    return id;
  },
});

const organizationAccessValidator = v.union(
  v.id("organizations"),
  v.literal(PORTAL_TENANT_ID),
);

const fetchScopedPostType = async (
  ctx: MutationCtx,
  slug: string,
  organizationId?: Id<"organizations">,
): Promise<Doc<"postTypes"> | null> => {
  return await getScopedPostTypeBySlug(ctx, slug, organizationId);
};

const clonePostTypeForOrganization = async (
  ctx: MutationCtx,
  slug: string,
  organizationId: Id<"organizations">,
): Promise<Doc<"postTypes">> => {
  const baseDefinition = await fetchScopedPostType(ctx, slug);
  if (!baseDefinition) {
    throw new Error(`Post type with slug ${slug} not found`);
  }

  const timestamp = Date.now();
  const {
    _id: basePostTypeId,
    _creationTime: _baseCreationTime,
    organizationId: _baseOrgId,
    enabledOrganizationIds: _baseEnabledIds,
    createdAt: _baseCreatedAt,
    updatedAt: _baseUpdatedAt,
    ...basePayload
  } = baseDefinition;

  const clonedPostTypeId = await ctx.db.insert("postTypes", {
    ...basePayload,
    organizationId,
    enabledOrganizationIds: [organizationId],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const baseFields = await ctx.db
    .query("postTypeFields")
    .withIndex("by_postType", (q) => q.eq("postTypeId", basePostTypeId))
    .collect();

  await Promise.all(
    baseFields.map((field) => {
      const {
        _id: _fieldId,
        _creationTime: _fieldCreationTime,
        postTypeId: _fieldPostTypeId,
        createdAt: fieldCreatedAt,
        updatedAt: fieldUpdatedAt,
        ...fieldPayload
      } = field;

      return ctx.db.insert("postTypeFields", {
        ...fieldPayload,
        postTypeId: clonedPostTypeId,
        createdAt: fieldCreatedAt,
        updatedAt: fieldUpdatedAt ?? timestamp,
      });
    }),
  );

  const clonedPostType = await ctx.db.get(clonedPostTypeId);
  if (!clonedPostType) {
    throw new Error(
      `Failed to load cloned post type for ${slug} and organization ${organizationId}`,
    );
  }
  return clonedPostType;
};

export const enableForOrganization = mutation({
  args: {
    slug: v.string(),
    organizationId: organizationAccessValidator,
    definition: v.optional(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
        enableApi: v.optional(v.boolean()),
        includeTimestamps: v.optional(v.boolean()),
        enableVersioning: v.optional(v.boolean()),
        supports: v.optional(postTypeSupportsValidator),
        rewrite: v.optional(postTypeRewriteValidator),
        adminMenu: v.optional(postTypeAdminMenuValidator),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const resolvedOrgId = resolveScopedOrganizationId(args.organizationId);
    const isPortal = args.organizationId === PORTAL_TENANT_ID;

    let postType = await fetchScopedPostType(ctx, args.slug, resolvedOrgId);

    if (!postType) {
      if (args.definition) {
        const timestamp = Date.now();
        const id = await ctx.db.insert("postTypes", {
          organizationId: resolvedOrgId ?? undefined,
          enabledOrganizationIds: resolvedOrgId ? [resolvedOrgId] : undefined,
          name: args.definition.name,
          slug: args.slug,
          description: args.definition.description,
          isPublic: args.definition.isPublic,
          isBuiltIn: false,
          enableApi: args.definition.enableApi ?? true,
          includeTimestamps: args.definition.includeTimestamps ?? true,
          enableVersioning: args.definition.enableVersioning ?? false,
          supports: args.definition.supports,
          rewrite: args.definition.rewrite,
          adminMenu:
            args.definition.adminMenu ??
            ({
              enabled: false,
              label: args.definition.name,
              slug: args.slug,
            } satisfies Doc<"postTypes">["adminMenu"]),
          fieldCount: 0,
          entryCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        await createSystemFields(ctx, id);
        postType = await ctx.db.get(id);
      } else if (resolvedOrgId) {
        postType = await clonePostTypeForOrganization(
          ctx,
          args.slug,
          resolvedOrgId,
        );
      }
    }

    if (
      !postType ||
      (resolvedOrgId &&
        postType.organizationId &&
        postType.organizationId !== resolvedOrgId)
    ) {
      throw new Error(`Post type with slug ${args.slug} not found`);
    }

    const existing = postType.enabledOrganizationIds ?? [];

    if (resolvedOrgId && postType.organizationId === resolvedOrgId) {
      if (existing.includes(resolvedOrgId) && existing.length > 0) {
        return { updated: false };
      }
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: existing.includes(resolvedOrgId)
          ? existing
          : [...existing, resolvedOrgId],
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    if (isPortal) {
      if (postType.enabledOrganizationIds?.length === 0) {
        await ctx.db.patch(postType._id, {
          enabledOrganizationIds: undefined,
          updatedAt: Date.now(),
        });
        return { updated: true };
      }
      return { updated: false };
    }

    if (existing.includes(args.organizationId as Id<"organizations">)) {
      return { updated: false };
    }

    await ctx.db.patch(postType._id, {
      enabledOrganizationIds: [
        ...existing,
        args.organizationId as Id<"organizations">,
      ],
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const disableForOrganization = mutation({
  args: {
    slug: v.string(),
    organizationId: organizationAccessValidator,
  },
  handler: async (ctx, args) => {
    const resolvedOrgId = resolveScopedOrganizationId(args.organizationId);
    const isPortal = args.organizationId === PORTAL_TENANT_ID;

    const postType = await fetchScopedPostType(ctx, args.slug, resolvedOrgId);

    if (
      !postType ||
      (resolvedOrgId &&
        postType.organizationId &&
        postType.organizationId !== resolvedOrgId)
    ) {
      throw new Error(`Post type with slug ${args.slug} not found`);
    }

    const enabledOrgIds = postType.enabledOrganizationIds;
    const existing = enabledOrgIds ?? [];
    const hasLegacyOwnership =
      enabledOrgIds === undefined &&
      (postType.organizationId === args.organizationId ||
        (isPortal && postType.organizationId === undefined));

    if (resolvedOrgId && postType.organizationId === resolvedOrgId) {
      if (!existing.includes(resolvedOrgId) || existing.length === 0) {
        return { updated: false };
      }
      const next = existing.filter((id) => id !== resolvedOrgId);
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: next,
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    if (
      !existing.includes(args.organizationId as Id<"organizations">) &&
      !hasLegacyOwnership
    ) {
      return { updated: false };
    }

    if (hasLegacyOwnership) {
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: [],
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    const next = existing.filter(
      (id) => id !== (args.organizationId as Id<"organizations">),
    );

    await ctx.db.patch(postType._id, {
      enabledOrganizationIds: next,
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("postTypes"),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
      enableApi: v.optional(v.boolean()),
      includeTimestamps: v.optional(v.boolean()),
      enableVersioning: v.optional(v.boolean()),
      supports: v.optional(postTypeSupportsValidator),
      rewrite: v.optional(postTypeRewriteValidator),
      adminMenu: v.optional(postTypeAdminMenuValidator),
    }),
  },
  handler: async (ctx, args) => {
    const postType = await ctx.db.get(args.id);
    if (!postType) {
      throw new Error("Post type not found");
    }

    const nextSlug = args.data.slug;
    if (nextSlug && nextSlug !== postType.slug) {
      if (postType.organizationId) {
        const conflict = await ctx.db
          .query("postTypes")
          .withIndex("by_slug_organization", (q) =>
            q
              .eq("slug", nextSlug)
              .eq("organizationId", postType.organizationId),
          )
          .unique();
        if (conflict && conflict._id !== postType._id) {
          throw new Error(`Slug ${nextSlug} is already in use`);
        }
      } else {
        const matches = await ctx.db
          .query("postTypes")
          .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
          .collect();
        const conflict = matches.find(
          (type) =>
            type.organizationId === undefined && type._id !== postType._id,
        );
        if (conflict) {
          throw new Error(`Slug ${nextSlug} is already in use`);
        }
      }
    }

    await ctx.db.patch(args.id, {
      ...args.data,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const remove = mutation({
  args: {
    id: v.id("postTypes"),
  },
  handler: async (ctx, args) => {
    const postType = await ctx.db.get(args.id);
    if (!postType) {
      throw new Error("Post type not found");
    }

    const fields = await ctx.db
      .query("postTypeFields")
      .withIndex("by_postType", (q) => q.eq("postTypeId", args.id))
      .collect();

    await Promise.all(fields.map((field) => ctx.db.delete(field._id)));
    await ctx.db.delete(args.id);
    return true;
  },
});

export const addField = mutation({
  args: {
    postTypeId: v.id("postTypes"),
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
      isSystem: v.optional(v.boolean()),
      isBuiltIn: v.optional(v.boolean()),
      uiConfig: v.optional(v.any()),
      order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const fieldInput: PostTypeField = {
      name: args.field.name,
      key: args.field.key,
      type: args.field.type,
      description: args.field.description,
      required: args.field.required ?? false,
      searchable: args.field.searchable ?? false,
      filterable: args.field.filterable ?? false,
      defaultValue: args.field.defaultValue,
      validationRules: args.field.validationRules,
      options: args.field.options,
      isSystem: args.field.isSystem ?? false,
      isBuiltIn: args.field.isBuiltIn ?? false,
      uiConfig: (args.field.uiConfig ?? null) as PostTypeField["uiConfig"],
      order: args.field.order ?? 0,
    };

    validateField(fieldInput);

    const existingField = await getPostTypeFieldByKey(
      ctx,
      args.postTypeId,
      fieldInput.key,
    );
    if (existingField) {
      throw new Error(`Field key ${fieldInput.key} already exists`);
    }

    const now = Date.now();
    const fieldPayload = {
      postTypeId: args.postTypeId,
      ...fieldInput,
      uiConfig: (fieldInput.uiConfig ??
        null) as Doc<"postTypeFields">["uiConfig"],
      createdAt: now,
    };

    // @ts-expect-error Field payload is runtime validated via validators above
    await ctx.db.insert("postTypeFields", fieldPayload);

    await updateFieldCount(ctx, args.postTypeId);
    return true;
  },
});

export const updateField = mutation({
  args: {
    fieldId: v.id("postTypeFields"),
    data: v.object({
      name: v.optional(v.string()),
      key: v.optional(v.string()),
      type: v.optional(v.string()),
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
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    if (args.data.key && args.data.key !== field.key) {
      const existing = await getPostTypeFieldByKey(
        ctx,
        field.postTypeId,
        args.data.key,
      );
      if (existing) {
        throw new Error(`Field key ${args.data.key} already exists`);
      }
    }

    const updates: Partial<Doc<"postTypeFields">> = {};
    if (args.data.name !== undefined) updates.name = args.data.name;
    if (args.data.key !== undefined) updates.key = args.data.key;
    if (args.data.type !== undefined) updates.type = args.data.type;
    if (args.data.description !== undefined) {
      updates.description = args.data.description;
    }
    if (args.data.required !== undefined) updates.required = args.data.required;
    if (args.data.searchable !== undefined) {
      updates.searchable = args.data.searchable;
    }
    if (args.data.filterable !== undefined) {
      updates.filterable = args.data.filterable;
    }
    if (args.data.defaultValue !== undefined) {
      updates.defaultValue = args.data
        .defaultValue as Doc<"postTypeFields">["defaultValue"];
    }
    if (args.data.validationRules !== undefined) {
      updates.validationRules = args.data
        .validationRules as Doc<"postTypeFields">["validationRules"];
    }
    if (args.data.options !== undefined) {
      updates.options = args.data.options as Doc<"postTypeFields">["options"];
    }
    if (args.data.uiConfig !== undefined) {
      updates.uiConfig = args.data
        .uiConfig as Doc<"postTypeFields">["uiConfig"];
    }
    if (args.data.order !== undefined) updates.order = args.data.order;

    await ctx.db.patch(args.fieldId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const removeField = mutation({
  args: {
    fieldId: v.id("postTypeFields"),
  },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    await ctx.db.delete(args.fieldId);
    await updateFieldCount(ctx, field.postTypeId);
    return true;
  },
});

export const updateEntryCounts = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await updateEntryCount(ctx, args.slug);
  },
});
