import type { Doc, Id } from "../../_generated/dataModel";
import { internalQuery, query } from "../../_generated/server";

import type { QueryCtx } from "../../_generated/server";
import { getEmailSettingsByAliasHelper } from "./helpers";
import { normalizeOrganizationId } from "../../constants";
import { supportOrganizationIdValidator } from "./schema";
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

const verificationStatusValidator = v.union(
  v.literal("unverified"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("failed"),
);

const dnsRecordShape = v.object({
  type: v.string(),
  host: v.string(),
  value: v.string(),
});

const DEFAULT_EMAIL_DOMAIN =
  process.env.SUPPORT_EMAIL_DOMAIN ?? "support.launchthat.dev";

const resultShape = v.object({
  entryId: v.id("posts"),
  title: v.string(),
  content: v.string(),
  excerpt: v.optional(v.string()),
  slug: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  type: v.optional(v.string()),
  source: v.optional(v.string()),
  updatedAt: v.number(),
});

const sanitizeOrganizationId = (organizationId: Id<"organizations">) => {
  return organizationId
    .toString()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
};

const randomSuffix = (length: number) => {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 36)
      .toString(36)
      .charAt(0),
  ).join("");
};

export const generateDefaultAliasParts = (
  organizationId: Id<"organizations">,
) => {
  const base = sanitizeOrganizationId(organizationId);
  const suffix = randomSuffix(8);
  const localPart = `${base}${suffix}`;
  const address = `${localPart}@${DEFAULT_EMAIL_DOMAIN}`;
  return { localPart, address };
};

export const getEmailSettingsByAlias = internalQuery({
  args: {
    aliasLocalPart: v.string(),
  },
  handler: async (ctx, args) => {
    return getEmailSettingsByAliasHelper(ctx, args.aliasLocalPart);
  },
});

// export const getEmailSettingsByAlias = query({
//   args: {
//     aliasLocalPart: v.string(),
//   },
//   returns: v.union(
//     v.object({
//       organizationId: v.id("organizations"),
//       defaultAlias: v.string(),
//     }),
//     v.null(),
//   ),
//   handler: async (ctx, args) => {
//     const record = await ctx.db
//       .query("supportEmailSettings")
//       .withIndex("by_alias_local_part", (q) =>
//         q.eq("defaultAliasLocalPart", args.aliasLocalPart.toLowerCase()),
//       )
//       .unique();

//     if (!record) {
//       return null;
//     }

//     return {
//       organizationId: record.organizationId,
//       defaultAlias: record.defaultAlias,
//     };
//   },
// });

export const listHelpdeskArticles = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(resultShape),
  handler: async (ctx, args) => {
    const normalizedQuery = args.query?.trim().toLowerCase() ?? "";
    const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
    const terms = normalizedQuery
      ? normalizedQuery.split(/\s+/).filter(Boolean)
      : [];
    const organizationId = normalizeOrganizationId(args.organizationId);

    const helpdeskPosts = await ctx.db
      .query("posts")
      .withIndex("by_organization_postTypeSlug", (q) =>
        q
          .eq("organizationId", organizationId)
          .eq("postTypeSlug", "helpdeskarticles"),
      )
      .take(200);

    const publishedPosts = helpdeskPosts.filter(
      (post) => post.status === "published",
    );

    const scoredEntries = publishedPosts
      .map((entry) => {
        const haystack = [
          entry.title,
          entry.excerpt ?? "",
          entry.content ?? "",
          (entry.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        const score =
          terms.length === 0
            ? 1
            : terms.reduce(
                (total, term) => (haystack.includes(term) ? total + 1 : total),
                0,
              );
        return { entry, score };
      })
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.entry.updatedAt ?? 0) - (a.entry.updatedAt ?? 0),
      )
      .slice(0, limit)
      .map(({ entry }) => ({
        entryId: entry._id,
        title: entry.title ?? "Untitled article",
        content: entry.content ?? entry.excerpt ?? "",
        excerpt: entry.excerpt ?? undefined,
        slug: entry.slug ?? undefined,
        tags: entry.tags ?? undefined,
        type: entry.postTypeSlug ?? undefined,
        source: "helpdesk",
        updatedAt: entry.updatedAt ?? entry._creationTime,
      }));

    if (scoredEntries.length > 0) {
      return scoredEntries;
    }

    const fallbackPosts = publishedPosts
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, limit);

    return fallbackPosts.map((post) => ({
      entryId: post._id,
      title: post.title ?? "Untitled article",
      content: post.excerpt ?? post.content ?? "",
      excerpt: post.excerpt ?? undefined,
      slug: post.slug ?? undefined,
      tags: post.tags ?? undefined,
      type: post.postTypeSlug ?? undefined,
      source: "helpdesk",
      updatedAt: post.updatedAt ?? post._creationTime,
    }));
  },
});

