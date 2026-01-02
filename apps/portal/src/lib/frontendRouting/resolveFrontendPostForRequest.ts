import type { Doc, Id } from "@/convex/_generated/dataModel";

import { resolveFrontendEntry } from "./resolveFrontendEntry";
import type { FetchQueryLike } from "./fetchQueryAdapter";

const looksLikeConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

export type FrontendPostResolvedBy = "downloads" | "entity" | "core";

export async function resolveFrontendPostForRequest(args: {
  segments: string[];
  slug: string;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQueryLike;

  getPostTypeBySingleSlugKey: unknown;
  readEntity: unknown;
  listEntities: unknown;
  api?: unknown;
  searchParams?: Record<string, string | string[] | undefined>;

  getCorePostBySlug: unknown;
  getCorePostById: unknown;
}): Promise<{ post: Doc<"posts">; resolvedBy: FrontendPostResolvedBy } | null> {
  const pluginResolved = await resolveFrontendEntry({
    segments: args.segments,
    slug: args.slug,
    organizationId: args.organizationId,
    fetchQuery: args.fetchQuery,
    getPostTypeBySingleSlugKey: args.getPostTypeBySingleSlugKey,
    readEntity: args.readEntity,
    listEntities: args.listEntities,
    api: args.api,
    searchParams: args.searchParams,
  });

  if (pluginResolved) {
    return {
      post: pluginResolved.post,
      resolvedBy:
        pluginResolved.resolvedBy === "downloads" ? "downloads" : "entity",
    };
  }

  // Core posts fallback (slug then id).
  const orgArg = args.organizationId ? { organizationId: args.organizationId } : {};

  const bySlug = (await args.fetchQuery<Doc<"posts"> | null>(args.getCorePostBySlug, {
    slug: args.slug,
    ...orgArg,
  })) ?? null;
  if (bySlug) {
    return { post: bySlug, resolvedBy: "core" };
  }

  if (looksLikeConvexId(args.slug)) {
    const byId =
      (await args.fetchQuery<Doc<"posts"> | null>(args.getCorePostById, {
        id: args.slug,
        ...orgArg,
      })) ?? null;
    if (byId) {
      return { post: byId, resolvedBy: "core" };
    }
  }

  return null;
}


