import type { Doc, Id } from "../../_generated/dataModel";
import { internalMutation, mutation } from "../../_generated/server";

import type { MutationCtx } from "../../_generated/server";
import { generateDefaultAliasParts } from "./queries";
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

const ragFieldSelection = v.array(
  v.union(v.literal("title"), v.literal("excerpt"), v.literal("content")),
);

type ConversationDoc = Doc<"supportConversations">;
type EmailSettingsDoc = Doc<"supportEmailSettings">;
type DnsRecord = NonNullable<EmailSettingsDoc["dnsRecords"]>[number];

// const verificationStatusValidator = v.union(
//   v.literal("unverified"),
//   v.literal("pending"),
//   v.literal("verified"),
//   v.literal("failed"),
// );

// const dnsRecordShape = v.object({
//   type: v.string(),
//   host: v.string(),
//   value: v.string(),
// });

async function ensureEmailSettings(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
): Promise<EmailSettingsDoc> {
  const existing = await ctx.db
    .query("supportEmailSettings")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .unique();

  const now = Date.now();

  if (existing) {
    if (!existing.defaultAliasLocalPart) {
      const aliasParts = generateDefaultAliasParts(organizationId);
      await ctx.db.patch(existing._id, {
        defaultAlias: aliasParts.address,
        defaultAliasLocalPart: aliasParts.localPart,
        updatedAt: now,
      });
      const patched = await ctx.db.get(existing._id);
      if (patched) {
        return patched;
      }
    }
    return existing;
  }

  const aliasParts = generateDefaultAliasParts(organizationId);
  const id = await ctx.db.insert("supportEmailSettings", {
    organizationId,
    defaultAlias: aliasParts.address,
    defaultAliasLocalPart: aliasParts.localPart,
    allowEmailIntake: false,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ctx.db.get(id);
  if (!created) {
    throw new Error("Failed to create support email settings");
  }
  return created;
}

async function touchConversation(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    sessionId: string;
    contactId?: Id<"contacts">;
    contactName?: string;
    contactEmail?: string;
    role: "user" | "assistant";
    snippet: string;
    agentUserId?: string;
    agentName?: string;
    mode?: "agent" | "manual";
  },
  timestamp: number,
): Promise<ConversationDoc> {
  const existing = await ctx.db
    .query("supportConversations")
    .withIndex("by_org_session", (q) =>
      q
        .eq("organizationId", args.organizationId)
        .eq("sessionId", args.sessionId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      contactId: args.contactId ?? existing.contactId ?? undefined,
      contactName: args.contactName ?? existing.contactName ?? undefined,
      contactEmail: args.contactEmail ?? existing.contactEmail ?? undefined,
      lastMessageSnippet: args.snippet,
      lastMessageAuthor: args.role,
      lastMessageAt: timestamp,
      totalMessages: existing.totalMessages + 1,
      assignedAgentId:
        args.role === "assistant" && args.agentUserId
          ? args.agentUserId
          : (existing.assignedAgentId ?? undefined),
      assignedAgentName:
        args.role === "assistant" && args.agentName
          ? args.agentName
          : (existing.assignedAgentName ?? undefined),
      mode: args.mode ?? existing.mode ?? "agent",
      updatedAt: timestamp,
    });
    const updated = await ctx.db.get(existing._id);
    return updated ?? existing;
  }

  const now = timestamp;
  const insertId = await ctx.db.insert("supportConversations", {
    organizationId: args.organizationId,
    sessionId: args.sessionId,
    origin: "chat",
    status: "open",
    mode: args.mode ?? "agent",
    subject: undefined,
    emailThreadId: undefined,
    inboundAlias: undefined,
    contactId: args.contactId ?? undefined,
    contactName: args.contactName ?? undefined,
    contactEmail: args.contactEmail ?? undefined,
    lastMessageSnippet: args.snippet,
    lastMessageAuthor: args.role,
    assignedAgentId:
      args.role === "assistant" ? (args.agentUserId ?? undefined) : undefined,
    assignedAgentName:
      args.role === "assistant" ? (args.agentName ?? undefined) : undefined,
    firstMessageAt: now,
    lastMessageAt: now,
    totalMessages: 1,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ctx.db.get(insertId);
  if (!created) {
    throw new Error("Failed to create conversation");
  }
  return created;
}

const createDnsRecords = (domain: string): DnsRecord[] => {
  const token = Math.random().toString(36).slice(-8);
  return [
    {
      type: "TXT",
      host: `_resend.${domain}`,
      value: `verify=${token}`,
    },
    {
      type: "CNAME",
      host: `dkim._domainkey.${domain}`,
      value: `dkim.resend.net`,
    },
  ];
};

async function upsertAgentPresenceRecord(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    sessionId: string;
    agentUserId: string;
    agentName: string;
    status: "typing" | "idle";
    updatedAt: number;
  },
) {
  const existing = await ctx.db
    .query("supportAgentPresence")
    .withIndex("by_org_session", (q) =>
      q
        .eq("organizationId", args.organizationId)
        .eq("sessionId", args.sessionId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      agentUserId: args.agentUserId,
      agentName: args.agentName,
      status: args.status,
      updatedAt: args.updatedAt,
    });
    return;
  }

  await ctx.db.insert("supportAgentPresence", {
    organizationId: args.organizationId,
    sessionId: args.sessionId,
    agentUserId: args.agentUserId,
    agentName: args.agentName,
    status: args.status,
    updatedAt: args.updatedAt,
  });
}

