/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
"use node";

import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

import { action } from "../_generated/server";
import { env } from "../../src/env";
/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/
import { v } from "convex/values";

// IMPORTANT: Avoid importing the typed Convex `api`/`components` here — it can trigger TS
// "type instantiation is excessively deep". Pull via require() to keep it `any`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("../_generated/api").internal;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiUntyped: any = require("../_generated/api").api;

const traderlaunchpadConnectionsMutations =
  componentsUntyped.launchthat_traderlaunchpad.connections.mutations;
const traderlaunchpadDraftMutations =
  componentsUntyped.launchthat_traderlaunchpad.connections.drafts;
const traderlaunchpadJournalMutations =
  componentsUntyped.launchthat_traderlaunchpad.journal.mutations;
const traderlaunchpadConnectionsQueries =
  componentsUntyped.launchthat_traderlaunchpad.connections.queries;
const traderlaunchpadConnectionsInternal =
  componentsUntyped.launchthat_traderlaunchpad.connections.internalQueries;

const traderlaunchpadPlatformConnections =
  componentsUntyped.launchthat_traderlaunchpad.connections.platform;

const requireClickhouseComponentConfig = () => {
  const url = process.env.CLICKHOUSE_HTTP_URL;
  const database = process.env.CLICKHOUSE_DB ?? "traderlaunchpad";
  const user = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;
  if (!url) throw new Error("Missing CLICKHOUSE_HTTP_URL");
  if (!user) throw new Error("Missing CLICKHOUSE_USER");
  if (!password) throw new Error("Missing CLICKHOUSE_PASSWORD");
  return { url, database, user, password };
};

const textEncoder = new TextEncoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

const base64Encode = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");

const base64UrlDecode = (input: string): string => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const b64 = `${padded}${"=".repeat(padLength)}`;
  return Buffer.from(b64, "base64").toString("utf8");
};

const extractJwtHost = (token: string): string | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1] ?? "")) as {
      host?: string;
    };
    return typeof payload.host === "string" && payload.host.trim()
      ? payload.host.trim()
      : null;
  } catch {
    return null;
  }
};

const deriveAesKey = async (keyMaterial: string): Promise<CryptoKey> => {
  const keyBytes = await crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(textEncoder.encode(keyMaterial)),
  );
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
};

const encryptSecret = async (
  plaintext: string,
  keyMaterial: string,
): Promise<string> => {
  const key = await deriveAesKey(keyMaterial);
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const iv = toArrayBuffer(ivBytes);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      toArrayBuffer(textEncoder.encode(plaintext)),
    ),
  );
  const tag = ciphertext.slice(ciphertext.length - 16);
  const data = ciphertext.slice(0, ciphertext.length - 16);
  const payload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: base64Encode(ivBytes),
    tagB64: base64Encode(tag),
    dataB64: base64Encode(data),
  };
  const encoded = base64Encode(textEncoder.encode(JSON.stringify(payload)));
  return `enc_v1:${encoded}`;
};

const requireTradeLockerSecretsKey = (override?: string): string => {
  const key = override?.trim() || env.TRADELOCKER_SECRETS_KEY;
  if (!key) {
    throw new Error("Missing TRADELOCKER_SECRETS_KEY");
  }
  return key;
};

const decryptSecret = async (
  encrypted: string,
  keyMaterial: string,
): Promise<string> => {
  const trimmed = String(encrypted ?? "");
  if (!trimmed) return "";
  if (!trimmed.startsWith("enc_v1:")) return trimmed;
  const b64 = trimmed.slice("enc_v1:".length);
  const decoded = Buffer.from(b64, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as {
    ivB64: string;
    tagB64: string;
    dataB64: string;
  };

  const key = await deriveAesKey(keyMaterial);
  const iv = Buffer.from(payload.ivB64, "base64");
  const tag = Buffer.from(payload.tagB64, "base64");
  const data = Buffer.from(payload.dataB64, "base64");
  const combined = Buffer.concat([data, tag]);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(new Uint8Array(iv)) },
    key,
    toArrayBuffer(new Uint8Array(combined)),
  );
  return Buffer.from(new Uint8Array(plaintext)).toString("utf8");
};

const baseUrlForEnv = (env: "demo" | "live"): string => {
  return `https://${env}.tradelocker.com/backend-api`;
};

const developerKeyHeader = () => {
  const key = env.TRADELOCKER_DEVELOPER_API_KEY;
  if (!key) return {};
  // TradeLocker Public API docs refer to this header for developer program access/rate limits.
  return { "tl-developer-api-key": key } as Record<string, string>;
};

interface JwtTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiration?: number;
  refreshTokenExpiration?: number;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  expiresIn?: number;
}

