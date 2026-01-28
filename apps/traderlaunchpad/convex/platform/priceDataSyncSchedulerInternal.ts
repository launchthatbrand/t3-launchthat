/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { env } from "../../src/env";
import { clickhouseSelect, clickhouseExec } from "../lib/clickhouseHttp";

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

type SelectedAccount = {
  policyId: any;
  accountRowId: string;
  connectionId: string;
  accountId: string;
  accNum: number;
  label?: string;
};

const selectAccountFromPool = (policies: any[], lastAccountRowIdUsed?: string): SelectedAccount | null => {
  const list = (Array.isArray(policies) ? policies : [])
    .filter((p) => Boolean(p?.enabledForPriceData))
    .map((p) => ({
      policyId: p._id,
      accountRowId: String(p.accountRowId ?? ""),
      connectionId: String(p.connectionId ?? ""),
      accountId: String(p.accountId ?? ""),
      accNum: Number(p.accNum ?? NaN),
      label: typeof p.label === "string" ? p.label : undefined,
      lastUsedAt: Number(p.lastUsedAt ?? 0),
    }))
    .filter((p) => p.accountRowId && p.connectionId && p.accountId && Number.isFinite(p.accNum));

  if (list.length === 0) return null;

  // Round-robin-ish: if we have a lastUsed account, pick the next after it; otherwise pick least-recently-used.
  if (lastAccountRowIdUsed) {
    const idx = list.findIndex((p) => p.accountRowId === lastAccountRowIdUsed);
    if (idx >= 0 && list.length > 1) {
      const next = list[(idx + 1) % list.length]!;
      return next;
    }
  }

  list.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
  return list[0]!;
};

