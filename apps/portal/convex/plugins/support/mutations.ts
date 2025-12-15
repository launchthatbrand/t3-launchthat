import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { components } from "../../_generated/api";
import { internalMutation, mutation } from "../../_generated/server";

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
    sessionId: string;
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
    filters: { postTypeSlug: "support_conversation" },
  })) as SupportPostRecord[];
  let convo = conversations.find((c) => c.slug === args.sessionId);
  if (!convo) {
    const convoId = await ctx.runMutation(supportMutations.createSupportPost, {
      organizationId: args.organizationId,
      postTypeSlug: "support_conversation",
      title: `Conversation ${args.sessionId}`,
      slug: args.sessionId,
      status: "published",
      meta: [
        { key: "sessionId", value: args.sessionId },
        { key: "contactId", value: args.contactId },
        { key: "contactName", value: args.contactName },
        { key: "contactEmail", value: args.contactEmail },
        {
          key: "origin",
          value: args.mode === "manual" ? "email" : "chat",
        },
        { key: "firstAt", value: timestamp },
      ],
    });
    convo = {
      _id: convoId as string,
      _creationTime: timestamp,
      organizationId: args.organizationId,
      postTypeSlug: "support_conversation",
      slug: args.sessionId,
      createdAt: timestamp,
    };
  }

  await ctx.runMutation(supportMutations.upsertSupportPostMeta, {
    postId: convo._id as Id<"posts">,
    organizationId: args.organizationId,
    entries: [
      { key: "lastMessage", value: args.snippet },
      { key: "lastRole", value: args.role },
      { key: "lastAt", value: timestamp },
      { key: "firstAt", value: convo.createdAt ?? timestamp },
      { key: "contactId", value: args.contactId },
      { key: "contactName", value: args.contactName },
      { key: "contactEmail", value: args.contactEmail },
      { key: "mode", value: args.mode ?? "agent" },
    ],
  });

  return convo._id;
};

const recordMessageArgs = {
  organizationId: v.string(),
  sessionId: v.string(),
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
    const timestamp = Date.now();
    const convoId = await touchConversationPost(
      ctx,
      {
        organizationId: args.organizationId,
        sessionId: args.sessionId,
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

    const metaEntries = [
      { key: "sessionId", value: args.sessionId },
      { key: "role", value: args.role },
      { key: "contactId", value: args.contactId },
      { key: "contactName", value: args.contactName },
      { key: "contactEmail", value: args.contactEmail },
      { key: "messageType", value: args.messageType },
      { key: "subject", value: args.subject },
      { key: "htmlBody", value: args.htmlBody },
      { key: "textBody", value: args.textBody },
    ].filter((entry) => entry.value !== undefined);

    await ctx.runMutation(supportMutations.createSupportPost, {
      organizationId: args.organizationId,
      postTypeSlug: "support_conversation_message",
      title: `Message ${timestamp}`,
      slug: `${args.sessionId}-${timestamp}`,
      status: "published",
      content: args.content,
      parentId: convoId as Id<"posts">,
      parentTypeSlug: "support_conversation",
      meta: metaEntries as { key: string; value: unknown }[],
    });
    return null;
  },
});

export const recordMessageInternal = internalMutation({
  args: recordMessageArgs,
  handler: async (ctx, args) => {
    await ctx.runMutation(recordMessage, args);
    return null;
  },
});

export const setAgentPresence = mutation({
  args: {
    organizationId: v.string(),
    sessionId: v.string(),
    agentUserId: v.string(),
    agentName: v.optional(v.string()),
    status: v.union(v.literal("typing"), v.literal("idle")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const presencePosts: SupportPostRecord[] = (await ctx.runQuery(
      supportQueries.listSupportPosts,
      {
        organizationId: args.organizationId,
        filters: { postTypeSlug: "support_presence" },
      },
    )) as SupportPostRecord[];

    let presence: SupportPostRecord | undefined = presencePosts.find(
      (p) => p.slug === args.sessionId,
    );
    if (!presence) {
      const presenceId = await ctx.runMutation(
        supportMutations.createSupportPost,
        {
          organizationId: args.organizationId,
          postTypeSlug: "support_presence",
          title: `Presence ${args.sessionId}`,
          slug: args.sessionId,
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
    sessionId: v.string(),
    mode: v.union(v.literal("agent"), v.literal("manual")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "support_conversation" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === args.sessionId);
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
    organizationId: v.string(),
    sourceId: v.optional(v.id("posts")),
    postTypeSlug: v.string(),
    fields: v.optional(v.array(v.string())),
    includeTags: v.optional(v.boolean()),
    metaFieldKeys: v.optional(v.array(v.string())),
    additionalMetaKeys: v.optional(v.string()),
    displayName: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const slug = args.postTypeSlug.toLowerCase();
    const metaEntries = [
      { key: "displayName", value: args.displayName ?? slug },
      { key: "isEnabled", value: args.isEnabled ?? true },
      { key: "includeTags", value: args.includeTags ?? false },
      {
        key: "metaFieldKeys",
        value: (args.metaFieldKeys ?? []).join(","),
      },
      {
        key: "additionalMetaKeys",
        value: args.additionalMetaKeys ?? "",
      },
      {
        key: "fields",
        value: JSON.stringify(args.fields ?? ["title", "content"]),
      },
      {
        key: "config",
        value: JSON.stringify({
          displayName: args.displayName ?? slug,
          isEnabled: args.isEnabled ?? true,
          includeTags: args.includeTags ?? false,
          metaFieldKeys: args.metaFieldKeys ?? [],
          additionalMetaKeys: args.additionalMetaKeys ?? "",
          fields: args.fields ?? ["title", "content"],
        }),
      },
    ];

    if (args.sourceId) {
      await ctx.runMutation(supportMutations.updateSupportPost, {
        id: args.sourceId,
        organizationId: args.organizationId,
        title: args.displayName ?? slug,
        postTypeSlug: "support_rag_source",
        content: null,
        excerpt: null,
        slug,
        status: "published",
        meta: metaEntries,
      });
      return { ragSourceId: args.sourceId };
    }

    const id = await ctx.runMutation(supportMutations.createSupportPost, {
      organizationId: args.organizationId,
      title: args.displayName ?? slug,
      postTypeSlug: "support_rag_source",
      content: null,
      excerpt: null,
      slug,
      status: "published",
      meta: metaEntries,
    });
    return { ragSourceId: id };
  },
});

export const deleteRagSourceConfig = mutation({
  args: {
    organizationId: v.string(),
    sourceId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(supportMutations.updateSupportPost, {
      id: args.sourceId,
      organizationId: args.organizationId,
      title: "archived",
      postTypeSlug: "support_rag_source",
      content: null,
      excerpt: null,
      slug: `${args.sourceId}-archived`,
      status: "archived",
      meta: [{ key: "archivedAt", value: Date.now() }],
    });
    return null;
  },
});

export const setConversationAgentThread = internalMutation({
  args: {
    organizationId: v.string(),
    sessionId: v.string(),
    agentThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "support_conversation" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === args.sessionId);
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
};
