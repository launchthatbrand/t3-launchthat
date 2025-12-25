import type { Id } from "@/convex/_generated/dataModel";
import { findEntityAdapter, findPostSaveAdapter } from "@/lib/postTypes/adminAdapters";

import { generateSlugFromTitle } from "@/lib/blog";
export type AdminSaveStatus = "published" | "draft" | "archived";

export type AdminSaveResult = {
  entityId: string;
  resolvedSlug: string;
};

type SaveEntityFn = (args: {
  postTypeSlug: string;
  data: unknown;
}) => Promise<{ id?: string } | null | undefined>;

type UpdateEntityFn = (args: {
  postTypeSlug: string;
  id: string;
  data: unknown;
}) => Promise<{ id?: string } | null | undefined>;

export async function saveAdminEntry(args: {
  postTypeSlug: string;
  organizationId?: Id<"organizations">;
  adminEntryId?: string | null;
  isNewRecord: boolean;
  title: string;
  content: string;
  excerpt: string;
  slugValue: string;
  status: AdminSaveStatus;
  metaPayload: Record<string, unknown>;

  saveEntity: SaveEntityFn;
  updateEntity: UpdateEntityFn;

  /**
   * Custom-table-specific side effects (kept in the UI layer for now; adapters
   * will call these).
   */
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
    termIds: Array<Id<"taxonomyTerms">>;
  }) => Promise<unknown>;
  taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
  supportsTaxonomy?: boolean;
}): Promise<AdminSaveResult> {
  const normalizedTitle = args.title.trim();
  const manualSlug = args.slugValue.trim();
  const baseSlug = manualSlug || generateSlugFromTitle(normalizedTitle) || "";
  const resolvedSlug = generateSlugFromTitle(baseSlug) || `post-${Date.now()}`;

  const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
  const adapter = findEntityAdapter(normalizedPostTypeSlug);
  const metaPayload = args.metaPayload;

  const createData = (adapter ?? null)?.buildCreateData({
    postTypeSlug: normalizedPostTypeSlug,
    organizationId: args.organizationId,
    title: normalizedTitle,
    content: args.content,
    excerpt: args.excerpt,
    slug: resolvedSlug,
    status: args.status,
    metaPayload,
  });

  const updateData = (adapter ?? null)?.buildUpdateData({
    postTypeSlug: normalizedPostTypeSlug,
    organizationId: args.organizationId,
    title: normalizedTitle,
    content: args.content,
    excerpt: args.excerpt,
    slug: resolvedSlug,
    status: args.status,
    metaPayload,
  });

  let entityId: string;
  if (args.isNewRecord) {
    const created = await args.saveEntity({
      postTypeSlug: normalizedPostTypeSlug,
      data: createData,
    });
    if (!created?.id) {
      throw new Error("Failed to create entry.");
    }
    entityId = created.id;
  } else {
    if (!args.adminEntryId) {
      throw new Error("Missing entry id.");
    }

    const rawId =
      (adapter ?? null)?.toEntityId(normalizedPostTypeSlug, args.adminEntryId) ??
      args.adminEntryId;
    if (!rawId) {
      throw new Error("Invalid entry id.");
    }

    const updated = await args.updateEntity({
      postTypeSlug: normalizedPostTypeSlug,
      id: rawId,
      data: updateData,
    });
    entityId = updated?.id ?? rawId;
  }

  const postSaveAdapter = findPostSaveAdapter(normalizedPostTypeSlug);
  if (postSaveAdapter) {
    await postSaveAdapter.afterSave({
      postTypeSlug: args.postTypeSlug,
      organizationId: args.organizationId,
      entityId,
      status: args.status,
      metaPayload,
      supportsTaxonomy: Boolean(args.supportsTaxonomy),
      taxonomyTermIds: args.taxonomyTermIds ?? [],
      publishDownload: args.publishDownload,
      upsertDownloadMeta: args.upsertDownloadMeta,
      upsertMediaItemMeta: args.upsertMediaItemMeta,
      setObjectTerms: args.setObjectTerms,
    });
  }

  return { entityId, resolvedSlug };
}


