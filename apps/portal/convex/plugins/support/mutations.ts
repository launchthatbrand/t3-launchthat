import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { api, components } from "../../_generated/api";
import { internalMutation, mutation } from "../../_generated/server";
import { supportOrganizationIdValidator } from "./schema";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const supportMutations = components.launchthat_support.mutations;
const supportQueries = components.launchthat_support.queries;

interface SupportPostRecord {
  _id: string;
  _creationTime: number;
  organizationId: string;
  postTypeSlug: string;
  slug: string;
  createdAt: number;
  updatedAt?: number;
}

// ---------- helpers ----------
const DEFAULT_EMAIL_DOMAIN =
  process.env.SUPPORT_EMAIL_DOMAIN ?? "support.launchthat.dev";

const buildDefaultAlias = (organizationId: string) =>
  `support-${organizationId}`.toLowerCase() + `@${DEFAULT_EMAIL_DOMAIN}`;

const buildDnsRecords = (domain: string) => {
  const token = Math.random().toString(36).slice(-8);
  return [
    { type: "TXT", host: `_resend.${domain}`, value: `verify=${token}` },
    {
      type: "CNAME",
      host: `dkim._domainkey.${domain}`,
      value: "dkim.resend.net",
    },
  ];
};

const touchConversationPost = async (
  ctx: MutationCtx,
  args: {
    organizationId: string;
    threadId: string;
    contactId?: string;
    contactName?: string;
    contactEmail?: string;
    role: "user" | "assistant";
    snippet: string;
    mode?: "agent" | "manual";
  },
  timestamp: number,
): Promise<string> => {
  const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
    organizationId: args.organizationId,
    filters: { postTypeSlug: "supportconversations" },
  })) as SupportPostRecord[];
  let convo = conversations.find((c) => c.slug === args.threadId);
  if (!convo) {
    const convoId = await ctx.runMutation(supportMutations.createSupportPost, {
      organizationId: args.organizationId,
      postTypeSlug: "supportconversations",
      title: `Conversation ${args.threadId.slice(-8)}`,
      slug: args.threadId,
      status: "published",
      meta: [
        { key: "threadId", value: args.threadId },
        { key: "agentThreadId", value: args.threadId },
        { key: "contactId", value: args.contactId },
        { key: "contactName", value: args.contactName },
        { key: "contactEmail", value: args.contactEmail },
        {
          key: "origin",
          value: args.mode === "manual" ? "email" : "chat",
        },
        { key: "firstAt", value: timestamp },
        { key: "totalMessages", value: 0 },
      ],
    });
    convo = {
      _id: convoId as string,
      _creationTime: timestamp,
      organizationId: args.organizationId,
      postTypeSlug: "supportconversations",
      slug: args.threadId,
      createdAt: timestamp,
    };
  }

  const existingMeta = await ctx.runQuery(supportQueries.getSupportPostMeta, {
    postId: convo._id as Id<"posts">,
    organizationId: args.organizationId,
  });
  const existingTotal =
    (existingMeta.find((m) => m.key === "totalMessages")?.value as
      | number
      | undefined) ?? 0;
  const nextTotal = (typeof existingTotal === "number" ? existingTotal : 0) + 1;

  await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
    postId: convo._id as Id<"posts">,
    organizationId: args.organizationId,
    entries: [
      { key: "lastMessage", value: args.snippet },
      { key: "lastRole", value: args.role },
      { key: "lastAt", value: timestamp },
      { key: "firstAt", value: convo.createdAt ?? timestamp },
      { key: "threadId", value: args.threadId },
      { key: "agentThreadId", value: args.threadId },
      { key: "contactId", value: args.contactId },
      { key: "contactName", value: args.contactName },
      { key: "contactEmail", value: args.contactEmail },
      { key: "mode", value: args.mode ?? "agent" },
      { key: "totalMessages", value: nextTotal },
    ],
  });

  return convo._id;
};

const recordMessageArgs = {
  organizationId: v.string(),
  threadId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  contactId: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  contactName: v.optional(v.string()),
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
  source: v.optional(
    v.union(v.literal("agent"), v.literal("admin"), v.literal("system")),
  ),
} as const;

// ---------- mutations ----------

