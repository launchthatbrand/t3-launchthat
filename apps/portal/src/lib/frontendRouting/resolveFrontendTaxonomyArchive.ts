import type { Doc, Id } from "@/convex/_generated/dataModel";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { fetchQuery as convexFetchQuery } from "convex/nextjs";

type FetchQuery = typeof convexFetchQuery;
type QueryRef = Parameters<FetchQuery>[0];
type FetchQueryRest =
  Parameters<FetchQuery> extends [unknown, ...infer R] ? R : [];

type PostTypeDoc = Doc<"postTypes">;
type PostsDoc = Doc<"posts">;

interface PermalinkSettings {
  categoryBase?: string;
  tagBase?: string;
}

type TaxonomyArchiveContext =
  | {
      kind: "category" | "tag" | "custom";
      taxonomySlug: string;
      taxonomyLabel: string;
      termSlug: string;
      termName: string;
      description?: string | null;
      postTypeSlug?: string;
    }
  | "not_found"
  | null;

export type FrontendTaxonomyArchiveResolved =
  | {
      kind: "single";
      label: string;
      termName: string;
      termSlug: string;
      description?: string | null;
      postType: PostTypeDoc;
      posts: PostsDoc[];
    }
  | {
      kind: "grouped";
      label: string;
      termName: string;
      termSlug: string;
      description?: string | null;
      sections: { postType: PostTypeDoc; posts: PostsDoc[] }[];
    };

const PERMALINK_OPTION_KEY = "permalink_settings";

const LMS_POST_TYPE_SLUGS = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
  "badges",
]);

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

function normalizeBaseSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimSlashes(trimmed).toLowerCase();
}

function parsePostTypeSlugFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
): string | undefined {
  if (!searchParams) return undefined;
  const raw = searchParams.post_type;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return undefined;
  const normalized = trimmed.toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(normalized)) return undefined;
  return normalized;
}

async function loadPermalinkSettings(args: {
  fetchQuery: FetchQuery;
  organizationId?: Id<"organizations">;
  getOption: QueryRef;
}): Promise<PermalinkSettings> {
  const callFetchQuery = async <TResult>(
    query: QueryRef,
    params: unknown,
  ): Promise<TResult> => {
    return (await args.fetchQuery(
      query,
      ...([params] as unknown as FetchQueryRest),
    )) as TResult;
  };

  const orgOption = await callFetchQuery<unknown>(args.getOption, {
    metaKey: PERMALINK_OPTION_KEY,
    type: "site",
    orgId: args.organizationId ?? undefined,
  });
  const fallbackOption =
    orgOption ??
    (await callFetchQuery<unknown>(args.getOption, {
      metaKey: PERMALINK_OPTION_KEY,
      type: "site",
    }));

  const metaValue = isRecord(fallbackOption) ? fallbackOption.metaValue : null;
  if (!metaValue || typeof metaValue !== "object") return {};
  const record = metaValue as Record<string, unknown>;
  return {
    categoryBase:
      typeof record.categoryBase === "string" ? record.categoryBase : undefined,
    tagBase: typeof record.tagBase === "string" ? record.tagBase : undefined,
  };
}

