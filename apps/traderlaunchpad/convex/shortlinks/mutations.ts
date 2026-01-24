import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api, components } from "../_generated/api";

import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

const APP_KEY = "traderlaunchpad";

const assertAdmin = async (ctx: any): Promise<void> => {
  const viewer = await ctx.runQuery(api.viewer.queries.getViewerSettings, {});
  if (!viewer.isAdmin) {
    throw new Error("Forbidden: admin access required.");
  }
};

const normalizeDomain = (raw: string): string => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s.includes("://")) return "";
  if (s.includes("/")) return "";
  if (!/^[a-z0-9.-]+$/.test(s)) return "";
  return s;
};

export const createShortlink = mutation({
  args: {
    path: v.string(),
    kind: v.optional(v.string()),
    targetId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    code: v.string(),
    url: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);

    const out = await ctx.runMutation(components.launchthat_shortlinks.mutations.create, {
      appKey: APP_KEY,
      path: args.path,
      kind: args.kind,
      targetId: args.targetId,
      expiresAt: args.expiresAt,
      createdByUserId: viewerUserId,
    });

    const settings = await ctx.runQuery(components.launchthat_shortlinks.queries.getSettings, {
      appKey: APP_KEY,
    });
    const domain = String(settings.domain ?? "").trim();

    return {
      code: out.code,
      url: domain ? `https://${domain}/${out.code}` : undefined,
    };
  },
});

export const upsertShortlinkSettings = mutation({
  args: {
    domain: v.string(),
    enabled: v.boolean(),
    codeLength: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    await assertAdmin(ctx);

    const domain = normalizeDomain(args.domain);
    if (!domain) throw new Error("Invalid domain (hostname only, no protocol/path)");

    await ctx.runMutation(components.launchthat_shortlinks.mutations.upsertSettings, {
      appKey: APP_KEY,
      domain,
      enabled: Boolean(args.enabled),
      codeLength: args.codeLength,
      updatedByUserId: viewerUserId,
    });

    return null;
  },
});

