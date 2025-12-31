/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { MutationCtx } from "@convex-config/_generated/server";
import type { Value } from "convex/values";
import { createOpenAI } from "@ai-sdk/openai";
import { components, internal } from "@convex-config/_generated/api";
import { action, internalAction, internalMutation, internalQuery } from "@convex-config/_generated/server";
import { RAG } from "@convex-dev/rag";
import { v } from "convex/values";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

type SupportRagFilters = Record<string, Value>;
type SupportRagMetadata = Record<string, Value>;

const supportRag = new RAG<SupportRagFilters, SupportRagMetadata>(
  components.rag,
  {
    textEmbeddingModel: openai.embedding("text-embedding-3-small"),
    embeddingDimension: 1536,
    // Keep filters minimal for stability: org-scoping + optional context tag.
    // (The `source` label is stored in entry metadata instead of being a filter.)
    filterNames: ["organizationId", "tag"],
  },
);

const buildFilterValues = (args: {
  organizationId: Id<"organizations">;
  tag: string;
}) => [
  { name: "organizationId" as const, value: args.organizationId },
  { name: "tag" as const, value: args.tag },
];

const buildSearchFilters = (args: {
  organizationId: Id<"organizations">;
  tag?: string;
}) => {
  const filters = [{ name: "organizationId" as const, value: args.organizationId }];
  if (typeof args.tag === "string" && args.tag.trim().length > 0) {
    filters.push({ name: "tag" as const, value: args.tag.trim() });
  }
  return filters;
};

type SupportRagSourceDoc = Doc<"supportRagSources">;
type PostDoc = Doc<"posts">;
type LmsPostTypeSlug = string;

const namespaceForOrganization = (organizationId: Id<"organizations">) =>
  `org-${organizationId}`;

const extractMetadata = (
  value: Record<string, Value> | undefined,
): { slug?: string; source?: string } => ({
  slug: typeof value?.slug === "string" ? value.slug : undefined,
  source: typeof value?.source === "string" ? value.source : undefined,
});

const ensureApiKey = () => {
  if (!OPENAI_API_KEY) {
    console.warn("[support-rag] missing OPENAI_API_KEY");
    return false;
  }
  return true;
};

const POST_ENTRY_PREFIX = "post:";
const LMS_ENTRY_PREFIX = "lms:";

export const upsertRagIndexStatusInternal = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
    postTypeSlug: v.string(),
    postId: v.string(),
    entryKey: v.string(),
    lastStatus: v.string(),
    lastAttemptAt: v.number(),
    lastSuccessAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    lastEntryId: v.optional(v.string()),
    lastEntryStatus: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("replaced")),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
    const existing = await ctx.db
      .query("supportRagIndexStatus")
      .withIndex("by_org_post", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("postTypeSlug", normalizedPostTypeSlug)
          .eq("postId", args.postId),
      )
      .unique();

    const payload = {
      organizationId: args.organizationId,
      sourceType: args.sourceType,
      postTypeSlug: normalizedPostTypeSlug,
      postId: args.postId,
      entryKey: args.entryKey,
      lastStatus: args.lastStatus,
      lastAttemptAt: args.lastAttemptAt,
      lastSuccessAt: args.lastSuccessAt,
      lastError: args.lastError,
      lastEntryId: args.lastEntryId,
      lastEntryStatus: args.lastEntryStatus,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }

    await ctx.db.insert("supportRagIndexStatus", payload);
    return null;
  },
});

const deleteEntryByKey = async (
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  key: string,
) => {
  if (!ensureApiKey()) {
    return;
  }

  const namespaceRecord = await supportRag.getNamespace(ctx, {
    namespace: namespaceForOrganization(organizationId),
  });
  if (!namespaceRecord) {
    return;
  }

  await supportRag.deleteByKeyAsync(ctx, {
    namespaceId: namespaceRecord.namespaceId,
    key,
  });
};