async function resolveTaxonomyArchiveContext(args: {
  segments: string[];
  organizationId?: Id<"organizations">;
  requestedPostTypeSlug?: string;
  fetchQuery: FetchQuery;

  getOption: QueryRef;
  getTermBySlug: QueryRef;
  getTaxonomyBySlug: QueryRef;
}): Promise<TaxonomyArchiveContext> {
  if (args.segments.length < 2) return null;

  const callFetchQuery = async <TResult>(
    query: QueryRef,
    params: unknown,
  ): Promise<TResult> => {
    return (await args.fetchQuery(
      query,
      ...([params] as unknown as FetchQueryRest),
    )) as TResult;
  };

  const settings = await loadPermalinkSettings({
    fetchQuery: args.fetchQuery,
    organizationId: args.organizationId,
    getOption: args.getOption,
  });

  const configuredCategoryBase = normalizeBaseSegment(settings.categoryBase);
  const configuredTagBase = normalizeBaseSegment(settings.tagBase);

  const categoryBases = new Set(
    [configuredCategoryBase ?? "categories", "category"].filter(Boolean),
  );
  const tagBases = new Set(
    [configuredTagBase ?? "tags", "tag"].filter(Boolean),
  );

  const base = args.segments[0]?.toLowerCase() ?? "";
  const termSlug = (
    args.segments[args.segments.length - 1] ?? ""
  ).toLowerCase();
  if (!termSlug) return null;

  if (categoryBases.has(base)) {
    if (!args.organizationId) return "not_found";
    const term = await callFetchQuery<unknown>(args.getTermBySlug, {
      taxonomySlug: "category",
      organizationId: args.organizationId,
      termSlug,
    });
    if (!term) return "not_found";
    if (
      !isRecord(term) ||
      typeof term.slug !== "string" ||
      typeof term.name !== "string"
    ) {
      return "not_found";
    }
    return {
      kind: "category",
      taxonomySlug: "category",
      taxonomyLabel: "Category",
      postTypeSlug: args.requestedPostTypeSlug ?? undefined,
      termSlug: term.slug,
      termName: term.name,
      description:
        typeof term.description === "string" ? term.description : null,
    };
  }

  if (tagBases.has(base)) {
    if (!args.organizationId) return "not_found";
    const term = await callFetchQuery<unknown>(args.getTermBySlug, {
      taxonomySlug: "post_tag",
      organizationId: args.organizationId,
      termSlug,
    });
    if (!term) return "not_found";
    if (
      !isRecord(term) ||
      typeof term.slug !== "string" ||
      typeof term.name !== "string"
    ) {
      return "not_found";
    }
    return {
      kind: "tag",
      taxonomySlug: "post_tag",
      taxonomyLabel: "Tag",
      postTypeSlug: args.requestedPostTypeSlug ?? undefined,
      termSlug: term.slug,
      termName: term.name,
      description:
        typeof term.description === "string" ? term.description : null,
    };
  }

  // Custom taxonomy archives: /{taxonomySlug}/{termSlug}
  if (args.organizationId) {
    const taxonomy = await callFetchQuery<unknown>(args.getTaxonomyBySlug, {
      slug: base,
      organizationId: args.organizationId,
    });
    if (!taxonomy) return null;
    if (!isRecord(taxonomy) || typeof taxonomy.name !== "string") {
      return null;
    }
    const term = await callFetchQuery<unknown>(args.getTermBySlug, {
      taxonomySlug: base,
      organizationId: args.organizationId,
      termSlug,
    });
    if (!term) return "not_found";
    if (
      !isRecord(term) ||
      typeof term.slug !== "string" ||
      typeof term.name !== "string"
    ) {
      return "not_found";
    }
    return {
      kind: "custom",
      taxonomySlug: base,
      taxonomyLabel: taxonomy.name,
      postTypeSlug: args.requestedPostTypeSlug ?? undefined,
      termSlug: term.slug,
      termName: term.name,
      description:
        typeof term.description === "string" ? term.description : null,
    };
  }

  return null;
}

function toSafePostTypeDoc(
  postTypeSlug: string,
  postType: PostTypeDoc | null,
): PostTypeDoc {
  return (
    postType ??
    ({
      name: postTypeSlug,
      slug: postTypeSlug,
      description: null,
    } as unknown as PostTypeDoc)
  );
}

