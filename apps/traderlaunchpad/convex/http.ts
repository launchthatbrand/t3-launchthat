/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("./_generated/api").components;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const http = httpRouter();

http.route({
  path: "/widgets/economic-calendar",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/widgets/economic-calendar",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const fromMs = Number(url.searchParams.get("fromMs") ?? "");
    const toMs = Number(url.searchParams.get("toMs") ?? "");
    const limit = Number(url.searchParams.get("limit") ?? "");

    const now = Date.now();
    const safeFromMs = Number.isFinite(fromMs) ? Math.max(0, Math.floor(fromMs)) : now;
    const safeToMs = Number.isFinite(toMs)
      ? Math.max(safeFromMs, Math.floor(toMs))
      : safeFromMs + 7 * 24 * 60 * 60 * 1000;
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 200;

    const rows: any[] =
      (await ctx.runQuery(componentsUntyped.launchthat_news.events.queries.listEventsGlobal, {
        fromMs: safeFromMs,
        toMs: safeToMs,
        limit: safeLimit,
        eventType: "economic",
      })) ?? [];

    const body = (Array.isArray(rows) ? rows : []).map((r: any) => {
      const econ = r?.meta?.economic ?? null;
      return {
        id: String(r?._id ?? ""),
        title: String(r?.title ?? ""),
        startsAt: typeof r?.startsAt === "number" ? r.startsAt : null,
        currency: typeof r?.currency === "string" ? r.currency : null,
        country: typeof r?.country === "string" ? r.country : null,
        impact: typeof r?.impact === "string" ? r.impact : null,
        actual: typeof econ?.actual === "string" ? econ.actual : null,
        forecast: typeof econ?.forecast === "string" ? econ.forecast : null,
        previous: typeof econ?.previous === "string" ? econ.previous : null,
      };
    });

    return new Response(JSON.stringify({ ok: true, fromMs: safeFromMs, toMs: safeToMs, rows: body }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }),
});

export default http;