export const startTradeLockerConnect = action({
  args: {
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    email: v.string(),
    password: v.string(),
    // DEV-ONLY: allow returning raw tokens to the caller for debugging/copying.
    // This is intentionally gated in the handler (never returned in production).
    debugReturnTokens: v.optional(v.boolean()),
  },
  returns: v.object({
    // NOTE: this id belongs to the *component* table `brokerConnectDrafts`,
    // so it must be treated as an opaque string at the app boundary.
    draftId: v.string(),
    accounts: v.array(v.any()),
    debugTokens: v.optional(
      v.object({
        accessToken: v.string(),
        refreshToken: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const server = args.server.trim();
    const email = args.email.trim();
    const password = args.password;
    if (!server || !email || !password) {
      throw new Error("Missing email/password/server");
    }

    const baseUrl = baseUrlForEnv(args.environment);
    const res = await fetch(`${baseUrl}/auth/jwt/token`, {
      method: "POST",
      headers: { "content-type": "application/json", ...developerKeyHeader() },
      body: JSON.stringify({ email, password, server }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `TradeLocker auth failed (${res.status}): ${text || "request failed"}`,
      );
    }

    const json = (await res.json()) as JwtTokenResponse;
    const accessToken =
      typeof json.accessToken === "string" ? json.accessToken : "";
    const refreshToken =
      typeof json.refreshToken === "string" ? json.refreshToken : "";
    if (!accessToken || !refreshToken) {
      throw new Error("TradeLocker auth response missing tokens");
    }

    const accessTokenExpiresAt =
      typeof json.accessTokenExpiresAt === "number"
        ? json.accessTokenExpiresAt
        : typeof json.accessTokenExpiration === "number"
          ? json.accessTokenExpiration
          : undefined;
    const refreshTokenExpiresAt =
      typeof json.refreshTokenExpiresAt === "number"
        ? json.refreshTokenExpiresAt
        : typeof json.refreshTokenExpiration === "number"
          ? json.refreshTokenExpiration
          : undefined;

    const jwtHost = extractJwtHost(accessToken);
    const baseUrlResolved = jwtHost
      ? `https://${jwtHost}/backend-api`
      : baseUrl;

    const allAccountsRes = await fetch(
      `${baseUrlResolved}/auth/jwt/all-accounts`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}`, ...developerKeyHeader() },
      },
    );
    if (!allAccountsRes.ok) {
      const text = await allAccountsRes.text().catch(() => "");
      throw new Error(
        `TradeLocker all-accounts failed (${allAccountsRes.status}): ${text || "request failed"}`,
      );
    }
    const accountsJson: any = await allAccountsRes.json();
    const accounts = Array.isArray(accountsJson)
      ? accountsJson
      : Array.isArray(accountsJson?.accounts)
        ? accountsJson.accounts
        : [];

    const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = env.TRADELOCKER_SECRETS_KEY;

    let accessTokenEncrypted: string;
    let refreshTokenEncrypted: string;
    if (tokenStorage === "enc") {
      if (!secretsKey) {
        throw new Error(
          "TRADELOCKER_SECRETS_KEY is required when TRADELOCKER_TOKEN_STORAGE=enc",
        );
      }
      accessTokenEncrypted = await encryptSecret(accessToken, secretsKey);
      refreshTokenEncrypted = await encryptSecret(refreshToken, secretsKey);
    } else {
      accessTokenEncrypted = accessToken;
      refreshTokenEncrypted = refreshToken;
    }

    const draftId = await ctx.runMutation(
      traderlaunchpadDraftMutations.createConnectDraft,
      {
        organizationId,
        userId,
        environment: args.environment,
        server,
        jwtHost,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        expiresAt: Date.now() + 10 * 60 * 1000,
      },
    );

    const isDev = process.env.NODE_ENV !== "production";
    const debugTokens =
      isDev && args.debugReturnTokens
        ? { accessToken, refreshToken }
        : undefined;

    return { draftId, accounts, debugTokens };
  },
});

export const connectTradeLocker = action({
  args: {
    // NOTE: this id belongs to the *component* table `brokerConnectDrafts`,
    // so it must be treated as an opaque string at the app boundary.
    draftId: v.string(),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
    selectedAccountName: v.optional(v.string()),
    selectedAccountCurrency: v.optional(v.string()),
    selectedAccountStatus: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const accountId = args.selectedAccountId.trim();
    if (!accountId) {
      throw new Error("Missing selectedAccountId");
    }
    const accNum = Number(args.selectedAccNum);
    if (!Number.isFinite(accNum) || accNum <= 0) {
      throw new Error("Invalid selectedAccNum");
    }

    const consumed: any = await ctx.runMutation(
      traderlaunchpadDraftMutations.consumeConnectDraft,
      {
        draftId: args.draftId as any,
        organizationId,
        userId,
      },
    );
    if (!consumed) {
      throw new Error("Connect session expired. Please try again.");
    }

    const connectionId = await ctx.runMutation(
      traderlaunchpadConnectionsMutations.upsertConnection,
      {
        organizationId,
        userId,
        environment: consumed.environment === "live" ? "live" : "demo",
        server: String(consumed.server ?? ""),
        jwtHost: typeof consumed.jwtHost === "string" ? consumed.jwtHost : undefined,
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        accessTokenEncrypted: String(consumed.accessTokenEncrypted ?? ""),
        refreshTokenEncrypted: String(consumed.refreshTokenEncrypted ?? ""),
        accessTokenExpiresAt: consumed.accessTokenExpiresAt,
        refreshTokenExpiresAt: consumed.refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      },
    );

    // Add/update account row for this connection
    const accountRowId = await ctx.runMutation(traderlaunchpadConnectionsMutations.upsertConnectionAccount, {
      organizationId,
      userId,
      connectionId,
      accountId,
      accNum,
      name: args.selectedAccountName,
      currency: args.selectedAccountCurrency,
      status: args.selectedAccountStatus,
    } as any);

    // Best-effort: fetch /trade/config for this account and cache customerAccess flags.
    try {
      const cfg = await ctx.runAction(
        componentsUntyped.launchthat_traderlaunchpad.sync.probeTradeConfigForAccNum,
        {
          organizationId,
          userId,
          accNum,
          secretsKey: env.TRADELOCKER_SECRETS_KEY,
          tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
        },
      );

      const customerAccessRaw =
        cfg?.json?.d && typeof cfg.json.d === "object"
          ? (cfg.json.d as any).customerAccess
          : undefined;

      const customerAccess =
        customerAccessRaw && typeof customerAccessRaw === "object"
          ? {
            orders: Boolean((customerAccessRaw as any).orders),
            ordersHistory: Boolean((customerAccessRaw as any).ordersHistory),
            filledOrders: Boolean((customerAccessRaw as any).filledOrders),
            positions: Boolean((customerAccessRaw as any).positions),
            symbolInfo: Boolean((customerAccessRaw as any).symbolInfo),
            marketDepth: Boolean((customerAccessRaw as any).marketDepth),
          }
          : undefined;

      await ctx.runMutation(traderlaunchpadConnectionsMutations.updateConnectionAccountDebug, {
        organizationId,
        userId,
        accountRowId,
        lastConfigOk: Boolean(cfg?.ok),
        customerAccess,
        lastConfigError: typeof cfg?.error === "string" ? cfg.error : undefined,
        lastConfigRaw: cfg?.json,
      } as any);
    } catch {
      // ignore debug cache errors
    }

    return { ok: true };
  },
});

export const refreshMyTradeLockerAccountConfig = action({
  args: {
    accountRowId: v.string(),
    accNum: v.number(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const cfg = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeTradeConfigForAccNum,
      {
        organizationId,
        userId,
        accNum: args.accNum,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );

    const customerAccessRaw =
      cfg?.json?.d && typeof cfg.json.d === "object"
        ? (cfg.json.d as any).customerAccess
        : undefined;

    const customerAccess =
      customerAccessRaw && typeof customerAccessRaw === "object"
        ? {
          orders: Boolean((customerAccessRaw as any).orders),
          ordersHistory: Boolean((customerAccessRaw as any).ordersHistory),
          filledOrders: Boolean((customerAccessRaw as any).filledOrders),
          positions: Boolean((customerAccessRaw as any).positions),
          symbolInfo: Boolean((customerAccessRaw as any).symbolInfo),
          marketDepth: Boolean((customerAccessRaw as any).marketDepth),
        }
        : undefined;

    await ctx.runMutation(traderlaunchpadConnectionsMutations.updateConnectionAccountDebug, {
      organizationId,
      userId,
      accountRowId: args.accountRowId as any,
      lastConfigOk: Boolean(cfg?.ok),
      customerAccess,
      lastConfigError: typeof cfg?.error === "string" ? cfg.error : undefined,
      lastConfigRaw: cfg?.json,
    } as any);

    return { ok: true };
  },
});

export const disconnectTradeLocker = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    await ctx.runMutation(
      traderlaunchpadConnectionsMutations.deleteConnection,
      {
        organizationId,
        userId,
      },
    );

    return { ok: true };
  },
});

export const syncMyTradeLockerNow = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    result: v.any(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync
        .syncTradeLockerConnection,
      {
        organizationId,
        userId,
        limit: 500,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );

    // Post-sync: backfill symbols using pricedata mapping (tradableInstrumentId -> symbol).
    // TradeLocker executions often omit `symbol`, but we already have a full mapping in `priceInstruments`.
    let symbolBackfill: any = null;
    try {
      // Prefer sourceKey derived from the user's active TradeLocker connection (matches the data we just synced).
      // Fall back to pricedata's default source if needed.
      const connection = await ctx.runQuery(traderlaunchpadConnectionsQueries.getMyConnection, {
        organizationId,
        userId,
      });
      const environment =
        connection?.environment === "live" ? ("live" as const) : ("demo" as const);
      const jwtHost =
        typeof connection?.jwtHost === "string" && connection.jwtHost.trim()
          ? connection.jwtHost.trim()
          : undefined;
      const baseUrlHost = jwtHost ?? `${environment}.tradelocker.com`;
      const server =
        typeof connection?.server === "string" && connection.server.trim()
          ? connection.server.trim()
          : "unknown";
      const connectionSourceKey = `tradelocker:${environment}:${baseUrlHost}:${server}`
        .toLowerCase()
        .trim();

      const defaultSource = await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
        {},
      );
      const defaultSourceKey =
        typeof defaultSource?.sourceKey === "string" ? String(defaultSource.sourceKey) : "";

      const sourceKey = connectionSourceKey || defaultSourceKey;
      if (sourceKey) {
        const missingInstrumentIds = await ctx.runQuery(
          componentsUntyped.launchthat_traderlaunchpad.raw.queries
            .listInstrumentIdsMissingExecutionSymbols,
          { organizationId, userId, limit: 200, scanCap: 2000 },
        );
        const ids = Array.isArray(missingInstrumentIds) ? missingInstrumentIds : [];
        if (ids.length > 0) {
          // First attempt: map using the derived sourceKey.
          const mappedPrimary = await ctx.runQuery(
            componentsUntyped.launchthat_pricedata.instruments.queries
              .listInstrumentsByTradableInstrumentIds,
            { sourceKey, tradableInstrumentIds: ids },
          );

          let instrumentSymbols = Array.isArray(mappedPrimary)
            ? mappedPrimary
              .map((r: any) => ({
                instrumentId:
                  typeof r?.tradableInstrumentId === "string"
                    ? String(r.tradableInstrumentId)
                    : "",
                symbol: typeof r?.symbol === "string" ? String(r.symbol) : "",
              }))
              .filter((r) => r.instrumentId && r.symbol)
            : [];

          // Fallback: if the derived key isn't populated, try the pricedata default key too.
          if (instrumentSymbols.length === 0 && defaultSourceKey && defaultSourceKey !== sourceKey) {
            const mappedFallback = await ctx.runQuery(
              componentsUntyped.launchthat_pricedata.instruments.queries
                .listInstrumentsByTradableInstrumentIds,
              { sourceKey: defaultSourceKey, tradableInstrumentIds: ids },
            );
            instrumentSymbols = Array.isArray(mappedFallback)
              ? mappedFallback
                .map((r: any) => ({
                  instrumentId:
                    typeof r?.tradableInstrumentId === "string"
                      ? String(r.tradableInstrumentId)
                      : "",
                  symbol: typeof r?.symbol === "string" ? String(r.symbol) : "",
                }))
                .filter((r) => r.instrumentId && r.symbol)
              : [];
          }

          // Final fallback: if we still have no mappings, try other known sources (any env/server).
          if (instrumentSymbols.length === 0) {
            const sources = await ctx.runQuery(
              componentsUntyped.launchthat_pricedata.sources.queries.listSources,
              { limit: 25 },
            );
            const sourceKeys = Array.isArray(sources)
              ? sources
                .map((s: any) => (typeof s?.sourceKey === "string" ? String(s.sourceKey) : ""))
                .filter(Boolean)
              : [];
            for (const k of sourceKeys) {
              if (k === sourceKey || k === defaultSourceKey) continue;
              const mappedAny = await ctx.runQuery(
                componentsUntyped.launchthat_pricedata.instruments.queries
                  .listInstrumentsByTradableInstrumentIds,
                { sourceKey: k, tradableInstrumentIds: ids },
              );
              const next = Array.isArray(mappedAny)
                ? mappedAny
                  .map((r: any) => ({
                    instrumentId:
                      typeof r?.tradableInstrumentId === "string"
                        ? String(r.tradableInstrumentId)
                        : "",
                    symbol: typeof r?.symbol === "string" ? String(r.symbol) : "",
                  }))
                  .filter((r) => r.instrumentId && r.symbol)
                : [];
              if (next.length > 0) {
                instrumentSymbols = next;
                break;
              }
            }
          }

          const backfill = await ctx.runMutation(
            componentsUntyped.launchthat_traderlaunchpad.raw.mutations
              .backfillSymbolsForUser,
            { organizationId, userId, instrumentSymbols, perInstrumentCap: 500 },
          );
          symbolBackfill = {
            connectionSourceKey,
            defaultSourceKey,
            chosenSourceKey: sourceKey,
            ids: ids.length,
            mapped: instrumentSymbols.length,
            backfill,
          };
        }
      }
    } catch (err) {
      // Non-fatal: sync result should still return even if backfill fails.
      console.log("[syncMyTradeLockerNow] symbol backfill skipped/failed", String(err));
    }

    // Post-sync: ensure thesis-level TradeIdeas exist by (re)backfilling assignment.
    // This is idempotent and guarantees `/admin/tradeideas` has rows even if inline assignment
    // inside the rebuild mutation fails for any reason.
    let ideasBackfill: any = null;
    try {
      ideasBackfill = await ctx.runMutation(
        componentsUntyped.launchthat_traderlaunchpad.tradeIdeas.ideas.backfillIdeasForUser as any,
        { organizationId, userId, scanCap: 2000, limitAssigned: 2000 },
      );
    } catch (err) {
      console.log("[syncMyTradeLockerNow] ideas backfill skipped/failed", String(err));
    }

    // Post-sync: reconcile idea symbols to group symbols (fixes legacy numeric symbols).
    let ideasReconcile: any = null;
    try {
      ideasReconcile = await ctx.runMutation(
        componentsUntyped.launchthat_traderlaunchpad.tradeIdeas.ideas.reconcileIdeasForUser as any,
        { organizationId, userId, scanCap: 1000 },
      );
    } catch (err) {
      console.log("[syncMyTradeLockerNow] ideas reconcile skipped/failed", String(err));
    }

    return {
      ok: true,
      result: {
        ...result,
        symbolBackfill,
        ideasBackfill,
        ideasReconcile,
      },
    };
  },
});

export const getMyTradeLockerInstrumentDetails = action({
  args: {
    instrumentId: v.string(),
  },
  returns: v.union(
    v.object({
      instrumentId: v.string(),
      symbol: v.optional(v.string()),
      raw: v.any(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.getInstrumentDetails,
      {
        organizationId,
        userId,
        instrumentId: args.instrumentId,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerHistoryForEurUsd = action({
  args: {
    resolution: v.optional(v.string()), // e.g. "1H", "4H", "15m"
    lookbackDays: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeHistoryForSymbol,
      {
        organizationId,
        userId,
        symbol: "EURUSD",
        resolution: args.resolution,
        lookbackDays: args.lookbackDays,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerConfig = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeTradeConfig,
      {
        organizationId,
        userId,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerInstruments = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeInstrumentsForSelectedAccount,
      {
        organizationId,
        userId,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerAllAccounts = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeAllAccountsForUser,
      {
        organizationId,
        userId,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerTradeEndpointForAccountRow = action({
  args: {
    accountRowId: v.string(),
    endpoint: v.union(
      v.literal("state"),
      v.literal("positions"),
      v.literal("orders"),
      v.literal("ordersHistory"),
      v.literal("filledOrders"),
      v.literal("executions"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.getMyConnection,
      { organizationId, userId },
    );
    if (!connection) {
      return { ok: false, error: "No TradeLocker connection found." };
    }

    const accounts = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.listMyConnectionAccounts,
      {
        organizationId,
        userId,
        connectionId: (connection as any)._id,
      } as any,
    );
    const list = Array.isArray(accounts) ? accounts : [];
    const row =
      list.find((a: any) => String(a?._id ?? "") === args.accountRowId) ?? null;
    if (!row) {
      return { ok: false, error: "Account row not found." };
    }

    const accountId = String((row as any).accountId ?? "").trim();
    const accNum = Number((row as any).accNum ?? 0);
    if (!accountId || !Number.isFinite(accNum) || accNum <= 0) {
      return { ok: false, error: "Invalid account identifiers." };
    }

    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeTradeEndpointForAccount,
      {
        organizationId,
        userId,
        accountId,
        accNum,
        endpoint: args.endpoint,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerBackendPathForAccountRow = action({
  args: {
    accountRowId: v.string(),
    path: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.getMyConnection,
      { organizationId, userId },
    );
    if (!connection) {
      return { ok: false, error: "No TradeLocker connection found." };
    }

    const accounts = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.listMyConnectionAccounts,
      {
        organizationId,
        userId,
        connectionId: (connection as any)._id,
      } as any,
    );
    const list = Array.isArray(accounts) ? accounts : [];
    const row =
      list.find((a: any) => String(a?._id ?? "") === args.accountRowId) ?? null;
    if (!row) {
      return { ok: false, error: "Account row not found." };
    }

    const accountId = String((row as any).accountId ?? "").trim();
    const accNum = Number((row as any).accNum ?? 0);
    if (!accountId || !Number.isFinite(accNum) || accNum <= 0) {
      return { ok: false, error: "Invalid account identifiers." };
    }

    const path = String(args.path ?? "").replaceAll("{accNum}", String(accNum));

    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeBackendPathForAccount,
      {
        organizationId,
        userId,
        accountId,
        accNum,
        path,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerHistoryForInstrumentForAccountRow = action({
  args: {
    accountRowId: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
    routeId: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.getMyConnection,
      { organizationId, userId },
    );
    if (!connection) {
      return { ok: false, error: "No TradeLocker connection found." };
    }

    const accounts = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.listMyConnectionAccounts,
      {
        organizationId,
        userId,
        connectionId: (connection as any)._id,
      } as any,
    );
    const list = Array.isArray(accounts) ? accounts : [];
    const row =
      list.find((a: any) => String(a?._id ?? "") === args.accountRowId) ?? null;
    if (!row) {
      return { ok: false, error: "Account row not found." };
    }

    const accountId = String((row as any).accountId ?? "").trim();
    const accNum = Number((row as any).accNum ?? 0);
    if (!accountId || !Number.isFinite(accNum) || accNum <= 0) {
      return { ok: false, error: "Invalid account identifiers." };
    }

    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync
        .probeHistoryForInstrumentForAccount,
      {
        organizationId,
        userId,
        accountId,
        accNum,
        tradableInstrumentId: args.tradableInstrumentId,
        routeId: args.routeId,
        resolution: args.resolution,
        lookbackDays: args.lookbackDays,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerConfigForAccountRow = action({
  args: {
    accountRowId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.getMyConnection,
      { organizationId, userId },
    );
    if (!connection) {
      return { ok: false, error: "No TradeLocker connection found." };
    }

    const accounts = await ctx.runQuery(
      traderlaunchpadConnectionsQueries.listMyConnectionAccounts,
      {
        organizationId,
        userId,
        connectionId: (connection as any)._id,
      } as any,
    );
    const list = Array.isArray(accounts) ? accounts : [];
    const row =
      list.find((a: any) => String(a?._id ?? "") === args.accountRowId) ?? null;
    if (!row) {
      return { ok: false, error: "Account row not found." };
    }

    const accNum = Number((row as any).accNum ?? 0);
    if (!Number.isFinite(accNum) || accNum <= 0) {
      return { ok: false, error: "Invalid accNum." };
    }

    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeTradeConfigForAccNum,
      {
        organizationId,
        userId,
        accNum,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerInstrumentsCandidates = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeInstrumentsForAllAccounts,
      {
        organizationId,
        userId,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const probeMyTradeLockerHistoryForInstrument = action({
  args: {
    tradableInstrumentId: v.string(),
    routeId: v.optional(v.number()),
    resolution: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const result = await ctx.runAction(
      componentsUntyped.launchthat_traderlaunchpad.sync.probeHistoryForInstrument,
      {
        organizationId,
        userId,
        tradableInstrumentId: args.tradableInstrumentId,
        routeId: args.routeId,
        resolution: args.resolution,
        lookbackDays: args.lookbackDays,
        secretsKey: env.TRADELOCKER_SECRETS_KEY,
        tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
      },
    );
    return result;
  },
});

export const getMyDefaultPriceDataSource = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const source = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
      {},
    );
    return source;
  },
});

export const setDefaultPriceDataSourceFromMyTradeLocker = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    sourceKey: v.string(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(traderlaunchpadConnectionsQueries.getMyConnection, {
      organizationId,
      userId,
    });
    if (!connection || connection.status !== "connected") {
      throw new Error("TradeLocker not connected. Connect TradeLocker first.");
    }

    const environment =
      connection.environment === "live" ? ("live" as const) : ("demo" as const);
    const jwtHost =
      typeof connection.jwtHost === "string" && connection.jwtHost.trim()
        ? connection.jwtHost.trim()
        : undefined;
    const baseUrlHost = jwtHost ?? `${environment}.tradelocker.com`;
    const server =
      typeof connection.server === "string" && connection.server.trim()
        ? connection.server.trim()
        : "unknown";

    const sourceKey = `tradelocker:${environment}:${baseUrlHost}:${server}`
      .toLowerCase()
      .trim();

    await ctx.runMutation(
      componentsUntyped.launchthat_pricedata.sources.mutations.upsertSource,
      {
        sourceKey,
        provider: "tradelocker",
        environment,
        server,
        jwtHost,
        baseUrlHost,
        isDefault: true,
        seedRef: { organizationId, userId },
      },
    );

    return { ok: true, sourceKey };
  },
});

const normalizeSymbol = (value: string) => value.trim().toUpperCase();
const DAY_MS = 24 * 60 * 60 * 1000;
const utcDayStartMs = (tMs: number) => {
  const d = new Date(tMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

const normalizeClickhouseResolution = (
  value: string,
):
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | null => {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "1m" || v === "m1") return "1m";
  if (v === "5m" || v === "m5") return "5m";
  if (v === "15m" || v === "m15") return "15m";
  if (v === "30m" || v === "m30") return "30m";
  if (v === "1h" || v === "h1" || v === "1hr") return "1h";
  if (v === "4h" || v === "h4" || v === "4hr") return "4h";
  if (v === "1d" || v === "d1") return "1d";
  return null;
};

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

const dedupeBarsStrictAsc = <T extends { t: number }>(bars: T[]): T[] => {
  const sorted = (Array.isArray(bars) ? bars : [])
    .filter((b) => b && Number.isFinite(b.t))
    .sort((a, b) => a.t - b.t);

  const out: T[] = [];
  for (const b of sorted) {
    const prev = out.length > 0 ? out[out.length - 1]! : null;
    if (!prev) {
      out.push(b);
      continue;
    }
    if (b.t > prev.t) {
      out.push(b);
      continue;
    }
    // Same timestamp (or out-of-order due to duplicates): replace the previous value.
    // This ensures STRICTLY increasing times for chart consumers that assert uniqueness.
    out[out.length - 1] = b;
  }
  return out;
};

export const pricedataListPublicSymbols = action({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sourceKey: v.optional(v.string()),
    symbols: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const source = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
      {},
    );
    const sourceKey =
      typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) return { sourceKey: undefined, symbols: [] };

    const rows = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.listInstrumentsForSource,
      { sourceKey, limit: args.limit },
    );

    const symbols = Array.isArray(rows)
      ? rows
        .map((r: any) => (typeof r?.symbol === "string" ? r.symbol : ""))
        .filter(Boolean)
      : [];

    return { sourceKey, symbols };
  },
});

export const pricedataListPublicSources = action({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      sourceKey: v.string(),
      label: v.string(),
      isDefault: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows: any[] = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.sources.queries.listSources,
      { limit: args.limit },
    );
    const defaultSource = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
      {},
    );
    const defaultKey =
      typeof defaultSource?.sourceKey === "string" ? String(defaultSource.sourceKey) : "";

    const mapped = Array.isArray(rows)
      ? rows
        .map((r: any) => {
          const sourceKey = typeof r?.sourceKey === "string" ? String(r.sourceKey) : "";
          const environment = typeof r?.environment === "string" ? String(r.environment) : "";
          const server = typeof r?.server === "string" ? String(r.server) : "";
          const provider = typeof r?.provider === "string" ? String(r.provider) : "";
          if (!sourceKey) return null;
          const label = [provider, environment, server].filter(Boolean).join(":") || sourceKey;
          const isDefault = Boolean(r?.isDefault) || (defaultKey && sourceKey === defaultKey);
          return { sourceKey, label, isDefault: isDefault || undefined };
        })
        .filter(Boolean)
      : [];

    mapped.sort((a: any, b: any) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));
    return mapped as any;
  },
});

export const pricedataListPublicSymbolsForSourceKey = action({
  args: {
    sourceKey: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sourceKey: v.string(),
    symbols: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim();
    if (!sourceKey) return { sourceKey, symbols: [] };

    const rows = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.listInstrumentsForSource,
      { sourceKey, limit: args.limit },
    );

    const symbols = Array.isArray(rows)
      ? rows
        .map((r: any) => (typeof r?.symbol === "string" ? r.symbol : ""))
        .filter(Boolean)
      : [];

    return { sourceKey, symbols };
  },
});

export const pricedataGetPublicBars = action({
  args: {
    symbol: v.string(),
    resolution: v.string(),
    // Optional override for broker/feed selection on public pages.
    sourceKey: v.optional(v.string()),
    // Pagination:
    // - `toMs` is an inclusive cursor (ms). Omit for "latest".
    // - `limit` is the maximum number of candles returned.
    toMs: v.optional(v.number()),
    limit: v.optional(v.number()),
    // Backward compatible: allow callers to request a bounded window from `toMs`/now.
    lookbackDays: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    sourceKey: v.optional(v.string()),
    symbol: v.string(),
    resolution: v.string(),
    bars: v.array(
      v.object({
        t: v.number(),
        o: v.number(),
        h: v.number(),
        l: v.number(),
        c: v.number(),
        v: v.number(),
      }),
    ),
    nextToMs: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const symbol = normalizeSymbol(args.symbol);
    const resolutionRaw = args.resolution.trim();
    const requestedSourceKey =
      typeof args.sourceKey === "string" ? args.sourceKey.trim() : "";
    const lookbackDaysRaw =
      typeof args.lookbackDays === "number" && Number.isFinite(args.lookbackDays)
        ? Math.floor(args.lookbackDays)
        : 0;
    const lookbackDays = Math.max(0, Math.min(3650, lookbackDaysRaw));
    const resolution = normalizeClickhouseResolution(resolutionRaw);
    if (!resolution) {
      return {
        ok: false,
        sourceKey: undefined,
        symbol,
        resolution: resolutionRaw,
        bars: [],
        nextToMs: undefined,
        error: "Unsupported resolution.",
      };
    }

    const source = requestedSourceKey
      ? await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getSourceByKey,
        { sourceKey: requestedSourceKey },
      )
      : await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
        {},
      );
    const sourceKey = typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) {
      return {
        ok: false,
        sourceKey: undefined,
        symbol,
        resolution: resolutionRaw,
        bars: [],
        nextToMs: undefined,
        error: requestedSourceKey ? "Unknown price sourceKey." : "No default price source configured.",
      };
    }

    const instrument = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
      { sourceKey, symbol },
    );
    if (!instrument || typeof instrument.tradableInstrumentId !== "string") {
      return {
        ok: false,
        sourceKey,
        symbol,
        resolution: resolutionRaw,
        bars: [],
        nextToMs: undefined,
        error: "Symbol is not mapped for the default source yet.",
      };
    }

    const limit = Math.max(50, Math.min(5000, Number(args.limit ?? 2000)));
    const toMsRaw =
      typeof args.toMs === "number" && Number.isFinite(args.toMs) ? args.toMs : Date.now();
    const toMs = Math.max(0, Math.floor(toMsRaw));
    const fromMs = lookbackDays > 0 ? Math.max(0, toMs - lookbackDays * DAY_MS) : undefined;

    const allowLegacyChunks = process.env.PRICEDATA_USE_LEGACY_CHUNKS !== "false";

    let bars: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> = [];
    try {
      const clickhouse = requireClickhouseComponentConfig();
      const barsRes: unknown = await ctx.runAction(
        componentsUntyped.launchthat_clickhouse.candles.actions.listCandles,
        {
          clickhouse,
          sourceKey,
          tradableInstrumentId: instrument.tradableInstrumentId,
          resolution,
          fromMs,
          toMs,
          limit,
        },
      );
      bars = Array.isArray(barsRes)
        ? barsRes
          .map((b: any) => ({
            t: Number(b?.t),
            o: Number(b?.o),
            h: Number(b?.h),
            l: Number(b?.l),
            c: Number(b?.c),
            v: Number.isFinite(Number(b?.v)) ? Number(b?.v) : 0,
          }))
          .filter(
            (b: any) =>
              Number.isFinite(b.t) &&
              Number.isFinite(b.o) &&
              Number.isFinite(b.h) &&
              Number.isFinite(b.l) &&
              Number.isFinite(b.c) &&
              Number.isFinite(b.v),
          )
        : [];
    } catch {
      // ignore; we may fall back to legacy Convex chunks
    }

    // Temporary fallback while ClickHouse is being phased in.
    if (bars.length === 0 && allowLegacyChunks) {
      const legacyFromMs =
        typeof fromMs === "number" && Number.isFinite(fromMs)
          ? fromMs
          : Math.max(0, toMs - 7 * DAY_MS);
      const chunks = await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.bars.queries.getBarChunks,
        {
          sourceKey,
          tradableInstrumentId: instrument.tradableInstrumentId,
          resolution: resolutionRaw,
          fromMs: legacyFromMs,
          toMs,
        },
      );
      bars = (Array.isArray(chunks) ? chunks : [])
        .flatMap((c: any) => (Array.isArray(c?.bars) ? c.bars : []))
        .map((b: any) => ({
          t: Number(b?.t),
          o: Number(b?.o),
          h: Number(b?.h),
          l: Number(b?.l),
          c: Number(b?.c),
          v: Number(b?.v),
        }))
        .filter(
          (b: any) =>
            Number.isFinite(b.t) &&
            Number.isFinite(b.o) &&
            Number.isFinite(b.h) &&
            Number.isFinite(b.l) &&
            Number.isFinite(b.c) &&
            Number.isFinite(b.v),
        )
        .sort((a: any, b: any) => a.t - b.t);
    }

    // Enforce strict ascending & unique timestamps (TradingChartReal asserts this).
    const deduped = dedupeBarsStrictAsc(bars);
    const oldest = deduped.length > 0 ? deduped[0]!.t : null;
    const nextToMs =
      deduped.length >= limit && typeof oldest === "number" && Number.isFinite(oldest) && oldest > 0
        ? oldest - 1
        : undefined;

    return {
      ok: true,
      sourceKey,
      symbol,
      resolution: resolutionRaw,
      bars: deduped,
      nextToMs,
    };
  },
});

export const pricedataGetMyChartOverlays = action({
  args: {
    symbol: v.string(),
    // Optional override for broker/feed selection on chart pages.
    sourceKey: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    hasIdentity: v.boolean(),
    markers: v.array(
      v.object({
        t: v.number(),
        kind: v.union(v.literal("entry"), v.literal("exit")),
        side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
        label: v.optional(v.string()),
      }),
    ),
    priceLines: v.array(
      v.object({
        kind: v.union(v.literal("sl"), v.literal("tp")),
        price: v.number(),
        title: v.optional(v.string()),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const ident = await ctx.auth.getUserIdentity();
    if (!ident) {
      // Public/marketing chart: fall back to local demo overlays.
      return { ok: true, hasIdentity: false, markers: [], priceLines: [] };
    }

    const symbol = normalizeSymbol(args.symbol);
    const requestedSourceKey =
      typeof args.sourceKey === "string" ? args.sourceKey.trim() : "";

    const source = requestedSourceKey
      ? await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getSourceByKey,
        { sourceKey: requestedSourceKey },
      )
      : await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
        {},
      );
    const sourceKey = typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) {
      return {
        ok: true,
        hasIdentity: true,
        markers: [],
        priceLines: [],
        error: "No default price source configured.",
      };
    }

    const instrument = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
      { sourceKey, symbol },
    );
    const tradableInstrumentId =
      typeof instrument?.tradableInstrumentId === "string"
        ? String(instrument.tradableInstrumentId)
        : "";
    if (!tradableInstrumentId) {
      return { ok: true, hasIdentity: true, markers: [], priceLines: [] };
    }

    // Ensure user doc exists for this session (actions can create-or-get).
    try {
      await resolveViewerUserId(ctx);
    } catch {
      // ignore; overlay requires auth, but we already have identity. Return empty.
    }

    const getNum = (raw: unknown, keys: string[]): number | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
      }
      return null;
    };

    try {
      const positions: any[] = await ctx.runQuery(
        apiUntyped.traderlaunchpad.queries.listMyTradeLockerPositions,
        { limit: 200 },
      );
      const list = Array.isArray(positions) ? positions : [];
      const forInstrument = list.filter((p) => {
        const pid = String((p as any)?.instrumentId ?? "");
        const psym = normalizeSymbol(String((p as any)?.symbol ?? ""));
        return pid === tradableInstrumentId || psym === symbol;
      });

      const markers: Array<{
        t: number;
        kind: "entry" | "exit";
        side?: "buy" | "sell";
        label?: string;
      }> = [];
      const priceLines: Array<{ kind: "sl" | "tp"; price: number; title?: string }> =
        [];

      for (const p of forInstrument) {
        const openedAt =
          typeof (p as any)?.openedAt === "number" ? Number((p as any).openedAt) : 0;
        const updatedAt =
          typeof (p as any)?.updatedAt === "number" ? Number((p as any).updatedAt) : 0;
        const t = openedAt > 0 ? openedAt : updatedAt;
        if (Number.isFinite(t) && t > 0) {
          const sideRaw = String((p as any)?.side ?? "");
          const side = sideRaw === "sell" ? "sell" : sideRaw === "buy" ? "buy" : undefined;
          markers.push({
            t,
            kind: "entry",
            side,
            label: side === "sell" ? "Sell" : side === "buy" ? "Buy" : "Entry",
          });
        }

        const raw = (p as any)?.raw;
        const sl =
          getNum(raw, ["stopLoss", "stopLossPrice", "sl", "SL"]) ??
          getNum((raw as any)?.risk, ["stopLoss"]);
        const tp =
          getNum(raw, ["takeProfit", "takeProfitPrice", "tp", "TP"]) ??
          getNum((raw as any)?.risk, ["takeProfit"]);
        if (typeof sl === "number") priceLines.push({ kind: "sl", price: sl, title: "SL" });
        if (typeof tp === "number") priceLines.push({ kind: "tp", price: tp, title: "TP" });
      }

      // Deduplicate price lines by kind (keep the latest).
      const byKind: Record<string, { kind: "sl" | "tp"; price: number; title?: string }> = {};
      for (const pl of priceLines) byKind[pl.kind] = pl;

      return {
        ok: true,
        hasIdentity: true,
        markers,
        priceLines: Object.values(byKind),
      };
    } catch (e) {
      return {
        ok: true,
        hasIdentity: true,
        markers: [],
        priceLines: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
});

export const pricedataEnsurePublicBarsCached = action({
  args: {
    symbol: v.string(),
    resolution: v.string(),
    // Optional override for broker/feed selection on public pages.
    sourceKey: v.optional(v.string()),
    // Backward compatible bounded warm window.
    lookbackDays: v.optional(v.number()),
    // Optional explicit window (ms) for warming the currently viewed chart range.
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    sourceKey: v.optional(v.string()),
    symbol: v.string(),
    resolution: v.string(),
    barsStored: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const symbol = normalizeSymbol(args.symbol);
    const resolution = args.resolution.trim();
    const requestedSourceKey =
      typeof args.sourceKey === "string" ? args.sourceKey.trim() : "";
    // This action is meant to quickly warm ClickHouse; keep it bounded.
    const lookbackDaysRaw =
      typeof args.lookbackDays === "number" && Number.isFinite(args.lookbackDays)
        ? Math.floor(args.lookbackDays)
        : 7;
    const lookbackDays = Math.max(1, Math.min(7, lookbackDaysRaw));

    const source = requestedSourceKey
      ? await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getSourceByKey,
        { sourceKey: requestedSourceKey },
      )
      : await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
        {},
      );
    const sourceKey =
      typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) {
      return {
        ok: false,
        sourceKey: undefined,
        symbol,
        resolution,
        error: requestedSourceKey
          ? "Unknown price sourceKey."
          : "No default price source configured. Set it in Admin → Settings → Connections.",
      };
    }

    console.log("[pricedataEnsurePublicBarsCached] start", {
      symbol,
      resolution,
      lookbackDays,
      sourceKey,
    });

    const resolvePlatformPoolAuth = async (): Promise<{
      baseUrl: string;
      accessToken: string;
      refreshToken: string;
      accNum: number;
      accountId: string;
      environment: "demo" | "live";
      server: string;
      jwtHost?: string;
    } | null> => {
      // Local dev ergonomics: allow public "Sync" to use the platform account pool
      // when the default source seed connection isn't connected.
      if (process.env.NODE_ENV === "production") return null;

      const policies: any[] = await ctx.runQuery(
        internalUntyped.platform.priceDataSyncInternalQueries
          .listEnabledAccountPoliciesForSourceKey,
        { sourceKey, limit: 50 },
      );
      const p = Array.isArray(policies) ? policies[0] : null;
      if (!p) return null;

      const connectionId = String(p.connectionId ?? "").trim();
      const accountId = String(p.accountId ?? "").trim();
      const accNum = Number(p.accNum ?? NaN);
      if (!connectionId || !accountId || !Number.isFinite(accNum) || accNum <= 0) return null;

      const secretsRes: any = await ctx.runQuery(
        traderlaunchpadPlatformConnections.getConnectionSecrets,
        { connectionId: (connectionId as unknown) as any },
      );
      const secrets = secretsRes?.secrets ?? null;
      if (!secrets) return null;

      const environment = secrets.environment === "live" ? ("live" as const) : ("demo" as const);
      const server = String(secrets.server ?? "");
      const jwtHost = typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined;
      const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlForEnv(environment);

      const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE ?? "raw";
      const keyMaterial = requireTradeLockerSecretsKey();
      const accessTokenEncrypted = String(secrets.accessTokenEncrypted ?? "");
      const refreshTokenEncrypted = String(secrets.refreshTokenEncrypted ?? "");
      const accessToken =
        tokenStorage === "enc" ? await decryptSecret(accessTokenEncrypted, keyMaterial) : accessTokenEncrypted;
      const refreshToken =
        tokenStorage === "enc" ? await decryptSecret(refreshTokenEncrypted, keyMaterial) : refreshTokenEncrypted;

      if (!accessToken || !refreshToken) return null;

      console.log("[pricedataEnsurePublicBarsCached] using platform pool account", {
        connectionId,
        accountRowId: String(p.accountRowId ?? ""),
        accountId,
        accNum,
      });

      return { baseUrl, accessToken, refreshToken, accNum, accountId, environment, server, jwtHost };
    };

    const seedRef = source?.seedRef;
    const seedOrg =
      typeof seedRef?.organizationId === "string" ? seedRef.organizationId : "";
    const seedUser = typeof seedRef?.userId === "string" ? seedRef.userId : "";
    const canPersistSeed = Boolean(seedOrg && seedUser);

    console.log("[pricedataEnsurePublicBarsCached] seedRef", {
      seedOrg: seedOrg || undefined,
      seedUser: seedUser || undefined,
      canPersistSeed,
    });

    // 1) Load seed connection secrets to get TradeLocker tokens + account identifiers
    let secrets: any = null;
    if (canPersistSeed) {
      secrets = await ctx.runQuery(traderlaunchpadConnectionsInternal.getConnectionSecrets, {
        organizationId: seedOrg,
        userId: seedUser,
      });
    }
    if (!secrets || secrets.status !== "connected") {
      const platformAuth = await resolvePlatformPoolAuth();
      if (!platformAuth) {
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: "Seed TradeLocker connection is not connected.",
        };
      }

      // Use platformAuth instead of the seed connection for TradeLocker calls.
      // We normalize it into the same shape as the seed `secrets` payload so the rest
      // of this function can proceed unchanged.
      secrets = {
        status: "connected",
        environment: platformAuth.environment,
        server: platformAuth.server,
        jwtHost: platformAuth.jwtHost,
        selectedAccNum: platformAuth.accNum,
        selectedAccountId: platformAuth.accountId,
        accessTokenEncrypted: platformAuth.accessToken,
        refreshTokenEncrypted: platformAuth.refreshToken,
      };
    }

    const keyMaterial = requireTradeLockerSecretsKey();
    let accessToken = await decryptSecret(
      String((secrets as any).accessTokenEncrypted ?? ""),
      keyMaterial,
    );
    let refreshToken = await decryptSecret(
      String((secrets as any).refreshTokenEncrypted ?? ""),
      keyMaterial,
    );

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrl = jwtHost
      ? `https://${jwtHost}/backend-api`
      : baseUrlForEnv(secrets.environment === "live" ? "live" : "demo");

    let accNum = Number((secrets as any).selectedAccNum ?? 0);
    let accountId = String((secrets as any).selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) {
      return {
        ok: false,
        sourceKey,
        symbol,
        resolution,
        error: "Seed TradeLocker connection missing account identifiers.",
      };
    }

    console.log("[pricedataEnsurePublicBarsCached] seed connection identifiers", {
      environment: secrets.environment,
      server: String((secrets as any).server ?? ""),
      jwtHost,
      baseUrl,
      accNum,
      accountId,
    });

    // Self-heal: if stored account identifiers are stale, resolve them via /auth/jwt/all-accounts.
    // This endpoint does NOT require accNum, and helps map accountId<->accNum correctly for the broker/server.
    const accountsRes = await ctx.runAction(
      componentsUntyped.launchthat_pricedata.tradelocker.actions.fetchAllAccounts,
      {
        baseUrl,
        accessToken,
        refreshToken,
        developerKey: env.TRADELOCKER_DEVELOPER_API_KEY,
      },
    );
    if (accountsRes?.ok && Array.isArray(accountsRes?.accounts) && accountsRes.accounts.length > 0) {
      if (accountsRes?.refreshed?.accessToken && accountsRes?.refreshed?.refreshToken) {
        accessToken = accountsRes.refreshed.accessToken;
        refreshToken = accountsRes.refreshed.refreshToken;
      }

      const accounts: any[] = accountsRes.accounts;
      const matched =
        accounts.find(
          (a) =>
            String(a?.accountId ?? a?.id ?? a?._id ?? "") === accountId ||
            String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "") === accountId ||
            Number(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? 0) === accNum ||
            Number(a?.accountId ?? a?.id ?? 0) === accNum,
        ) ?? accounts[0];

      const resolvedAccountId = String(matched?.accountId ?? matched?.id ?? matched?._id ?? accountId).trim();
      const resolvedAccNum = Number(matched?.accNum ?? matched?.acc_num ?? matched?.accountNumber ?? accNum);

      if (resolvedAccountId && Number.isFinite(resolvedAccNum) && resolvedAccNum > 0) {
        const changed = resolvedAccountId !== accountId || resolvedAccNum !== accNum;
        if (changed) {
          console.log("[pricedataEnsurePublicBarsCached] resolved account identifiers", {
            from: { accountId, accNum },
            to: { accountId: resolvedAccountId, accNum: resolvedAccNum },
          });
          accountId = resolvedAccountId;
          accNum = resolvedAccNum;

          // Persist corrected selection to the seed connection (best effort).
          if (canPersistSeed) {
            await ctx.runMutation(traderlaunchpadConnectionsMutations.upsertConnection, {
              organizationId: seedOrg,
              userId: seedUser,
              environment: secrets.environment === "live" ? "live" : "demo",
              server: String((secrets as any).server ?? ""),
              jwtHost: extractJwtHost(accessToken),
              selectedAccountId: accountId,
              selectedAccNum: accNum,
              accessTokenEncrypted: (secrets as any).accessTokenEncrypted,
              refreshTokenEncrypted: (secrets as any).refreshTokenEncrypted,
              accessTokenExpiresAt: (secrets as any).accessTokenExpiresAt,
              refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
              status: "connected",
              lastError: undefined,
            });
          }
        }
      }
    } else {
      console.log("[pricedataEnsurePublicBarsCached] fetchAllAccounts unavailable", {
        ok: Boolean(accountsRes?.ok),
        status: accountsRes?.status,
        error: accountsRes?.error,
        textPreview: (accountsRes as any)?.textPreview,
      });
    }

    // 2) Ensure symbol mapping exists
    let instrument = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
      { sourceKey, symbol },
    );

    if (!instrument) {
      const instrumentsRes = await ctx.runAction(
        componentsUntyped.launchthat_pricedata.tradelocker.actions.fetchInstruments,
        {
          baseUrl,
          accessToken,
          refreshToken,
          accNum,
          accountId,
          developerKey: env.TRADELOCKER_DEVELOPER_API_KEY,
        },
      );

      console.log("[pricedataEnsurePublicBarsCached] fetchInstruments", {
        ok: Boolean(instrumentsRes?.ok),
        status: instrumentsRes?.status,
        count: instrumentsRes?.count,
        error: instrumentsRes?.error,
        textPreview: (instrumentsRes as any)?.textPreview,
      });

      if (!instrumentsRes?.ok) {
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: `Failed to fetch instruments from TradeLocker (status ${String(instrumentsRes?.status ?? "unknown")}). baseUrl=${baseUrl} accNum=${String(accNum)} accountId=${accountId}`,
        };
      }

      // Persist refreshed tokens (best effort)
      if (instrumentsRes?.refreshed?.accessToken && instrumentsRes?.refreshed?.refreshToken) {
        accessToken = instrumentsRes.refreshed.accessToken;
        refreshToken = instrumentsRes.refreshed.refreshToken;

        const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE ?? "raw";
        const accessToStore =
          tokenStorage === "enc"
            ? await encryptSecret(instrumentsRes.refreshed.accessToken, keyMaterial)
            : instrumentsRes.refreshed.accessToken;
        const refreshToStore =
          tokenStorage === "enc"
            ? await encryptSecret(instrumentsRes.refreshed.refreshToken, keyMaterial)
            : instrumentsRes.refreshed.refreshToken;

        if (canPersistSeed) {
          await ctx.runMutation(traderlaunchpadConnectionsMutations.upsertConnection, {
            organizationId: seedOrg,
            userId: seedUser,
            environment: secrets.environment === "live" ? "live" : "demo",
            server: String((secrets as any).server ?? ""),
            selectedAccountId: accountId,
            selectedAccNum: accNum,
            accessTokenEncrypted: accessToStore,
            refreshTokenEncrypted: refreshToStore,
            accessTokenExpiresAt: instrumentsRes.refreshed.expireDateMs,
            refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
            status: "connected",
            lastError: undefined,
            jwtHost: extractJwtHost(instrumentsRes.refreshed.accessToken),
          });
        }
      }

      const list: any[] = Array.isArray(instrumentsRes?.instruments)
        ? instrumentsRes.instruments
        : [];
      if (list.length === 0) {
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: `Fetched instruments from TradeLocker but none were parsed. (status ${String(instrumentsRes?.status ?? "unknown")}) ${String((instrumentsRes as any)?.textPreview ?? "")}`,
        };
      }
      for (const row of list) {
        if (!row || typeof row.symbol !== "string") continue;
        const tid =
          typeof row.tradableInstrumentId === "string"
            ? row.tradableInstrumentId
            : typeof row.tradableInstrumentId === "number"
              ? String(row.tradableInstrumentId)
              : "";
        if (!tid) continue;
        await ctx.runMutation(
          componentsUntyped.launchthat_pricedata.instruments.mutations.upsertInstrument,
          {
            sourceKey,
            symbol: normalizeSymbol(row.symbol),
            tradableInstrumentId: tid,
            infoRouteId: typeof row.infoRouteId === "number" ? row.infoRouteId : undefined,
            metadata: row.raw,
          },
        );
      }

      instrument = await ctx.runQuery(
        componentsUntyped.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
        { sourceKey, symbol },
      );

      if (!instrument) {
        const sample = list
          .slice(0, 25)
          .map((r) => String(r?.symbol ?? ""))
          .filter(Boolean)
          .join(", ");
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: `Symbol "${symbol}" was not found in the TradeLocker instruments list for the selected account. Sample symbols: ${sample}`,
        };
      }
    }

    const tradableInstrumentId =
      typeof instrument?.tradableInstrumentId === "string"
        ? instrument.tradableInstrumentId
        : "";
    const infoRouteId =
      typeof instrument?.infoRouteId === "number" ? instrument.infoRouteId : NaN;
    if (!tradableInstrumentId || !Number.isFinite(infoRouteId)) {
      return {
        ok: false,
        sourceKey,
        symbol,
        resolution,
        error: "Symbol mapping is missing tradableInstrumentId/infoRouteId.",
      };
    }

    // 3) Insert missing bars into ClickHouse.
    // IMPORTANT: Convex values have an array length limit (8192). A 7-day 1m window is 10080 bars,
    // so we MUST fetch in slices when we're doing an initial warm.
    const clickhouse = requireClickhouseComponentConfig();
    const maxTsMsRaw: unknown = await ctx.runAction(
      componentsUntyped.launchthat_clickhouse.candles.actions.getMaxTsMs1m,
      { clickhouse, sourceKey, tradableInstrumentId },
    );
    const maxTsMs =
      typeof maxTsMsRaw === "number" && Number.isFinite(maxTsMsRaw) ? maxTsMsRaw : null;

    const toMs =
      typeof args.toMs === "number" && Number.isFinite(args.toMs) ? Math.floor(args.toMs) : Date.now();
    const fullFromMs =
      typeof args.fromMs === "number" && Number.isFinite(args.fromMs)
        ? Math.max(0, Math.floor(args.fromMs))
        : toMs - lookbackDays * DAY_MS;
    const overlapMs = DAY_MS; // allow some overlap for dedupe
    const fromMs =
      maxTsMs === null ? fullFromMs : Math.max(fullFromMs, maxTsMs - overlapMs);
    console.log("[pricedataEnsurePublicBarsCached] window", {
      maxTsMs,
      fullFromMs,
      fromMs,
      toMs,
    });

    const sliceMs = 3 * DAY_MS; // 4320 bars at 1m, safely under Convex 8192 limit
    let maxInserted = maxTsMs ?? -1;
    let barsStored = 0;

    for (let cursor = fromMs; cursor < toMs; cursor += sliceMs) {
      const sliceToMs = Math.min(toMs, cursor + sliceMs);
      console.log("[pricedataEnsurePublicBarsCached] slice", {
        fromMs: cursor,
        toMs: sliceToMs,
        spanMinutes: Math.round((sliceToMs - cursor) / 60_000),
      });
      const history = await ctx.runAction(
        componentsUntyped.launchthat_pricedata.tradelocker.actions.fetchHistory,
        {
          baseUrl,
          accessToken,
          refreshToken,
          accNum,
          tradableInstrumentId,
          infoRouteId,
          resolution: "1m",
          fromMs: cursor,
          toMs: sliceToMs,
          developerKey: env.TRADELOCKER_DEVELOPER_API_KEY,
        },
      );

      if (!history?.ok) {
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: String(history?.error ?? "TradeLocker history fetch failed."),
        };
      }

      // Persist refreshed tokens (best effort) ONLY if we are actually using the seed connection.
      if (history?.refreshed?.accessToken && history?.refreshed?.refreshToken) {
        accessToken = history.refreshed.accessToken;
        refreshToken = history.refreshed.refreshToken;

        if (canPersistSeed) {
          const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE ?? "raw";
          const accessToStore =
            tokenStorage === "enc"
              ? await encryptSecret(history.refreshed.accessToken, keyMaterial)
              : history.refreshed.accessToken;
          const refreshToStore =
            tokenStorage === "enc"
              ? await encryptSecret(history.refreshed.refreshToken, keyMaterial)
              : history.refreshed.refreshToken;

          await ctx.runMutation(traderlaunchpadConnectionsMutations.upsertConnection, {
            organizationId: seedOrg,
            userId: seedUser,
            environment: secrets.environment === "live" ? "live" : "demo",
            server: String((secrets as any).server ?? ""),
            selectedAccountId: accountId,
            selectedAccNum: accNum,
            accessTokenEncrypted: accessToStore,
            refreshTokenEncrypted: refreshToStore,
            accessTokenExpiresAt: history.refreshed.expireDateMs,
            refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
            status: "connected",
            lastError: undefined,
            jwtHost: extractJwtHost(history.refreshed.accessToken),
          });
        }
      }

      const bars: any[] = Array.isArray(history?.bars) ? history.bars : [];
      const normalizedBars = bars
        .map((b: any) => ({
          t: Number(b?.t),
          o: Number(b?.o),
          h: Number(b?.h),
          l: Number(b?.l),
          c: Number(b?.c),
          v: Number(b?.v),
        }))
        .filter(
          (b: any) =>
            Number.isFinite(b.t) &&
            Number.isFinite(b.o) &&
            Number.isFinite(b.h) &&
            Number.isFinite(b.l) &&
            Number.isFinite(b.c) &&
            Number.isFinite(b.v) &&
            b.t > maxInserted,
        )
        .sort((a: any, b: any) => a.t - b.t);

      if (normalizedBars.length === 0) continue;

      const payload = normalizedBars
        .map((b: any) =>
          JSON.stringify({
            sourceKey: sourceKey.toLowerCase(),
            tradableInstrumentId,
            symbol,
            ts: formatDateTime64Utc(b.t),
            open: b.o,
            high: b.h,
            low: b.l,
            close: b.c,
            volume: b.v,
          }),
        )
        .join("\n");

      const ins: any = await ctx.runAction(
        componentsUntyped.launchthat_clickhouse.candles.actions.insertCandles1mJsonEachRow,
        { clickhouse, payload },
      );
      if (!ins?.ok) {
        return {
          ok: false,
          sourceKey,
          symbol,
          resolution,
          error: typeof ins?.error === "string" ? ins.error : "ClickHouse insert failed",
        };
      }

      barsStored += normalizedBars.length;
      maxInserted = normalizedBars[normalizedBars.length - 1]!.t;
    }

    return { ok: true, sourceKey, symbol, resolution, barsStored };
  },
});