const helpdeskTriggerResult = v.union(
  v.object({
    entryId: v.id("posts"),
    title: v.string(),
    content: v.string(),
    slug: v.optional(v.string()),
  }),
  v.null(),
);

const TRIGGER_META_KEYS = {
  phrases: "trigger_phrases",
  mode: "trigger_match_mode",
  priority: "trigger_priority",
  active: "trigger_is_active",
} as const;

const MATCH_MODE_VALUES = ["contains", "exact", "regex"] as const;
type TriggerMatchMode = (typeof MATCH_MODE_VALUES)[number];
const MATCH_MODES = new Set<TriggerMatchMode>(MATCH_MODE_VALUES);

const parseBooleanMeta = (value: Doc<"postsMeta">["value"]) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

const parseNumberMeta = (value: Doc<"postsMeta">["value"]) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

const parseStringMeta = (value: Doc<"postsMeta">["value"]) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

async function getPostMetaMap(ctx: QueryCtx, postId: Id<"posts">) {
  const entries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();
  const map = new Map<string, Doc<"postsMeta">["value"]>();
  for (const entry of entries) {
    map.set(entry.key, entry.value ?? null);
  }
  return map;
}

export const matchHelpdeskArticle = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    question: v.string(),
  },
  returns: helpdeskTriggerResult,
  handler: async (ctx, args) => {
    const normalizedQuestion = args.question.trim();
    if (!normalizedQuestion) {
      return null;
    }

    const organizationId = normalizeOrganizationId(args.organizationId);
    const lowerQuestion = normalizedQuestion.toLowerCase();
    const helpdeskPosts = await ctx.db
      .query("posts")
      .withIndex("by_organization_postTypeSlug", (q) =>
        q
          .eq("organizationId", organizationId)
          .eq("postTypeSlug", "helpdeskarticles"),
      )
      .take(200);

    let bestMatch: {
      entryId: Id<"posts">;
      title: string;
      content: string;
      slug?: string;
      score: number;
      priority: number;
      updatedAt: number;
    } | null = null;

    for (const post of helpdeskPosts) {
      if (post.status !== "published") continue;
      const metaMap = await getPostMetaMap(ctx, post._id);
      const rawPhrases = parseStringMeta(
        metaMap.get(TRIGGER_META_KEYS.phrases),
      );
      if (!rawPhrases) continue;

      const phrases = rawPhrases
        .split(/[\n,]+/)
        .map((phrase) => phrase.trim())
        .filter(Boolean);
      if (phrases.length === 0) continue;

      const isActiveMeta = parseBooleanMeta(
        metaMap.get(TRIGGER_META_KEYS.active),
      );
      if (isActiveMeta === false) continue;

      const priority =
        parseNumberMeta(metaMap.get(TRIGGER_META_KEYS.priority)) ?? 0;
      const modeMeta = parseStringMeta(
        metaMap.get(TRIGGER_META_KEYS.mode),
      ).toLowerCase();
      const mode: TriggerMatchMode = MATCH_MODES.has(
        modeMeta as TriggerMatchMode,
      )
        ? (modeMeta as TriggerMatchMode)
        : "contains";

      let matched = false;
      for (const phrase of phrases) {
        if (!phrase) continue;
        if (mode === "regex") {
          try {
            const regex = new RegExp(phrase, "i");
            if (regex.test(normalizedQuestion)) {
              matched = true;
              break;
            }
          } catch (error) {
            console.warn(
              "[support.matchHelpdeskArticle] invalid regex phrase",
              phrase,
              error,
            );
          }
        } else if (mode === "exact") {
          if (lowerQuestion === phrase.toLowerCase()) {
            matched = true;
            break;
          }
        } else if (lowerQuestion.includes(phrase.toLowerCase())) {
          matched = true;
          break;
        }
      }

      if (!matched) continue;

      const score =
        phrases.filter((phrase) => lowerQuestion.includes(phrase.toLowerCase()))
          .length || 1;
      if (
        !bestMatch ||
        priority > bestMatch.priority ||
        (priority === bestMatch.priority &&
          (score > bestMatch.score ||
            (score === bestMatch.score &&
              (post.updatedAt ?? 0) > bestMatch.updatedAt)))
      ) {
        bestMatch = {
          entryId: post._id,
          title: post.title ?? "Untitled article",
          content: post.content ?? post.excerpt ?? "",
          slug: post.slug ?? undefined,
          score,
          priority,
          updatedAt: post.updatedAt ?? 0,
        };
      }
    }

    if (!bestMatch) {
      return null;
    }

    return {
      entryId: bestMatch.entryId,
      title: bestMatch.title,
      content: bestMatch.content,
      excerpt: undefined,
      slug: bestMatch.slug,
      tags: undefined,
      type: undefined,
      source: "helpdesk",
      updatedAt: bestMatch.updatedAt,
    };
  },
});

