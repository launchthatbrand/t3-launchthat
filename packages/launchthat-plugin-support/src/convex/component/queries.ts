import { v } from "convex/values";

import { query } from "./_generated/server";
import { organizationMatches } from "./helpers";

const resolveConversation = async (
  ctx: any,
  args: { organizationId: string; threadId?: string; sessionId?: string },
) => {
  const resolved = args.threadId ?? args.sessionId;
  if (!resolved) return null;
  const byThread = args.threadId
    ? await ctx.db
        .query("supportConversations")
        .withIndex("by_org_agentThreadId", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("agentThreadId", resolved),
        )
        .first()
    : null;
  const bySession = !byThread
    ? await ctx.db
        .query("supportConversations")
        .withIndex("by_org_session", (q: any) =>
          q.eq("organizationId", args.organizationId).eq("sessionId", resolved),
        )
        .first()
    : null;
  return byThread ?? bySession ?? null;
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
    const orgId = args.organizationId;
    const postTypeSlug = args.filters?.postTypeSlug?.toLowerCase();
    const parentId = args.filters?.parentId;

    let qb;
    if (parentId) {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org_parent", (q) =>
          q.eq("organizationId", orgId).eq("parentId", parentId),
        );
    } else if (postTypeSlug) {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org_postTypeSlug", (q) =>
          q.eq("organizationId", orgId).eq("postTypeSlug", postTypeSlug),
        );
    } else {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId));
    }

    if (args.filters?.status) {
      qb = qb.filter((q) => q.eq(q.field("status"), args.filters?.status));
    }

    const posts = await qb.order("desc").take(args.filters?.limit ?? 200);
    return posts;
  },
});

export const getSupportPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId ?? undefined,
      )
    ) {
      return null;
    }
    return post;
  },
});

export const getSupportPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return [];
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId ?? undefined,
      )
    ) {
      return [];
    }

    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const getSupportOption = query({
  args: {
    organizationId: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("key", args.key),
      )
      .unique();
    if (!existing) return null;
    return {
      key: existing.key,
      value: existing.value ?? null,
      updatedAt: existing.updatedAt ?? existing.createdAt,
    };
  },
});

export const listSupportOptions = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
    return options.map((opt) => ({
      key: opt.key,
      value: opt.value ?? null,
      updatedAt: opt.updatedAt ?? opt.createdAt,
    }));
  },
});

// ------------------------------
// Support operational queries
// ------------------------------

export const listConversations = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const rows = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_lastMessageAt", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit);

    // Dedupe: historically we could end up with multiple rows pointing at the same
    // agent thread id (e.g. one row keyed by clientSessionId + one keyed by agentThreadId).
    // Keep the first one (newest) since we’re sorted by lastMessageAt desc.
    const seen = new Set<string>();
    const result: any[] = [];
    for (const row of rows as any[]) {
      const threadId = row.agentThreadId ?? row.sessionId;
      const key = String(threadId ?? "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push({
        threadId,
        lastMessage: row.lastMessageSnippet ?? undefined,
        lastRole: row.lastMessageAuthor ?? undefined,
        lastAt: row.lastMessageAt ?? undefined,
        firstAt: row.firstMessageAt ?? undefined,
        totalMessages: row.totalMessages ?? undefined,
        contactId: typeof row.contactId === "string" ? row.contactId : undefined,
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
      });
    }
    return result;
  },
});

export const getConversationIndex = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await resolveConversation(ctx, args);
  },
});

