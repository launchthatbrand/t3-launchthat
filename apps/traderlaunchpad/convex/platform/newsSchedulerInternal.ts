/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

/**
 * Cron-driven runner:
 * - builds supported-symbol allowlist from pricedata
 * - runs due news sources inside the news component
 */
export const runDueNewsSources = internalAction({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    ok: v.boolean(),
    processed: v.number(),
    errors: v.number(),
    lastError: v.optional(v.string()),
    tickAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const tickAt = Date.now();
    const limit = Math.max(1, Math.min(50, Number(args.limit ?? 10)));

    let supportedSymbols: string[] = [];
    try {
      supportedSymbols = await ctx.runQuery(
        internal.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
        { limitPerSource: 5000 },
      );
    } catch {
      supportedSymbols = [];
    }

    let due: any[] = [];
    try {
      due =
        (await ctx.runQuery(
          componentsUntyped.launchthat_news.sources.queries.listDueSources,
          { nowMs: tickAt, limit },
        )) ?? [];
    } catch {
      due = [];
    }

    let processed = 0;
    let errors = 0;
    let lastError: string | undefined;

    for (const s of Array.isArray(due) ? due : []) {
      try {
        const ingestRes: any = await ctx.runAction(componentsUntyped.launchthat_news.ingest.actions.ingestSource, {
          sourceId: (s as any)._id,
          nowMs: tickAt,
          supportedSymbols,
        });
        // Fanout notifications for newly created events (best effort).
        const createdEventIds: string[] = Array.isArray(ingestRes?.createdEventIds)
          ? ingestRes.createdEventIds.map((x: any) => String(x)).filter(Boolean)
          : [];
        for (const eventId of createdEventIds) {
          try {
            const links: any[] = await ctx.runQuery(
              componentsUntyped.launchthat_news.events.queries.listSymbolsForEvent,
              { eventId },
            );
            const symbols = Array.isArray(links)
              ? links.map((r: any) => String(r?.symbol ?? "")).filter(Boolean)
              : [];
            for (const symbol of symbols) {
              const subs: any[] = await ctx.runQuery(
                componentsUntyped.launchthat_news.subscriptions.queries.listEnabledSubscriptionsForSymbol,
                { symbol, limit: 200 },
              );
              const list = Array.isArray(subs) ? subs : [];
              for (const sub of list) {
                const userId = String(sub?.userId ?? "");
                const orgId = String(sub?.orgId ?? "");
                if (!userId || !orgId) continue;
                const eventKey = `news:${eventId}`;
                await ctx.runMutation(
                  componentsUntyped.launchthat_notifications.mutations.createNotificationOnce,
                  {
                    userId,
                    orgId,
                    eventKey,
                    tabKey: "news",
                    title: `News: ${symbol}`,
                    content: "New event available for a subscribed symbol.",
                    actionUrl: `/symbol/${encodeURIComponent(symbol)}?sideTab=details`,
                  },
                );
              }
            }
          } catch {
            // ignore per-event fanout failures
          }
        }
        processed += 1;
      } catch (e) {
        errors += 1;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    return { ok: errors === 0, processed, errors, lastError, tickAt };
  },
});

