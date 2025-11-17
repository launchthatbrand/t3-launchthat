import { Doc } from "@convex-config/_generated/dataModel";
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

import type { MutationCtx } from "../../_generated/server";
import type { PostTypeField } from "./lib/contentTypes";
import { mutation } from "../../_generated/server";
import { seedDefaultTaxonomies } from "../taxonomies/mutations";
import {
  createSystemFields,
  getPostTypeFieldByKey,
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
    adminMenu: postTypeAdminMenuValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("postTypes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error(`Post type with slug ${args.slug} already exists`);
    }

    const timestamp = Date.now();
    const id = await ctx.db.insert("postTypes", {
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
      adminMenu: args.adminMenu,
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createSystemFields(ctx, id);
    return id;
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
      const existing = await ctx.db
        .query("postTypes")
        .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
        .unique();
      if (existing) {
        throw new Error(`Slug ${nextSlug} is already in use`);
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
      uiConfig: args.field.uiConfig as PostTypeField["uiConfig"],
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
      createdAt: now,
    };

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
      updates.defaultValue = args.data.defaultValue;
    }
    if (args.data.validationRules !== undefined) {
      updates.validationRules = args.data.validationRules;
    }
    if (args.data.options !== undefined) updates.options = args.data.options;
    if (args.data.uiConfig !== undefined) updates.uiConfig = args.data.uiConfig;
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