export const runDuePriceDataSyncRules = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    processed: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const nowMs = Date.now();
    await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.upsertSchedulerState, {
      lastTickAt: nowMs,
      lastTickError: undefined,
      processedRulesLastTick: 0,
    });

    const limit = Math.max(1, Math.min(50, Number(args.limit ?? 20)));
    let processed = 0;

    try {
      const dueRules: any[] = await ctx.runQuery(internal.platform.priceDataSyncInternalQueries.listDueSyncRules, {
        nowMs,
        limit,
      });

      for (const rule of Array.isArray(dueRules) ? dueRules : []) {
        const ruleId = rule._id;
        const sourceKey = String(rule.sourceKey ?? "").trim().toLowerCase();
        const tradableInstrumentId = String(rule.tradableInstrumentId ?? "").trim();
        const symbol = String(rule.symbol ?? "").trim().toUpperCase();
        const cadenceSeconds = Number(rule.cadenceSeconds ?? 60);
        const overlapSeconds = Number(rule.overlapSeconds ?? 60);
        const lastAccountRowIdUsed = typeof rule.lastAccountRowIdUsed === "string" ? rule.lastAccountRowIdUsed : undefined;
        let infoRouteId = Number(rule.infoRouteId ?? NaN);

        if (!sourceKey || !tradableInstrumentId || !symbol) {
          continue;
        }

        processed += 1;
        await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleAttempt, {
          ruleId,
          nowMs,
        });

        // Pick an enabled platform account from the pool for this sourceKey.
        const policies: any[] = await ctx.runQuery(
          internal.platform.priceDataSyncInternalQueries.listEnabledAccountPoliciesForSourceKey,
          { sourceKey, limit: 50 },
        );
        const selected = selectAccountFromPool(policies, lastAccountRowIdUsed);
        if (!selected) {
          const nextRunAt = nowMs + Math.max(10_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: `No enabled platform accounts for sourceKey=${sourceKey}`,
            lastAccountRowIdUsed,
          });
          continue;
        }

        // Resolve connection secrets for selected account's connection.
        const secretsRes: any = await ctx.runQuery(platformConnections.getConnectionSecrets, {
          connectionId: (selected.connectionId as unknown) as any,
        });
        const secrets = secretsRes?.secrets ?? null;
        if (!secrets) {
          const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: "Missing connection secrets for selected account",
            lastAccountRowIdUsed: selected.accountRowId,
          });
          continue;
        }

        const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE;
        const secretsKey = env.TRADELOCKER_SECRETS_KEY;
        const accessTokenEncrypted = String(secrets.accessTokenEncrypted ?? "");
        const refreshTokenEncrypted = String(secrets.refreshTokenEncrypted ?? "");
        let accessToken = accessTokenEncrypted;
        let refreshToken = refreshTokenEncrypted;
        if (tokenStorage === "enc") {
          if (!secretsKey) throw new Error("Missing TRADELOCKER_SECRETS_KEY for encrypted token storage");
          accessToken = await decryptSecret(accessTokenEncrypted, secretsKey);
          refreshToken = await decryptSecret(refreshTokenEncrypted, secretsKey);
        }

        const environment = secrets.environment === "live" ? ("live" as const) : ("demo" as const);
        const jwtHost = typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined;
        const server = String(secrets.server ?? "");
        const connectionSourceKey = computeTradeLockerSourceKey({ environment, jwtHost, server });
        if (connectionSourceKey !== sourceKey) {
          const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: `Selected account connection sourceKey mismatch (${connectionSourceKey})`,
            lastAccountRowIdUsed: selected.accountRowId,
          });
          continue;
        }

        const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlForEnv(environment);
        const developerKey = env.TRADELOCKER_DEVELOPER_API_KEY;

        // Determine current max(ts) from ClickHouse.
        const maxRes = await clickhouseSelect<{ maxTsMs: number }>(
          `SELECT toUnixTimestamp64Milli(max(ts)) AS maxTsMs
           FROM candles_1m
           WHERE sourceKey = {sourceKey:String}
             AND tradableInstrumentId = {tradableInstrumentId:String}`,
          [
            { name: "sourceKey", type: "String", value: sourceKey },
            { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
          ],
        );
        if (!maxRes.ok) {
          const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: maxRes.error ?? "ClickHouse max(ts) query failed",
            lastAccountRowIdUsed: selected.accountRowId,
          });
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.touchPolicyUsed, {
            policyId: selected.policyId,
            nowMs,
            error: maxRes.error ?? "ClickHouse query failed",
          });
          continue;
        }

        const maxTsMs = Number(maxRes.rows[0]?.maxTsMs ?? NaN);
        const lastSeenMaxTsMs = Number.isFinite(maxTsMs) ? maxTsMs : undefined;

        // Align to last closed minute boundary (UTC).
        const minuteMs = 60_000;
        const toMs = Math.floor(nowMs / minuteMs) * minuteMs;
        const fromMsRaw = Number.isFinite(maxTsMs) ? maxTsMs - overlapSeconds * 1000 : toMs - 60 * minuteMs;
        const fromMs = Math.max(0, Math.min(fromMsRaw, toMs));

        // Resolve infoRouteId if missing.
        if (!Number.isFinite(infoRouteId)) {
          const instrumentsRes = await ctx.runAction(pricedataTradeLocker.fetchInstruments, {
            baseUrl,
            accessToken,
            refreshToken,
            accNum: selected.accNum,
            accountId: selected.accountId,
            developerKey,
          });
          const instruments: any[] = Array.isArray(instrumentsRes?.instruments) ? instrumentsRes.instruments : [];
          const match =
            instruments.find((i) => String(i?.tradableInstrumentId ?? "") === tradableInstrumentId) ??
            instruments.find((i) => String(i?.symbol ?? "").trim().toUpperCase() === symbol);
          infoRouteId = Number(match?.infoRouteId ?? NaN);
        }

        if (!Number.isFinite(infoRouteId)) {
          const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: "Unable to resolve infoRouteId for instrument",
            lastAccountRowIdUsed: selected.accountRowId,
          });
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.touchPolicyUsed, {
            policyId: selected.policyId,
            nowMs,
            error: "infoRouteId resolution failed",
          });
          continue;
        }

        // Fetch bars. Use TradeLocker refresh-on-401 built into pricedata action.
        const historyRes = await ctx.runAction(pricedataTradeLocker.fetchHistory, {
          baseUrl,
          accessToken,
          refreshToken,
          accNum: selected.accNum,
          tradableInstrumentId,
          infoRouteId,
          resolution: "1m",
          fromMs,
          toMs,
          developerKey,
        });

        if (!historyRes?.ok) {
          const err = String(historyRes?.error ?? historyRes?.textPreview ?? "TradeLocker history failed");
          const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
            ruleId,
            nowMs,
            nextRunAt,
            error: err,
            lastAccountRowIdUsed: selected.accountRowId,
          });
          await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.touchPolicyUsed, {
            policyId: selected.policyId,
            nowMs,
            error: err,
          });
          await sleepMs(350);
          continue;
        }

        const bars: { t: number; o: number; h: number; l: number; c: number; v: number }[] = Array.isArray(
          historyRes?.bars,
        )
          ? (historyRes.bars as { t: number; o: number; h: number; l: number; c: number; v: number }[])
          : [];

        // Filter to strictly-newer bars to avoid duplicates, and to closed bars only (< toMs).
        const filtered = bars
          .map((b) => ({
            t: Number(b.t),
            o: Number(b.o),
            h: Number(b.h),
            l: Number(b.l),
            c: Number(b.c),
            v: Number.isFinite(Number(b.v)) ? Number(b.v) : 0,
          }))
          .filter(
            (b) =>
              Number.isFinite(b.t) &&
              Number.isFinite(b.o) &&
              Number.isFinite(b.h) &&
              Number.isFinite(b.l) &&
              Number.isFinite(b.c) &&
              Number.isFinite(b.v) &&
              b.t < toMs &&
              (!Number.isFinite(maxTsMs) || b.t > maxTsMs),
          )
          .map((b) => ({
            sourceKey,
            tradableInstrumentId,
            symbol,
            ts: formatDateTime64Utc(b.t),
            open: b.o,
            high: b.h,
            low: b.l,
            close: b.c,
            volume: b.v,
          }));

        if (filtered.length > 0) {
          const insertSql =
            `INSERT INTO candles_1m FORMAT JSONEachRow\n` + filtered.map((r) => JSON.stringify(r)).join("\n");
          const insertRes = await clickhouseExec(insertSql, [], { timeoutMs: 120_000 });
          if (!insertRes.ok) {
            const err = (insertRes.error ?? "ClickHouse insert failed") +
              (insertRes.textPreview ? `\n${insertRes.textPreview}` : "");
            const nextRunAt = nowMs + Math.max(30_000, cadenceSeconds * 1000);
            await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleError, {
              ruleId,
              nowMs,
              nextRunAt,
              error: err,
              lastAccountRowIdUsed: selected.accountRowId,
            });
            await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.touchPolicyUsed, {
              policyId: selected.policyId,
              nowMs,
              error: insertRes.error ?? "ClickHouse insert failed",
            });
            await sleepMs(350);
            continue;
          }
        }

        const nextRunAt = nowMs + clampCadence(cadenceSeconds) * 1000;
        const newMax = filtered.length > 0 ? Math.max(...filtered.map((r) => Date.parse(r.ts))) : lastSeenMaxTsMs;

        await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.markRuleSuccess, {
          ruleId,
          nowMs,
          nextRunAt,
          lastSeenMaxTsMs: Number.isFinite(newMax ?? NaN) ? Number(newMax) : lastSeenMaxTsMs,
          lastAccountRowIdUsed: selected.accountRowId,
          infoRouteId: Number.isFinite(infoRouteId) ? infoRouteId : undefined,
        });

        await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.touchPolicyUsed, {
          policyId: selected.policyId,
          nowMs,
        });

        await sleepMs(350);
      }

      await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.upsertSchedulerState, {
        lastTickOkAt: nowMs,
        processedRulesLastTick: processed,
        lastTickError: undefined,
      });

      return { ok: true, processed };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await ctx.runMutation(internal.platform.priceDataSyncInternalMutations.upsertSchedulerState, {
        lastTickError: msg,
        processedRulesLastTick: processed,
      });
      return { ok: false, processed, error: msg };
    }
  },
});

const clampCadence = (raw: number): number => {
  if (!Number.isFinite(raw)) return 60;
  return Math.max(10, Math.min(60 * 60, Math.floor(raw)));
};

