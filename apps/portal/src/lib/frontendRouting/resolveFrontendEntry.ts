import type { Doc, Id } from "@/convex/_generated/dataModel";

import { findPostTypeBySingleSlug } from "~/lib/plugins/frontend";
import { resolveDownloadPost } from "./resolvers/downloads";

type FetchQuery = <TResult>(fn: unknown, args: unknown) => Promise<TResult>;

const looksLikeConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

export async function resolveFrontendEntry(args: {
  segments: string[];
  slug: string;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQuery;
  readEntity: unknown;
  listEntities: unknown;
}): Promise<{ post: Doc<"posts"> } | null> {
  const normalizeEntityPost = (entity: unknown): Doc<"posts"> | null => {
    if (!entity || typeof entity !== "object") return null;
    const raw = entity as Record<string, unknown>;
    const id = raw._id ?? raw.id;
    if (typeof id !== "string") return null;
    return { ...raw, _id: id } as unknown as Doc<"posts">;
  };

  const downloadPost = await resolveDownloadPost(args);
  if (downloadPost) return { post: downloadPost };

  // Support nested routing shapes (e.g. /course/:courseSlug/lesson/:lessonSlug)
  // by scanning for the *last* `singleSlug` marker in the path and using the
  // segment immediately after it as the candidate slug.
  let pluginMatch: ReturnType<typeof findPostTypeBySingleSlug> = null;
  let candidateSlug: string | null = null;

  for (let i = 0; i < args.segments.length - 1; i += 1) {
    const segment = (args.segments[i] ?? "").toLowerCase();
    if (!segment) continue;
    const found = findPostTypeBySingleSlug(segment);
    if (!found) continue;

    const next = args.segments[i + 1]?.trim();
    if (!next) continue;

    pluginMatch = found;
    candidateSlug = next;
  }

  // Fallback to the legacy behavior for simple routes like /{singleSlug}/{slug}
  // (where the singleSlug is the first segment and the slug is derived from the URL).
  if (!pluginMatch && args.segments.length >= 2) {
    const baseSegment = (args.segments[0] ?? "").toLowerCase();
    pluginMatch = baseSegment ? findPostTypeBySingleSlug(baseSegment) : null;
    candidateSlug = args.slug;
  }

  if (pluginMatch) {
    const organizationId = args.organizationId
      ? String(args.organizationId)
      : undefined;
    const candidate = candidateSlug ?? args.slug;
    const readEntityFn: unknown = args.readEntity;
    const listEntitiesFn: unknown = args.listEntities;

    // Fast-path: allow ID-based access when the slug is actually a Convex id.
    if (looksLikeConvexId(candidate)) {
      const entity = await args.fetchQuery(readEntityFn, {
        postTypeSlug: pluginMatch.postType.slug,
        id: candidate,
        organizationId,
      });
      const normalized = normalizeEntityPost(entity);
      if (normalized) return { post: normalized };
    }

    // Default: resolve by slug via listEntities (readEntity only supports id).
    const results = await args.fetchQuery(listEntitiesFn, {
      postTypeSlug: pluginMatch.postType.slug,
      organizationId,
      filters: { slug: candidate, status: "published", limit: 1 },
    });
    if (Array.isArray(results) && results.length > 0) {
      const normalized = normalizeEntityPost(results[0]);
      if (normalized) return { post: normalized };
    }
  }

  return null;
}