type MessageDoc = Doc<"supportMessages">;

export const listMessages = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    sessionId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("supportMessages"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      createdAt: v.number(),
      contactId: v.optional(v.id("contacts")),
      contactEmail: v.optional(v.string()),
      contactName: v.optional(v.string()),
      agentUserId: v.optional(v.string()),
      agentName: v.optional(v.string()),
      messageType: v.optional(
        v.union(
          v.literal("chat"),
          v.literal("email_inbound"),
          v.literal("email_outbound"),
        ),
      ),
      subject: v.optional(v.string()),
      htmlBody: v.optional(v.string()),
      textBody: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const entries = (await ctx.db
      .query("supportMessages")
      .withIndex("by_session", (q) =>
        q.eq("organizationId", organizationId).eq("sessionId", args.sessionId),
      )
      .order("desc")
      .take(50)) as MessageDoc[];

    return entries
      .map((entry) => ({
        _id: entry._id,
        role: entry.role,
        content: entry.content,
        createdAt: entry.createdAt,
        contactId: entry.contactId,
        contactEmail: entry.contactEmail ?? undefined,
        contactName: entry.contactName ?? undefined,
        agentUserId: entry.agentUserId ?? undefined,
        agentName: entry.agentName ?? undefined,
        messageType: entry.messageType ?? undefined,
        subject: entry.subject ?? undefined,
        htmlBody: entry.htmlBody ?? undefined,
        textBody: entry.textBody ?? undefined,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const listConversations = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      sessionId: v.string(),
      lastMessage: v.string(),
      lastRole: v.union(v.literal("user"), v.literal("assistant")),
      lastAt: v.number(),
      firstAt: v.number(),
      totalMessages: v.number(),
      contactId: v.optional(v.id("contacts")),
      contactName: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      origin: v.union(v.literal("chat"), v.literal("email")),
      status: v.optional(
        v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
      ),
      mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
      assignedAgentId: v.optional(v.string()),
      assignedAgentName: v.optional(v.string()),
      agentThreadId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const organizationId = normalizeOrganizationId(args.organizationId);
    const stored = await ctx.db
      .query("supportConversations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId),
      )
      .order("desc")
      .take(limit);

    if (stored.length > 0) {
      return stored.map((conversation) => ({
        sessionId: conversation.sessionId,
        lastMessage: conversation.lastMessageSnippet ?? "",
        lastRole: conversation.lastMessageAuthor ?? "user",
        lastAt: conversation.lastMessageAt,
        firstAt: conversation.firstMessageAt,
        totalMessages: conversation.totalMessages,
        contactId: conversation.contactId ?? undefined,
        contactName: conversation.contactName ?? undefined,
        contactEmail: conversation.contactEmail ?? undefined,
        origin: conversation.origin,
        status: conversation.status ?? "open",
        mode: conversation.mode ?? "agent",
        assignedAgentId: conversation.assignedAgentId ?? undefined,
        assignedAgentName: conversation.assignedAgentName ?? undefined,
        agentThreadId: conversation.agentThreadId ?? undefined,
      }));
    }

    const rows = (await ctx.db
      .query("supportMessages")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(500)) as MessageDoc[];

    const conversations = new Map<
      string,
      {
        sessionId: string;
        lastMessage: string;
        lastRole: "user" | "assistant";
        lastAt: number;
        firstAt: number;
        totalMessages: number;
        contactId?: Id<"contacts">;
        contactName?: string;
        contactEmail?: string;
        assignedAgentId?: string;
        assignedAgentName?: string;
        mode?: "agent" | "manual";
        agentThreadId?: string;
      }
    >();

    for (const row of rows) {
      const existing = conversations.get(row.sessionId);
      if (existing) {
        existing.totalMessages += 1;
        existing.firstAt = row.createdAt;
        if (!existing.contactId && row.contactId) {
          existing.contactId = row.contactId;
          existing.contactName = row.contactName ?? undefined;
          existing.contactEmail = row.contactEmail ?? undefined;
        }
        continue;
      }
      conversations.set(row.sessionId, {
        sessionId: row.sessionId,
        lastMessage: row.content,
        lastRole: row.role,
        lastAt: row.createdAt,
        firstAt: row.createdAt,
        totalMessages: 1,
        contactId: row.contactId ?? undefined,
        contactName: row.contactName ?? undefined,
        contactEmail: row.contactEmail ?? undefined,
        assignedAgentId: row.agentUserId ?? undefined,
        assignedAgentName: row.agentName ?? undefined,
        mode: "agent",
        agentThreadId: undefined,
      });
    }

    return Array.from(conversations.values())
      .sort((a, b) => b.lastAt - a.lastAt)
      .slice(0, limit)
      .map((conversation) => ({
        ...conversation,
        origin: "chat" as const,
        status: "open" as const,
        mode: conversation.mode ?? "agent",
        agentThreadId: conversation.agentThreadId ?? undefined,
      }));
  },
});

export const getConversationMode = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    sessionId: v.string(),
  },
  returns: v.object({
    mode: v.union(v.literal("agent"), v.literal("manual")),
  }),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const conversation = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", organizationId).eq("sessionId", args.sessionId),
      )
      .unique();

    if (!conversation) {
      return { mode: "agent" as const };
    }

    return { mode: conversation.mode ?? "agent" };
  },
});

