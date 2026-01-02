import type { Doc, Id } from "@/convex/_generated/dataModel";

import type { FetchQueryLike } from "./fetchQueryAdapter";
import type { PostIdentifier } from "./postStores/types";
import { resolvePostViaStores } from "./postStores/resolvePostViaStores";
import { resolveDownloadPost } from "./resolvers/downloads";

const looksLikeConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

export async function resolveFrontendEntry(args: {
  segments: string[];
  slug: string;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQueryLike;
  getPostTypeBySingleSlugKey: unknown;
  readEntity: unknown;
  listEntities: unknown;
  // Convex generated API object (used by PostStores)
  api?: unknown;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<{ post: Doc<"posts">; resolvedBy: "downloads" | "entity" } | null> {
  const normalizeEntityPost = (
    entity: unknown,
    fallbackPostTypeSlug: string,
  ): Doc<"posts"> | null => {
    if (!entity || typeof entity !== "object") return null;
    const raw = entity as Record<string, unknown>;
    const id = raw._id ?? raw.id;
    if (typeof id !== "string") return null;
    const postTypeSlug =
      typeof raw.postTypeSlug === "string" && raw.postTypeSlug.trim().length > 0
        ? raw.postTypeSlug
        : fallbackPostTypeSlug;
    return { ...raw, _id: id, postTypeSlug } as unknown as Doc<"posts">;
  };

  const downloadPost = await resolveDownloadPost(args);
  if (downloadPost) return { post: downloadPost, resolvedBy: "downloads" };

  const normalizeRouteKey = (value: string) =>
    value
      .replace(/^\/+|\/+$/g, "")
      .trim()
      .toLowerCase();

  // Support nested routing shapes (e.g. /course/:courseSlug/lesson/:lessonSlug)
  // by scanning for the *last* `singleSlug` marker in the path and using the
  // segment immediately after it as the candidate slug.
  let postTypeSlug: string | null = null;
  let candidateSlug: string | null = null;

  for (let i = 0; i < args.segments.length - 1; i += 1) {
    const segment = (args.segments[i] ?? "").toLowerCase();
    if (!segment) continue;
    const key = normalizeRouteKey(segment);
    if (!key) continue;

    const found = await args.fetchQuery<{
      slug: string;
    } | null>(args.getPostTypeBySingleSlugKey, {
      singleSlugKey: key,
      ...(args.organizationId ? { organizationId: args.organizationId } : {}),
    });
    if (!found || typeof found.slug !== "string" || !found.slug) continue;

    const next = args.segments[i + 1]?.trim();
    if (!next) continue;

    postTypeSlug = found.slug;
    candidateSlug = next;
  }

  // Fallback to the legacy behavior for simple routes like /{singleSlug}/{slug}
  // (where the singleSlug is the first segment and the slug is derived from the URL).
  if (!postTypeSlug && args.segments.length >= 2) {
    const baseSegment = (args.segments[0] ?? "").toLowerCase();
    const key = baseSegment ? normalizeRouteKey(baseSegment) : "";
    if (key) {
      const found = await args.fetchQuery<{ slug: string } | null>(
        args.getPostTypeBySingleSlugKey,
        {
          singleSlugKey: key,
          ...(args.organizationId
            ? { organizationId: args.organizationId }
            : {}),
        },
      );
      if (found && typeof found.slug === "string" && found.slug) {
        postTypeSlug = found.slug;
      }
    }
    candidateSlug = args.slug;
  }

  if (postTypeSlug) {
    const candidate = candidateSlug ?? args.slug;

    const identifier: PostIdentifier = looksLikeConvexId(candidate)
      ? { kind: "id", id: candidate }
      : { kind: "slug", slug: candidate };

    const debugRouting = (() => {
      const raw = args.searchParams?.debugRouting;
      const value = Array.isArray(raw) ? raw[0] : raw;
      return value === "1" || value === "true";
    })();

    if (debugRouting) {
      console.log("[routing] rewrite matched", {
        segments: args.segments,
        postTypeSlug,
        identifier,
      });
    }

    const storeResolved = await resolvePostViaStores({
      segments: args.segments,
      searchParams: args.searchParams,
      organizationId: args.organizationId ? String(args.organizationId) : null,
      postTypeSlug,
      identifier,
      fetchQuery: args.fetchQuery as any,
      api: args.api,
      debug: debugRouting,
    });
    if (storeResolved?.post) {
      const normalized = normalizeEntityPost(storeResolved.post, postTypeSlug);
      if (normalized) return { post: normalized, resolvedBy: "entity" };
    }
  }

  return null;
}
