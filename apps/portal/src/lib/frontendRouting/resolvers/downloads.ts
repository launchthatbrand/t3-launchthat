import type { Doc, Id } from "@/convex/_generated/dataModel";

import type { FetchQueryLike } from "../fetchQueryAdapter";

const isConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

interface EntityRecord {
  id: string;
  postTypeSlug?: string | null;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  status?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  organizationId?: string | null;
}

export async function resolveDownloadPost(args: {
  segments: string[];
  slug: string;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQueryLike;
  readEntity: unknown;
  listEntities: unknown;
}): Promise<Doc<"posts"> | null> {
  const isDownloadRoute = ["download", "downloads"].includes(
    args.segments[0]?.toLowerCase() ?? "",
  );
  if (!isDownloadRoute) return null;
  if (!args.organizationId) return null;

  const orgString = String(args.organizationId);

  let entity: EntityRecord | null = null;

  if (isConvexId(args.slug)) {
    const byId =
      (await args.fetchQuery<EntityRecord | null>(args.readEntity, {
        postTypeSlug: "downloads",
        id: args.slug,
        organizationId: orgString,
      })) ?? null;
    entity = byId;
  }

  if (!entity) {
    const list =
      (await args.fetchQuery<EntityRecord[] | null>(args.listEntities, {
        postTypeSlug: "downloads",
        organizationId: orgString,
        filters: { slug: args.slug, limit: 1 },
      })) ?? null;
    entity = Array.isArray(list) ? (list[0] ?? null) : null;
  }

  if (!entity) return null;

  const createdAt = entity.createdAt ?? Date.now();
  const updatedAt = entity.updatedAt ?? createdAt;
  const status = entity.status === "published" ? "published" : "draft";

  return {
    _id: `custom:downloads:${entity.id}`,
    _creationTime: createdAt,
    organizationId: args.organizationId,
    postTypeSlug: "downloads",
    slug: entity.slug ?? args.slug,
    title: entity.title ?? "Download",
    excerpt: entity.excerpt ?? undefined,
    content: entity.content ?? "",
    status,
    createdAt,
    updatedAt,
  } as unknown as Doc<"posts">;
}
