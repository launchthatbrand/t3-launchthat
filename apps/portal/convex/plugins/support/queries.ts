import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { internalQuery, query } from "../../_generated/server";

interface SupportPostRecord {
  _id: string;
  _creationTime: number;
  organizationId: string;
  postTypeSlug: string;
  slug: string;
  createdAt: number;
  updatedAt?: number;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  status?: "published" | "draft" | "archived";
  tags?: string[];
  parentId?: string;
  parentTypeSlug?: string;
}

type RagSourceRecord = {
  _id: string;
  _creationTime: number;
  postTypeSlug?: string;
  displayName?: string;
  isEnabled?: boolean;
  includeTags?: boolean;
  metaFieldKeys?: string[];
  additionalMetaKeys?: string;
  fields?: string[];
  useCustomBaseInstructions?: boolean;
  baseInstructions?: string;
};

type EmailSettings = {
  defaultAlias: string;
  customDomain?: string | null;
  allowEmailIntake?: boolean;
  verificationStatus?: "unverified" | "pending" | "verified" | "failed";
  dnsRecords?: Array<{ type: string; host: string; value: string }>;
};

const supportQueries = components.launchthat_support.queries;

const parseJsonArray = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseMetaJson = <T>(value: unknown): T | null => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const fetchMetaMap = async (
  ctx: Parameters<(typeof query)["handler"]>[0],
  postId: Id<"posts">,
  organizationId: string,
) => {
  const metas = (await ctx.runQuery(supportQueries.getSupportPostMeta, {
    postId,
    organizationId,
  })) as { key: string; value: unknown }[];
  const map: Record<string, unknown> = {};
  metas.forEach((m) => {
    map[m.key] = m.value ?? null;
  });
  return map;
};

export const listSupportPosts = query({
  args: {
    organizationId: v.string(),
    filters: v.optional(
      v.object({
        status: v.optional(
          v.union(
            v.literal("published"),
            v.literal("draft"),
            v.literal("archived"),
          ),
        ),
        postTypeSlug: v.optional(v.string()),
        parentId: v.optional(v.id("posts")),
        limit: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return (await ctx.runQuery(supportQueries.listSupportPosts, args)) as
      | SupportPostRecord[]
      | [];
  },
});

export const getSupportPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return (await ctx.runQuery(supportQueries.getSupportPostById, args)) as
      | (SupportPostRecord & { status: "published" | "draft" | "archived" })
      | null;
  },
});

export const getSupportPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return (await ctx.runQuery(supportQueries.getSupportPostMeta, args)) as {
      _id: string;
      _creationTime: number;
      postId: string;
      key: string;
      value: string | number | boolean | null | undefined;
      createdAt: number;
      updatedAt?: number;
    }[];
  },
});

