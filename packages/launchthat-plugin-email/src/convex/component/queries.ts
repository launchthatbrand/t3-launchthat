import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internalQuery, query } from "./server";

export const getEmailSettings = query({
  args: { orgId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      enabled: v.boolean(),
      fromName: v.string(),
      fromMode: v.union(v.literal("portal"), v.literal("custom")),
      fromLocalPart: v.string(),
      replyToEmail: v.union(v.string(), v.null()),
      designKey: v.optional(
        v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();
    if (!row) return null;
    return {
      enabled: row.enabled,
      fromName: row.fromName,
      fromMode: row.fromMode,
      fromLocalPart: row.fromLocalPart,
      replyToEmail: row.replyToEmail ?? null,
      designKey: row.designKey ?? undefined,
    };
  },
});

export const getEmailDomain = query({
  args: { orgId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      domain: v.union(v.string(), v.null()),
      status: v.union(
        v.literal("unconfigured"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("error"),
      ),
      records: v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          value: v.string(),
        }),
      ),
      lastError: v.optional(v.string()),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("emailDomains")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();
    if (!row) return null;
    return {
      domain: row.domain,
      status: row.status,
      records: row.records,
      lastError: row.lastError ?? undefined,
      updatedAt: row.updatedAt,
    };
  },
});

export const listOutbox = query({
  args: { orgId: v.string(), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const cursorCreatedAt = args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) : null;
    const limit = Math.max(1, args.paginationOpts.numItems);
    const take = limit + 1;

    const q = ctx.db
      .query("emailOutbox")
      .withIndex("by_org_and_createdAt", (q: any) => {
        const base = q.eq("orgId", args.orgId);
        return cursorCreatedAt && Number.isFinite(cursorCreatedAt)
          ? base.lt("createdAt", cursorCreatedAt)
          : base;
      })
      .order("desc");

    const rows = await q.take(take);
    const hasMore = rows.length > limit;
    const slice = rows.slice(0, limit);
    const last = slice[slice.length - 1] as any;
    const continueCursor =
      hasMore && typeof last?.createdAt === "number" ? String(last.createdAt) : null;

    return { page: slice, isDone: !hasMore, continueCursor };
  },
});

export const getOutboxByIdInternal = internalQuery({
  args: { outboxId: v.id("emailOutbox") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.outboxId);
  },
});

export const getEmailDomainByOrgInternal = internalQuery({
  args: { orgId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailDomains")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();
  },
});