export const recordMessageHelper = async (
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    contactId?: Id<"contacts">;
    contactEmail?: string;
    contactName?: string;
    messageType?: "chat" | "email_inbound" | "email_outbound";
    subject?: string;
    htmlBody?: string;
    textBody?: string;
    source?: "agent" | "admin" | "system";
  },
) => {
  const lastMessage = await ctx.db
    .query("supportMessages")
    .withIndex("by_session", (q) =>
      q
        .eq("organizationId", args.organizationId)
        .eq("sessionId", args.sessionId),
    )
    .order("desc")
    .first();

  if (
    lastMessage &&
    lastMessage.role === args.role &&
    lastMessage.content === args.content
  ) {
    return lastMessage._id;
  }

  let agentUserId: string | undefined;
  let agentName: string | undefined;
  if (args.role === "assistant") {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      agentUserId =
        identity.subject ??
        identity.tokenIdentifier ??
        identity.email ??
        undefined;
      agentName = identity.name ?? identity.email ?? undefined;
    }
  }

  const createdAt = Date.now();
  const insertedId = await ctx.db.insert("supportMessages", {
    ...args,
    agentUserId,
    agentName,
    messageType: args.messageType ?? "chat",
    createdAt,
  });
  await touchConversation(
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
      agentUserId,
      agentName,
    },
    createdAt,
  );

  if (agentUserId && agentName) {
    await upsertAgentPresenceRecord(ctx, {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
      agentUserId,
      agentName: agentName ?? "Support agent",
      status: "idle",
      updatedAt: createdAt,
    });
  }

  return insertedId;
};

export const recordMessage = mutation({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    contactId: v.optional(v.id("contacts")),
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
  },
  handler: async (ctx, args) => {
    return recordMessageHelper(ctx, args);
  },
});

export const setAgentPresence = mutation({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    status: v.union(v.literal("typing"), v.literal("idle")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const agentUserId =
      identity.subject ?? identity.tokenIdentifier ?? identity.email;
    if (!agentUserId) {
      throw new Error("Unable to determine agent identity");
    }

    const agentName = identity.name ?? identity.email ?? "Support agent";
    const updatedAt = Date.now();

    await upsertAgentPresenceRecord(ctx, {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
      agentUserId,
      agentName,
      status: args.status,
      updatedAt,
    });

    return { agentUserId, agentName, status: args.status, updatedAt };
  },
});

export const setConversationMode = mutation({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    mode: v.union(v.literal("agent"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sessionId", args.sessionId),
      )
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversation._id, {
      mode: args.mode,
      updatedAt: Date.now(),
    });

    return { mode: args.mode };
  },
});

export const recordMessageInternal = internalMutation({
  args: recordMessage.args,
  handler: async (ctx, args) => {
    return recordMessageHelper(ctx, args);
  },
});