export const listConversations = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      threadId: v.string(),
      lastMessage: v.optional(v.string()),
      lastRole: v.optional(v.union(v.literal("user"), v.literal("assistant"))),
      lastAt: v.optional(v.number()),
      firstAt: v.optional(v.number()),
      totalMessages: v.optional(v.number()),
      contactId: v.optional(v.string()),
      contactName: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      origin: v.optional(v.union(v.literal("chat"), v.literal("email"))),
      status: v.optional(
        v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
      ),
      mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
      assignedAgentId: v.optional(v.string()),
      assignedAgentName: v.optional(v.string()),
      agentThreadId: v.optional(v.string()),
      postId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const orgId = args.organizationId as any;

    const nativeRows = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_lastMessageAt", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .take(limit);

    const seenThreadIds = new Set<string>();
    const native = nativeRows.map((row) => {
      const threadId = row.agentThreadId ?? row.sessionId;
      seenThreadIds.add(threadId);
      return {
        threadId,
        lastMessage: row.lastMessageSnippet ?? undefined,
        lastRole: row.lastMessageAuthor ?? undefined,
        lastAt: row.lastMessageAt ?? undefined,
        firstAt: row.firstMessageAt ?? undefined,
        totalMessages: row.totalMessages ?? undefined,
        contactId: row.contactId ? String(row.contactId) : undefined,
        contactName: row.contactName ?? undefined,
        contactEmail: row.contactEmail ?? undefined,
        origin: row.origin ?? undefined,
        status: row.status ?? undefined,
        mode: row.mode ?? undefined,
        assignedAgentId: row.assignedAgentId ?? undefined,
        assignedAgentName: row.assignedAgentName ?? undefined,
        agentThreadId: row.agentThreadId ?? undefined,
        // Back-compat: callers historically used this only as an opaque reference.
        postId: threadId,
      };
    });

    // Back-compat fallback (no N+1): include CMS conversations that haven't been written to the native index yet.
    const legacy = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "supportconversations", limit },
    })) as SupportPostRecord[];

    const legacyMapped = legacy
      .filter((post) => !seenThreadIds.has(post.slug))
      .map((post) => ({
        threadId: post.slug,
        lastMessage: post.content ?? undefined,
        lastRole: "user" as const,
        lastAt: post.updatedAt ?? post.createdAt,
        firstAt: post.createdAt,
        totalMessages: undefined,
        contactId: undefined,
        contactName: undefined,
        contactEmail: undefined,
        origin: "chat" as const,
        status: undefined,
        mode: undefined,
        assignedAgentId: undefined,
        assignedAgentName: undefined,
        agentThreadId: undefined,
        postId: post._id,
      }));

    return [...native, ...legacyMapped].slice(0, limit);
  },
});

export const listMessages = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      createdAt: v.number(),
      agentName: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) return [];
    const orgId = args.organizationId as any;

    // Verify thread ownership via native index (no scans).
    const conversationByThread = args.threadId
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_agentThreadId", (q) =>
            q.eq("organizationId", orgId).eq("agentThreadId", resolvedThreadId),
          )
          .first()
      : null;
    const conversationBySession = !conversationByThread
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_session", (q) =>
            q.eq("organizationId", orgId).eq("sessionId", resolvedThreadId),
          )
          .first()
      : null;
    const agentThreadId =
      conversationByThread?.agentThreadId ??
      conversationBySession?.agentThreadId ??
      (args.threadId ? resolvedThreadId : null);

    if (!agentThreadId) {
      return [];
    }

    const page = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId: agentThreadId,
        order: "asc",
        paginationOpts: { cursor: null, numItems: 200 },
        excludeToolMessages: true,
      },
    );

    const extractText = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (!Array.isArray(value)) return "";
      return value
        .map((part) => {
          if (!part || typeof part !== "object") return "";
          const p = part as Record<string, unknown>;
          return p.type === "text" && typeof p.text === "string" ? p.text : "";
        })
        .filter(Boolean)
        .join("\n");
    };

    return (page.page ?? []).flatMap((row: any) => {
      const role = row?.message?.role;
      if (role !== "user" && role !== "assistant") {
        return [];
      }
      const contentRaw = row?.message?.content;
      const content = extractText(contentRaw).trim();
      if (!content) return [];
      return [
        {
          _id: String(row._id ?? row.id ?? ""),
          role,
          content,
          createdAt:
            typeof row._creationTime === "number" ? row._creationTime : Date.now(),
          agentName: typeof row.agentName === "string" ? row.agentName : undefined,
        },
      ];
    });
  },
});

export const listConversationNotes = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      note: v.string(),
      actorId: v.optional(v.string()),
      actorName: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const resolved = args.threadId ?? args.sessionId;
    if (!resolved) {
      return [];
    }
    const orgId = args.organizationId as any;
    const conversationByThread = args.threadId
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_agentThreadId", (q) =>
            q.eq("organizationId", orgId).eq("agentThreadId", resolved),
          )
          .first()
      : null;
    const conversationBySession = !conversationByThread
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_session", (q) =>
            q.eq("organizationId", orgId).eq("sessionId", resolved),
          )
          .first()
      : null;
    const conversation = conversationByThread ?? conversationBySession;
    if (!conversation) {
      return [];
    }

    const rows = await ctx.db
      .query("supportConversationNotes")
      .withIndex("by_org_session_createdAt", (q) =>
        q
          .eq("organizationId", args.organizationId as any)
          .eq("sessionId", conversation.sessionId),
      )
      .order("desc")
      .take(200);

    return rows.map((row) => ({
      _id: String(row._id),
      note: row.note,
      actorId: row.actorId ?? undefined,
      actorName: row.actorName ?? undefined,
      createdAt: row.createdAt,
    }));
  },
});