export const getAgentPresence = query({
  args: {
    organizationId: supportOrganizationIdValidator,
    sessionId: v.string(),
  },
  returns: v.object({
    agentName: v.optional(v.string()),
    status: v.union(v.literal("typing"), v.literal("idle")),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const presence = await ctx.db
      .query("supportAgentPresence")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", organizationId).eq("sessionId", args.sessionId),
      )
      .unique();

    if (!presence) {
      return { status: "idle" as const, updatedAt: Date.now() };
    }

    const isStale = Date.now() - presence.updatedAt > 15_000;

    return {
      agentName: presence.agentName ?? undefined,
      status: isStale ? ("idle" as const) : presence.status,
      updatedAt: presence.updatedAt,
    };
  },
});

export const getConversationMetadata = internalQuery({
  args: {
    organizationId: supportOrganizationIdValidator,
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const conversation = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", organizationId).eq("sessionId", args.sessionId),
      )
      .unique();

    if (!conversation) {
      return null;
    }

    return {
      agentThreadId: conversation.agentThreadId ?? null,
      contactId: conversation.contactId ?? null,
      contactEmail: conversation.contactEmail ?? null,
      contactName: conversation.contactName ?? null,
      mode: conversation.mode ?? "agent",
    };
  },
});

export const getEmailSettings = query({
  args: {
    organizationId: supportOrganizationIdValidator,
  },
  returns: v.object({
    defaultAlias: v.string(),
    allowEmailIntake: v.boolean(),
    customDomain: v.optional(v.string()),
    verificationStatus: verificationStatusValidator,
    dnsRecords: v.optional(v.array(dnsRecordShape)),
    resendDomainId: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    isCustomDomainConnected: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const existing = await ctx.db
      .query("supportEmailSettings")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId),
      )
      .unique();

    if (!existing) {
      const aliasParts = generateDefaultAliasParts(organizationId);
      return {
        defaultAlias: aliasParts.address,
        allowEmailIntake: false,
        verificationStatus: "unverified" as const,
        dnsRecords: undefined,
        resendDomainId: undefined,
        lastSyncedAt: undefined,
        customDomain: undefined,
        isCustomDomainConnected: false,
      };
    }

    const verificationStatus = existing.verificationStatus ?? "unverified";
    const isCustomDomainConnected =
      Boolean(existing.customDomain) && verificationStatus === "verified";

    return {
      defaultAlias: existing.defaultAlias,
      allowEmailIntake: existing.allowEmailIntake,
      customDomain: existing.customDomain ?? undefined,
      verificationStatus,
      dnsRecords: existing.dnsRecords ?? undefined,
      resendDomainId: existing.resendDomainId ?? undefined,
      lastSyncedAt: existing.lastSyncedAt ?? undefined,
      isCustomDomainConnected,
    };
  },
});

const ragFieldValidator = v.array(
  v.union(v.literal("title"), v.literal("excerpt"), v.literal("content")),
);

export const listRagSources = query({
  args: {
    organizationId: supportOrganizationIdValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("supportRagSources"),
      postTypeSlug: v.string(),
      sourceType: v.string(),
      fields: ragFieldValidator,
      includeTags: v.boolean(),
      metaFieldKeys: v.optional(v.array(v.string())),
      displayName: v.optional(v.string()),
      isEnabled: v.boolean(),
      lastIndexedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const rawSources = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type", (q) =>
        q.eq("organizationId", organizationId).eq("sourceType", "postType"),
      )
      .collect();

    return rawSources.map((source) => ({
      _id: source._id,
      postTypeSlug: source.postTypeSlug,
      sourceType: source.sourceType,
      fields: source.fields,
      includeTags: source.includeTags,
      metaFieldKeys: source.metaFieldKeys ?? undefined,
      displayName: source.displayName ?? undefined,
      isEnabled: source.isEnabled,
      lastIndexedAt: source.lastIndexedAt ?? undefined,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    }));
  },
});
