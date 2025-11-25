import { v } from "convex/values";

import { mutation } from "../../_generated/server";

const matchModeValidator = v.optional(
  v.union(v.literal("contains"), v.literal("exact"), v.literal("regex")),
);

export const recordMessage = mutation({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("supportMessages", {
      ...args,
      createdAt: Date.now(),
    });
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
        tags: args.tags ?? null,
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
      tags: args.tags ?? null,
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