export const listConversationEvents = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      eventType: v.string(),
      actorId: v.optional(v.string()),
      actorName: v.optional(v.string()),
      payload: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const resolved = args.threadId ?? args.sessionId;
    if (!resolved) {
      return [];
    }
    const orgId = args.organizationId as any;
    const conversationByThread = args.threadId
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_agentThreadId", (q) =>
            q.eq("organizationId", orgId).eq("agentThreadId", resolved),
          )
          .first()
      : null;
    const conversationBySession = !conversationByThread
      ? await ctx.db
          .query("supportConversations")
          .withIndex("by_org_session", (q) =>
            q.eq("organizationId", orgId).eq("sessionId", resolved),
          )
          .first()
      : null;
    const conversation = conversationByThread ?? conversationBySession;
    if (!conversation) {
      return [];
    }

    const rows = await ctx.db
      .query("supportConversationEvents")
      .withIndex("by_org_session_createdAt", (q) =>
        q
          .eq("organizationId", args.organizationId as any)
          .eq("sessionId", conversation.sessionId),
      )
      .order("desc")
      .take(200);

    return rows.map((row) => ({
      _id: String(row._id),
      eventType: row.eventType,
      actorId: row.actorId ?? undefined,
      actorName: row.actorName ?? undefined,
      payload: row.payload ?? undefined,
      createdAt: row.createdAt,
    }));
  },
});

export const getRagIndexStatusForPost = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
    postId: v.string(),
  },
  returns: v.object({
    isEnabledForPostType: v.boolean(),
    sourceType: v.optional(v.union(v.literal("postType"), v.literal("lmsPostType"))),
    entryKey: v.optional(v.string()),
    lastStatus: v.optional(v.string()),
    lastAttemptAt: v.optional(v.number()),
    lastSuccessAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    lastEntryId: v.optional(v.string()),
    lastEntryStatus: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("replaced")),
    ),
    config: v.optional(
      v.object({
        displayName: v.optional(v.string()),
        fields: v.optional(v.array(v.string())),
        includeTags: v.optional(v.boolean()),
        metaFieldKeys: v.optional(v.array(v.string())),
        additionalMetaKeys: v.optional(v.string()),
        lastIndexedAt: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
    const org = args.organizationId as Id<"organizations">;

    const lmsConfig = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", org)
          .eq("sourceType", "lmsPostType")
          .eq("postTypeSlug", normalizedPostTypeSlug),
      )
      .unique();

    const postConfig =
      lmsConfig ??
      (await ctx.db
        .query("supportRagSources")
        .withIndex("by_org_type_and_postTypeSlug", (q) =>
          q
            .eq("organizationId", org)
            .eq("sourceType", "postType")
            .eq("postTypeSlug", normalizedPostTypeSlug),
        )
        .unique());

    if (!postConfig?.isEnabled) {
      return { isEnabledForPostType: false };
    }

    const sourceType = postConfig.sourceType;
    const entryKey =
      sourceType === "lmsPostType"
        ? `lms:${normalizedPostTypeSlug}:${args.postId}`
        : `post:${args.postId}`;

    const status = await ctx.db
      .query("supportRagIndexStatus")
      .withIndex("by_org_post", (q) =>
        q
          .eq("organizationId", org)
          .eq("postTypeSlug", normalizedPostTypeSlug)
          .eq("postId", args.postId),
      )
      .unique();

    return {
      isEnabledForPostType: true,
      sourceType,
      entryKey,
      lastStatus: status?.lastStatus,
      lastAttemptAt: status?.lastAttemptAt,
      lastSuccessAt: status?.lastSuccessAt,
      lastError: status?.lastError,
      lastEntryId: status?.lastEntryId,
      lastEntryStatus: status?.lastEntryStatus,
      config: {
        displayName: postConfig.displayName,
        fields: postConfig.fields as unknown as string[],
        includeTags: postConfig.includeTags,
        metaFieldKeys: postConfig.metaFieldKeys,
        additionalMetaKeys: postConfig.additionalMetaKeys,
        lastIndexedAt: postConfig.lastIndexedAt,
      },
    };
  },
});

