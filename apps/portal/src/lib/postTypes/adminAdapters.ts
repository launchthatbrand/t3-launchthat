import type { Id } from "@/convex/_generated/dataModel";

/**
 * Admin editor unification helpers.
 *
 * We keep the metabox/runtime types in the portal modeled around `Doc<"posts">`
 * for now. For non-`posts` storage backends (custom tables / components), we
 * represent records in the admin UI using *synthetic* string IDs and adapt
 * reads/writes through backend-specific adapters.
 */

export const SYNTHETIC_ID_PREFIX = "custom:";

export interface SyntheticIdParts {
  postTypeSlug: string;
  rawId: string;
}

/**
 * Encode a synthetic admin entry id for a non-core post type record.
 *
 * Format: `custom:{postTypeSlug}:{rawId}`
 */
export const encodeSyntheticId = (parts: SyntheticIdParts): string => {
  const postTypeSlug = parts.postTypeSlug.toLowerCase();
  return `${SYNTHETIC_ID_PREFIX}${postTypeSlug}:${parts.rawId}`;
};

export const decodeSyntheticId = (
  value?: string | null,
): SyntheticIdParts | null => {
  if (!value) return null;
  if (!value.startsWith(SYNTHETIC_ID_PREFIX)) return null;
  const remainder = value.slice(SYNTHETIC_ID_PREFIX.length);
  const [postTypeSlug, ...rest] = remainder.split(":");
  const rawId = rest.join(":");
  if (!postTypeSlug || !rawId) return null;
  return { postTypeSlug, rawId };
};

export interface AdminStorageAdapter {
  /**
   * True if this adapter owns the post type slug.
   */
  supportsPostType: (postTypeSlug: string) => boolean;

  /**
   * Convert an app-level ID into the admin editor's entry id string.
   *
   * For core posts: returns the real `Id<"posts">`.
   * For custom tables: returns a synthetic `custom:{slug}:{rawId}` id string.
   */
  toAdminEntryId: (postTypeSlug: string, rawId: string) => string;

  /**
   * Convert an admin entry id string back into its raw ID.
   * Returns null if the ID does not belong to this adapter.
   */
  toRawId: (postTypeSlug: string, adminEntryId: string) => string | null;
}

export interface AdminMetaAdapter {
  supportsPostType: (postTypeSlug: string) => boolean;
  /**
   * Normalize organizationId typing for Convex calls.
   */
  normalizeOrganizationId: (
    organizationId?: string,
  ) => Id<"organizations"> | undefined;
}

export type AdminEditorStatus = "published" | "draft" | "archived";

export interface AdminEntityAdapter {
  supportsPostType: (postTypeSlug: string) => boolean;

  /**
   * Convert the admin editor's entry id into the raw entity id used by the
   * backend CRUD router.
   *
   * For core posts: this is the same as `adminEntryId`.
   * For custom tables: decode synthetic ids into raw ids.
   */
  toEntityId: (postTypeSlug: string, adminEntryId: string) => string | null;

  /**
   * Build the payload passed to `api.plugins.entity.mutations.saveEntity`.
   * Kept `unknown` so each post type can define its own fields.
   */
  buildCreateData: (args: {
    postTypeSlug: string;
    organizationId?: Id<"organizations">;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: AdminEditorStatus;
    metaPayload: Record<string, unknown>;
  }) => Record<string, unknown>;

  /**
   * Build the payload passed to `api.plugins.entity.mutations.updateEntity`.
   */
  buildUpdateData: (args: {
    postTypeSlug: string;
    organizationId?: Id<"organizations">;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: AdminEditorStatus;
    metaPayload: Record<string, unknown>;
  }) => Record<string, unknown>;
}

export interface AdminPostSaveAdapter {
  supportsPostType: (postTypeSlug: string) => boolean;

  afterSave: (args: {
    postTypeSlug: string;
    organizationId?: Id<"organizations">;
    entityId: string;
    status: AdminEditorStatus;
    metaPayload: Record<string, unknown>;
    supportsTaxonomy: boolean;
    taxonomyTermIds: Id<"taxonomyTerms">[];

    publishDownload?: (args: {
      organizationId: Id<"organizations">;
      downloadId: Id<"downloads">;
    }) => Promise<unknown>;
    upsertDownloadMeta?: (args: {
      organizationId: Id<"organizations">;
      downloadId: Id<"downloads">;
      meta: Record<string, string | number | boolean | null>;
    }) => Promise<unknown>;
    upsertMediaItemMeta?: (args: {
      organizationId: Id<"organizations">;
      mediaItemId: Id<"mediaItems">;
      meta: Record<string, string | number | boolean | null>;
    }) => Promise<unknown>;
    setObjectTerms?: (args: {
      organizationId: Id<"organizations">;
      objectId: string;
      postTypeSlug: string;
      termIds: Id<"taxonomyTerms">[];
    }) => Promise<unknown>;
  }) => Promise<void>;
}