async function fetchPostsForPostType(args: {
  postType: PostTypeDoc;
  organizationId: Id<"organizations">;
  objectIdSet: Set<string>;
  fetchQuery: FetchQuery;

  getAllPostsCore: QueryRef;
  getAllPostsLms: QueryRef;
  listEntities: QueryRef;
}): Promise<PostsDoc[]> {
  const postTypeSlug = args.postType.slug.toLowerCase();

  // Custom storage post types (downloads, attachments, etc.) - use entity router.
  if (args.postType.storageKind === "custom") {
    const raw = (await args.fetchQuery(
      args.listEntities,
      ...([
        {
          postTypeSlug: args.postType.slug,
          organizationId: String(args.organizationId),
          filters: { status: "published", limit: 200 },
        },
      ] as unknown as FetchQueryRest),
    )) as unknown;

    const rows: unknown[] = Array.isArray(raw) ? raw : [];

    const mapped: PostsDoc[] = rows.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const entity = row as Record<string, unknown>;
      const id = typeof entity.id === "string" ? entity.id : "";
      if (!id) return [];
      if (!args.objectIdSet.has(id)) return [];

      const createdAt =
        typeof entity.createdAt === "number" ? entity.createdAt : Date.now();
      const updatedAt =
        typeof entity.updatedAt === "number" ? entity.updatedAt : createdAt;
      const slug = typeof entity.slug === "string" ? entity.slug : "";
      const title =
        typeof entity.title === "string" ? entity.title : "Untitled";
      const excerpt =
        typeof entity.excerpt === "string" ? entity.excerpt : null;
      const content =
        typeof entity.content === "string" ? entity.content : null;

      return [
        {
          _id: `custom:${args.postType.slug}:${id}`,
          _creationTime: createdAt,
          organizationId: args.organizationId,
          postTypeSlug: args.postType.slug,
          slug,
          title,
          excerpt: excerpt ?? undefined,
          content: content ?? "",
          status: "published",
          createdAt,
          updatedAt,
        } as unknown as PostsDoc,
      ];
    });

    return mapped;
  }

  const isLmsComponentArchive =
    LMS_POST_TYPE_SLUGS.has(postTypeSlug) ||
    (args.postType.storageKind === "component" &&
      (args.postType.storageTables ?? []).some((table) =>
        table.includes("launchthat_lms:posts"),
      ));

  const rawPosts = (
    isLmsComponentArchive
      ? await args.fetchQuery(
          args.getAllPostsLms,
          ...([
            {
              organizationId: args.organizationId,
              filters: {
                status: "published",
                postTypeSlug: args.postType.slug,
                limit: 200,
              },
            },
          ] as unknown as FetchQueryRest),
        )
      : await args.fetchQuery(
          args.getAllPostsCore,
          ...([
            {
              organizationId: args.organizationId,
              filters: {
                status: "published",
                postTypeSlug: args.postType.slug,
                limit: 200,
              },
            },
          ] as unknown as FetchQueryRest),
        )
  ) as unknown;

  const rows: unknown[] = Array.isArray(rawPosts)
    ? (rawPosts as unknown[])
    : [];
  const filtered = rows.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const id = (row as Record<string, unknown>)._id;
    return typeof id === "string" && args.objectIdSet.has(id);
  }) as unknown as PostsDoc[];

  return filtered;
}

function parsePostTypeDoc(value: unknown): PostTypeDoc | null {
  if (!isRecord(value)) return null;
  if (typeof value.slug !== "string" || typeof value.name !== "string") {
    return null;
  }
  return value as PostTypeDoc;
}

