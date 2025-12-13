/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { v } from "convex/values";

import type { MutationCtx } from "../../_generated/server";
import type { PostTypeField } from "./lib/contentTypes";
import { mutation } from "../../_generated/server";
import {
  isPortalOrganizationValue,
  PORTAL_TENANT_ID,
  PORTAL_TENANT_SLUG,
} from "../../constants";
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
  postTypeMetaBoxValidator,
  postTypeRewriteValidator,
  postTypeStorageKindValidator,
  postTypeStorageTablesValidator,
  postTypeSupportsValidator,
} from "./schema";

const PORTAL_ORGANIZATION_ID = PORTAL_TENANT_ID as Id<"organizations">;

const DEFAULT_POST_STORAGE_TABLES = ["posts", "postsMeta"] as const;

const normalizeStorageTables = (tables: readonly string[]) =>
  [...tables].sort();

const storageTablesEqual = (
  a: readonly string[] | undefined,
  b: readonly string[],
) => {
  const sortedA = normalizeStorageTables(a ?? []);
  const sortedB = normalizeStorageTables(b);
  if (sortedA.length !== sortedB.length) {
    return false;
  }
  return sortedA.every((value, index) => value === sortedB[index]);
};

const normalizeMetaBoxes = (boxes?: Doc<"postTypes">["metaBoxes"]) =>
  (boxes ?? [])
    .map((box) => ({
      id: box.id,
      title: box.title,
      description: box.description ?? null,
      location: box.location ?? "main",
      priority: box.priority ?? null,
      fieldKeys: [...box.fieldKeys],
      rendererKey: box.rendererKey ?? null,
    }))
    .sort((a, b) => {
      const priorityDelta = (a.priority ?? 0) - (b.priority ?? 0);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return a.id.localeCompare(b.id);
    });

const metaBoxesEqual = (
  a?: Doc<"postTypes">["metaBoxes"],
  b?: Doc<"postTypes">["metaBoxes"],
) => {
  const normalizedA = normalizeMetaBoxes(a);
  const normalizedB = normalizeMetaBoxes(b);

  if (normalizedA.length !== normalizedB.length) {
    return false;
  }

  return normalizedA.every((box, index) => {
    const other = normalizedB[index];
    if (!other) return false;

    if (
      box.id !== other.id ||
      box.title !== other.title ||
      box.description !== other.description ||
      box.location !== other.location ||
      box.priority !== other.priority ||
      box.rendererKey !== other.rendererKey
    ) {
      return false;
    }

    if (box.fieldKeys.length !== other.fieldKeys.length) {
      return false;
    }

    return box.fieldKeys.every(
      (fieldKey, fieldIndex) => fieldKey === other.fieldKeys[fieldIndex],
    );
  });
};

interface DefaultPostTypeConfig {
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  supports?: Doc<"postTypes">["supports"];
  rewrite?: Doc<"postTypes">["rewrite"];
  adminMenu: Doc<"postTypes">["adminMenu"];
  storageKind?: "posts" | "custom" | "component";
  storageTables?: string[];
  metaBoxes?: Doc<"postTypes">["metaBoxes"];
}

type DefaultFieldSeed = PostTypeField & {
  isBuiltIn?: boolean;
  isSystem?: boolean;
};

const DEFAULT_POST_TYPE_FIELDS: Record<string, DefaultFieldSeed[]> = {
  helpdeskarticles: [
    {
      name: "Trigger phrases",
      key: "trigger_phrases",
      type: "textarea",
      description:
        "Comma or newline-separated keywords that should route visitors to this article.",
      required: false,
      searchable: false,
      filterable: false,
      order: 10,
    },
    {
      name: "Trigger match mode",
      key: "trigger_match_mode",
      type: "select",
      description: "Controls how visitor messages are matched against phrases.",
      defaultValue: "contains",
      options: [
        { label: "Contains", value: "contains" },
        { label: "Exact", value: "exact" },
        { label: "Regex", value: "regex" },
      ],
      order: 11,
    },
    {
      name: "Trigger priority",
      key: "trigger_priority",
      type: "number",
      description: "Higher priorities win when multiple articles match.",
      defaultValue: 0,
      order: 12,
    },
    {
      name: "Trigger active",
      key: "trigger_is_active",
      type: "boolean",
      description: "Disable to skip this article when auto-responding.",
      defaultValue: true,
      order: 13,
    },
  ],
};