const buildPostText = async (
  post: PostDoc,
  config: SupportRagSourceDoc,
): Promise<string> => {
  const segments: string[] = [];

  for (const field of config.fields ?? []) {
    if (field === "title" && typeof post.title === "string") {
      segments.push(post.title);
    }
    if (field === "excerpt" && typeof post.excerpt === "string") {
      segments.push(post.excerpt);
    }
    if (field === "content" && typeof post.content === "string") {
      segments.push(post.content);
    }
  }

  if (config.includeTags && Array.isArray(post.tags) && post.tags.length > 0) {
    segments.push(`Tags: ${post.tags.join(", ")}`);
  }

  if (config.metaFieldKeys && config.metaFieldKeys.length > 0) {
    // Note: core post meta is handled by a dedicated ingestion query.
    // buildPostText is used by the ingestion action after it loads meta into a single map.
    for (const key of config.metaFieldKeys) {
      const normalized = key.trim();
      if (normalized.length === 0) continue;
      // Values appended in getPostForIngestion (so we don’t touch ctx.db here).
      const raw = (post as unknown as Record<string, unknown>)[`__meta:${normalized}`];
      if (typeof raw === "string" && raw.trim()) segments.push(`${normalized}: ${raw}`);
    }
  }

  const text = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("\n\n");
  return text;
};

const buildLmsPostText = async (args: {
  lmsPost: Record<string, unknown>;
  lmsMeta: Array<{ key?: unknown; value?: unknown }>;
  config: SupportRagSourceDoc;
}): Promise<string> => {
  const segments: string[] = [];
  const post = args.lmsPost;
  const config = args.config;

  const title = typeof post.title === "string" ? post.title : null;
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : null;
  const content = typeof post.content === "string" ? post.content : null;

  for (const field of config.fields ?? []) {
    if (field === "title" && title) segments.push(title);
    if (field === "excerpt" && excerpt) segments.push(excerpt);
    if (field === "content" && content) segments.push(content);
  }

  const metaMap = new Map<string, string>();
  for (const entry of args.lmsMeta) {
    const key = typeof entry.key === "string" ? entry.key : null;
    if (!key) continue;
    const value = entry.value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      metaMap.set(key, String(value));
    }
  }

  const allMetaKeys: Array<string> = [];
  if (Array.isArray(config.metaFieldKeys)) {
    for (const key of config.metaFieldKeys) {
      if (typeof key === "string" && key.trim()) allMetaKeys.push(key.trim());
    }
  }
  if (typeof config.additionalMetaKeys === "string" && config.additionalMetaKeys.trim()) {
    for (const token of config.additionalMetaKeys.split(",")) {
      const trimmed = token.trim();
      if (trimmed) allMetaKeys.push(trimmed);
    }
  }

  for (const key of allMetaKeys) {
    const value = metaMap.get(key);
    if (value) {
      segments.push(`${key}: ${value}`);
    }
  }

  const tagsValue = post.tags;
  if (config.includeTags && Array.isArray(tagsValue) && tagsValue.length > 0) {
    const tags = tagsValue.filter((tag): tag is string => typeof tag === "string" && tag.length > 0);
    if (tags.length > 0) {
      segments.push(`Tags: ${tags.join(", ")}`);
    }
  }

  return segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("\n\n");
};

export const getSupportRagSourceForPostType = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    postTypeSlug: v.string(),
    sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("supportRagSources"),
      postTypeSlug: v.optional(v.string()),
      displayName: v.optional(v.string()),
      isEnabled: v.optional(v.boolean()),
      includeTags: v.optional(v.boolean()),
      metaFieldKeys: v.optional(v.array(v.string())),
      additionalMetaKeys: v.optional(v.string()),
      fields: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sourceType", args.sourceType)
          .eq("postTypeSlug", args.postTypeSlug.toLowerCase()),
      )
      .unique();
    if (!doc) {
      return null;
    }

    // IMPORTANT: Only return fields allowed by the `returns` validator.
    // Convex will throw if we return a document with extra fields.
    return {
      _id: doc._id,
      postTypeSlug: doc.postTypeSlug,
      displayName: doc.displayName,
      isEnabled: doc.isEnabled,
      includeTags: doc.includeTags,
      metaFieldKeys: doc.metaFieldKeys,
      additionalMetaKeys: doc.additionalMetaKeys,
      fields: doc.fields,
    };
  },
});