export async function resolveFrontendTaxonomyArchive(args: {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQuery;

  getOption: QueryRef;
  getTermBySlug: QueryRef;
  getTaxonomyBySlug: QueryRef;
  listObjectsByTerm: QueryRef;
  listAssignmentsByTerm: QueryRef;
  getPostTypeBySlug: QueryRef;
  getAllPostsCore: QueryRef;
  getAllPostsLms: QueryRef;
  listEntities: QueryRef;
}): Promise<FrontendTaxonomyArchiveResolved | "not_found" | null> {
  const requestedPostTypeSlug = parsePostTypeSlugFromSearchParams(
    args.searchParams,
  );
  const archiveContext = await resolveTaxonomyArchiveContext({
    segments: args.segments,
    organizationId: args.organizationId ?? undefined,
    requestedPostTypeSlug,
    fetchQuery: args.fetchQuery,
    getOption: args.getOption,
    getTermBySlug: args.getTermBySlug,
    getTaxonomyBySlug: args.getTaxonomyBySlug,
  });

  if (archiveContext === "not_found") return "not_found";
  if (!archiveContext) return null;
  if (!args.organizationId) return "not_found";

  const term = (await args.fetchQuery(
    args.getTermBySlug,
    ...([
      {
        taxonomySlug: archiveContext.taxonomySlug,
        organizationId: args.organizationId,
        termSlug: archiveContext.termSlug,
      },
    ] as unknown as FetchQueryRest),
  )) as unknown;
  if (!term || !isRecord(term) || typeof term._id !== "string")
    return "not_found";

  const termId = term._id as Id<"taxonomyTerms">;

  // If ?post_type=... is provided, render only that post type.
  if (archiveContext.postTypeSlug) {
    const postTypeRaw = (await args.fetchQuery(
      args.getPostTypeBySlug,
      ...([
        {
          slug: archiveContext.postTypeSlug,
          organizationId: args.organizationId,
        },
      ] as unknown as FetchQueryRest),
    )) as unknown;
    const postType = parsePostTypeDoc(postTypeRaw);
    const effectivePostType = toSafePostTypeDoc(
      archiveContext.postTypeSlug,
      postType,
    );

    const objectIds = (await args.fetchQuery(
      args.listObjectsByTerm,
      ...([
        {
          organizationId: args.organizationId,
          termId,
          postTypeSlug: archiveContext.postTypeSlug,
        },
      ] as unknown as FetchQueryRest),
    )) as unknown;
    const idList: string[] = Array.isArray(objectIds)
      ? objectIds.filter((v): v is string => typeof v === "string")
      : [];
    const objectIdSet = new Set(idList);

    const posts = await fetchPostsForPostType({
      postType: effectivePostType,
      organizationId: args.organizationId,
      objectIdSet,
      fetchQuery: args.fetchQuery,
      getAllPostsCore: args.getAllPostsCore,
      getAllPostsLms: args.getAllPostsLms,
      listEntities: args.listEntities,
    });

    return {
      kind: "single",
      label: archiveContext.taxonomyLabel,
      termName: archiveContext.termName,
      termSlug: archiveContext.termSlug,
      description: archiveContext.description ?? null,
      postType: effectivePostType,
      posts,
    };
  }

  // No ?post_type=... => render all assigned posts grouped by post type.
  const assignments = (await args.fetchQuery(
    args.listAssignmentsByTerm,
    ...([
      { organizationId: args.organizationId, termId },
    ] as unknown as FetchQueryRest),
  )) as unknown;
  const rows: unknown[] = Array.isArray(assignments) ? assignments : [];

  const byPostType = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const postTypeSlug =
      typeof rec.postTypeSlug === "string" ? rec.postTypeSlug : "";
    const objectId = typeof rec.objectId === "string" ? rec.objectId : "";
    if (!postTypeSlug || !objectId) continue;
    const key = postTypeSlug.toLowerCase();
    const set = byPostType.get(key) ?? new Set<string>();
    set.add(objectId);
    byPostType.set(key, set);
  }

  const sections: { postType: PostTypeDoc; posts: PostsDoc[] }[] = [];
  for (const [postTypeSlug, objectIdSet] of byPostType.entries()) {
    const postTypeRaw = (await args.fetchQuery(
      args.getPostTypeBySlug,
      ...([
        {
          slug: postTypeSlug,
          organizationId: args.organizationId,
        },
      ] as unknown as FetchQueryRest),
    )) as unknown;
    const postType = parsePostTypeDoc(postTypeRaw);
    const effectivePostType = toSafePostTypeDoc(postTypeSlug, postType);

    const posts = await fetchPostsForPostType({
      postType: effectivePostType,
      organizationId: args.organizationId,
      objectIdSet,
      fetchQuery: args.fetchQuery,
      getAllPostsCore: args.getAllPostsCore,
      getAllPostsLms: args.getAllPostsLms,
      listEntities: args.listEntities,
    });
    if (posts.length > 0) {
      sections.push({ postType: effectivePostType, posts });
    }
  }

  return {
    kind: "grouped",
    label: archiveContext.taxonomyLabel,
    termName: archiveContext.termName,
    termSlug: archiveContext.termSlug,
    description: archiveContext.description ?? null,
    sections,
  };
}