/**
 * Registry pattern (filled in incrementally).
 * For now, this gives us a single import location for admin adapters.
 */
export const ADMIN_STORAGE_ADAPTERS: AdminStorageAdapter[] = [];
export const ADMIN_META_ADAPTERS: AdminMetaAdapter[] = [];
export const ADMIN_ENTITY_ADAPTERS: AdminEntityAdapter[] = [];
export const ADMIN_POST_SAVE_ADAPTERS: AdminPostSaveAdapter[] = [];

export const findStorageAdapter = (postTypeSlug: string) =>
  ADMIN_STORAGE_ADAPTERS.find((adapter) =>
    adapter.supportsPostType(postTypeSlug),
  );

export const findMetaAdapter = (postTypeSlug: string) =>
  ADMIN_META_ADAPTERS.find((adapter) => adapter.supportsPostType(postTypeSlug));

export const findEntityAdapter = (postTypeSlug: string) =>
  ADMIN_ENTITY_ADAPTERS.find((adapter) => adapter.supportsPostType(postTypeSlug));

export const findPostSaveAdapter = (postTypeSlug: string) =>
  ADMIN_POST_SAVE_ADAPTERS.find((adapter) =>
    adapter.supportsPostType(postTypeSlug),
  );

/**
 * Built-in adapters for core custom-table post types.
 *
 * These *do not* implement CRUD yet; they only define how IDs are represented
 * in the admin editor layer.
 */
const downloadsAdapter: AdminStorageAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "downloads" || slug === "download";
  },
  toAdminEntryId: (postTypeSlug, rawId) =>
    encodeSyntheticId({ postTypeSlug, rawId }),
  toRawId: (postTypeSlug, adminEntryId) => {
    const slug = postTypeSlug.toLowerCase();
    const decoded = decodeSyntheticId(adminEntryId);
    if (!decoded) return null;
    if (
      decoded.postTypeSlug !== slug &&
      !(slug === "downloads" && decoded.postTypeSlug === "download")
    ) {
      return null;
    }
    return decoded.rawId;
  },
};

const attachmentsAdapter: AdminStorageAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "attachments" || slug === "attachment";
  },
  toAdminEntryId: (postTypeSlug, rawId) =>
    encodeSyntheticId({ postTypeSlug, rawId }),
  toRawId: (postTypeSlug, adminEntryId) => {
    const slug = postTypeSlug.toLowerCase();
    const decoded = decodeSyntheticId(adminEntryId);
    if (!decoded) return null;
    if (
      decoded.postTypeSlug !== slug &&
      !(slug === "attachments" && decoded.postTypeSlug === "attachment")
    ) {
      return null;
    }
    return decoded.rawId;
  },
};

ADMIN_STORAGE_ADAPTERS.push(downloadsAdapter, attachmentsAdapter);

const defaultEntityAdapter: AdminEntityAdapter = {
  supportsPostType: () => true,
  toEntityId: (_postTypeSlug, adminEntryId) => adminEntryId,
  buildCreateData: ({
    organizationId,
    title,
    content,
    excerpt,
    slug,
    status,
    metaPayload,
    postTypeSlug,
  }) => ({
    postTypeSlug,
    title,
    content,
    excerpt,
    slug,
    status,
    organizationId: organizationId ? String(organizationId) : undefined,
    meta: metaPayload as Record<string, string | number | boolean | null>,
  }),
  buildUpdateData: ({
    organizationId,
    title,
    content,
    excerpt,
    slug,
    status,
    metaPayload,
    postTypeSlug,
  }) => ({
    postTypeSlug,
    title,
    content,
    excerpt,
    slug,
    status,
    organizationId: organizationId ? String(organizationId) : undefined,
    meta: metaPayload as Record<string, string | number | boolean | null>,
  }),
};

const downloadsEntityAdapter: AdminEntityAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "downloads" || slug === "download";
  },
  toEntityId: (postTypeSlug, adminEntryId) => {
    const decoded = decodeSyntheticId(adminEntryId);
    if (!decoded) return null;
    const slug = postTypeSlug.toLowerCase();
    if (decoded.postTypeSlug !== slug && !(slug === "downloads" && decoded.postTypeSlug === "download")) {
      return null;
    }
    return decoded.rawId;
  },
  buildCreateData: ({
    organizationId,
    title,
    content,
    slug,
    status,
    metaPayload,
  }) => ({
    organizationId: organizationId ? String(organizationId) : undefined,
    title: title.trim() ? title : undefined,
    slug,
    status,
    content,
    description: typeof metaPayload.description === "string" ? metaPayload.description : undefined,
    mediaItemId: metaPayload.mediaItemId,
    accessKind: metaPayload.accessKind,
  }),
  buildUpdateData: ({
    organizationId,
    title,
    content,
    slug,
    status,
    metaPayload,
  }) => ({
    organizationId: organizationId ? String(organizationId) : undefined,
    title: title.trim() ? title : undefined,
    slug,
    status,
    content,
    description: typeof metaPayload.description === "string" ? metaPayload.description : undefined,
    mediaItemId: metaPayload.mediaItemId,
    accessKind: metaPayload.accessKind,
  }),
};

