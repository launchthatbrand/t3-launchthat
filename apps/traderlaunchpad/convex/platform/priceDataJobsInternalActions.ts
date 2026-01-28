"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { env } from "../../src/env";
import { clickhouseExec, clickhouseSelect } from "../lib/clickhouseHttp";

// Avoid typed api imports here (can cause TS deep instantiation errors in node actions).
const internal: any = require("../_generated/api").internal;
const componentsUntyped: any = require("../_generated/api").components;

const platformConnections = componentsUntyped.launchthat_traderlaunchpad.connections.platform;
const pricedataTradeLocker = componentsUntyped.launchthat_pricedata.tradelocker.actions;

const baseUrlForEnv = (envName: "demo" | "live"): string =>
  `https://${envName}.tradelocker.com/backend-api`;

const computeTradeLockerSourceKey = (args: {
  environment: "demo" | "live";
  jwtHost?: string;
  server?: string;
}): string => {
  const envName = args.environment === "live" ? "live" : "demo";
  const baseUrlHost =
    typeof args.jwtHost === "string" && args.jwtHost.trim()
      ? args.jwtHost.trim()
      : `${envName}.tradelocker.com`;
  const server =
    typeof args.server === "string" && args.server.trim() ? args.server.trim() : "unknown";
  return `tradelocker:${envName}:${baseUrlHost}:${server}`.toLowerCase().trim();
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const base64Decode = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, "base64"));

const deriveAesKey = async (keyMaterial: string): Promise<CryptoKey> => {
  const keyBytes = await crypto.subtle.digest("SHA-256", toArrayBuffer(textEncoder.encode(keyMaterial)));
  return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
};

const decryptSecret = async (ciphertext: string, keyMaterial: string): Promise<string> => {
  if (!ciphertext.startsWith("enc_v1:")) return ciphertext;
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = textDecoder.decode(base64Decode(raw));
  const parsed = JSON.parse(decoded) as { alg: string; ivB64: string; tagB64: string; dataB64: string };
  if (parsed.alg !== "aes-256-gcm") throw new Error("Unsupported ciphertext alg");
  const key = await deriveAesKey(keyMaterial);
  const iv = toArrayBuffer(base64Decode(parsed.ivB64));
  const tag = base64Decode(parsed.tagB64);
  const data = base64Decode(parsed.dataB64);
  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data, 0);
  combined.set(tag, data.length);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(combined));
  return textDecoder.decode(plaintext);
};

const sleepMs = async (ms: number) =>
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

export const computeAndStoreBackfillWindow1m = internalAction({
  args: { jobId: v.id("platformPriceDataJobs") },
  returns: v.object({
    ok: v.boolean(),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    existingMinMs: v.optional(v.number()),
    existingMaxMs: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
      jobId: args.jobId,
      level: "info",
      message: "Compute backfill window",
    });

    const job: any = await ctx.runQuery(internal.platform.priceDataJobsInternalMutations.getJobById, {
      jobId: args.jobId,
    });
    if (!job) return { ok: false, error: "Job not found" };

    const lookbackDays = Number(job.requestedLookbackDays ?? 0);
    const overlapDays = Number(job.overlapDays ?? 1);
    const nowMs = Date.now();
    const desiredFromMs = nowMs - lookbackDays * 24 * 60 * 60 * 1000;
    const desiredToMs = nowMs;

    const chRes = await clickhouseSelect<{ rows: number; minTsMs: number; maxTsMs: number }>(
      `SELECT
         count() AS rows,
         toUnixTimestamp64Milli(min(ts)) AS minTsMs,
         toUnixTimestamp64Milli(max(ts)) AS maxTsMs
       FROM candles_1m
       WHERE sourceKey = {sourceKey:String}
         AND tradableInstrumentId = {tradableInstrumentId:String}`,
      [
        { name: "sourceKey", type: "String", value: String(job.sourceKey ?? "") },
        { name: "tradableInstrumentId", type: "String", value: String(job.tradableInstrumentId ?? "") },
      ],
    );

    if (!chRes.ok) {
      return { ok: false, error: chRes.error ?? "ClickHouse query failed" };
    }

    const row = chRes.rows[0] as any;
    const rows = row && Number.isFinite(Number(row.rows ?? NaN)) ? Number(row.rows) : 0;
    const existingMinMs =
      rows > 0 && Number.isFinite(Number(row?.minTsMs ?? NaN)) ? Number(row.minTsMs) : undefined;
    const existingMaxMs =
      rows > 0 && Number.isFinite(Number(row?.maxTsMs ?? NaN)) ? Number(row.maxTsMs) : undefined;

    let fromMs: number | undefined;
    let toMs: number | undefined;

    if (!Number.isFinite(existingMinMs ?? NaN)) {
      // No data yet: fetch the full desired range.
      fromMs = desiredFromMs;
      toMs = desiredToMs;
    } else {
      // Only backfill older missing data with overlap (extend lookback).
      if (Number(existingMinMs) <= desiredFromMs) {
        fromMs = undefined;
        toMs = undefined;
      } else {
        fromMs = desiredFromMs;
        toMs = Math.min(desiredToMs, Number(existingMinMs) + overlapDays * 24 * 60 * 60 * 1000);
      }
    }

    await ctx.runMutation(internal.platform.priceDataJobsInternalMutations.setComputedWindow, {
      jobId: args.jobId,
      computedFromTs: fromMs,
      computedToTs: toMs,
    });

    await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
      jobId: args.jobId,
      level: "info",
      message: "Computed window",
      data: {
        fromMs,
        toMs,
        existingMinMs,
        existingMaxMs,
        requestedLookbackDays: lookbackDays,
        overlapDays,
      },
    });

    return { ok: true, fromMs, toMs, existingMinMs, existingMaxMs };
  },
});

