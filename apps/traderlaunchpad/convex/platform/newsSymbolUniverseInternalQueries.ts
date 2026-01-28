/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

/**
 * Internal: build a list of all supported symbols from pricedata mappings.
 * This is used by the news scheduler to enforce the "only symbols we support in price data" rule.
 */
export const listSupportedSymbols = internalQuery({
  args: { limitPerSource: v.optional(v.number()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const limitPerSource = Math.max(50, Math.min(20000, Number(args.limitPerSource ?? 5000)));

    // Prefer enumerating all sources; if that fails, fall back to the default source only.
    let sourceKeys: string[] = [];
    try {
      const rows: any[] =
        (await ctx.runQuery(componentsUntyped.launchthat_pricedata.sources.queries.listSources, {
          limit: 200,
        })) ?? [];
      sourceKeys = (Array.isArray(rows) ? rows : [])
        .map((r: any) => String(r?.sourceKey ?? "").trim())
        .filter(Boolean);
    } catch {
      sourceKeys = [];
    }

    if (sourceKeys.length === 0) {
      const def = await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
        {},
      );
      const k = typeof def?.sourceKey === "string" ? String(def.sourceKey).trim() : "";
      if (k) sourceKeys = [k];
    }

    const set = new Set<string>();
    for (const sourceKey of sourceKeys) {
      try {
        const rows: any[] = await ctx.runQuery(
          componentsUntyped.launchthat_pricedata.instruments.queries.listInstrumentsForSource,
          { sourceKey, limit: limitPerSource },
        );
        const list = Array.isArray(rows) ? rows : [];
        for (const r of list) {
          const sym = String((r as any)?.symbol ?? "").trim().toUpperCase();
          if (sym) set.add(sym);
        }
      } catch {
        // ignore
      }
    }

    return Array.from(set.values()).sort();
  },
});