const attachmentsEntityAdapter: AdminEntityAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "attachments" || slug === "attachment";
  },
  toEntityId: (postTypeSlug, adminEntryId) => {
    const decoded = decodeSyntheticId(adminEntryId);
    if (!decoded) return null;
    const slug = postTypeSlug.toLowerCase();
    if (
      decoded.postTypeSlug !== slug &&
      !(slug === "attachments" && decoded.postTypeSlug === "attachment")
    ) {
      return null;
    }
    return decoded.rawId;
  },
  buildCreateData: () => {
    // Attachments are created through upload flows, not the editor.
    return {};
  },
  buildUpdateData: ({ title, status, metaPayload }) => ({
    title,
    status,
    caption: metaPayload.caption,
    alt: metaPayload.alt,
  }),
};

ADMIN_ENTITY_ADAPTERS.push(
  downloadsEntityAdapter,
  attachmentsEntityAdapter,
  defaultEntityAdapter,
);

const downloadsPostSaveAdapter: AdminPostSaveAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "downloads" || slug === "download";
  },
  afterSave: async ({
    organizationId,
    entityId,
    status,
    metaPayload,
    supportsTaxonomy,
    taxonomyTermIds,
    publishDownload,
    upsertDownloadMeta,
    setObjectTerms,
    postTypeSlug,
  }) => {
    if (!organizationId) {
      throw new Error("Organization is required to save downloads.");
    }

    // Upsert custom meta (excluding domain/editor fields).
    if (upsertDownloadMeta) {
      const stripMetaKeys = new Set<string>([
        "title",
        "slug",
        "status",
        "content",
        "excerpt",
        "description",
        "mediaItemId",
        "accessKind",
      ]);
      const filtered = Object.fromEntries(
        Object.entries(metaPayload).filter(([key]) => !stripMetaKeys.has(key)),
      ) as Record<string, string | number | boolean | null>;
      if (Object.keys(filtered).length > 0) {
        await upsertDownloadMeta({
          organizationId,
          downloadId: entityId as unknown as Id<"downloads">,
          meta: filtered,
        });
      }
    }

    // Assign taxonomy terms (if enabled).
    if (supportsTaxonomy && setObjectTerms) {
      await setObjectTerms({
        organizationId,
        objectId: entityId,
        postTypeSlug,
        termIds: taxonomyTermIds,
      });
    }

    // Publish via action (copy-to-R2).
    if (status === "published" && publishDownload) {
      await publishDownload({
        organizationId,
        downloadId: entityId as unknown as Id<"downloads">,
      });
    }
  },
};

const attachmentsPostSaveAdapter: AdminPostSaveAdapter = {
  supportsPostType: (postTypeSlug) => {
    const slug = postTypeSlug.toLowerCase();
    return slug === "attachments" || slug === "attachment";
  },
  afterSave: async ({
    organizationId,
    entityId,
    metaPayload,
    supportsTaxonomy,
    taxonomyTermIds,
    upsertMediaItemMeta,
    setObjectTerms,
    postTypeSlug,
  }) => {
    if (!organizationId) {
      throw new Error("Organization is required to save attachments.");
    }

    if (upsertMediaItemMeta) {
      const stripMetaKeys = new Set<string>([
        "title",
        "slug",
        "status",
        "content",
        "excerpt",
        "caption",
        "alt",
      ]);
      const filtered = Object.fromEntries(
        Object.entries(metaPayload).filter(([key]) => !stripMetaKeys.has(key)),
      ) as Record<string, string | number | boolean | null>;
      if (Object.keys(filtered).length > 0) {
        await upsertMediaItemMeta({
          organizationId,
          mediaItemId: entityId as unknown as Id<"mediaItems">,
          meta: filtered,
        });
      }
    }

    if (supportsTaxonomy && setObjectTerms) {
      await setObjectTerms({
        organizationId,
        objectId: entityId,
        postTypeSlug,
        termIds: taxonomyTermIds,
      });
    }
  },
};

ADMIN_POST_SAVE_ADAPTERS.push(downloadsPostSaveAdapter, attachmentsPostSaveAdapter);

const defaultMetaAdapter: AdminMetaAdapter = {
  supportsPostType: () => true,
  normalizeOrganizationId: (organizationId) =>
    organizationId
      ? (organizationId as unknown as Id<"organizations">)
      : undefined,
};

ADMIN_META_ADAPTERS.push(defaultMetaAdapter);
