import { mutation } from "./_generated/server";
import { organizationMatches } from "./helpers";
import { v } from "convex/values";

// ------------------------------
// Support operational helpers
// ------------------------------

const resolveConversation = async (ctx: any, args: {
  organizationId: string;
  threadId?: string;
  sessionId?: string;
}) => {
  const resolved = args.threadId ?? args.sessionId;
  if (!resolved) {
    throw new Error("threadId is required");
  }
  const byThread = args.threadId
    ? await ctx.db
        .query("supportConversations")
        .withIndex("by_org_agentThreadId", (q: any) =>
          q.eq("organizationId", args.organizationId).eq("agentThreadId", resolved),
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
  const conversation = byThread ?? bySession;
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  return { conversation, resolved };
};

export const createSupportPost = mutation({
  args: {
    title: v.string(),
    organizationId: v.string(),
    postTypeSlug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.string()),
    parentId: v.optional(v.id("posts")),
    parentTypeSlug: v.optional(v.string()),
    meta: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.optional(
            v.union(v.string(), v.number(), v.boolean(), v.null()),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      organizationId: args.organizationId,
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      content: args.content,
      excerpt: args.excerpt,
      slug: args.slug.toLowerCase(),
      status: args.status,
      tags: args.tags,
      authorId: args.authorId,
      parentId: args.parentId,
      parentTypeSlug: args.parentTypeSlug,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (args.meta && args.meta.length > 0) {
      for (const entry of args.meta) {
        await ctx.db.insert("postsMeta", {
          postId,
          key: entry.key,
          value: entry.value ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    return postId;
  },
});

export const updateSupportPost = mutation({
  args: {
    id: v.id("posts"),
    organizationId: v.string(),
    title: v.string(),
    postTypeSlug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.string()),
    parentId: v.optional(v.id("posts")),
    parentTypeSlug: v.optional(v.string()),
    meta: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.optional(
            v.union(v.string(), v.number(), v.boolean(), v.null()),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    if (
      !organizationMatches(
        existing.organizationId ?? undefined,
        args.organizationId,
      )
    ) {
      return null;
    }

    const timestamp = Date.now();
    await ctx.db.patch(args.id, {
      title: args.title,
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      content: args.content,
      excerpt: args.excerpt,
      slug: args.slug.toLowerCase(),
      status: args.status,
      tags: args.tags,
      authorId: args.authorId,
      parentId: args.parentId,
      parentTypeSlug: args.parentTypeSlug,
      updatedAt: timestamp,
    });

    if (args.meta) {
      for (const entry of args.meta) {
        const existingMeta = await ctx.db
          .query("postsMeta")
          .withIndex("by_post_and_key", (q) =>
            q.eq("postId", args.id).eq("key", entry.key),
          )
          .unique();
        if (existingMeta) {
          await ctx.db.patch(existingMeta._id, {
            value: entry.value ?? null,
            updatedAt: timestamp,
          });
        } else {
          await ctx.db.insert("postsMeta", {
            postId: args.id,
            key: entry.key,
            value: entry.value ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      }
    }

    return args.id;
  },
});

export const upsertSupportPostMeta = mutation({
  args: {
    postId: v.id("posts"),
    organizationId: v.string(),
    entries: v.array(
      v.object({
        key: v.string(),
        value: v.optional(
          v.union(v.string(), v.number(), v.boolean(), v.null()),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId,
      )
    ) {
      return false;
    }
    const timestamp = Date.now();
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q) =>
          q.eq("postId", args.postId).eq("key", entry.key),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: entry.value ?? null,
          updatedAt: timestamp,
        });
      } else {
        await ctx.db.insert("postsMeta", {
          postId: args.postId,
          key: entry.key,
          value: entry.value ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
    return true;
  },
});

export const upsertSupportOption = mutation({
  args: {
    organizationId: v.string(),
    key: v.string(),
    value: v.optional(
      v.union(v.string(), v.number(), v.boolean(), v.null()),
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("key", args.key),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value ?? null,
        updatedAt: timestamp,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("options", {
      organizationId: args.organizationId,
      key: args.key,
      value: args.value ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return id;
  },
});

// ------------------------------
// Support operational mutations
// ------------------------------

export const rateLimitOrThrow = mutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = Math.floor(now / args.windowMs);
    const bucketKey = `${args.key}:${windowStart}`;

    const existing = await ctx.db
      .query("supportRateLimits")
      .withIndex("by_key", (q) => q.eq("key", bucketKey))
      .unique();

    if (!existing) {
      await ctx.db.insert("supportRateLimits", {
        key: bucketKey,
        count: 1,
        expiresAt: now + args.windowMs,
        updatedAt: now,
      });
      return null;
    }

    if ((existing.count ?? 0) >= args.limit) {
      throw new Error("Rate limited");
    }

    await ctx.db.patch(existing._id, {
      count: (existing.count ?? 0) + 1,
      updatedAt: now,
    });

    return null;
  },
});

export const upsertConversationIndex = mutation({
  args: {
    organizationId: v.string(),
    sessionId: v.string(),
    agentThreadId: v.optional(v.string()),
    origin: v.union(v.literal("chat"), v.literal("email")),
    status: v.optional(
      v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
    ),
    mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
    subject: v.optional(v.string()),
    emailThreadId: v.optional(v.string()),
    inboundAlias: v.optional(v.string()),
    contactId: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    assignedAgentId: v.optional(v.string()),
    assignedAgentName: v.optional(v.string()),
    firstMessageAt: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    lastMessageAuthor: v.optional(
      v.union(v.literal("user"), v.literal("assistant")),
    ),
    lastMessageSnippet: v.optional(v.string()),
    totalMessages: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", args.organizationId).eq("sessionId", args.sessionId),
      )
      .unique();

    const firstMessageAt = args.firstMessageAt ?? existing?.firstMessageAt ?? now;
    const lastMessageAt = args.lastMessageAt ?? existing?.lastMessageAt ?? now;
    const totalMessages = args.totalMessages ?? existing?.totalMessages ?? 0;

    const payload = {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
      origin: args.origin,
      status: args.status ?? existing?.status ?? "open",
      mode: args.mode ?? existing?.mode ?? "agent",
      subject: args.subject ?? existing?.subject,
      emailThreadId: args.emailThreadId ?? existing?.emailThreadId,
      inboundAlias: args.inboundAlias ?? existing?.inboundAlias,
      contactId: args.contactId ?? existing?.contactId,
      contactName: args.contactName ?? existing?.contactName,
      contactEmail: args.contactEmail ?? existing?.contactEmail,
      assignedAgentId: args.assignedAgentId ?? existing?.assignedAgentId,
      assignedAgentName: args.assignedAgentName ?? existing?.assignedAgentName,
      agentThreadId: args.agentThreadId ?? existing?.agentThreadId,
      lastMessageSnippet: args.lastMessageSnippet ?? existing?.lastMessageSnippet,
      lastMessageAuthor: args.lastMessageAuthor ?? existing?.lastMessageAuthor,
      firstMessageAt,
      lastMessageAt,
      totalMessages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }

    await ctx.db.insert("supportConversations", payload);
    return null;
  },
});

export const recordMessageIndexUpdate = mutation({
  args: {
    organizationId: v.string(),
    // Stable browser session id if available, else thread id.
    sessionId: v.string(),
    threadId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    snippet: v.string(),
    contactId: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", args.organizationId).eq("sessionId", args.sessionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        contactId: args.contactId ?? existing.contactId,
        contactEmail: args.contactEmail ?? existing.contactEmail,
        contactName: args.contactName ?? existing.contactName,
        agentThreadId: args.threadId,
        lastMessageSnippet: args.snippet,
        lastMessageAuthor: args.role,
        lastMessageAt: now,
        totalMessages: (existing.totalMessages ?? 0) + 1,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("supportConversations", {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
      origin: "chat",
      status: "open",
      mode: args.mode ?? "agent",
      contactId: args.contactId,
      contactEmail: args.contactEmail,
      contactName: args.contactName,
      agentThreadId: args.threadId,
      lastMessageSnippet: args.snippet,
      lastMessageAuthor: args.role,
      firstMessageAt: now,
      lastMessageAt: now,
      totalMessages: 1,
      createdAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const appendConversationEvent = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    eventType: v.string(),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    const now = Date.now();
    await ctx.db.insert("supportConversationEvents", {
      organizationId: args.organizationId,
      sessionId: conversation.sessionId,
      agentThreadId: conversation.agentThreadId ?? resolved,
      eventType: args.eventType,
      actorId: args.actorId,
      actorName: args.actorName,
      payload: args.payload === undefined ? undefined : JSON.stringify(args.payload),
      createdAt: now,
    });
    return null;
  },
});

export const addConversationNote = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    note: v.string(),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    const now = Date.now();
    await ctx.db.insert("supportConversationNotes", {
      organizationId: args.organizationId,
      sessionId: conversation.sessionId,
      agentThreadId: conversation.agentThreadId ?? resolved,
      note: args.note,
      actorId: args.actorId,
      actorName: args.actorName,
      createdAt: now,
    });
    await ctx.db.insert("supportConversationEvents", {
      organizationId: args.organizationId,
      sessionId: conversation.sessionId,
      agentThreadId: conversation.agentThreadId ?? resolved,
      eventType: "note_added",
      actorId: args.actorId,
      actorName: args.actorName,
      createdAt: now,
    });
    return null;
  },
});

export const setConversationStatus = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("snoozed"), v.literal("closed")),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    const current = (conversation.status ?? "open") as "open" | "snoozed" | "closed";
    const next = args.status;

    const allowed: Record<
      "open" | "snoozed" | "closed",
      readonly ("open" | "snoozed" | "closed")[]
    > = {
      open: ["snoozed", "closed"],
      snoozed: ["open", "closed"],
      closed: ["open"],
    };
    if (next !== current && !allowed[current].includes(next)) {
      throw new Error(`Invalid status transition: ${current} -> ${next}`);
    }

    if (next !== current) {
      await ctx.db.patch(conversation._id, {
        status: next,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("supportConversationEvents", {
        organizationId: args.organizationId,
        sessionId: conversation.sessionId,
        agentThreadId: conversation.agentThreadId ?? resolved,
        eventType: "status_changed",
        actorId: args.actorId,
        actorName: args.actorName,
        payload: JSON.stringify({ from: current, to: next }),
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

export const assignConversation = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    assignedAgentId: v.string(),
    assignedAgentName: v.optional(v.string()),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    await ctx.db.patch(conversation._id, {
      assignedAgentId: args.assignedAgentId,
      assignedAgentName: args.assignedAgentName,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("supportConversationEvents", {
      organizationId: args.organizationId,
      sessionId: conversation.sessionId,
      agentThreadId: conversation.agentThreadId ?? resolved,
      eventType: "assignment_changed",
      actorId: args.actorId,
      actorName: args.actorName,
      payload: JSON.stringify({
        assignedAgentId: args.assignedAgentId,
        assignedAgentName: args.assignedAgentName,
      }),
      createdAt: Date.now(),
    });
    return null;
  },
});

export const unassignConversation = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    await ctx.db.patch(conversation._id, {
      assignedAgentId: undefined,
      assignedAgentName: undefined,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("supportConversationEvents", {
      organizationId: args.organizationId,
      sessionId: conversation.sessionId,
      agentThreadId: conversation.agentThreadId ?? resolved,
      eventType: "assignment_cleared",
      actorId: args.actorId,
      actorName: args.actorName,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const setConversationMode = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    mode: v.union(v.literal("agent"), v.literal("manual")),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { conversation, resolved } = await resolveConversation(ctx, args);
    const previousMode = conversation.mode ?? "agent";
    if (previousMode !== args.mode) {
      await ctx.db.patch(conversation._id, {
        mode: args.mode,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("supportConversationEvents", {
        organizationId: args.organizationId,
        sessionId: conversation.sessionId,
        agentThreadId: conversation.agentThreadId ?? resolved,
        eventType: "mode_changed",
        actorId: args.actorId,
        actorName: args.actorName,
        payload: JSON.stringify({ from: previousMode, to: args.mode }),
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

export const setAgentPresence = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    agentUserId: v.string(),
    agentName: v.optional(v.string()),
    status: v.union(v.literal("typing"), v.literal("idle")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const resolved = args.threadId ?? args.sessionId;
    if (!resolved) return null;

    const now = Date.now();
    const existing = await ctx.db
      .query("supportAgentPresence")
      .withIndex("by_org_session", (q) =>
        q.eq("organizationId", args.organizationId).eq("sessionId", resolved),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        agentUserId: args.agentUserId,
        agentName: args.agentName ?? existing.agentName,
        status: args.status,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("supportAgentPresence", {
      organizationId: args.organizationId,
      sessionId: resolved,
      agentUserId: args.agentUserId,
      agentName: args.agentName ?? "",
      status: args.status,
      updatedAt: now,
    });
    return null;
  },
});

export const saveRagSourceConfig = mutation({
  args: {
    organizationId: v.string(),
    sourceId: v.optional(v.id("supportRagSources")),
    postTypeSlug: v.string(),
    sourceType: v.optional(
      v.union(v.literal("postType"), v.literal("lmsPostType")),
    ),
    fields: v.optional(v.array(v.string())),
    includeTags: v.optional(v.boolean()),
    metaFieldKeys: v.optional(v.array(v.string())),
    additionalMetaKeys: v.optional(v.string()),
    displayName: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    useCustomBaseInstructions: v.optional(v.boolean()),
    baseInstructions: v.optional(v.string()),
  },
  returns: v.object({ ragSourceId: v.id("supportRagSources") }),
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const slug = args.postTypeSlug.toLowerCase();
    const inferredSourceType =
      args.sourceType ??
      ([
        "courses",
        "lessons",
        "topics",
        "quizzes",
        "certificates",
        "badges",
      ].includes(slug)
        ? "lmsPostType"
        : "postType");
    const fields = (args.fields ?? ["title", "content"]).filter(
      (field): field is "title" | "excerpt" | "content" =>
        field === "title" || field === "excerpt" || field === "content",
    );

    if (args.sourceId) {
      await ctx.db.patch(args.sourceId, {
        postTypeSlug: slug,
        sourceType: inferredSourceType,
        fields,
        includeTags: args.includeTags ?? false,
        metaFieldKeys: args.metaFieldKeys ?? [],
        additionalMetaKeys: args.additionalMetaKeys ?? "",
        displayName: args.displayName ?? slug,
        isEnabled: args.isEnabled ?? true,
        useCustomBaseInstructions: args.useCustomBaseInstructions ?? false,
        baseInstructions: args.baseInstructions ?? "",
        updatedAt: timestamp,
      });
      return { ragSourceId: args.sourceId };
    }

    const existing = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_type_and_postTypeSlug", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sourceType", inferredSourceType)
          .eq("postTypeSlug", slug),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fields,
        includeTags: args.includeTags ?? false,
        metaFieldKeys: args.metaFieldKeys ?? [],
        additionalMetaKeys: args.additionalMetaKeys ?? "",
        displayName: args.displayName ?? slug,
        isEnabled: args.isEnabled ?? true,
        useCustomBaseInstructions: args.useCustomBaseInstructions ?? false,
        baseInstructions: args.baseInstructions ?? "",
        updatedAt: timestamp,
      });
      return { ragSourceId: existing._id };
    }

    const id = await ctx.db.insert("supportRagSources", {
      organizationId: args.organizationId,
      sourceType: inferredSourceType,
      postTypeSlug: slug,
      fields,
      includeTags: args.includeTags ?? false,
      metaFieldKeys: args.metaFieldKeys ?? [],
      additionalMetaKeys: args.additionalMetaKeys ?? "",
      displayName: args.displayName ?? slug,
      isEnabled: args.isEnabled ?? true,
      useCustomBaseInstructions: args.useCustomBaseInstructions ?? false,
      baseInstructions: args.baseInstructions ?? "",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { ragSourceId: id };
  },
});

export const deleteRagSourceConfig = mutation({
  args: {
    organizationId: v.string(),
    sourceId: v.id("supportRagSources"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.sourceId);
    if (!doc || doc.organizationId !== args.organizationId) {
      return null;
    }
    await ctx.db.delete(args.sourceId);
    return null;
  },
});

export const touchRagSourceIndexedAt = mutation({
  args: { sourceId: v.id("supportRagSources") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sourceId, {
      lastIndexedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const upsertRagIndexStatus = mutation({
  args: {
    organizationId: v.string(),
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

export const mutations = {
  createSupportPost,
  updateSupportPost,
  upsertSupportPostMeta,
  upsertSupportOption,
  rateLimitOrThrow,
  upsertConversationIndex,
  recordMessageIndexUpdate,
  appendConversationEvent,
  addConversationNote,
  setConversationStatus,
  assignConversation,
  unassignConversation,
  setConversationMode,
  setAgentPresence,
  saveRagSourceConfig,
  deleteRagSourceConfig,
  touchRagSourceIndexedAt,
  upsertRagIndexStatus,
};