export const createThread = mutation({
  args: {
    organizationId: v.string(),
    contactId: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
  },
  returns: v.object({ threadId: v.string() }),
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const thread = await ctx.runMutation(components.agent.threads.createThread, {
      title: args.contactName
        ? `Support: ${args.contactName}`
        : "Support conversation",
      userId: args.contactId,
    });
    const threadId = thread._id as unknown as string;

    await ctx.runMutation(supportMutations.createSupportPost, {
      organizationId: args.organizationId,
      postTypeSlug: "supportconversations",
      title: `Conversation ${threadId.slice(-8)}`,
      slug: threadId,
      status: "published",
      meta: [
        { key: "threadId", value: threadId },
        { key: "agentThreadId", value: threadId },
        { key: "contactId", value: args.contactId },
        { key: "contactName", value: args.contactName },
        { key: "contactEmail", value: args.contactEmail },
        { key: "origin", value: args.mode === "manual" ? "email" : "chat" },
        { key: "mode", value: args.mode ?? "agent" },
        { key: "firstAt", value: timestamp },
        { key: "lastAt", value: timestamp },
        { key: "totalMessages", value: 0 },
      ],
    });

    return { threadId };
  },
});

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
    const result = await ctx.runMutation(
      supportMutations.createSupportPost,
      args,
    );
    return result as string;
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
    const result = await ctx.runMutation(
      supportMutations.updateSupportPost,
      args,
    );
    return result as string | null;
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
    const result = await ctx.runMutation(
      supportMutations.upsertSupportPostMeta,
      args,
    );
    return result as boolean;
  },
});

export const recordMessage = mutation({
  args: recordMessageArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) {
      throw new Error("threadId is required");
    }
    const timestamp = Date.now();
    const convoId = await touchConversationPost(
      ctx,
      {
        organizationId: args.organizationId,
        threadId: resolvedThreadId,
        contactId: args.contactId ?? undefined,
        contactName: args.contactName ?? undefined,
        contactEmail: args.contactEmail ?? undefined,
        role: args.role,
        snippet: args.content.slice(0, 240),
        mode:
          args.source === "admin"
            ? "manual"
            : args.source === "agent"
              ? "agent"
              : undefined,
      },
      timestamp,
    );

    // Store the canonical message in the agent component tables.
    await ctx.runMutation(components.agent.messages.addMessages, {
      threadId: resolvedThreadId,
      messages: [
        {
          message: {
            role: args.role,
            content: args.content,
          } as any,
          status: "success",
        },
      ],
    });

    // Keep the support conversation record's meta linked.
    await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
      postId: convoId as Id<"posts">,
      organizationId: args.organizationId,
      entries: [{ key: "agentThreadId", value: resolvedThreadId }],
    });
    return null;
  },
});

export const recordMessageInternal = internalMutation({
  args: recordMessageArgs,
  handler: async (ctx, args) => {
    const _result: null = await ctx.runMutation(
      api.plugins.support.mutations.recordMessage,
      args,
    );
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
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) {
      return null;
    }
    const presencePosts: SupportPostRecord[] = (await ctx.runQuery(
      supportQueries.listSupportPosts,
      {
        organizationId: args.organizationId,
        filters: { postTypeSlug: "supportpresence" },
      },
    )) as SupportPostRecord[];

    let presence: SupportPostRecord | undefined = presencePosts.find(
      (p) => p.slug === resolvedThreadId,
    );
    if (!presence) {
      const presenceId = await ctx.runMutation(
        supportMutations.createSupportPost,
        {
          organizationId: args.organizationId,
          postTypeSlug: "supportpresence",
          title: `Presence ${resolvedThreadId.slice(-8)}`,
          slug: resolvedThreadId,
          status: "published",
          meta: [
            { key: "agentUserId", value: args.agentUserId },
            { key: "agentName", value: args.agentName },
            { key: "status", value: args.status },
          ],
        },
      );
      const fetchedPresence = (await ctx.runQuery(
        supportQueries.getSupportPostById,
        {
          id: presenceId as Id<"posts">,
          organizationId: args.organizationId,
        },
      )) as SupportPostRecord | null;
      presence = fetchedPresence ?? undefined;
      if (!presence) {
        return null;
      }
    }

    await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
      postId: presence._id as Id<"posts">,
      organizationId: args.organizationId,
      entries: [
        { key: "agentUserId", value: args.agentUserId },
        { key: "agentName", value: args.agentName },
        { key: "status", value: args.status },
      ],
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const resolvedThreadId = args.threadId ?? args.sessionId;
    if (!resolvedThreadId) {
      return null;
    }
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "supportconversations" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === resolvedThreadId);
    if (!convo) {
      return null;
    }
    await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
      postId: convo._id as Id<"posts">,
      organizationId: args.organizationId,
      entries: [{ key: "mode", value: args.mode }],
    });
    return null;
  },
});