export const getPostForIngestion = internalQuery({
  args: { postId: v.id("posts") },
  returns: v.union(
    v.null(),
    v.object({
      // NOTE: component-scoped posts (e.g. launchthat_ecommerce:posts) can be
      // ingested as well, and their IDs won't validate as `v.id("posts")`.
      _id: v.string(),
      organizationId: v.optional(v.id("organizations")),
      postTypeSlug: v.optional(v.string()),
      title: v.optional(v.union(v.string(), v.null())),
      excerpt: v.optional(v.union(v.string(), v.null())),
      content: v.optional(v.union(v.string(), v.null())),
      slug: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      status: v.optional(
        v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
      ),
      // meta values are packed into synthetic keys like "__meta:<key>"
    }),
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const metaEntries = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();
    const metaMap: Record<string, string> = {};
    for (const entry of metaEntries) {
      if (
        typeof entry.value === "string" ||
        typeof entry.value === "number" ||
        typeof entry.value === "boolean"
      ) {
        metaMap[entry.key] = String(entry.value);
      }
    }

    // IMPORTANT: keep the returned shape stable for the validator and for buildPostText.
    const base = {
      _id: String((post as any)._id),
      organizationId: (post as any).organizationId,
      postTypeSlug: (post as any).postTypeSlug,
      title: (post as any).title ?? null,
      excerpt: (post as any).excerpt ?? null,
      content: (post as any).content ?? null,
      slug: (post as any).slug,
      tags: (post as any).tags,
      status: (post as any).status,
    };

    return {
      ...base,
      ...Object.fromEntries(Object.entries(metaMap).map(([k, v]) => [`__meta:${k}`, v])),
    };
  },
});

export const searchKnowledge = action({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      title: v.string(),
      content: v.string(),
      slug: v.optional(v.string()),
      source: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    if (!ensureApiKey()) {
      return [];
    }

    const trimmedQuery = args.query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const namespace = namespaceForOrganization(args.organizationId);
    const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
    await supportRag.getOrCreateNamespace(ctx, { namespace });

    const { entries } = await supportRag.search(ctx, {
      namespace,
      query: trimmedQuery,
      limit,
      filters: buildSearchFilters({ organizationId: args.organizationId }),
      chunkContext: { before: 1, after: 1 },
    });

    return entries.map((entry) => {
      const metadata = extractMetadata(entry.metadata);
      const resolvedSource = metadata.source ?? "helpdesk";
      const resolvedTitle =
        typeof entry.title === "string" ? entry.title : resolvedSource;
      return {
        title: resolvedTitle,
        content: entry.text ?? "",
        slug: metadata.slug,
        source: resolvedSource,
      };
    });
  },
});

export const searchKnowledgeForContext = action({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      title: v.string(),
      content: v.string(),
      slug: v.optional(v.string()),
      source: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    if (!ensureApiKey()) {
      return [];
    }

    const trimmedQuery = args.query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const namespace = namespaceForOrganization(args.organizationId);
    const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
    const tags = (args.tags ?? [])
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10);
    await supportRag.getOrCreateNamespace(ctx, { namespace });

    const primaryTag = tags.at(0);

    const { entries } = await supportRag.search(ctx, {
      namespace,
      query: trimmedQuery,
      limit,
      filters: buildSearchFilters({
        organizationId: args.organizationId,
        tag: typeof primaryTag === "string" ? primaryTag : undefined,
      }),
      chunkContext: { before: 1, after: 1 },
    });

    return entries.map((entry) => {
      const metadata = extractMetadata(entry.metadata);
      const resolvedSource = metadata.source ?? "helpdesk";
      const resolvedTitle =
        typeof entry.title === "string" ? entry.title : resolvedSource;
      return {
        title: resolvedTitle,
        content: entry.text ?? "",
        slug: metadata.slug,
        source: resolvedSource,
      };
    });
  },
});

