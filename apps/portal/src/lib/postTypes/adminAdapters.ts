import type { Id } from "@/convex/_generated/dataModel";

/**
 * Admin editor unification helpers.
 *
 * We keep the metabox/runtime types in the portal modeled around `Doc<"posts">`
 * for now. For non-`posts` storage backends (custom tables / components), we
 * represent records in the admin UI using *synthetic* string IDs and adapt
 * reads/writes through backend-specific adapters.
 */

export const SYNTHETIC_ID_PREFIX = "custom:" as const;

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

/**
 * Registry pattern (filled in incrementally).
 * For now, this gives us a single import location for admin adapters.
 */
export const ADMIN_STORAGE_ADAPTERS: AdminStorageAdapter[] = [];
export const ADMIN_META_ADAPTERS: AdminMetaAdapter[] = [];

export const findStorageAdapter = (postTypeSlug: string) =>
  ADMIN_STORAGE_ADAPTERS.find((adapter) =>
    adapter.supportsPostType(postTypeSlug),
  );

export const findMetaAdapter = (postTypeSlug: string) =>
  ADMIN_META_ADAPTERS.find((adapter) => adapter.supportsPostType(postTypeSlug));

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

const defaultMetaAdapter: AdminMetaAdapter = {
  supportsPostType: () => true,
  normalizeOrganizationId: (organizationId) =>
    organizationId
      ? (organizationId as unknown as Id<"organizations">)
      : undefined,
};

ADMIN_META_ADAPTERS.push(defaultMetaAdapter);
