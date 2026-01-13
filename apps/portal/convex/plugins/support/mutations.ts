import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { api, components, internal } from "../../_generated/api";
import { internalMutation, mutation } from "../../_generated/server";
import { normalizeOrganizationId } from "../../constants";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const supportMutations = components.launchthat_support.mutations as any;
const supportQueries = components.launchthat_support.queries as any;

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
const DEFAULT_EMAIL_DOMAIN = "support.launchthat.dev";

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

const rateLimitOrThrow = async (
  ctx: MutationCtx,
  args: { key: string; limit: number; windowMs: number },
) => {
  // Support rate limiting is component-scoped.
  const _result: null = await ctx.runMutation(supportMutations.rateLimitOrThrow, args);
  return;
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

const CRM_PLUGIN_ENABLED_KEY = "plugin_crm_enabled";

const isCrmEnabledForOrg = async (
  ctx: MutationCtx,
  organizationId: string,
): Promise<boolean> => {
  const orgIdForOptions = normalizeOrganizationId(organizationId as any);
  const option = await ctx.runQuery(api.core.options.get as any, {
    metaKey: CRM_PLUGIN_ENABLED_KEY,
    type: "site",
    orgId: orgIdForOptions,
  });
  return Boolean((option)?.metaValue);
};

// ---------- mutations ----------

const requireActor = async (ctx: MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  const obj: Record<string, unknown> =
    typeof identity === "object" && identity !== null
      ? (identity as Record<string, unknown>)
      : {};
  const actorId =
    typeof obj.tokenIdentifier === "string"
      ? obj.tokenIdentifier
      : typeof obj.subject === "string"
        ? obj.subject
        : undefined;
  const actorName =
    typeof obj.name === "string"
      ? obj.name
      : typeof obj.email === "string"
        ? obj.email
        : undefined;
  return { actorId, actorName };
};

export const createThread = mutation({
  args: {
    organizationId: v.string(),
    clientSessionId: v.optional(v.string()),
    contactId: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("agent"), v.literal("manual"))),
  },
  returns: v.object({ threadId: v.string() }),
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    if (args.clientSessionId) {
      await rateLimitOrThrow(ctx, {
        key: `support:createThread:${args.organizationId}:${args.clientSessionId}`,
        limit: 5,
        windowMs: 60_000,
      });
    }

    if (args.clientSessionId) {
      const existing = (await ctx.runQuery(supportQueries.getConversationIndex, {
        organizationId: args.organizationId,
        sessionId: args.clientSessionId,
      })) as { agentThreadId?: string } | null;
      if (existing?.agentThreadId) {
        return { threadId: existing.agentThreadId };
      }
    }

    const crmEnabled = await isCrmEnabledForOrg(ctx, args.organizationId);
    let resolvedContactId = args.contactId;
    let resolvedContactEmail = args.contactEmail;
    let resolvedContactName = args.contactName;

    if (crmEnabled && !resolvedContactId && resolvedContactEmail) {
      const resolved = await ctx.runMutation(
        internal.core.crm.identity.resolvers.resolveOrCreateContactForActor,
        {
          organizationId: args.organizationId as any,
          email: resolvedContactEmail,
          name: resolvedContactName,
          source: "support.createThread",
        },
      );
      if (resolved?.contactId) {
        resolvedContactId = resolved.contactId as unknown as string;
        resolvedContactEmail = resolved.contactEmail ?? resolvedContactEmail;
        resolvedContactName = resolved.contactName ?? resolvedContactName;
      }
    }

    const thread = await ctx.runMutation(
      components.agent.threads.createThread,
      {
      title: resolvedContactName
        ? `Support: ${resolvedContactName}`
        : "Support conversation",
      userId: resolvedContactId,
      },
    );
    const threadId = thread._id as unknown as string;

    // Support conversation index/state is stored in the support component tables.
    await ctx.runMutation(supportMutations.upsertConversationIndex, {
      organizationId: args.organizationId,
      sessionId: args.clientSessionId ?? threadId,
      agentThreadId: threadId,
      origin: "chat",
      status: "open",
      mode: args.mode ?? "agent",
      contactId: resolvedContactId,
      contactEmail: resolvedContactEmail,
      contactName: resolvedContactName,
      firstMessageAt: timestamp,
      lastMessageAt: timestamp,
      totalMessages: 0,
    });

    return { threadId };
  },
});

export const setConversationStatus = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("snoozed"),
      v.literal("closed"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { actorId, actorName } = await requireActor(ctx);
    const _result: null = await ctx.runMutation(
      supportMutations.setConversationStatus,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        status: args.status,
        actorId,
        actorName,
      },
    );
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { actorId, actorName } = await requireActor(ctx);
    const _result: null = await ctx.runMutation(
      supportMutations.assignConversation,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        assignedAgentId: args.assignedAgentId,
        assignedAgentName: args.assignedAgentName,
        actorId,
        actorName,
      },
    );
    return null;
  },
});

export const unassignConversation = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { actorId, actorName } = await requireActor(ctx);
    const _result: null = await ctx.runMutation(
      supportMutations.unassignConversation,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        actorId,
        actorName,
      },
    );
    return null;
  },
});

