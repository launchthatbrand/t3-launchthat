/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation, query } from "../../../_generated/server";

type CommercePostsQueries = {
  getPostMeta: unknown;
};

type CommercePostsMutations = {
  setPostMeta: unknown;
};

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

const commercePostsMutations = (
  components as unknown as {
    launchthat_ecommerce: { posts: { mutations: CommercePostsMutations } };
  }
).launchthat_ecommerce.posts.mutations;

const ORDER_NOTES_META_KEY = "order:notes_json";

type OrderNote = {
  id: string;
  content: string;
  createdAt: number;
  createdBy?: string;
  isPrivate?: boolean;
};

function parseNotes(raw: unknown): Array<OrderNote> {
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Array<OrderNote>) : [];
  } catch {
    return [];
  }
}

export const getOrderNotes = query({
  args: {
    orderId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: args.orderId,
    })) as Array<{ key: string; value: unknown }>;

    const raw = meta.find((m) => m.key === ORDER_NOTES_META_KEY)?.value ?? null;
    return parseNotes(raw);
  },
});

export const addOrderNote = mutation({
  args: {
    orderId: v.string(),
    content: v.string(),
    createdBy: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: args.orderId,
    })) as Array<{ key: string; value: unknown }>;

    const raw = meta.find((m) => m.key === ORDER_NOTES_META_KEY)?.value ?? null;
    const notes = parseNotes(raw);
    const note: OrderNote = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      content: args.content,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      isPrivate: args.isPrivate,
    };
    const next = [note, ...notes];

    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: args.orderId,
      key: ORDER_NOTES_META_KEY,
      value: JSON.stringify(next),
    });

    return { success: true, noteId: note.id };
  },
});

export const deleteOrderNote = mutation({
  args: {
    orderId: v.string(),
    noteId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: args.orderId,
    })) as Array<{ key: string; value: unknown }>;
    const raw = meta.find((m) => m.key === ORDER_NOTES_META_KEY)?.value ?? null;
    const notes = parseNotes(raw);
    const next = notes.filter((n) => n.id !== args.noteId);

    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: args.orderId,
      key: ORDER_NOTES_META_KEY,
      value: JSON.stringify(next),
    });

    return { success: true };
  },
});