export const listConversationNotes = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const convo = await resolveConversation(ctx, args);
    if (!convo) return [];
    const rows = await ctx.db
      .query("supportConversationNotes")
      .withIndex("by_org_session_createdAt", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sessionId", convo.sessionId),
      )
      .order("desc")
      .take(200);
    return rows.map((row: any) => ({
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
  handler: async (ctx, args) => {
    const convo = await resolveConversation(ctx, args);
    if (!convo) return [];
    const rows = await ctx.db
      .query("supportConversationEvents")
      .withIndex("by_org_session_createdAt", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sessionId", convo.sessionId),
      )
      .order("desc")
      .take(200);
    return rows.map((row: any) => ({
      _id: String(row._id),
      eventType: row.eventType,
      actorId: row.actorId ?? undefined,
      actorName: row.actorName ?? undefined,
      payload: row.payload ?? undefined,
      createdAt: row.createdAt,
    }));
  },
});

export const getAgentPresence = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolved = args.threadId ?? args.sessionId;
    if (!resolved) return null;
    const presence = await ctx.db
      .query("supportAgentPresence")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", args.organizationId).eq("sessionId", resolved),
      )
      .unique();
    if (!presence) return null;
    return {
      _id: String(presence._id),
      _creationTime: presence._creationTime,
      organizationId: presence.organizationId,
      threadId: resolved,
      agentUserId: presence.agentUserId ?? undefined,
      agentName: presence.agentName ?? undefined,
      status: presence.status ?? undefined,
      updatedAt: presence.updatedAt ?? undefined,
    };
  },
});

export const getConversationMode = query({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const convo = await resolveConversation(ctx, args);
    return (convo?.mode as "agent" | "manual" | undefined) ?? "agent";
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

    return [...postTypeSources, ...lmsSources].map((source: any) => ({
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
    }));
  },
});

export const getRagSourceConfigForPostType = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const postTypeSlug = args.postTypeSlug.toLowerCase().trim();
    if (!postTypeSlug) return null;

    const lmsConfig = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", args.organizationId)
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
            .eq("organizationId", args.organizationId)
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

export const getRagIndexStatusForPost = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();

    const lmsConfig = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", args.organizationId)
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
            .eq("organizationId", args.organizationId)
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
          .eq("organizationId", args.organizationId)
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
        fields: postConfig.fields,
        includeTags: postConfig.includeTags,
        metaFieldKeys: postConfig.metaFieldKeys,
        additionalMetaKeys: postConfig.additionalMetaKeys,
        lastIndexedAt: postConfig.lastIndexedAt,
      },
    };
  },
});

export const getRagSourceForPostType = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
    sourceType: v.union(v.literal("postType"), v.literal("lmsPostType")),
  },
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
    return {
      _id: doc._id,
      postTypeSlug: doc.postTypeSlug,
      displayName: doc.displayName,
      isEnabled: doc.isEnabled,
      includeTags: doc.includeTags,
      metaFieldKeys: doc.metaFieldKeys,
      additionalMetaKeys: doc.additionalMetaKeys,
      fields: doc.fields,
      useCustomBaseInstructions: doc.useCustomBaseInstructions,
      baseInstructions: doc.baseInstructions,
      lastIndexedAt: doc.lastIndexedAt,
      sourceType: doc.sourceType,
    };
  },
});

export const getRagSourceForPostTypeAny = query({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const slug = args.postTypeSlug.toLowerCase();
    const lmsConfig = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sourceType", "lmsPostType")
          .eq("postTypeSlug", slug),
      )
      .unique();

    const postConfig =
      lmsConfig ??
      (await ctx.db
        .query("supportRagSources")
        .withIndex("by_org_type_and_postTypeSlug", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("sourceType", "postType")
            .eq("postTypeSlug", slug),
        )
        .unique());

    if (!postConfig) {
      return null;
    }

    return {
      _id: postConfig._id,
      postTypeSlug: postConfig.postTypeSlug,
      sourceType: postConfig.sourceType,
      isEnabled: postConfig.isEnabled,
      fields: postConfig.fields,
      includeTags: postConfig.includeTags,
      metaFieldKeys: postConfig.metaFieldKeys,
      additionalMetaKeys: postConfig.additionalMetaKeys,
      displayName: postConfig.displayName,
      useCustomBaseInstructions: postConfig.useCustomBaseInstructions,
      baseInstructions: postConfig.baseInstructions,
      lastIndexedAt: postConfig.lastIndexedAt,
    };
  },
});
