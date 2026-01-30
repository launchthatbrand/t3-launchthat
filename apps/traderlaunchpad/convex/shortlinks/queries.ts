import { components } from "../_generated/api";
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { query } from "../_generated/server";
import { v } from "convex/values";

const APP_KEY = "traderlaunchpad";

export const resolveShortlinkByCode = query({
  args: {
    code: v.string(),
  },
  returns: v.union(v.object({ path: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const code = String(args.code ?? "").trim();
    if (!code) return null;

    const row = await ctx.runQuery(components.launchthat_shortlinks.queries.getByCode, {
      appKey: APP_KEY,
      code,
    });
    if (!row) return null;
    return { path: row.path };
  },
});

export const getPublicShortlinkSettings = query({
  args: {},
  returns: v.object({
    domain: v.string(),
    enabled: v.boolean(),
    codeLength: v.number(),
  }),
  handler: async (ctx) => {
    const settings = await ctx.runQuery(components.launchthat_shortlinks.queries.getSettings, {
      appKey: APP_KEY,
    });
    return {
      domain: settings.domain,
      enabled: settings.enabled,
      codeLength: settings.codeLength,
    };
  },
});

export const listMyShortlinksByKind = query({
  args: {
    kind: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      code: v.string(),
      path: v.string(),
      kind: v.optional(v.string()),
      targetId: v.optional(v.string()),
      createdAt: v.number(),
      createdByUserId: v.optional(v.string()),
      clickCount: v.optional(v.number()),
      lastAccessAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId =
      typeof identity?.tokenIdentifier === "string"
        ? identity.tokenIdentifier.trim()
        : typeof identity?.subject === "string"
          ? identity.subject.trim()
          : "";
    if (!userId) return [];

    const kind = String(args.kind ?? "").trim();
    if (!kind) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.floor(limitRaw)));

    const rows = await ctx.runQuery(components.launchthat_shortlinks.queries.listByCreator, {
      appKey: APP_KEY,
      kind,
      createdByUserId: userId,
      limit,
    });
    return Array.isArray(rows) ? (rows as any[]) : [];
  },
});

