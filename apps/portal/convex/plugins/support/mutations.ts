/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { internalMutation, mutation } from "../../_generated/server";
import { generateDefaultAliasParts } from "./queries";

const matchModeValidator = v.optional(
  v.union(v.literal("contains"), v.literal("exact"), v.literal("regex")),
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
    subject: undefined,
    emailThreadId: undefined,
    inboundAlias: undefined,
    contactId: args.contactId ?? undefined,
    contactName: args.contactName ?? undefined,
    contactEmail: args.contactEmail ?? undefined,
    lastMessageSnippet: args.snippet,
    lastMessageAuthor: args.role,
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

  const createdAt = Date.now();
  const insertedId = await ctx.db.insert("supportMessages", {
    ...args,
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
    },
    createdAt,
  );
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
  },
  handler: async (ctx, args) => {
    return recordMessageHelper(ctx, args);
  },
});

export const recordMessageInternal = internalMutation({
  args: recordMessage.args,
  handler: async (ctx, args) => {
    return recordMessageHelper(ctx, args);
  },
});

export const upsertKnowledgeEntry = mutation({
  args: {
    organizationId: v.id("organizations"),
    entryId: v.optional(v.id("supportKnowledge")),
    title: v.string(),
    slug: v.optional(v.string()),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    type: v.optional(v.string()),
    matchMode: matchModeValidator,
    matchPhrases: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.entryId) {
      const existing = await ctx.db.get(args.entryId);
      if (!existing || existing.organizationId !== args.organizationId) {
        throw new Error("Entry not found for this organization");
      }

      await ctx.db.patch(args.entryId, {
        title: args.title,
        slug: args.slug ?? args.title.toLowerCase().replace(/\s+/g, "-"),
        content: args.content,
        tags: args.tags ?? undefined,
        type: args.type ?? existing.type ?? "canned",
        matchMode: args.matchMode ?? existing.matchMode ?? "contains",
        matchPhrases: args.matchPhrases ?? existing.matchPhrases ?? [],
        priority: args.priority ?? existing.priority ?? 0,
        isActive: args.isActive ?? true,
        updatedAt: now,
      });
      return args.entryId;
    }

    return await ctx.db.insert("supportKnowledge", {
      organizationId: args.organizationId,
      title: args.title,
      slug: args.slug ?? args.title.toLowerCase().replace(/\s+/g, "-"),
      content: args.content,
      tags: args.tags ?? undefined,
      type: args.type ?? "canned",
      matchMode: args.matchMode ?? "contains",
      matchPhrases: args.matchPhrases ?? [],
      priority: args.priority ?? 0,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteKnowledgeEntry = mutation({
  args: {
    organizationId: v.id("organizations"),
    entryId: v.id("supportKnowledge"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.entryId);
    if (!existing || existing.organizationId !== args.organizationId) {
      throw new Error("Entry not found");
    }
    await ctx.db.delete(args.entryId);
    return args.entryId;
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