export const setMyJournalPublic = action({
  args: {
    isPublic: v.boolean(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    await ctx.runMutation(traderlaunchpadJournalMutations.upsertProfile, {
      organizationId,
      userId,
      isPublic: args.isPublic,
    });

    return { ok: true };
  },
});

export const newsListGlobal = action({
  args: {
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      eventType: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      startsAt: v.optional(v.number()),
      impact: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      meta: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows: any[] = await ctx.runQuery(
      componentsUntyped.launchthat_news.events.queries.listEventsGlobal,
      {
        fromMs: args.fromMs,
        toMs: args.toMs,
        limit: args.limit,
        eventType: args.eventType,
      },
    );
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r: any) => ({
      _id: String(r?._id ?? ""),
      eventType: String(r?.eventType ?? ""),
      title: String(r?.title ?? ""),
      summary: typeof r?.summary === "string" ? r.summary : undefined,
      publishedAt: typeof r?.publishedAt === "number" ? r.publishedAt : undefined,
      startsAt: typeof r?.startsAt === "number" ? r.startsAt : undefined,
      impact: typeof r?.impact === "string" ? r.impact : undefined,
      country: typeof r?.country === "string" ? r.country : undefined,
      currency: typeof r?.currency === "string" ? r.currency : undefined,
      meta: r?.meta,
      createdAt: Number(r?.createdAt ?? 0),
      updatedAt: Number(r?.updatedAt ?? 0),
    }));
  },
});

