/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

const resultShape = v.object({
  title: v.string(),
  content: v.string(),
  slug: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  type: v.optional(v.string()),
  source: v.optional(v.string()),
});

type KnowledgeDoc = Doc<"supportKnowledge">;

export const listKnowledge = query({
  args: {
    organizationId: v.id("organizations"),
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

    const knowledgeEntries = (await ctx.db
      .query("supportKnowledge")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect()) as KnowledgeDoc[];

    const scoredEntries = knowledgeEntries
      .map((entry) => {
        const haystack =
          `${entry.title} ${entry.content} ${(entry.tags ?? []).join(" ")}`.toLowerCase();
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
        (a, b) => b.score - a.score || b.entry.updatedAt - a.entry.updatedAt,
      )
      .slice(0, limit)
      .map(({ entry }) => ({
        title: entry.title,
        content: entry.content,
        slug: entry.slug,
        tags: entry.tags ?? undefined,
        type: entry.type ?? undefined,
        source: "knowledge",
      }));

    if (scoredEntries.length > 0) {
      return scoredEntries;
    }

    const fallbackPosts = await ctx.db
      .query("posts")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit);

    return fallbackPosts.map((post) => ({
      title: post.title,
      content: post.excerpt ?? post.content ?? "",
      slug: post.slug ?? undefined,
      tags: post.tags ?? undefined,
      type: post.postTypeSlug ?? undefined,
      source: "post",
    }));
  },
});

const cannedMatchResult = v.union(
  v.object({
    entryId: v.id("supportKnowledge"),
    title: v.string(),
    content: v.string(),
    slug: v.optional(v.string()),
  }),
  v.null(),
);

export const matchCannedResponse = query({
  args: {
    organizationId: v.id("organizations"),
    question: v.string(),
  },
  returns: cannedMatchResult,
  handler: async (ctx, args) => {
    const normalizedQuestion = args.question.trim();
    if (!normalizedQuestion) {
      return null;
    }

    const lowerQuestion = normalizedQuestion.toLowerCase();
    const entries = (await ctx.db
      .query("supportKnowledge")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect()) as KnowledgeDoc[];

    let bestMatch: {
      entryId: Id<"supportKnowledge">;
      title: string;
      content: string;
      slug?: string;
      score: number;
      priority: number;
      updatedAt: number;
    } | null = null;

    for (const entry of entries) {
      if (entry.type !== "canned") continue;
      if (entry.isActive === false) continue;
      const phrases = entry.matchPhrases ?? [];
      if (phrases.length === 0) continue;

      const mode = entry.matchMode ?? "contains";
      let matched = false;
      for (const phrase of phrases) {
        if (!phrase.trim()) continue;
        if (mode === "regex") {
          try {
            const regex = new RegExp(phrase, "i");
            if (regex.test(normalizedQuestion)) {
              matched = true;
              break;
            }
          } catch (error) {
            console.warn(
              "[support.matchCanned] invalid regex phrase",
              phrase,
              error,
            );
          }
        } else if (mode === "exact") {
          if (normalizedQuestion.toLowerCase() === phrase.toLowerCase()) {
            matched = true;
            break;
          }
        } else {
          if (lowerQuestion.includes(phrase.toLowerCase())) {
            matched = true;
            break;
          }
        }
      }

      if (!matched) continue;

      const score =
        phrases.filter((phrase) => lowerQuestion.includes(phrase.toLowerCase()))
          .length || 1;
      const priority = entry.priority ?? 0;

      if (
        !bestMatch ||
        priority > bestMatch.priority ||
        (priority === bestMatch.priority &&
          (score > bestMatch.score ||
            (score === bestMatch.score &&
              entry.updatedAt > bestMatch.updatedAt)))
      ) {
        bestMatch = {
          entryId: entry._id,
          title: entry.title,
          content: entry.content,
          slug: entry.slug ?? undefined,
          score,
          priority,
          updatedAt: entry.updatedAt,
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
      slug: bestMatch.slug,
    };
  },
});

export const listKnowledgeEntries = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("supportKnowledge"),
      title: v.string(),
      slug: v.string(),
      content: v.string(),
      tags: v.optional(v.array(v.string())),
      type: v.optional(v.string()),
      matchMode: v.optional(
        v.union(v.literal("contains"), v.literal("exact"), v.literal("regex")),
      ),
      matchPhrases: v.optional(v.array(v.string())),
      priority: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const entries = (await ctx.db
      .query("supportKnowledge")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .collect()) as KnowledgeDoc[];

    return entries.map((entry) => ({
      _id: entry._id,
      title: entry.title,
      slug: entry.slug ?? "",
      content: entry.content,
      tags: entry.tags ?? undefined,
      type: entry.type ?? undefined,
      matchMode: entry.matchMode,
      matchPhrases: entry.matchPhrases,
      priority: entry.priority,
      isActive: entry.isActive,
      updatedAt: entry.updatedAt,
      createdAt: entry.createdAt,
    }));
  },
});

type MessageDoc = Doc<"supportMessages">;

export const listMessages = query({
  args: {
    organizationId: v.id("organizations"),
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
    }),
  ),
  handler: async (ctx, args) => {
    const entries = (await ctx.db
      .query("supportMessages")
      .withIndex("by_session", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("sessionId", args.sessionId),
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
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const listConversations = query({
  args: {
    organizationId: v.id("organizations"),
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
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
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
      });
    }

    return Array.from(conversations.values())
      .sort((a, b) => b.lastAt - a.lastAt)
      .slice(0, limit);
  },
});