export const addConversationNote = mutation({
  args: {
    organizationId: v.string(),
    threadId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    note: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { actorId, actorName } = await requireActor(ctx);
    const _result: null = await ctx.runMutation(
      supportMutations.addConversationNote,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        note: args.note,
        actorId,
        actorName,
      },
    );
    return null;
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
    const normalizedSessionId = args.sessionId ?? resolvedThreadId;

    await rateLimitOrThrow(ctx, {
      key: `support:recordMessage:${args.organizationId}:${normalizedSessionId}`,
      limit: 30,
      windowMs: 60_000,
    });

    const crmEnabled = await isCrmEnabledForOrg(ctx, args.organizationId);
    let resolvedContactId = args.contactId ?? undefined;
    let resolvedContactEmail = args.contactEmail ?? undefined;
    let resolvedContactName = args.contactName ?? undefined;

    if (crmEnabled && !resolvedContactId && resolvedContactEmail) {
      const resolved = await ctx.runMutation(
        internal.core.crm.identity.resolvers.resolveOrCreateContactForActor,
        {
          organizationId: args.organizationId as any,
          email: resolvedContactEmail,
          name: resolvedContactName,
          source: "support.recordMessage",
        },
      );
      if (resolved?.contactId) {
        resolvedContactId = resolved.contactId as unknown as string;
        resolvedContactEmail = resolved.contactEmail ?? resolvedContactEmail;
        resolvedContactName = resolved.contactName ?? resolvedContactName;
      }
    }
    const snippet = (() => {
      const raw = args.content ?? "";
      const trimmed = raw.trim();
      if (!trimmed.startsWith("{")) return raw.slice(0, 240);
      try {
        const parsed = JSON.parse(trimmed) as any;
        if (parsed && typeof parsed === "object" && parsed.kind === "assistant_response_v1") {
          const text = typeof parsed.text === "string" ? parsed.text : "";
          return (text || raw).slice(0, 240);
        }
      } catch {
        // ignore
      }
      return raw.slice(0, 240);
    })();
    await ctx.runMutation(supportMutations.recordMessageIndexUpdate, {
      organizationId: args.organizationId,
      sessionId: normalizedSessionId,
      threadId: resolvedThreadId,
      role: args.role,
      snippet,
      contactId: resolvedContactId,
      contactEmail: resolvedContactEmail,
      contactName: resolvedContactName,
      mode:
        args.source === "admin"
          ? "manual"
          : args.source === "agent"
            ? "agent"
            : undefined,
    });

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
    const _result: null = await ctx.runMutation(
      supportMutations.setAgentPresence,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        agentUserId: args.agentUserId,
        agentName: args.agentName,
        status: args.status,
      },
    );
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
    const identity = await ctx.auth.getUserIdentity();
    const identityObj: Record<string, unknown> =
      typeof identity === "object" && identity !== null
        ? (identity as Record<string, unknown>)
        : {};
    const actorId =
      typeof identityObj.tokenIdentifier === "string"
        ? identityObj.tokenIdentifier
        : typeof identityObj.subject === "string"
          ? identityObj.subject
          : undefined;
    const actorName =
      typeof identityObj.name === "string"
        ? identityObj.name
        : typeof identityObj.email === "string"
          ? identityObj.email
          : undefined;
    const _result: null = await ctx.runMutation(
      supportMutations.setConversationMode,
      {
        organizationId: args.organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
        mode: args.mode,
        actorId,
        actorName,
      },
    );
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
    sourceId: v.optional(v.string()),
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
    const result = await ctx.runMutation(supportMutations.saveRagSourceConfig, {
      organizationId: args.organizationId,
      sourceId: args.sourceId,
      postTypeSlug: args.postTypeSlug,
      sourceType: args.sourceType,
      fields: args.fields,
      includeTags: args.includeTags,
      metaFieldKeys: args.metaFieldKeys,
      additionalMetaKeys: args.additionalMetaKeys,
      displayName: args.displayName,
      isEnabled: args.isEnabled,
      useCustomBaseInstructions: args.useCustomBaseInstructions,
      baseInstructions: args.baseInstructions,
    });
    return { ragSourceId: String((result)?.ragSourceId ?? "") };
  },
});

export const deleteRagSourceConfig = mutation({
  args: {
    organizationId: v.string(),
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const _result: null = await ctx.runMutation(
      supportMutations.deleteRagSourceConfig,
      {
        organizationId: args.organizationId,
        sourceId: args.sourceId,
      },
    );
    return null;
  },
});

export const triggerRagReindexForPost = mutation({
  args: {
    organizationId: v.string(),
    postTypeSlug: v.string(),
    postId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
    const postConfig = (await ctx.runQuery(
      supportQueries.getRagSourceForPostTypeAny,
      {
        organizationId: args.organizationId,
        postTypeSlug: normalizedPostTypeSlug,
      },
    )) as { isEnabled?: boolean; sourceType?: string } | null;

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
          organizationId: args.organizationId as any,
        },
      );
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.plugins.support.rag.ingestPostIfConfigured,
      {
        postId: args.postId as any,
      },
    );
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
    await ctx.runMutation(supportMutations.upsertConversationIndex, {
      organizationId: args.organizationId,
      sessionId: args.threadId,
      agentThreadId: args.agentThreadId,
      origin: "chat",
      status: "open",
      mode: "agent",
    });
    return { agentThreadId: args.agentThreadId } as const;
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
