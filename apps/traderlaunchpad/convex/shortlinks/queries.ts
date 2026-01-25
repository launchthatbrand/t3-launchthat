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