export const ingestPostIfConfigured = internalAction({
  args: {
    postId: v.id("posts"),
  },
  returns: v.object({
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!ensureApiKey()) {
      return { status: "missingApiKey" };
    }

    const post = await ctx.runQuery(internal.plugins.support.rag.getPostForIngestion, {
      postId: args.postId,
    });
    if (!post || !post.organizationId || !post.postTypeSlug) {
      return { status: "missingPost" };
    }

    const organizationId = post.organizationId;
    const normalizedSlug = post.postTypeSlug.toLowerCase();

    const config = await ctx.runQuery(internal.plugins.support.rag.getSupportRagSourceForPostType, {
      organizationId,
      postTypeSlug: normalizedSlug,
      sourceType: "postType",
    });

    const entryKey = `${POST_ENTRY_PREFIX}${post._id}`;
    const attemptAt = Date.now();

    if (!config?.isEnabled) {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "postType",
        postTypeSlug: normalizedSlug,
        postId: String(post._id),
        entryKey,
        lastStatus: "disabled",
        lastAttemptAt: attemptAt,
      });
      return { status: "disabled" };
    }

    if (post.status !== "published") {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "postType",
        postTypeSlug: normalizedSlug,
        postId: String(post._id),
        entryKey,
        lastStatus: "notPublished",
        lastAttemptAt: attemptAt,
      });
      return { status: "notPublished" };
    }

    const text = await buildPostText(post as PostDoc, config as SupportRagSourceDoc);
    if (!text) {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "postType",
        postTypeSlug: normalizedSlug,
        postId: String(post._id),
        entryKey,
        lastStatus: "empty",
        lastAttemptAt: attemptAt,
      });
      return { status: "empty" };
    }

    const namespace = namespaceForOrganization(organizationId);
    await supportRag.getOrCreateNamespace(ctx, { namespace });

    const sourceLabel = `post:${post.postTypeSlug}`;
    const metadata: SupportRagMetadata = {
      entryId: entryKey,
      source: sourceLabel,
    };
    if (typeof post.slug === "string") {
      metadata.slug = post.slug;
    }

    const addResult = await supportRag.add(ctx, {
      namespace,
      key: entryKey,
      text,
      title:
        post.title ??
        config.displayName ??
        `${post.postTypeSlug} article`.trim(),
      filterValues: buildFilterValues({
        organizationId,
        tag: `post:${post._id}`,
      }),
      metadata,
      importance: 0.7,
    });

    await ctx.runMutation(internal.plugins.support.rag.touchRagSourceIndexedAtInternal, {
      sourceId: config._id as any,
    });

    await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
      organizationId,
      sourceType: "postType",
      postTypeSlug: normalizedSlug,
      postId: String(post._id),
      entryKey,
      lastStatus: "indexed",
      lastAttemptAt: attemptAt,
      lastSuccessAt: attemptAt,
      lastEntryId: addResult.entryId,
      lastEntryStatus: addResult.status,
    });

    return { status: "indexed" };
  },
});

