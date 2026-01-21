import type { FunctionReference } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

interface EmailQueries {
  getEmailSettings: FunctionReference<
    "query",
    "public",
    { orgId: any },
    unknown
  >;
  getEmailDomain: FunctionReference<"query", "public", { orgId: any }, unknown>;
  listOutbox: FunctionReference<
    "query",
    "public",
    { orgId: any; paginationOpts: { numItems: number; cursor: string | null } },
    unknown
  >;
}

const emailQueries = (() => {
  const componentsAny = components as unknown as { launchthat_email?: { queries?: unknown } };
  return (componentsAny.launchthat_email?.queries ?? {}) as EmailQueries;
})();

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
    return (await ctx.runQuery(emailQueries.getEmailSettings, args)) as any;
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
    return (await ctx.runQuery(emailQueries.getEmailDomain, args)) as any;
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
    return (await ctx.runQuery(emailQueries.listOutbox, args)) as any;
  },
});

