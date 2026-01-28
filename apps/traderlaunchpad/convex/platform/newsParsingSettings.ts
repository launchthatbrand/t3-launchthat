/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-assignment
*/

import { mutation, query } from "../_generated/server";

import { internal } from "../_generated/api";
import { v } from "convex/values";

const SETTINGS_KEY = "main";

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

const defaultAssetAliasMap: Record<string, string> = {
  BTC: "BTCUSD",
  BITCOIN: "BTCUSD",
  ETH: "ETHUSD",
  ETHEREUM: "ETHUSD",
  GOLD: "XAUUSD",
  XAU: "XAUUSD",
  SILVER: "XAGUSD",
  XAG: "XAGUSD",
  OIL: "USOIL",
  WTI: "USOIL",
  US30: "US30",
  DOW: "US30",
};

export const getNewsParsingSettings = query({
  args: {},
  returns: v.object({
    assetAliasMap: v.record(v.string(), v.string()),
    disabledAliases: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const row = await ctx.db
      .query("platformNewsParsingSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (!row) {
      return { assetAliasMap: defaultAssetAliasMap, disabledAliases: [], updatedAt: 0 };
    }
    return {
      assetAliasMap: row.assetAliasMap ?? defaultAssetAliasMap,
      disabledAliases: Array.isArray(row.disabledAliases) ? row.disabledAliases : [],
      updatedAt: Number(row.updatedAt ?? 0),
    };
  },
});

export const upsertNewsParsingSettings = mutation({
  args: {
    assetAliasMap: v.record(v.string(), v.string()),
    disabledAliases: v.optional(v.array(v.string())),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();

    // Enforce that targets are within the pricedata symbol universe.
    const supportedSymbols: string[] = await ctx.runQuery(
      internal.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
      { limitPerSource: 20000 },
    );
    const allow = new Set(supportedSymbols.map((s) => String(s).trim().toUpperCase()));

    const normalized: Record<string, string> = {};
    for (const [k, vSym] of Object.entries(args.assetAliasMap)) {
      const key = String(k).trim().toUpperCase();
      const target = String(vSym).trim().toUpperCase();
      if (!key || !target) continue;
      if (!allow.has(target)) continue;
      normalized[key] = target;
    }

    const disabled = Array.isArray(args.disabledAliases)
      ? args.disabledAliases.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : [];

    const existing = await ctx.db
      .query("platformNewsParsingSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        assetAliasMap: normalized,
        disabledAliases: disabled,
        updatedAt: now,
      });
      return { ok: true };
    }

    await ctx.db.insert("platformNewsParsingSettings", {
      key: SETTINGS_KEY,
      assetAliasMap: normalized,
      disabledAliases: disabled,
      updatedAt: now,
      createdAt: now,
    });
    return { ok: true };
  },
});

export const resetNewsParsingSettingsToDefaults = mutation({
  args: {},
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("platformNewsParsingSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        assetAliasMap: defaultAssetAliasMap,
        disabledAliases: [],
        updatedAt: now,
      });
      return { ok: true };
    }
    await ctx.db.insert("platformNewsParsingSettings", {
      key: SETTINGS_KEY,
      assetAliasMap: defaultAssetAliasMap,
      disabledAliases: [],
      updatedAt: now,
      createdAt: now,
    });
    return { ok: true };
  },
});

