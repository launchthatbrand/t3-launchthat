import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { internalQuery, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

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

interface RagSourceRecord {
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
}

interface EmailSettings {
  defaultAlias: string;
  customDomain?: string | null;
  allowEmailIntake?: boolean;
  verificationStatus?: "unverified" | "pending" | "verified" | "failed";
  dnsRecords?: { type: string; host: string; value: string }[];
}

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

// Used by Node actions (e.g. OpenAI model list) that must be admin-only.
export const assertSupportAdmin = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return null;
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
    return (await ctx.runQuery(supportQueries.listConversations, args));
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

    const conversation = (await ctx.runQuery(supportQueries.getConversationIndex, {
      organizationId: args.organizationId,
      threadId: args.threadId,
      sessionId: args.sessionId,
    })) as { agentThreadId?: string } | null;

    // If the UI passed an agent thread id via `sessionId` (common in some admin views),
    // `getConversationIndex` won’t find a row (because the real sessionId might be `discord:*`).
    // In that case, fall back to treating the provided id as the agent thread id.
    const agentThreadId = conversation?.agentThreadId ?? resolvedThreadId;

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
      let content = extractText(contentRaw).trim();
      // If the assistant message is a structured envelope, unwrap to just the text
      // so all UIs (admin + widget) render cleanly by default.
      if (content.startsWith("{")) {
        try {
          const parsed = JSON.parse(content) as any;
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.kind === "assistant_response_v1" &&
            typeof parsed.text === "string"
          ) {
            content = parsed.text.trim() || content;
          }
        } catch {
          // ignore
        }
      }
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
    return (await ctx.runQuery(supportQueries.listConversationNotes, args));
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
    return (await ctx.runQuery(supportQueries.listConversationEvents, args));
  },
});

/**
 * Fetch a CRM contact by ID (used by the Support admin UI).
 *
 * Note: Contacts are not exposed as a first-class CRM API in the portal yet,
 * so Support owns this small bridge query.
 */
export const getContactById = query({
  args: {
    // Accept as string to avoid coupling Support to whether "contacts" is mounted in this schema
    // (and to keep `convexspec` generation stable).
    contactId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await ctx.db.get(args.contactId as any);
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
    return (await ctx.runQuery(supportQueries.getRagIndexStatusForPost, args));
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
    return (await ctx.runQuery(supportQueries.listRagSources, args)) as
      | RagSourceRecord[]
      | [];
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
      _id: v.string(),
      postTypeSlug: v.string(),
      sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
      isEnabled: v.boolean(),
      useCustomBaseInstructions: v.boolean(),
      baseInstructions: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(supportQueries.getRagSourceConfigForPostType, args);
    if (!result) return null;
    return {
      _id: String((result)._id ?? ""),
      postTypeSlug: (result).postTypeSlug,
      sourceType: (result).sourceType,
      isEnabled: Boolean((result).isEnabled),
      useCustomBaseInstructions: Boolean((result).useCustomBaseInstructions),
      baseInstructions: String((result).baseInstructions ?? ""),
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
