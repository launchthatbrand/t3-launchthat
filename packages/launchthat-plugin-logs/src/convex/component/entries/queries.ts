import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../_generated/server";

const filterValidator = v.object({
  pluginKey: v.optional(v.string()),
  kind: v.optional(v.string()),
  email: v.optional(v.string()),
  level: v.optional(
    v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
    ),
  ),
  status: v.optional(
    v.union(
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
    ),
  ),
  after: v.optional(v.number()),
  before: v.optional(v.number()),
});

const listArgsValidator = v.object({
  organizationId: v.string(),
  filter: v.optional(filterValidator),
  limit: v.optional(v.number()),
});

const logEntryReturn = v.object({
  _id: v.id("logEntries"),
  _creationTime: v.number(),
  organizationId: v.string(),
  pluginKey: v.string(),
  kind: v.string(),
  email: v.optional(v.string()),
  level: v.union(
    v.literal("debug"),
    v.literal("info"),
    v.literal("warn"),
    v.literal("error"),
  ),
  status: v.optional(
    v.union(
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
    ),
  ),
  message: v.string(),
  actionUrl: v.optional(v.string()),
  scopeKind: v.optional(v.string()),
  scopeId: v.optional(v.string()),
  actorUserId: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
});

const pickQuery = (args: {
  organizationId: string;
  pluginKey?: string;
  kind?: string;
  email?: string;
  level?: "debug" | "info" | "warn" | "error";
  status?: "scheduled" | "running" | "complete" | "failed";
}) => {
  // Prefer most selective index first.
  if (args.email) {
    return {
      index: "by_organizationId_and_email_and_createdAt" as const,
      builder: (q: any) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email),
    };
  }
  if (args.pluginKey) {
    return {
      index: "by_organizationId_and_pluginKey_and_createdAt" as const,
      builder: (q: any) =>
        q.eq("organizationId", args.organizationId).eq("pluginKey", args.pluginKey),
    };
  }
  if (args.kind) {
    return {
      index: "by_organizationId_and_kind_and_createdAt" as const,
      builder: (q: any) => q.eq("organizationId", args.organizationId).eq("kind", args.kind),
    };
  }
  if (args.level) {
    return {
      index: "by_organizationId_and_level_and_createdAt" as const,
      builder: (q: any) =>
        q.eq("organizationId", args.organizationId).eq("level", args.level),
    };
  }
  if (args.status) {
    return {
      index: "by_organizationId_and_status_and_createdAt" as const,
      builder: (q: any) =>
        q.eq("organizationId", args.organizationId).eq("status", args.status),
    };
  }
  return {
    index: "by_organizationId_and_createdAt" as const,
    builder: (q: any) => q.eq("organizationId", args.organizationId),
  };
};

const applyInMemoryFilter = (
  rows: Array<any>,
  filter: {
    pluginKey?: string;
    kind?: string;
    email?: string;
    level?: "debug" | "info" | "warn" | "error";
    status?: "scheduled" | "running" | "complete" | "failed";
    after?: number;
    before?: number;
  } | null
    | undefined,
) => {
  if (!filter) return rows;
  const after = typeof filter.after === "number" ? filter.after : null;
  const before = typeof filter.before === "number" ? filter.before : null;

  return rows.filter((row) => {
    if (filter.pluginKey && row.pluginKey !== filter.pluginKey) return false;
    if (filter.kind && row.kind !== filter.kind) return false;
    if (filter.email && row.email !== filter.email) return false;
    if (filter.level && row.level !== filter.level) return false;
    if (filter.status && row.status !== filter.status) return false;
    if (after !== null && row.createdAt < after) return false;
    if (before !== null && row.createdAt > before) return false;
    return true;
  });
};

export const listLogsForOrg = query({
  args: listArgsValidator,
  returns: v.array(logEntryReturn),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(1000, args.limit ?? 200));
    const filter = args.filter;

    const { index, builder } = pickQuery({
      organizationId: args.organizationId,
      pluginKey: filter?.pluginKey,
      kind: filter?.kind,
      email: filter?.email,
      level: filter?.level,
      status: filter?.status,
    });

    const rows = await ctx.db
      .query("logEntries")
      .withIndex(index, builder)
      .order("desc")
      .take(limit);

    return applyInMemoryFilter(rows, filter);
  },
});

export const listLogsForOrgPaginated = query({
  args: {
    organizationId: v.string(),
    filter: v.optional(filterValidator),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(logEntryReturn),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const filter = args.filter;
    const { index, builder } = pickQuery({
      organizationId: args.organizationId,
      pluginKey: filter?.pluginKey,
      kind: filter?.kind,
      email: filter?.email,
      level: filter?.level,
      status: filter?.status,
    });

    const page = await ctx.db
      .query("logEntries")
      .withIndex(index, builder)
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      page: applyInMemoryFilter(page.page, filter),
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

export const listRecentEmailsForOrg = query({
  args: {
    organizationId: v.string(),
    prefix: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, args.limit ?? 10));
    const prefix = (args.prefix ?? "").trim().toLowerCase();

    // Pull a batch of recent logs, then extract distinct emails.
    // (Convex doesn’t support “distinct” queries directly.)
    const rows = await ctx.db
      .query("logEntries")
      .withIndex("by_organizationId_and_createdAt", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(2000);

    const seen: Set<string> = new Set();
    const result: string[] = [];
    for (const row of rows) {
      const email = typeof row?.email === "string" ? row.email : "";
      if (!email) continue;
      const norm = email.trim().toLowerCase();
      if (!norm) continue;
      if (prefix && !norm.startsWith(prefix)) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      result.push(email);
      if (result.length >= limit) break;
    }

    return result;
  },
});