export const setConversationAgentThread = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    agentThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("supportConversations")
      .withIndex("by_org_session", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sessionId", args.sessionId),
      )
      .unique();

    if (!conversation) {
      return null;
    }

    await ctx.db.patch(conversation._id, {
      agentThreadId: args.agentThreadId,
      updatedAt: Date.now(),
    });

    return { agentThreadId: args.agentThreadId };
  },
});

export const saveRagSourceConfig = mutation({
  args: {
    organizationId: v.id("organizations"),
    sourceId: v.optional(v.id("supportRagSources")),
    postTypeSlug: v.string(),
    fields: ragFieldSelection,
    includeTags: v.optional(v.boolean()),
    metaFieldKeys: v.optional(v.array(v.string())),
    displayName: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const normalizedSlug = args.postTypeSlug.trim().toLowerCase();
    if (!normalizedSlug) {
      throw new Error("Post type slug is required");
    }

    const fields = args.fields.length > 0 ? args.fields : ["title", "content"];
    const includeTags = args.includeTags ?? false;
    const metaFieldKeys =
      args.metaFieldKeys
        ?.map((key) => key.trim())
        .filter((key) => key.length > 0) ?? [];
    const now = Date.now();

    const existing = await ctx.db
      .query("supportRagSources")
      .withIndex("by_org_postType", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("postTypeSlug", normalizedSlug),
      )
      .unique();

    if (existing && args.sourceId && existing._id !== args.sourceId) {
      throw new Error(
        "Another indexing configuration already exists for this post type",
      );
    }

    const targetId = args.sourceId ?? existing?._id;

    if (targetId) {
      const current = await ctx.db.get(targetId);
      if (!current || current.organizationId !== args.organizationId) {
        throw new Error("Configuration not found for this organization");
      }
      await ctx.db.patch(targetId, {
        postTypeSlug: normalizedSlug,
        fields,
        includeTags,
        metaFieldKeys,
        displayName: args.displayName?.trim() || undefined,
        isEnabled: args.isEnabled ?? current.isEnabled,
        updatedAt: now,
      });
      return { ragSourceId: targetId };
    }

    const insertedId = await ctx.db.insert("supportRagSources", {
      organizationId: args.organizationId,
      sourceType: "postType" as const,
      postTypeSlug: normalizedSlug,
      fields,
      includeTags,
      metaFieldKeys,
      displayName: args.displayName?.trim() || undefined,
      isEnabled: args.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return { ragSourceId: insertedId };
  },
});

export const deleteRagSourceConfig = mutation({
  args: {
    organizationId: v.id("organizations"),
    sourceId: v.id("supportRagSources"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.sourceId);
    if (!existing || existing.organizationId !== args.organizationId) {
      return null;
    }

    await ctx.db.delete(args.sourceId);
    return null;
  },
});

export const saveEmailSettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    allowEmailIntake: v.optional(v.boolean()),
    customDomain: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const settings = await ensureEmailSettings(ctx, args.organizationId);
    const now = Date.now();
    await ctx.db.patch(settings._id, {
      allowEmailIntake:
        args.allowEmailIntake ?? settings.allowEmailIntake ?? false,
      customDomain:
        (args.customDomain === undefined
          ? (settings.customDomain ?? undefined)
          : args.customDomain) ?? undefined,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const beginDomainVerification = mutation({
  args: {
    organizationId: v.id("organizations"),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedDomain = args.domain.trim().toLowerCase();
    if (!normalizedDomain) {
      throw new Error("Domain is required");
    }
    const settings = await ensureEmailSettings(ctx, args.organizationId);
    const now = Date.now();
    const dnsRecords = createDnsRecords(normalizedDomain);
    await ctx.db.patch(settings._id, {
      customDomain: normalizedDomain,
      verificationStatus: "pending",
      resendDomainId: settings.resendDomainId ?? `domain_${now}`,
      dnsRecords,
      updatedAt: now,
    });
    return {
      customDomain: normalizedDomain,
      verificationStatus: "pending" as const,
      dnsRecords,
    };
  },
});