export const getAgentPresence = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      organizationId: v.string(),
      threadId: v.string(),
      agentUserId: v.optional(v.string()),
      agentName: v.optional(v.string()),
      status: v.optional(v.union(v.literal("typing"), v.literal("idle"))),
      updatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) return null;
    const presencePosts = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "supportpresence" },
    })) as SupportPostRecord[];
    const match = presencePosts.find((p) => p.slug === resolvedThreadId);
    if (!match) return null;
    const meta = await ctx.runQuery(supportQueries.getSupportPostMeta, {
      postId: match._id,
      organizationId: args.organizationId,
    });
    const metaMap: Record<
      string,
      string | number | boolean | null | undefined
    > = {};
    meta.forEach((m) => {
      metaMap[m.key] = m.value ?? null;
    });
    return {
      _id: match._id,
      _creationTime: match._creationTime,
      organizationId: match.organizationId,
      threadId: resolvedThreadId,
      agentUserId: metaMap.agentUserId as string | undefined,
      agentName: metaMap.agentName as string | undefined,
      status: (metaMap.status as "typing" | "idle" | undefined) ?? "idle",
      updatedAt: match.updatedAt ?? match.createdAt,
    };
  },
});

export const getConversationMode = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.union(v.literal("agent"), v.literal("manual")),
  handler: async (ctx, args) => {
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) return "agent";
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "supportconversations" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === resolvedThreadId);
    if (!convo) return "agent";
    const meta = (await ctx.runQuery(supportQueries.getSupportPostMeta, {
      postId: convo._id,
      organizationId: args.organizationId,
    })) as { key: string; value: unknown }[];
    const modeEntry = meta.find((m) => m.key === "mode");
    return (modeEntry?.value as "agent" | "manual" | undefined) ?? "agent";
  },
});

export const listHelpdeskArticles = query({
  args: {
    organizationId: v.string(),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: {
        postTypeSlug: "helpdeskarticles",
        status: "published",
        limit: args.limit ?? 50,
      },
    })) as SupportPostRecord[];

    const normalizedQuery =
      typeof args.query === "string" ? args.query.trim().toLowerCase() : "";

    const mapped = posts.map((entry) => ({
      _id: entry._id,
      entryId: entry._id,
      title: entry.title ?? "Untitled article",
      content: entry.content ?? entry.excerpt ?? "",
      excerpt: entry.excerpt ?? undefined,
      slug: entry.slug ?? undefined,
      tags: entry.tags ?? undefined,
      type: entry.postTypeSlug ?? undefined,
      source: "helpdesk",
      status: entry.status ?? "published",
      updatedAt: entry.updatedAt ?? entry._creationTime,
      createdAt: entry.createdAt,
    }));

    if (!normalizedQuery) {
      return mapped;
    }

    // In-memory filtering for now (component doesn't expose a search index here).
    return mapped
      .map((entry) => {
        const haystack =
          `${entry.title}\n${entry.excerpt ?? ""}\n${entry.content}`
            .toLowerCase()
            .trim();
        const score = haystack.includes(normalizedQuery) ? 1 : 0;
        return { entry, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.entry);
  },
});

export const getHelpdeskArticleById = query({
  args: {
    // Component posts live in the support component namespace, not the portal "posts" table.
    // Accept string ids from component posts to avoid portal Id<"posts"> validation failures.
    id: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(supportQueries.getSupportPostById, {
      ...args,
      id: args.id as Id<"posts">,
    });
    if (!post || post.postTypeSlug !== "helpdeskarticles") return null;
    return post;
  },
});

