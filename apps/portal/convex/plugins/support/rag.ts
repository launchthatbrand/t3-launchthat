/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { MutationCtx } from "@convex-config/_generated/server";
import type { Value } from "convex/values";
import { createOpenAI } from "@ai-sdk/openai";
import { components } from "@convex-config/_generated/api";
import { action, internalMutation } from "@convex-config/_generated/server";
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
    filterNames: ["organizationId", "source", "tag"],
  },
);

type SupportRagSourceDoc = Doc<"supportRagSources">;
type PostDoc = Doc<"posts">;

const namespaceForOrganization = (organizationId: Id<"organizations">) =>
  `org-${organizationId}`;

const extractMetadata = (
  value: Record<string, Value> | undefined,
): { slug?: string; source?: string } => ({
  slug: typeof value?.slug === "string" ? value.slug : undefined,
  source: typeof value?.source === "string" ? value.source : undefined,
});

const normalizeFilters = (args: {
  organizationId: Id<"organizations">;
  source?: string | null;
  tags?: string[] | null;
}) => {
  const filters: { name: string; value: string }[] = [
    { name: "organizationId", value: args.organizationId },
    { name: "source", value: args.source ?? "knowledge" },
  ];

  if (args.tags) {
    for (const tag of args.tags) {
      if (tag) {
        filters.push({ name: "tag", value: tag });
      }
    }
  }

  return filters;
};

const ensureApiKey = () => {
  if (!OPENAI_API_KEY) {
    console.warn("[support-rag] missing OPENAI_API_KEY");
    return false;
  }
  return true;
};

const POST_ENTRY_PREFIX = "post:";

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
  ctx: MutationCtx,
  post: PostDoc,
  config: SupportRagSourceDoc,
): Promise<string> => {
  const segments: string[] = [];

  for (const field of config.fields) {
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
    const metaEntries = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();
    const metaMap = new Map<string, string>();
    for (const entry of metaEntries) {
      if (
        typeof entry.value === "string" ||
        typeof entry.value === "number" ||
        typeof entry.value === "boolean"
      ) {
        metaMap.set(entry.key, String(entry.value));
      }
    }
    for (const key of config.metaFieldKeys) {
      const normalized = key.trim();
      if (normalized.length === 0) continue;
      const value = metaMap.get(normalized);
      if (value) {
        segments.push(`${normalized}: ${value}`);
      }
    }
  }

  const text = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("\n\n");
  return text;
};

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

    const { entries } = await supportRag.search(ctx, {
      namespace,
      query: trimmedQuery,
      limit,
      filters: [{ name: "organizationId", value: args.organizationId }],
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

export const ingestPostIfConfigured = internalMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    if (!ensureApiKey()) {
      return { status: "missingApiKey" as const };
    }

    const post = await ctx.db.get(args.postId);
    if (!post || !post.organizationId || !post.postTypeSlug) {
      return { status: "missingPost" as const };
    }

    const organizationId = post.organizationId;
    const normalizedSlug = post.postTypeSlug.toLowerCase();

    const config = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_postType", (q) =>
        q
          .eq("organizationId", organizationId)
          .eq("postTypeSlug", normalizedSlug),
      )
      .unique();

    const entryKey = `${POST_ENTRY_PREFIX}${post._id}`;

    if (!config?.isEnabled) {
      await deleteEntryByKey(ctx, organizationId, entryKey);
      return { status: "disabled" as const };
    }

    if (post.status !== "published") {
      await deleteEntryByKey(ctx, organizationId, entryKey);
      return { status: "notPublished" as const };
    }

    const text = await buildPostText(ctx, post, config);
    if (!text) {
      await deleteEntryByKey(ctx, organizationId, entryKey);
      return { status: "empty" as const };
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

    await supportRag.add(ctx, {
      namespace,
      key: entryKey,
      text,
      title:
        post.title ??
        config.displayName ??
        `${post.postTypeSlug} article`.trim(),
      filterValues: normalizeFilters({
        organizationId,
        source: sourceLabel,
        tags: config.includeTags ? (post.tags ?? undefined) : undefined,
      }),
      metadata,
      importance: 0.7,
    });

    await ctx.db.patch(config._id, {
      lastIndexedAt: Date.now(),
    });

    return { status: "indexed" as const };
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