export const newsListForSymbol = action({
  args: {
    symbol: v.string(),
    horizonDays: v.optional(v.number()),
    lookbackHours: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    symbol: v.string(),
    allowed: v.boolean(),
    upcomingEconomic: v.array(
      v.object({
        eventId: v.string(),
        at: v.number(),
        title: v.string(),
        impact: v.optional(v.string()),
        country: v.optional(v.string()),
        currency: v.optional(v.string()),
      }),
    ),
    recentHeadlines: v.array(
      v.object({
        eventId: v.string(),
        at: v.number(),
        title: v.string(),
        summary: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const symbol = normalizeSymbol(args.symbol);
    const horizonDays = Math.max(1, Math.min(30, Math.floor(args.horizonDays ?? 7)));
    const lookbackHours = Math.max(1, Math.min(168, Math.floor(args.lookbackHours ?? 48)));
    const now = Date.now();

    const supportedSymbols: string[] = await ctx.runQuery(
      internalUntyped.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
      { limitPerSource: 5000 },
    );
    const allowed = supportedSymbols.includes(symbol);
    if (!allowed) {
      return {
        ok: true,
        symbol,
        allowed: false,
        upcomingEconomic: [],
        recentHeadlines: [],
      };
    }

    const upcoming: any[] = await ctx.runQuery(
      componentsUntyped.launchthat_news.events.queries.listEventsForSymbol,
      {
        symbol,
        fromMs: now,
        toMs: now + horizonDays * 24 * 60 * 60 * 1000,
        limit: 100,
      },
    );
    const recent: any[] = await ctx.runQuery(
      componentsUntyped.launchthat_news.events.queries.listEventsForSymbol,
      {
        symbol,
        fromMs: now - lookbackHours * 60 * 60 * 1000,
        toMs: now,
        limit: 100,
      },
    );

    const upcomingEconomic = (Array.isArray(upcoming) ? upcoming : [])
      .filter((r: any) => String(r?.eventType ?? "") === "economic")
      .slice(0, 30)
      .map((r: any) => ({
        eventId: String(r?.eventId ?? ""),
        at: Number(r?.at ?? 0),
        title: String(r?.title ?? ""),
        impact: typeof r?.impact === "string" ? r.impact : undefined,
        country: typeof r?.country === "string" ? r.country : undefined,
        currency: typeof r?.currency === "string" ? r.currency : undefined,
      }))
      .filter((r: any) => r.eventId && Number.isFinite(r.at) && r.at > 0);

    const recentHeadlines = (Array.isArray(recent) ? recent : [])
      .filter((r: any) => String(r?.eventType ?? "") === "headline")
      .sort((a: any, b: any) => Number(b?.at ?? 0) - Number(a?.at ?? 0))
      .slice(0, 30)
      .map((r: any) => ({
        eventId: String(r?.eventId ?? ""),
        at: Number(r?.at ?? 0),
        title: String(r?.title ?? ""),
        summary: typeof r?.summary === "string" ? r.summary : undefined,
      }))
      .filter((r: any) => r.eventId && Number.isFinite(r.at) && r.at > 0);

    return {
      ok: true,
      symbol,
      allowed: true,
      upcomingEconomic,
      recentHeadlines,
    };
  },
});

export const newsSetSubscription = action({
  args: {
    symbol: v.string(),
    enabled: v.boolean(),
    minImpact: v.optional(v.string()),
    channels: v.optional(v.any()),
    cooldownSeconds: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean(), hasIdentity: v.boolean(), symbol: v.string() }),
  handler: async (ctx, args) => {
    const symbol = normalizeSymbol(args.symbol);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { ok: true, hasIdentity: false, symbol };

    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const supportedSymbols: string[] = await ctx.runQuery(
      internalUntyped.platform.newsSymbolUniverseInternalQueries.listSupportedSymbols,
      { limitPerSource: 5000 },
    );
    if (!supportedSymbols.includes(symbol)) {
      return { ok: true, hasIdentity: true, symbol };
    }

    await ctx.runMutation(componentsUntyped.launchthat_news.subscriptions.mutations.upsertSubscription, {
      userId,
      orgId: organizationId,
      symbol,
      enabled: Boolean(args.enabled),
      minImpact: typeof args.minImpact === "string" ? args.minImpact : undefined,
      channels: args.channels,
      cooldownSeconds:
        typeof args.cooldownSeconds === "number" && Number.isFinite(args.cooldownSeconds)
          ? Math.max(0, Math.floor(args.cooldownSeconds))
          : undefined,
    });

    return { ok: true, hasIdentity: true, symbol };
  },
});

export const newsGetEvent = action({
  args: { eventId: v.string() },
  returns: v.object({
    ok: v.boolean(),
    event: v.optional(
      v.object({
        _id: v.string(),
        eventType: v.string(),
        canonicalKey: v.string(),
        title: v.string(),
        summary: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
        startsAt: v.optional(v.number()),
        impact: v.optional(v.string()),
        country: v.optional(v.string()),
        currency: v.optional(v.string()),
        meta: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    symbols: v.array(v.string()),
    sources: v.array(
      v.object({
        sourceKey: v.string(),
        url: v.optional(v.string()),
        externalId: v.optional(v.string()),
        createdAt: v.number(),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const eventId = args.eventId.trim();
    if (!eventId) return { ok: false, symbols: [], sources: [], error: "Missing eventId" };

    try {
      const event: any = await ctx.runQuery(
        componentsUntyped.launchthat_news.events.queries.getEventById,
        { eventId: eventId as any },
      );
      if (!event) return { ok: true, symbols: [], sources: [], event: undefined };

      const symbolsRes: any[] = await ctx.runQuery(
        componentsUntyped.launchthat_news.events.queries.listSymbolsForEvent,
        { eventId: (event._id as unknown) as any },
      );
      const sourcesRes: any[] = await ctx.runQuery(
        componentsUntyped.launchthat_news.events.queries.listSourcesForEvent,
        { eventId: (event._id as unknown) as any, limit: 50 },
      );

      const symbols = (Array.isArray(symbolsRes) ? symbolsRes : [])
        .map((r: any) => String(r?.symbol ?? "").trim().toUpperCase())
        .filter(Boolean);

      const sources = (Array.isArray(sourcesRes) ? sourcesRes : []).map((r: any) => ({
        sourceKey: String(r?.sourceKey ?? ""),
        url: typeof r?.url === "string" ? r.url : undefined,
        externalId: typeof r?.externalId === "string" ? r.externalId : undefined,
        createdAt: Number(r?.createdAt ?? 0),
      }));

      return {
        ok: true,
        event: {
          _id: String(event._id),
          eventType: String(event.eventType ?? ""),
          canonicalKey: String(event.canonicalKey ?? ""),
          title: String(event.title ?? ""),
          summary: typeof event.summary === "string" ? event.summary : undefined,
          publishedAt: typeof event.publishedAt === "number" ? event.publishedAt : undefined,
          startsAt: typeof event.startsAt === "number" ? event.startsAt : undefined,
          impact: typeof event.impact === "string" ? event.impact : undefined,
          country: typeof event.country === "string" ? event.country : undefined,
          currency: typeof event.currency === "string" ? event.currency : undefined,
          meta: event.meta,
          createdAt: Number(event.createdAt ?? 0),
          updatedAt: Number(event.updatedAt ?? 0),
        },
        symbols,
        sources,
      };
    } catch (e) {
      return {
        ok: false,
        symbols: [],
        sources: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
});