export const listRagSources = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const postTypeSources = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sourceType", "postType"),
      )
      .collect();
    const lmsSources = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sourceType", "lmsPostType"),
      )
      .collect();

    return [...postTypeSources, ...lmsSources].map((source) => ({
      _id: source._id,
      _creationTime: source._creationTime,
      postTypeSlug: source.postTypeSlug,
      displayName: source.displayName,
      isEnabled: source.isEnabled,
      includeTags: source.includeTags,
      metaFieldKeys: source.metaFieldKeys ?? [],
      additionalMetaKeys: source.additionalMetaKeys,
      fields: source.fields,
      useCustomBaseInstructions: source.useCustomBaseInstructions ?? false,
      baseInstructions: source.baseInstructions ?? "",
    })) satisfies RagSourceRecord[];
  },
});

export const getRagSourceConfigForPostType = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("supportRagSources"),
      postTypeSlug: v.string(),
      sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
      isEnabled: v.boolean(),
      useCustomBaseInstructions: v.boolean(),
      baseInstructions: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = args.organizationId as Id<"organizations">;
    const postTypeSlug = args.postTypeSlug.toLowerCase().trim();
    if (!postTypeSlug) return null;

    const lmsConfig = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", org)
          .eq("sourceType", "lmsPostType")
          .eq("postTypeSlug", postTypeSlug),
      )
      .unique();

    const postConfig =
      lmsConfig ??
      (await ctx.db
        .query("supportRagSources")
        .withIndex("by_org_type_and_postTypeSlug", (q) =>
          q
            .eq("organizationId", org)
            .eq("sourceType", "postType")
            .eq("postTypeSlug", postTypeSlug),
        )
        .unique());

    if (!postConfig) return null;

    return {
      _id: postConfig._id,
      postTypeSlug: postConfig.postTypeSlug,
      sourceType: postConfig.sourceType,
      isEnabled: postConfig.isEnabled,
      useCustomBaseInstructions: postConfig.useCustomBaseInstructions ?? false,
      baseInstructions: postConfig.baseInstructions ?? "",
    };
  },
});

const DEFAULT_EMAIL_DOMAIN =
  process.env.SUPPORT_EMAIL_DOMAIN ?? "support.launchthat.dev";

const buildDefaultAlias = (organizationId: string) =>
  `support-${organizationId}`.toLowerCase() + `@${DEFAULT_EMAIL_DOMAIN}`;

export const getEmailSettings = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.runQuery(supportQueries.listSupportOptions, {
      organizationId: args.organizationId,
    });
    const map = new Map<string, string | number | boolean | null | undefined>();
    entries.forEach((entry: { key: string; value: unknown }) => {
      map.set(
        entry.key,
        entry.value as string | number | boolean | null | undefined,
      );
    });
    const defaultAlias =
      (map.get("defaultAlias") as string | undefined) ??
      buildDefaultAlias(args.organizationId);
    const dnsRecords = parseJsonArray(map.get("dnsRecords")) ?? undefined;
    return {
      defaultAlias,
      customDomain:
        (map.get("customDomain") as string | null | undefined) ?? null,
      allowEmailIntake:
        (map.get("allowEmailIntake") as boolean | undefined) ?? false,
      verificationStatus:
        (map.get("verificationStatus") as
          | "unverified"
          | "pending"
          | "verified"
          | "failed"
          | undefined) ?? "unverified",
      dnsRecords,
    } satisfies EmailSettings;
  },
});

// Generic options accessor for support component options table
export const getSupportOption = query({
  args: {
    organizationId: v.string(),
    key: v.string(),
  },
  returns: v.union(v.string(), v.number(), v.boolean(), v.null()),
  handler: async (ctx, args) => {
    const options = await ctx.runQuery(supportQueries.listSupportOptions, {
      organizationId: args.organizationId,
    });
    const match = (options as { key: string; value: unknown }[]).find(
      (o) => o.key === args.key,
    );
    const value = match?.value;
    if (value === undefined) return null;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return value;
    }
    return null;
  },
});