const DEFAULT_POST_TYPES: DefaultPostTypeConfig[] = [
  {
    name: "Posts",
    slug: "posts",
    description: "Standard blog posts with categories, tags, comments.",
    isPublic: true,
    supports: {
      title: true,
      editor: true,
      excerpt: true,
      attachments: true,
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
  },
  {
    name: "Pages",
    slug: "pages",
    description: "Static pages with hierarchical parent/child support.",
    isPublic: true,
    supports: {
      title: true,
      editor: true,
      attachments: true,
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
  },
  {
    name: "Attachments",
    slug: "attachments",
    description:
      "Media files uploaded to the media library (stored as attachments).",
    isPublic: false,
    supports: {
      title: true,
      attachments: true,
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
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
    storageKind: "posts",
    storageTables: [...DEFAULT_POST_STORAGE_TABLES],
  },
];

const DEFAULT_POST_TYPE_SLUG_SET = new Set(
  DEFAULT_POST_TYPES.map((type) => type.slug),
);

async function seedDefaultPostTypes(ctx: MutationCtx) {
  const now = Date.now();
  const created: string[] = [];

  for (const type of DEFAULT_POST_TYPES) {
    const existing = await ctx.db
      .query("postTypes")
      .withIndex("by_slug", (q) => q.eq("slug", type.slug))
      .unique();
    const desiredStorageKind = type.storageKind ?? "posts";
    const desiredStorageTables =
      type.storageTables ??
      (desiredStorageKind === "posts" ? [...DEFAULT_POST_STORAGE_TABLES] : []);
    const adminMenu = type.adminMenu ?? {
      enabled: false,
      label: type.name,
      slug: type.slug,
    };

    let postTypeDoc = existing ?? null;

    const desiredMetaBoxes = type.metaBoxes;

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
          ...adminMenu,
          enabled: adminMenu.enabled,
        },
        storageKind: desiredStorageKind,
        storageTables: desiredStorageTables,
        metaBoxes: desiredMetaBoxes,
        fieldCount: 0,
        entryCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      await createSystemFields(ctx, id);
      postTypeDoc = await ctx.db.get(id);
      created.push(type.slug);
    } else {
      const storageKindNeedsUpdate =
        (existing.storageKind ?? "posts") !== desiredStorageKind;
      const storageTablesNeedsUpdate = !storageTablesEqual(
        existing.storageTables,
        desiredStorageTables,
      );
      const metaBoxesNeedUpdate =
        desiredMetaBoxes !== undefined &&
        !metaBoxesEqual(existing.metaBoxes, desiredMetaBoxes);

      if (
        storageKindNeedsUpdate ||
        storageTablesNeedsUpdate ||
        metaBoxesNeedUpdate
      ) {
        await ctx.db.patch(existing._id, {
          ...(storageKindNeedsUpdate
            ? {
                storageKind: desiredStorageKind,
                storageTables: desiredStorageTables,
              }
            : {}),
          ...(storageTablesNeedsUpdate && !storageKindNeedsUpdate
            ? { storageTables: desiredStorageTables }
            : {}),
          ...(metaBoxesNeedUpdate ? { metaBoxes: desiredMetaBoxes } : {}),
          updatedAt: now,
        });
      }
      postTypeDoc = existing;
    }

    if (postTypeDoc?.isBuiltIn) {
      const shouldClearOrgScope =
        postTypeDoc.organizationId !== undefined &&
        (postTypeDoc.organizationId === PORTAL_TENANT_SLUG ||
          postTypeDoc.organizationId === PORTAL_ORGANIZATION_ID);
      const shouldClearEnabledOrgs =
        postTypeDoc.enabledOrganizationIds !== undefined;

      if (shouldClearOrgScope || shouldClearEnabledOrgs) {
        await ctx.db.patch(postTypeDoc._id, {
          ...(shouldClearOrgScope ? { organizationId: undefined } : {}),
          ...(shouldClearEnabledOrgs
            ? { enabledOrganizationIds: undefined }
            : {}),
          updatedAt: Date.now(),
        });
        postTypeDoc = await ctx.db.get(postTypeDoc._id);
      }
    }

    if (postTypeDoc) {
      await ensureDefaultFieldsForPostType(ctx, postTypeDoc);
    }
  }

  const globalBuiltIns = await ctx.db.query("postTypes").collect();
  const obsoleteBuiltIns = globalBuiltIns.filter(
    (type) =>
      type.isBuiltIn &&
      type.organizationId === undefined &&
      !DEFAULT_POST_TYPE_SLUG_SET.has(type.slug),
  );

  await Promise.all(
    obsoleteBuiltIns.map(async (type) => {
      const fields = await ctx.db
        .query("postTypeFields")
        .withIndex("by_postType", (q) => q.eq("postTypeId", type._id))
        .collect();
      await Promise.all(fields.map((field) => ctx.db.delete(field._id)));
      await ctx.db.delete(type._id);
    }),
  );

  return created;
}

async function ensureDefaultFieldsForPostType(
  ctx: MutationCtx,
  postType: Doc<"postTypes">,
) {
  const defaults = DEFAULT_POST_TYPE_FIELDS[postType.slug];
  if (!defaults || defaults.length === 0) {
    return;
  }

  let inserted = false;

  for (const field of defaults) {
    const existingField = await getPostTypeFieldByKey(
      ctx,
      postType._id,
      field.key,
    );
    if (existingField) continue;

    const fieldInput: PostTypeField = {
      name: field.name,
      key: field.key,
      type: field.type,
      description: field.description,
      required: field.required ?? false,
      searchable: field.searchable ?? false,
      filterable: field.filterable ?? false,
      defaultValue: field.defaultValue,
      validationRules: field.validationRules,
      options: field.options,
      isSystem: field.isSystem ?? false,
      isBuiltIn: field.isBuiltIn ?? true,
      uiConfig: field.uiConfig,
      order: field.order,
    };

    validateField(fieldInput);
    const now = Date.now();

    await ctx.db.insert("postTypeFields", {
      postTypeId: postType._id,
      name: fieldInput.name,
      key: fieldInput.key,
      type: fieldInput.type,
      description: fieldInput.description,
      required: fieldInput.required ?? false,
      searchable: fieldInput.searchable ?? false,
      filterable: fieldInput.filterable ?? false,
      defaultValue:
        fieldInput.defaultValue as Doc<"postTypeFields">["defaultValue"],
      validationRules:
        fieldInput.validationRules as Doc<"postTypeFields">["validationRules"],
      options: fieldInput.options as Doc<"postTypeFields">["options"],
      isSystem: fieldInput.isSystem ?? false,
      isBuiltIn: fieldInput.isBuiltIn ?? true,
      uiConfig: (fieldInput.uiConfig ??
        null) as Doc<"postTypeFields">["uiConfig"],
      order: fieldInput.order ?? 0,
      createdAt: now,
    });
    inserted = true;
  }

  if (inserted) {
    await updateFieldCount(ctx, postType._id);
  }
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
    storageKind: v.optional(postTypeStorageKindValidator),
    storageTables: v.optional(postTypeStorageTablesValidator),
    metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
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
    const storageKind = args.storageKind ?? "posts";
    const storageTables =
      args.storageTables ??
      (storageKind === "posts" ? [...DEFAULT_POST_STORAGE_TABLES] : []);
    if (storageKind === "custom" && storageTables.length === 0) {
      throw new Error("Custom post types must specify storage tables");
    }
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
      storageKind,
      storageTables,
      metaBoxes: args.metaBoxes,
      fieldCount: 0,
      entryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createSystemFields(ctx, id);
    const created = await ctx.db.get(id);
    if (created) {
      await ensureDefaultFieldsForPostType(ctx, created);
    }
    return id;
  },
});