// email settings (options)
export const saveEmailSettings = mutation({
  args: {
    organizationId: v.string(),
    allowEmailIntake: v.optional(v.boolean()),
    defaultAlias: v.optional(v.string()),
    customDomain: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const writes: Promise<unknown>[] = [];
    if (args.allowEmailIntake !== undefined) {
      writes.push(
        ctx.runMutation(supportMutations.upsertSupportOption, {
          organizationId: args.organizationId,
          key: "allowEmailIntake",
          value: args.allowEmailIntake,
        }),
      );
    }
    if (args.defaultAlias) {
      writes.push(
        ctx.runMutation(supportMutations.upsertSupportOption, {
          organizationId: args.organizationId,
          key: "defaultAlias",
          value: args.defaultAlias,
        }),
      );
    }
    if (args.customDomain !== undefined) {
      writes.push(
        ctx.runMutation(supportMutations.upsertSupportOption, {
          organizationId: args.organizationId,
          key: "customDomain",
          value: args.customDomain,
        }),
      );
      // Clearing domain should also clear verification status and dnsRecords.
      if (args.customDomain === null || args.customDomain === undefined) {
        writes.push(
          ctx.runMutation(supportMutations.upsertSupportOption, {
            organizationId: args.organizationId,
            key: "verificationStatus",
            value: "unverified",
          }),
        );
        writes.push(
          ctx.runMutation(supportMutations.upsertSupportOption, {
            organizationId: args.organizationId,
            key: "dnsRecords",
            value: JSON.stringify([]),
          }),
        );
      }
    }
    await Promise.all(writes);
    return null;
  },
});

export const beginDomainVerification = mutation({
  args: {
    organizationId: v.string(),
    customDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const dnsRecords = buildDnsRecords(args.customDomain);
    await ctx.runMutation(supportMutations.upsertSupportOption, {
      organizationId: args.organizationId,
      key: "customDomain",
      value: args.customDomain,
    });
    await ctx.runMutation(supportMutations.upsertSupportOption, {
      organizationId: args.organizationId,
      key: "verificationStatus",
      value: "pending",
    });
    await ctx.runMutation(supportMutations.upsertSupportOption, {
      organizationId: args.organizationId,
      key: "dnsRecords",
      value: JSON.stringify(dnsRecords),
    });
    await ctx.runMutation(supportMutations.upsertSupportOption, {
      organizationId: args.organizationId,
      key: "defaultAlias",
      value: buildDefaultAlias(args.organizationId),
    });
    return { dnsRecords };
  },
});

// RAG sources
export const saveRagSourceConfig = mutation({
  args: {
    organizationId: supportOrganizationIdValidator,
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
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const slug = args.postTypeSlug.toLowerCase();
    const organizationId = args.organizationId as
      | Id<"organizations">
      | "portal-root";
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
          .eq("organizationId", organizationId)
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
      organizationId,
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
    organizationId: supportOrganizationIdValidator,
    sourceId: v.id("supportRagSources"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.sourceId);
    if (!doc || doc.organizationId !== args.organizationId) {
      return null;
    }
    await ctx.db.delete(args.sourceId);
    return null;
  },
});

export const triggerRagReindexForPost = mutation({
  args: {
    organizationId: supportOrganizationIdValidator,
    postTypeSlug: v.string(),
    postId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = args.organizationId as Id<"organizations">;
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();

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
      throw new Error("This post type is not enabled for AI indexing.");
    }

    if (postConfig.sourceType === "lmsPostType") {
      await ctx.scheduler.runAfter(
        0,
        internal.plugins.support.rag.ingestLmsPostIfConfigured,
        {
          id: args.postId,
          postTypeSlug: normalizedPostTypeSlug,
          organizationId: org,
        },
      );
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.plugins.support.rag.ingestPostIfConfigured, {
      postId: args.postId as any,
    });
    return null;
  },
});

export const setConversationAgentThread = internalMutation({
  args: {
    organizationId: v.string(),
    threadId: v.string(),
    agentThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "supportconversations" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === args.threadId);
    if (!convo) {
      return null;
    }
    await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
      postId: convo._id as Id<"posts">,
      organizationId: args.organizationId,
      entries: [{ key: "agentThreadId", value: args.agentThreadId }],
    });
    return { agentThreadId: args.agentThreadId };
  },
});

export const mutations = {
  createThread,
  createSupportPost,
  updateSupportPost,
  upsertSupportPostMeta,
  recordMessage,
  recordMessageInternal,
  setAgentPresence,
  setConversationMode,
  setConversationAgentThread,
  saveEmailSettings,
  beginDomainVerification,
  saveRagSourceConfig,
  deleteRagSourceConfig,
  triggerRagReindexForPost,
};
