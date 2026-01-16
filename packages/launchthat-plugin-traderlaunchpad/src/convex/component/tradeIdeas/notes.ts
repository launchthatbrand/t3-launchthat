import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../server";

const noteView = v.object({
  _id: v.id("tradeIdeaNotes"),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
  reviewedAt: v.optional(v.number()),
  thesis: v.optional(v.string()),
  setup: v.optional(v.string()),
  mistakes: v.optional(v.string()),
  outcome: v.optional(v.string()),
  nextTime: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  updatedAt: v.number(),
});

export const getNoteForGroup = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.union(noteView, v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeIdeaNotes")
      .withIndex("by_org_user_tradeIdeaGroupId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("tradeIdeaGroupId", args.tradeIdeaGroupId),
      )
      .unique();
    return existing ?? null;
  },
});

export const upsertNoteForGroup = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    thesis: v.optional(v.string()),
    setup: v.optional(v.string()),
    mistakes: v.optional(v.string()),
    outcome: v.optional(v.string()),
    nextTime: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("tradeIdeaNotes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("tradeIdeaNotes")
      .withIndex("by_org_user_tradeIdeaGroupId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("tradeIdeaGroupId", args.tradeIdeaGroupId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        thesis: args.thesis,
        setup: args.setup,
        mistakes: args.mistakes,
        outcome: args.outcome,
        nextTime: args.nextTime,
        tags: args.tags,
        // Preserve reviewed status if already reviewed; otherwise keep todo.
        reviewStatus:
          existing.reviewStatus === "reviewed" ? "reviewed" : "todo",
        reviewedAt: existing.reviewedAt,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("tradeIdeaNotes", {
      organizationId: args.organizationId,
      userId: args.userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId,
      reviewStatus: "todo",
      reviewedAt: undefined,
      thesis: args.thesis,
      setup: args.setup,
      mistakes: args.mistakes,
      outcome: args.outcome,
      nextTime: args.nextTime,
      tags: args.tags,
      updatedAt: now,
    });
  },
});

export const markReviewed = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.id("tradeIdeaNotes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("tradeIdeaNotes")
      .withIndex("by_org_user_tradeIdeaGroupId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("tradeIdeaGroupId", args.tradeIdeaGroupId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        reviewStatus: "reviewed",
        reviewedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("tradeIdeaNotes", {
      organizationId: args.organizationId,
      userId: args.userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId,
      reviewStatus: "reviewed",
      reviewedAt: now,
      updatedAt: now,
    });
  },
});

export const listNextToReview = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaGroupId: v.id("tradeIdeaGroups"),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      direction: v.union(v.literal("long"), v.literal("short")),
      closedAt: v.number(),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
      reviewedAt: v.optional(v.number()),
      noteUpdatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, Number(args.limit ?? 10)));

    // Pull recent closed TradeIdeas and filter to those not yet reviewed (or with no note).
    // We use openedAt ordering because it's indexed; closedAt is derived from lastExecutionAt.
    const candidates = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", "closed"),
      )
      .order("desc")
      .take(200);

    const out: Array<{
      tradeIdeaGroupId: Id<"tradeIdeaGroups">;
      symbol: string;
      instrumentId?: string;
      direction: "long" | "short";
      closedAt: number;
      realizedPnl?: number;
      fees?: number;
      reviewStatus: "todo" | "reviewed";
      reviewedAt?: number;
      noteUpdatedAt?: number;
    }> = [];

    for (const ti of candidates) {
      if (out.length >= limit) break;
      const closedAt =
        typeof (ti as any).closedAt === "number"
          ? Number((ti as any).closedAt)
          : typeof (ti as any).lastExecutionAt === "number"
            ? Number((ti as any).lastExecutionAt)
            : 0;
      if (!closedAt) continue;

      const note = await ctx.db
        .query("tradeIdeaNotes")
        .withIndex("by_org_user_tradeIdeaGroupId", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("userId", args.userId)
            .eq("tradeIdeaGroupId", ti._id),
        )
        .unique();

      const reviewStatus: "todo" | "reviewed" =
        note?.reviewStatus === "reviewed" ? "reviewed" : "todo";
      if (reviewStatus === "reviewed") continue;

      out.push({
        tradeIdeaGroupId: ti._id,
        symbol: String((ti as any).symbol ?? "UNKNOWN"),
        instrumentId:
          typeof (ti as any).instrumentId === "string"
            ? String((ti as any).instrumentId)
            : undefined,
        direction: (ti as any).direction === "short" ? "short" : "long",
        closedAt,
        realizedPnl:
          typeof (ti as any).realizedPnl === "number"
            ? Number((ti as any).realizedPnl)
            : undefined,
        fees:
          typeof (ti as any).fees === "number"
            ? Number((ti as any).fees)
            : undefined,
        reviewStatus,
        reviewedAt:
          typeof note?.reviewedAt === "number" ? Number(note.reviewedAt) : undefined,
        noteUpdatedAt:
          typeof note?.updatedAt === "number" ? Number(note.updatedAt) : undefined,
      });
    }

    return out;
  },
});