const organizationAccessValidator = v.union(
  v.id("organizations"),
  v.literal(PORTAL_TENANT_SLUG),
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
        storageKind: v.optional(postTypeStorageKindValidator),
        storageTables: v.optional(postTypeStorageTablesValidator),
        metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const resolvedOrgId = resolveScopedOrganizationId(args.organizationId);
    const isPortal = isPortalOrganizationValue(args.organizationId);
    const targetOrgId = isPortal
      ? PORTAL_ORGANIZATION_ID
      : (args.organizationId as Id<"organizations">);

    let postType = await fetchScopedPostType(ctx, args.slug, resolvedOrgId);

    if (!postType) {
      if (args.definition) {
        const timestamp = Date.now();
        const storageKind = args.definition.storageKind ?? "posts";
        const storageTables =
          args.definition.storageTables ??
          (storageKind === "posts" ? [...DEFAULT_POST_STORAGE_TABLES] : []);
        if (storageKind === "custom" && storageTables.length === 0) {
          throw new Error("Custom post types must specify storage tables");
        }
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
          storageKind,
          storageTables,
          metaBoxes: args.definition.metaBoxes,
          fieldCount: 0,
          entryCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        await createSystemFields(ctx, id);
        postType = await ctx.db.get(id);
        if (postType) {
          await ensureDefaultFieldsForPostType(ctx, postType);
        }
      } else if (resolvedOrgId) {
        postType = await clonePostTypeForOrganization(
          ctx,
          args.slug,
          resolvedOrgId,
        );
      }
    } else if (args.definition) {
      console.log("[postTypes.enableForOrganization] sync definition", {
        slug: args.slug,
        org: resolvedOrgId,
        hasAdminMenu: Boolean(args.definition.adminMenu),
        adminMenu: args.definition.adminMenu,
        storageKind: args.definition.storageKind,
        storageTables: args.definition.storageTables,
      });
      const desiredStorageKind = args.definition.storageKind ?? "posts";
      const desiredStorageTables =
        args.definition.storageTables ??
        (desiredStorageKind === "posts"
          ? [...DEFAULT_POST_STORAGE_TABLES]
          : []);
      const desiredMetaBoxes = args.definition.metaBoxes;
      const desiredAdminMenu = args.definition.adminMenu;
      const desiredSupports = args.definition.supports;
      const desiredRewrite = args.definition.rewrite;
      const desiredEnableApi = args.definition.enableApi ?? postType.enableApi;
      const desiredIncludeTimestamps =
        args.definition.includeTimestamps ?? postType.includeTimestamps;
      const desiredEnableVersioning =
        args.definition.enableVersioning ?? postType.enableVersioning;

      // Force-sync all definition-backed fields on enable to match plugin JSON.
      const timestamp = Date.now();
      await ctx.db.patch(postType._id, {
        storageKind: desiredStorageKind,
        storageTables: desiredStorageTables,
        ...(desiredMetaBoxes !== undefined
          ? { metaBoxes: desiredMetaBoxes }
          : {}),
        ...(desiredAdminMenu !== undefined
          ? { adminMenu: desiredAdminMenu }
          : {}),
        ...(desiredSupports !== undefined ? { supports: desiredSupports } : {}),
        ...(desiredRewrite !== undefined ? { rewrite: desiredRewrite } : {}),
        enableApi: desiredEnableApi,
        includeTimestamps: desiredIncludeTimestamps,
        enableVersioning: desiredEnableVersioning,
        updatedAt: timestamp,
      });
      console.log(
        "[postTypes.enableForOrganization] applied definition patch",
        {
          slug: args.slug,
          org: resolvedOrgId,
          adminMenu: desiredAdminMenu,
          storageKind: desiredStorageKind,
          storageTables: desiredStorageTables,
        },
      );
      postType = {
        ...postType,
        storageKind: desiredStorageKind,
        storageTables: desiredStorageTables,
        ...(desiredMetaBoxes !== undefined
          ? { metaBoxes: desiredMetaBoxes }
          : {}),
        ...(desiredAdminMenu !== undefined
          ? { adminMenu: desiredAdminMenu }
          : {}),
        ...(desiredSupports !== undefined ? { supports: desiredSupports } : {}),
        ...(desiredRewrite !== undefined ? { rewrite: desiredRewrite } : {}),
        enableApi: desiredEnableApi,
        includeTimestamps: desiredIncludeTimestamps,
        enableVersioning: desiredEnableVersioning,
        updatedAt: timestamp,
      };
    }

    if (
      !postType ||
      (resolvedOrgId &&
        postType.organizationId &&
        postType.organizationId !== resolvedOrgId)
    ) {
      throw new Error(`Post type with slug ${args.slug} not found`);
    }

    if (postType.isBuiltIn && postType.organizationId === undefined) {
      return { updated: false };
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
      if (existing.includes(targetOrgId)) {
        return { updated: false };
      }
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: [...existing, targetOrgId],
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    if (existing.includes(targetOrgId)) {
      return { updated: false };
    }

    await ctx.db.patch(postType._id, {
      enabledOrganizationIds: [...existing, targetOrgId],
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
    const isPortal = isPortalOrganizationValue(args.organizationId);
    const targetOrgId = isPortal
      ? PORTAL_ORGANIZATION_ID
      : (args.organizationId as Id<"organizations">);

    const postType = await fetchScopedPostType(ctx, args.slug, resolvedOrgId);

    if (
      !postType ||
      (resolvedOrgId &&
        postType.organizationId &&
        postType.organizationId !== resolvedOrgId)
    ) {
      throw new Error(`Post type with slug ${args.slug} not found`);
    }

    if (postType.isBuiltIn && postType.organizationId === undefined) {
      return { updated: false };
    }

    const enabledOrgIds = postType.enabledOrganizationIds;
    const existing = enabledOrgIds ?? [];
    const matchesTargetOrg =
      postType.organizationId === targetOrgId ||
      (isPortalOrganizationValue(postType.organizationId) &&
        targetOrgId === PORTAL_ORGANIZATION_ID);
    const hasLegacyOwnership =
      enabledOrgIds === undefined &&
      (matchesTargetOrg || (isPortal && postType.organizationId === undefined));

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

    if (isPortal) {
      if (!existing.includes(targetOrgId)) {
        return { updated: false };
      }
      const next = existing.filter((id) => id !== targetOrgId);
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: next,
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    if (!existing.includes(targetOrgId) && !hasLegacyOwnership) {
      return { updated: false };
    }

    if (hasLegacyOwnership) {
      await ctx.db.patch(postType._id, {
        enabledOrganizationIds: [],
        updatedAt: Date.now(),
      });
      return { updated: true };
    }

    const next = existing.filter((id) => id !== targetOrgId);

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
      storageKind: v.optional(postTypeStorageKindValidator),
      storageTables: v.optional(postTypeStorageTablesValidator),
      metaBoxes: v.optional(v.array(postTypeMetaBoxValidator)),
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

    const patchPayload: Partial<Doc<"postTypes">> = {
      ...args.data,
      updatedAt: Date.now(),
    };

    if (
      args.data.storageKind !== undefined ||
      args.data.storageTables !== undefined
    ) {
      const storageKind =
        args.data.storageKind ?? postType.storageKind ?? "posts";
      const storageTables =
        args.data.storageTables ??
        (storageKind === "posts"
          ? [...DEFAULT_POST_STORAGE_TABLES]
          : (postType.storageTables ?? []));
      if (storageKind === "custom" && storageTables.length === 0) {
        throw new Error("Custom post types must specify storage tables");
      }
      patchPayload.storageKind = storageKind;
      patchPayload.storageTables = storageTables;
    }

    if (args.data.metaBoxes !== undefined) {
      patchPayload.metaBoxes = args.data.metaBoxes;
    }

    await ctx.db.patch(args.id, patchPayload);

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
