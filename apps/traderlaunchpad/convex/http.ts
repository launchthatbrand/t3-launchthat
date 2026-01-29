/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("./_generated/api").components;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("./_generated/api").internal;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-TDRLP-Widget-Id, X-TDRLP-Widget-Key",
};

const http = httpRouter();

const readWidgetAuthHeaders = (req: Request) => {
  const installationId = req.headers.get("X-TDRLP-Widget-Id") ?? "";
  const apiKey = req.headers.get("X-TDRLP-Widget-Key") ?? "";
  return { installationId: installationId.trim(), apiKey: apiKey.trim() };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

http.route({
  path: "/widgets/economic-calendar",
  method: "OPTIONS",
  handler: httpAction(() => Promise.resolve(new Response(null, { status: 204, headers: corsHeaders }))),
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

http.route({
  path: "/widgets/auth/profile-card",
  method: "OPTIONS",
  handler: httpAction(() => Promise.resolve(new Response(null, { status: 204, headers: corsHeaders }))),
});

http.route({
  path: "/widgets/auth/profile-card",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const { installationId, apiKey } = readWidgetAuthHeaders(req);
    if (!installationId || !apiKey) return json({ ok: false, error: "Missing widget credentials" }, 401);

    const validated = await ctx.runQuery(internalUntyped.widgets.auth.validateWidgetKey, {
      installationId: installationId as any,
      apiKey,
    });
    if (!validated) return json({ ok: false, error: "Unauthorized" }, 401);

    await ctx.runQuery(internalUntyped.widgets.auth.assertTierForWidget, {
      userId: validated.userId,
      requiredTier: validated.requiredTier,
    });

    await ctx.runMutation(internalUntyped.widgets.auth.touchInstallationLastUsedAt, {
      installationId: validated.installationId,
      at: Date.now(),
    });

    const data = await ctx.runQuery(internalUntyped.widgets.data.getProfileCardData, {
      userId: validated.userId,
    });

    return json({ ok: true, widgetType: validated.widgetType, data });
  }),
});

http.route({
  path: "/widgets/auth/my-trades",
  method: "OPTIONS",
  handler: httpAction(() => Promise.resolve(new Response(null, { status: 204, headers: corsHeaders }))),
});

http.route({
  path: "/widgets/auth/my-trades",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const { installationId, apiKey } = readWidgetAuthHeaders(req);
    if (!installationId || !apiKey) return json({ ok: false, error: "Missing widget credentials" }, 401);

    const validated = await ctx.runQuery(internalUntyped.widgets.auth.validateWidgetKey, {
      installationId: installationId as any,
      apiKey,
    });
    if (!validated) return json({ ok: false, error: "Unauthorized" }, 401);

    await ctx.runQuery(internalUntyped.widgets.auth.assertTierForWidget, {
      userId: validated.userId,
      requiredTier: validated.requiredTier,
    });

    await ctx.runMutation(internalUntyped.widgets.auth.touchInstallationLastUsedAt, {
      installationId: validated.installationId,
      at: Date.now(),
    });

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "");
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 20;

    const trades = await ctx.runQuery(internalUntyped.widgets.data.listMyTradesData, {
      userId: validated.userId,
      limit: safeLimit,
    });

    return json({ ok: true, widgetType: validated.widgetType, trades });
  }),
});

http.route({
  path: "/widgets/auth/open-positions",
  method: "OPTIONS",
  handler: httpAction(() => Promise.resolve(new Response(null, { status: 204, headers: corsHeaders }))),
});

http.route({
  path: "/widgets/auth/open-positions",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const { installationId, apiKey } = readWidgetAuthHeaders(req);
    if (!installationId || !apiKey) return json({ ok: false, error: "Missing widget credentials" }, 401);

    const validated = await ctx.runQuery(internalUntyped.widgets.auth.validateWidgetKey, {
      installationId: installationId as any,
      apiKey,
    });
    if (!validated) return json({ ok: false, error: "Unauthorized" }, 401);

    // Explicitly enforce pro for open positions (even if the installation was misconfigured).
    await ctx.runQuery(internalUntyped.widgets.auth.assertTierForWidget, {
      userId: validated.userId,
      requiredTier: "pro",
    });

    await ctx.runMutation(internalUntyped.widgets.auth.touchInstallationLastUsedAt, {
      installationId: validated.installationId,
      at: Date.now(),
    });

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "");
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 50;

    const positions = await ctx.runQuery(internalUntyped.widgets.data.listOpenPositionsData, {
      userId: validated.userId,
      limit: safeLimit,
    });

    return json({ ok: true, widgetType: validated.widgetType, positions });
  }),
});

export default http;