export const ingestLmsPostIfConfigured = internalAction({
  args: {
    id: v.string(),
    postTypeSlug: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!ensureApiKey()) {
      return { status: "missingApiKey" };
    }

    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();

    // Load LMS post + meta directly from the LMS component.
    const lmsPost = (await ctx.runQuery(
      (components.launchthat_lms.posts.queries.getPostByIdInternal as unknown as any),
      { id: args.id },
    )) as Record<string, unknown> | null;

    if (!lmsPost) {
      return { status: "missingPost" as const };
    }

    const derivedOrg =
      typeof lmsPost.organizationId === "string" ? lmsPost.organizationId : null;
    const organizationId = (args.organizationId ?? derivedOrg) as
      | Id<"organizations">
      | null;

    if (!organizationId) {
      return { status: "missingOrganization" as const };
    }

    const config = await ctx.runQuery(internal.plugins.support.rag.getSupportRagSourceForPostType, {
      organizationId,
      postTypeSlug: normalizedPostTypeSlug,
      sourceType: "lmsPostType",
    });

    const entryKey = `${LMS_ENTRY_PREFIX}${normalizedPostTypeSlug}:${args.id}`;
    const attemptAt = Date.now();

    if (!config?.isEnabled) {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "lmsPostType",
        postTypeSlug: normalizedPostTypeSlug,
        postId: args.id,
        entryKey,
        lastStatus: "disabled",
        lastAttemptAt: attemptAt,
      });
      return { status: "disabled" };
    }

    const statusValue = typeof lmsPost.status === "string" ? lmsPost.status : null;
    if (statusValue !== "published") {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "lmsPostType",
        postTypeSlug: normalizedPostTypeSlug,
        postId: args.id,
        entryKey,
        lastStatus: "notPublished",
        lastAttemptAt: attemptAt,
      });
      return { status: "notPublished" };
    }

    const lmsMeta = (await ctx.runQuery(
      (components.launchthat_lms.posts.queries.getPostMetaInternal as unknown as any),
      { postId: args.id },
    )) as Array<{ key?: unknown; value?: unknown }>;

    const text = await buildLmsPostText({
      lmsPost,
      lmsMeta,
      config,
    });
    if (!text) {
      await ctx.runMutation(internal.plugins.support.rag.deleteEntryByKeyInternal, {
        organizationId,
        key: entryKey,
      });
      await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
        organizationId,
        sourceType: "lmsPostType",
        postTypeSlug: normalizedPostTypeSlug,
        postId: args.id,
        entryKey,
        lastStatus: "empty",
        lastAttemptAt: attemptAt,
      });
      return { status: "empty" };
    }

    const namespace = namespaceForOrganization(organizationId);
    await supportRag.getOrCreateNamespace(ctx, { namespace });

    const sourceLabel = `lms:${normalizedPostTypeSlug}` satisfies string;
    const metadata: SupportRagMetadata = {
      entryId: entryKey,
      source: sourceLabel,
    };
    if (typeof lmsPost.slug === "string") {
      metadata.slug = lmsPost.slug;
    }

    const addResult = await supportRag.add(ctx, {
      namespace,
      key: entryKey,
      text,
      title:
        (typeof lmsPost.title === "string" ? lmsPost.title : null) ??
        config.displayName ??
        `${normalizedPostTypeSlug} entry`,
      filterValues: buildFilterValues({
        organizationId,
        tag: `lms:${normalizedPostTypeSlug}:${args.id}`,
      }),
      metadata,
      importance: 0.8,
    });

    await ctx.runMutation(internal.plugins.support.rag.touchRagSourceIndexedAtInternal, {
      sourceId: config._id as any,
    });

    await ctx.runMutation(internal.plugins.support.rag.upsertRagIndexStatusInternal, {
      organizationId,
      sourceType: "lmsPostType",
      postTypeSlug: normalizedPostTypeSlug,
      postId: args.id,
      entryKey,
      lastStatus: "indexed",
      lastAttemptAt: attemptAt,
      lastSuccessAt: attemptAt,
      lastEntryId: addResult.entryId,
      lastEntryStatus: addResult.status,
    });

    return { status: "indexed" };
  },
});

export const deleteEntryByKeyInternal = internalMutation({
  args: { organizationId: v.id("organizations"), key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await deleteEntryByKey(ctx, args.organizationId, args.key);
    return null;
  },
});

export const touchRagSourceIndexedAtInternal = internalMutation({
  args: { sourceId: v.id("supportRagSources") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sourceId, { lastIndexedAt: Date.now(), updatedAt: Date.now() });
    return null;
  },
});

export const removeLmsEntry = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    postTypeSlug: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
    const entryKey = `${LMS_ENTRY_PREFIX}${normalizedPostTypeSlug}:${args.id}`;
    await deleteEntryByKey(ctx, args.organizationId, entryKey);
    return null;
  },
});

export const removePostEntry = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    await deleteEntryByKey(
      ctx,
      args.organizationId,
      `${POST_ENTRY_PREFIX}${args.postId}`,
    );
    return null;
  },
});
