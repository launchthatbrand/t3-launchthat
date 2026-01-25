"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/prefer-for-of,
  turbo/no-undeclared-env-vars
*/

import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

import { discordMultipart } from "launchthat-plugin-discord/runtime/discordApi";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";
import { clusterCommunityPositions } from "launchthat-plugin-traderlaunchpad/runtime/discordSnapshot";

import { PNG } from "pngjs";

// Avoid typed imports here (can cause TS deep instantiation errors).
const internal: any = require("../../_generated/api").internal;
const components: any = require("../../_generated/api").components;

const normalizeSymbol = (s: string): string => s.trim().toUpperCase();

interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const flattenBars = (chunks: any[], fromMs: number, toMs: number): Bar[] => {
  const map = new Map<number, Bar>();
  const list = Array.isArray(chunks) ? chunks : [];
  for (const c of list) {
    const bars = Array.isArray(c?.bars) ? c.bars : [];
    for (const b of bars) {
      const t = Number(b?.t);
      const o = Number(b?.o);
      const h = Number(b?.h);
      const l = Number(b?.l);
      const close = Number(b?.c);
      const vol = Number(b?.v);
      if (!Number.isFinite(t) || t < fromMs || t > toMs) continue;
      if (![o, h, l, close, vol].every((n) => Number.isFinite(n))) continue;
      map.set(t, { t, o, h, l, c: close, v: vol });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.t - b.t);
};

const movingAverage = (bars: Bar[], period: number): { t: number; value: number }[] => {
  const p = Math.max(2, Math.min(200, Number(period)));
  const out: { t: number; value: number }[] = [];
  let sum = 0;
  const q: number[] = [];
  for (const b of bars) {
    const c = b.c;
    q.push(c);
    sum += c;
    if (q.length > p) sum -= q.shift() ?? 0;
    if (q.length === p) out.push({ t: b.t, value: sum / p });
  }
  return out;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r1 = h[0] ?? "0";
    const g1 = h[1] ?? "0";
    const b1 = h[2] ?? "0";
    const r = parseInt(r1 + r1, 16);
    const g = parseInt(g1 + g1, 16);
    const b = parseInt(b1 + b1, 16);
    return { r, g, b };
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
};

const setPixel = (
  img: PNG,
  x: number,
  y: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const idx = (img.width * y + x) << 2;
  img.data[idx] = rgba.r;
  img.data[idx + 1] = rgba.g;
  img.data[idx + 2] = rgba.b;
  img.data[idx + 3] = rgba.a;
};

const fillRect = (
  img: PNG,
  x: number,
  y: number,
  w: number,
  h: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(img.width, x + w);
  const y1 = Math.min(img.height, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(img, xx, yy, rgba);
  }
};

const drawLine = (
  img: PNG,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  // Bresenham
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(img, x, y, rgba);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

const fillCircle = (
  img: PNG,
  cx: number,
  cy: number,
  r: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  const rr = r * r;
  for (let y = -r; y <= r; y++) {
    const yy = cy + y;
    const xxSpan = Math.floor(Math.sqrt(Math.max(0, rr - y * y)));
    for (let x = -xxSpan; x <= xxSpan; x++) {
      setPixel(img, cx + x, yy, rgba);
    }
  }
};

const renderSnapshotPng = (args: {
  symbol: string;
  bars: Bar[];
  clusters: Array<{
    count: number;
    direction: "long" | "short" | "mixed";
    avgEntryPrice: number;
    avgOpenedAt: number;
    totalAbsQty: number;
  }>;
  now: number;
}): Uint8Array => {
  const width = 1200;
  const height = 630;
  const img = new PNG({ width, height });

  // Theme
  const bg = hexToRgb("#0B1020");
  const grid = { r: 255, g: 255, b: 255, a: Math.round(255 * 0.06) };
  const up = hexToRgb("#22C55E");
  const down = hexToRgb("#EF4444");
  const ma = hexToRgb("#60A5FA");
  const mixed = hexToRgb("#A78BFA");

  // Background
  fillRect(img, 0, 0, width, height, { ...bg, a: 255 });

  // Layout
  const padL = 70;
  const padR = 40;
  const padT = 60;
  const padB = 50;
  const chartX = padL;
  const chartY = padT;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Grid
  const gridRows = 5;
  const gridCols = 6;
  for (let i = 0; i <= gridRows; i++) {
    const y = chartY + (chartH * i) / gridRows;
    drawLine(
      img,
      Math.round(chartX),
      Math.round(y),
      Math.round(chartX + chartW),
      Math.round(y),
      grid,
    );
  }
  for (let i = 0; i <= gridCols; i++) {
    const x = chartX + (chartW * i) / gridCols;
    drawLine(
      img,
      Math.round(x),
      Math.round(chartY),
      Math.round(x),
      Math.round(chartY + chartH),
      grid,
    );
  }

  const bars = Array.isArray(args.bars) ? args.bars : [];
  if (bars.length < 2) {
    return new Uint8Array(PNG.sync.write(img));
  }

  const minPrice = Math.min(...bars.map((b) => b.l));
  const maxPrice = Math.max(...bars.map((b) => b.h));
  const pad = (maxPrice - minPrice) * 0.06 || Math.max(1e-6, maxPrice * 0.002);
  const lo = minPrice - pad;
  const hi = maxPrice + pad;
  const pr = hi - lo || 1;

  const firstBar = bars[0];
  const lastBar = bars[bars.length - 1];
  if (!firstBar || !lastBar) {
    return new Uint8Array(PNG.sync.write(img));
  }
  const t0 = firstBar.t;
  const t1 = lastBar.t;
  const tr = t1 - t0 || 1;

  const xForT = (t: number) => chartX + ((t - t0) / tr) * chartW;
  const yForP = (p: number) => chartY + ((hi - p) / pr) * chartH;

  // Candles
  const step = chartW / bars.length;
  const bodyW = Math.max(1, Math.floor(step * 0.6));
  for (const [i, b] of bars.entries()) {
    const x = Math.round(chartX + i * step + step * 0.5);
    const yH = yForP(b.h);
    const yL = yForP(b.l);
    const yO = yForP(b.o);
    const yC = yForP(b.c);
    const isUp = b.c >= b.o;
    const col = isUp ? up : down;
    const colRgba = { ...col, a: 255 };

    // wick
    drawLine(
      img,
      x,
      Math.round(yH),
      x,
      Math.round(yL),
      colRgba,
    );

    // body
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const h = Math.max(1, bot - top);
    fillRect(
      img,
      Math.round(x - bodyW / 2),
      Math.round(top),
      bodyW,
      Math.round(h),
      colRgba,
    );
  }

  // MA20
  const ma20 = movingAverage(bars, 20);
  if (ma20.length > 1) {
    let prev: { x: number; y: number } | null = null;
    for (const p of ma20) {
      const x = xForT(p.t);
      const y = yForP(p.value);
      const pt = { x: Math.round(x), y: Math.round(y) };
      if (prev) {
        drawLine(img, prev.x, prev.y, pt.x, pt.y, { ...ma, a: 255 });
      }
      prev = pt;
    }
  }

  // Community clusters (<=10)
  const clusters = Array.isArray(args.clusters) ? args.clusters : [];
  for (const c of clusters) {
    const x = xForT(Number(c.avgOpenedAt));
    const y = yForP(Number(c.avgEntryPrice));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const r = Math.max(6, Math.min(18, 6 + Math.log10(Math.max(1, c.totalAbsQty)) * 6));
    const color = c.direction === "mixed" ? mixed : c.direction === "short" ? down : up;

    // shadow
    fillCircle(img, Math.round(x + 2), Math.round(y + 2), Math.round(r), {
      r: 0,
      g: 0,
      b: 0,
      a: Math.round(255 * 0.35),
    });
    // fill
    fillCircle(img, Math.round(x), Math.round(y), Math.round(r), {
      ...color,
      a: 255,
    });
  }
  const bytes = PNG.sync.write(img);
  return new Uint8Array(bytes);
};

const resolveOrgBotTokenForOrg = async (ctx: any, organizationId: string) => {
  const config = await ctx.runQuery(
    components.launchthat_discord.orgConfigs.internalQueries.getOrgConfigSecrets as any,
    { organizationId },
  );
  if (!config?.enabled) {
    throw new Error("Discord is not enabled for this organization");
  }

  return await resolveOrgBotToken({
    botMode: config.botMode === "custom" ? "custom" : "global",
    globalBotToken: process.env.DISCORD_GLOBAL_BOT_TOKEN,
    secretsKey: process.env.DISCORD_SECRETS_KEY,
    customBotTokenEncrypted: config.customBotTokenEncrypted,
    botTokenEncrypted: config.botTokenEncrypted,
  });
};

export const run = internalAction({
  args: {
    maxOrgs: v.optional(v.number()),
  },
  returns: v.object({
    orgsScanned: v.number(),
    orgsWithGuild: v.number(),
    symbolsProcessed: v.number(),
    messagesPosted: v.number(),
    messagesEdited: v.number(),
    skipped: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    const maxOrgs = Math.max(1, Math.min(500, Number(args.maxOrgs ?? 200)));
    const now = Date.now();

    // Resolve pricedata source once (global default).
    const source = await ctx.runQuery(
      components.launchthat_pricedata.sources.queries.getDefaultSource as any,
      {},
    );
    const sourceKey = typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) {
      return {
        orgsScanned: 0,
        orgsWithGuild: 0,
        symbolsProcessed: 0,
        messagesPosted: 0,
        messagesEdited: 0,
        skipped: 0,
        errors: 1,
      };
    }

    const orgIds = (await ctx.runQuery(
      internal.core.organizations.membershipsInternalQueries.listOrganizationIds,
      { limit: maxOrgs },
    )) as any[];

    let orgsWithGuild = 0;
    let symbolsProcessed = 0;
    let messagesPosted = 0;
    let messagesEdited = 0;
    let skipped = 0;
    let errors = 0;

    for (const orgId of orgIds) {
      const organizationId = String(orgId);

      const guildConnections = (await ctx.runQuery(
        components.launchthat_discord.guildConnections.queries.listGuildConnectionsForOrg as any,
        { organizationId },
      )) as any[] | null;
      const guilds = Array.isArray(guildConnections) ? guildConnections : [];
      const primary = guilds
        .slice()
        .sort((a, b) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
      const guildId = typeof primary?.guildId === "string" ? primary.guildId.trim() : "";
      if (!guildId) {
        skipped += 1;
        continue;
      }
      orgsWithGuild += 1;

      // Determine snapshot-enabled symbols by scanning enabled routing rules that include symbol conditions.
      const routingRules = (await ctx.runQuery(
        components.launchthat_discord.routing.queries.listRoutingRules as any,
        { organizationId, guildId, kind: "trade_feed" as const },
      )) as any[] | null;
      const rules = Array.isArray(routingRules) ? routingRules : [];
      const symbols = new Set<string>();
      for (const r of rules) {
        if (r?.enabled !== true) continue;
        const cond = r?.conditions;
        const list = Array.isArray(cond?.symbols) ? cond.symbols : [];
        for (const s of list) {
          const sym = normalizeSymbol(String(s ?? ""));
          if (sym) symbols.add(sym);
        }
      }
      if (symbols.size === 0) {
        skipped += 1;
        continue;
      }

      let botToken: string;
      try {
        botToken = await resolveOrgBotTokenForOrg(ctx, organizationId);
      } catch (err) {
        errors += 1;
        continue;
      }

      for (const symbol of Array.from(symbols)) {
        symbolsProcessed += 1;

        // Route to a channel using existing rules (actorRole fixed as "owner" for now).
        const channelIds = (await ctx.runQuery(
          components.launchthat_discord.routing.queries.resolveChannelsForEvent as any,
          {
            organizationId,
            guildId,
            kind: "trade_feed" as const,
            actorRole: "owner",
            symbol,
          },
        )) as string[] | null;
        const resolved = Array.isArray(channelIds)
          ? channelIds.map((c) => (typeof c === "string" ? c.trim() : "")).filter(Boolean)
          : [];
        const channelId = resolved[0] ?? "";
        if (!channelId) {
          skipped += 1;
          continue;
        }

        // Price data
        const instrument = await ctx.runQuery(
          components.launchthat_pricedata.instruments.queries.getInstrumentBySymbol as any,
          { sourceKey, symbol },
        );
        const tradableInstrumentId =
          typeof instrument?.tradableInstrumentId === "string"
            ? String(instrument.tradableInstrumentId)
            : "";
        if (!tradableInstrumentId) {
          skipped += 1;
          continue;
        }

        const toMs = now;
        const fromMs = now - 24 * 60 * 60 * 1000;
        const chunks = await ctx.runQuery(
          components.launchthat_pricedata.bars.queries.getBarChunks as any,
          {
            sourceKey,
            tradableInstrumentId,
            resolution: "15m",
            fromMs,
            toMs,
          },
        );
        const bars = flattenBars(Array.isArray(chunks) ? chunks : [], fromMs, toMs);

        // Community open positions (org+symbol, open only)
        const openGroups = (await ctx.runQuery(
          components.launchthat_traderlaunchpad.tradeIdeas.queries.listOpenGroupsForOrgSymbol as any,
          { organizationId, symbol, limit: 1000 },
        )) as any[] | null;
        const positions = (Array.isArray(openGroups) ? openGroups : []).map((g) => ({
          userId: String(g?.userId ?? ""),
          direction: g?.direction === "short" ? ("short" as const) : ("long" as const),
          netQty: Number(g?.netQty ?? 0),
          avgEntryPrice:
            typeof g?.avgEntryPrice === "number" ? (g.avgEntryPrice as number) : undefined,
          openedAt: Number(g?.openedAt ?? 0),
        }));
        const clusters = clusterCommunityPositions({
          positions,
          maxClusters: 10,
        });

        const png = renderSnapshotPng({ symbol, bars, clusters, now });

        const existing = await ctx.runQuery(
          components.launchthat_traderlaunchpad.tradeIdeas.queries.getDiscordSymbolSnapshotFeed as any,
          { organizationId, symbol },
        );

        const payloadJson = {
          content: `📈 ${symbol} community snapshot`,
          embeds: [
            {
              title: `${symbol} Community Snapshot`,
              description: `Open positions: ${positions.length} • Clusters: ${clusters.length}`,
              image: { url: "attachment://snapshot.png" },
            },
          ],
        };

        try {
          // If channel changed, create a fresh message in the new channel to preserve “one per org+symbol”.
          const existingChannelId =
            typeof existing?.channelId === "string" ? String(existing.channelId) : "";
          const existingMessageId =
            typeof existing?.messageId === "string" ? String(existing.messageId) : "";

          if (existingChannelId && existingMessageId && existingChannelId === channelId) {
            const res = await discordMultipart({
              botToken,
              method: "PATCH",
              url: `https://discord.com/api/v10/channels/${channelId}/messages/${existingMessageId}`,
              payloadJson,
              file: { name: "snapshot.png", bytes: png, contentType: "image/png" },
            });
            if (!res.ok) throw new Error(res.text);

            await ctx.runMutation(
              components.launchthat_traderlaunchpad.tradeIdeas.mutations.upsertDiscordSymbolSnapshotFeed as any,
              {
                organizationId,
                symbol,
                guildId,
                channelId,
                messageId: existingMessageId,
                lastEditedAt: now,
                lastError: undefined,
              },
            );

            messagesEdited += 1;
            continue;
          }

          const res = await discordMultipart({
            botToken,
            method: "POST",
            url: `https://discord.com/api/v10/channels/${channelId}/messages`,
            payloadJson,
            file: { name: "snapshot.png", bytes: png, contentType: "image/png" },
          });
          if (!res.ok) throw new Error(res.text);

          const msgId =
            typeof (res.json as any)?.id === "string" ? String((res.json as any).id) : "";
          if (!msgId) throw new Error("Discord response missing message id");

          await ctx.runMutation(
            components.launchthat_traderlaunchpad.tradeIdeas.mutations.upsertDiscordSymbolSnapshotFeed as any,
            {
              organizationId,
              symbol,
              guildId,
              channelId,
              messageId: msgId,
              lastPostedAt: now,
              lastEditedAt: now,
              lastError: undefined,
            },
          );

          messagesPosted += 1;
        } catch (err) {
          errors += 1;
          const message = err instanceof Error ? err.message : String(err);
          try {
            const existingMessageId =
              typeof existing?.messageId === "string" ? String(existing.messageId) : "";
            if (existingMessageId) {
              await ctx.runMutation(
                components.launchthat_traderlaunchpad.tradeIdeas.mutations.upsertDiscordSymbolSnapshotFeed as any,
                {
                  organizationId,
                  symbol,
                  guildId,
                  channelId,
                  messageId: existingMessageId,
                  lastError: message.slice(0, 500),
                },
              );
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      orgsScanned: orgIds.length,
      orgsWithGuild,
      symbolsProcessed,
      messagesPosted,
      messagesEdited,
      skipped,
      errors,
    };
  },
});