export const fetchAndInsertTradeLockerHistoryChunk1m = internalAction({
  args: {
    jobId: v.id("platformPriceDataJobs"),
    fromMs: v.number(),
    toMs: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
    insertedRows: v.optional(v.number()),
    progress: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
      jobId: args.jobId,
      level: "info",
      message: "Fetch chunk",
      data: { fromMs: args.fromMs, toMs: args.toMs },
    });

    const job: any = await ctx.runQuery(internal.platform.priceDataJobsInternalMutations.getJobById, {
      jobId: args.jobId,
    });
    if (!job) return { ok: false, error: "Job not found" };

    const sourceKey = String(job.sourceKey ?? "").trim().toLowerCase();
    const tradableInstrumentId = String(job.tradableInstrumentId ?? "").trim();
    const symbol = String(job.symbol ?? "").trim().toUpperCase();
    if (!sourceKey || !tradableInstrumentId || !symbol) return { ok: false, error: "Job missing fields" };

    // Locate the platform TradeLocker connection matching this sourceKey.
    const connections: any[] = await ctx.runQuery(platformConnections.listConnections, {
      provider: "tradelocker",
      limit: 200,
    });

    let matchedSecrets: Record<string, unknown> | null = null;
    for (const c of Array.isArray(connections) ? connections : []) {
      const secretsRes = await ctx.runQuery(platformConnections.getConnectionSecrets, {
        connectionId: c._id,
      });
      const secrets = secretsRes?.secrets ?? null;
      if (!secrets) continue;
      const connectionSourceKey = computeTradeLockerSourceKey({
        environment: secrets.environment === "live" ? "live" : "demo",
        jwtHost: secrets.jwtHost,
        server: secrets.server,
      });
      if (connectionSourceKey === sourceKey) {
        matchedSecrets = secrets;
        break;
      }
    }

    if (!matchedSecrets) {
      return { ok: false, error: `No platform TradeLocker connection found for sourceKey=${sourceKey}` };
    }

    const secretsKey = env.TRADELOCKER_SECRETS_KEY;
    const matched = matchedSecrets;
    const accessTokenEncrypted =
      typeof matched.accessTokenEncrypted === "string" ? matched.accessTokenEncrypted : "";
    const refreshTokenEncrypted =
      typeof matched.refreshTokenEncrypted === "string" ? matched.refreshTokenEncrypted : "";
    const accessToken =
      accessTokenEncrypted && secretsKey ? await decryptSecret(accessTokenEncrypted, secretsKey) : accessTokenEncrypted;
    const refreshToken =
      refreshTokenEncrypted && secretsKey ? await decryptSecret(refreshTokenEncrypted, secretsKey) : refreshTokenEncrypted;

    const environment = matched.environment === "live" ? ("live" as const) : ("demo" as const);
    const jwtHost = typeof matched.jwtHost === "string" ? matched.jwtHost : undefined;
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlForEnv(environment);
    const accNum = Number(matched.selectedAccNum ?? NaN);
    if (!Number.isFinite(accNum)) return { ok: false, error: "Platform connection missing selectedAccNum" };
    const accountId =
      typeof matched.selectedAccountId === "string" ? matched.selectedAccountId.trim() : "";
    if (!accountId) return { ok: false, error: "Platform connection missing selectedAccountId" };

    const developerKey = env.TRADELOCKER_DEVELOPER_API_KEY;

    // Cache-able infoRouteId resolution, stored in job.progress.
    const progress: any = job.progress ?? {};
    let infoRouteId = Number(progress.infoRouteId ?? NaN);

    if (!Number.isFinite(infoRouteId)) {
      const instrumentsRes = await ctx.runAction(pricedataTradeLocker.fetchInstruments, {
        baseUrl,
        accessToken,
        refreshToken,
        accNum,
        accountId,
        developerKey,
      });
      const instruments: any[] = Array.isArray(instrumentsRes?.instruments) ? instrumentsRes.instruments : [];
      const match =
        instruments.find((i) => String(i?.tradableInstrumentId ?? "") === tradableInstrumentId) ??
        instruments.find((i) => String(i?.symbol ?? "").trim().toUpperCase() === symbol);
      infoRouteId = Number(match?.infoRouteId ?? 1);

      await ctx.runMutation(internal.platform.priceDataJobsInternalMutations.updateJobProgress, {
        jobId: args.jobId,
        progress: { ...progress, infoRouteId },
      });
    }

    const tryResolutions = ["1", "1m"];
    let lastErr: string | undefined;
    let historyRes: { ok?: unknown; bars?: unknown } | null = null;
    for (const resolution of tryResolutions) {
      const r = await ctx.runAction(pricedataTradeLocker.fetchHistory, {
        baseUrl,
        accessToken,
        refreshToken,
        accNum,
        tradableInstrumentId,
        infoRouteId,
        resolution,
        fromMs: args.fromMs,
        toMs: args.toMs,
        developerKey,
      });
      if (r?.ok) {
        historyRes = r;
        break;
      }
      lastErr = String(r?.error ?? r?.textPreview ?? "TradeLocker history failed");
    }

    const history = historyRes;
    if (!history || history.ok !== true) {
      await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
        jobId: args.jobId,
        level: "error",
        message: "TradeLocker history failed",
        data: { lastErr },
      });
      return { ok: false, error: lastErr ?? "TradeLocker history failed" };
    }

    const bars: { t: number; o: number; h: number; l: number; c: number; v: number }[] = Array.isArray(
      history.bars,
    )
      ? (history.bars as { t: number; o: number; h: number; l: number; c: number; v: number }[])
      : [];

    // This workflow backfills *older* history. To keep the base table append-only (and avoid
    // duplicate 1m timestamps which would double-count in rollups), only insert rows that
    // are strictly older than the current min(ts) for this instrument.
    const minRes = await clickhouseSelect<{ rows: number; minTsMs: number }>(
      `SELECT
         count() AS rows,
         toUnixTimestamp64Milli(min(ts)) AS minTsMs
       FROM candles_1m
       WHERE sourceKey = {sourceKey:String}
         AND tradableInstrumentId = {tradableInstrumentId:String}`,
      [
        { name: "sourceKey", type: "String", value: sourceKey },
        { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
      ],
    );
    const existingMinTsMs =
      minRes.ok && Number(minRes.rows[0]?.rows ?? 0) > 0 && Number.isFinite(Number(minRes.rows[0]?.minTsMs ?? NaN))
        ? Number(minRes.rows[0]!.minTsMs)
        : undefined;

    const formatDateTime64Utc = (ms: number): string => {
      const d = new Date(ms);
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const pad3 = (n: number) => String(n).padStart(3, "0");
      return (
        `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}` +
        ` ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}.` +
        `${pad3(d.getUTCMilliseconds())}`
      );
    };

    const rows = bars
      .map((b) => {
        const t = Number(b.t);
        const o = Number(b.o);
        const h = Number(b.h);
        const l = Number(b.l);
        const c = Number(b.c);
        const v = Number.isFinite(Number(b.v)) ? Number(b.v) : 0;
        if (!Number.isFinite(t) || !Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) {
          return null;
        }
        if (typeof existingMinTsMs === "number" && Number.isFinite(existingMinTsMs) && t >= existingMinTsMs) {
          return null;
        }
        // Important: ClickHouse DateTime64 parsing is happiest with "YYYY-MM-DD HH:MM:SS.mmm" (UTC),
        // not ISO strings with "T" and "Z".
        const ts = formatDateTime64Utc(t);
        return {
          sourceKey,
          tradableInstrumentId,
          symbol,
          ts,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v,
        };
      })
      .filter((r): r is { sourceKey: string; tradableInstrumentId: string; symbol: string; ts: string; open: number; high: number; low: number; close: number; volume: number } => Boolean(r));

    if (rows.length === 0) {
      await sleepMs(400);
      await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
        jobId: args.jobId,
        level: "warn",
        message: "No bars returned for chunk",
        data: { fromMs: args.fromMs, toMs: args.toMs },
      });
      return { ok: true, insertedRows: 0, progress: { ...progress, insertedRowsDelta: 0 } };
    }

    const insertSql =
      `INSERT INTO candles_1m FORMAT JSONEachRow\n` + rows.map((r) => JSON.stringify(r)).join("\n");
    const insertRes = await clickhouseExec(insertSql, [], { timeoutMs: 120_000 });
    if (!insertRes.ok) {
      const more = insertRes.textPreview ? `\n${insertRes.textPreview}` : "";
      await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
        jobId: args.jobId,
        level: "error",
        message: "ClickHouse insert failed",
        data: { status: insertRes.status, textPreview: insertRes.textPreview },
      });
      return { ok: false, error: (insertRes.error ?? "ClickHouse insert failed") + more };
    }

    await sleepMs(400);

    await ctx.runMutation(internal.platform.priceDataLogsInternalMutations.appendLog, {
      jobId: args.jobId,
      level: "info",
      message: "Inserted bars",
      data: { insertedRows: rows.length, fromMs: args.fromMs, toMs: args.toMs },
    });

    return {
      ok: true,
      insertedRows: rows.length,
      progress: { ...progress, insertedRowsDelta: rows.length },
    };
  },
});

