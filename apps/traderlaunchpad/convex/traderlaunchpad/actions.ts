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
  },
  returns: v.object({
    // NOTE: this id belongs to the *component* table `tradelockerConnectDrafts`,
    // so it must be treated as an opaque string at the app boundary.
    draftId: v.string(),
    accounts: v.array(v.any()),
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

    const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE ?? "raw";
    const secretsKey = env.TRADELOCKER_SECRETS_KEY;
    const accessTokenEncrypted =
      tokenStorage === "enc"
        ? await encryptSecret(accessToken, secretsKey)
        : accessToken;
    const refreshTokenEncrypted =
      tokenStorage === "enc"
        ? await encryptSecret(refreshToken, secretsKey)
        : refreshToken;

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

    return { draftId, accounts };
  },
});

export const connectTradeLocker = action({
  args: {
    // NOTE: this id belongs to the *component* table `tradelockerConnectDrafts`,
    // so it must be treated as an opaque string at the app boundary.
    draftId: v.string(),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
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

    await ctx.runMutation(
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

    return { ok: true, result };
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

export const pricedataGetPublicBars = action({
  args: {
    symbol: v.string(),
    resolution: v.string(),
    lookbackDays: v.number(),
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
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const symbol = normalizeSymbol(args.symbol);
    const resolution = args.resolution.trim();
    const lookbackDays = Math.max(1, Math.min(30, Math.floor(args.lookbackDays)));

    const source = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.sources.queries.getDefaultSource,
      {},
    );
    const sourceKey =
      typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) {
      return { ok: false, sourceKey: undefined, symbol, resolution, bars: [], error: "No default price source configured." };
    }

    const instrument = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
      { sourceKey, symbol },
    );
    if (!instrument || typeof instrument.tradableInstrumentId !== "string") {
      return { ok: false, sourceKey, symbol, resolution, bars: [], error: "Symbol is not mapped for the default source yet." };
    }

    const toMs = Date.now();
    const fromMs = toMs - lookbackDays * DAY_MS;

    const chunks = await ctx.runQuery(
      componentsUntyped.launchthat_pricedata.bars.queries.getBarChunks,
      {
        sourceKey,
        tradableInstrumentId: instrument.tradableInstrumentId,
        resolution,
        fromMs,
        toMs,
      },
    );

    const bars = (Array.isArray(chunks) ? chunks : [])
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
        (b) =>
          Number.isFinite(b.t) &&
          Number.isFinite(b.o) &&
          Number.isFinite(b.h) &&
          Number.isFinite(b.l) &&
          Number.isFinite(b.c) &&
          Number.isFinite(b.v),
      )
      .sort((a, b) => a.t - b.t);

    return { ok: true, sourceKey, symbol, resolution, bars };
  },
});

export const pricedataEnsurePublicBarsCached = action({
  args: {
    symbol: v.string(),
    resolution: v.string(),
    lookbackDays: v.number(),
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
    const lookbackDays = Math.max(1, Math.min(30, Math.floor(args.lookbackDays)));

    const source = await ctx.runQuery(
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
        error: "No default price source configured. Set it in Admin → Settings → Connections.",
      };
    }

    console.log("[pricedataEnsurePublicBarsCached] start", {
      symbol,
      resolution,
      lookbackDays,
      sourceKey,
    });

    const seedRef = source?.seedRef;
    const seedOrg =
      typeof seedRef?.organizationId === "string" ? seedRef.organizationId : "";
    const seedUser = typeof seedRef?.userId === "string" ? seedRef.userId : "";
    if (!seedOrg || !seedUser) {
      return {
        ok: false,
        sourceKey,
        symbol,
        resolution,
        error: "Default price source has no seedRef. Set it in Admin → Settings → Connections.",
      };
    }

    console.log("[pricedataEnsurePublicBarsCached] seedRef", { seedOrg, seedUser });

    // 1) Load seed connection secrets to get TradeLocker tokens + account identifiers
    const secrets = await ctx.runQuery(
      traderlaunchpadConnectionsInternal.getConnectionSecrets,
      { organizationId: seedOrg, userId: seedUser },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        sourceKey,
        symbol,
        resolution,
        error: "Seed TradeLocker connection is not connected.",
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

    // 3) Fetch bars
    const toMs = Date.now();
    const fromMs = toMs - lookbackDays * DAY_MS;

    const history = await ctx.runAction(
      componentsUntyped.launchthat_pricedata.tradelocker.actions.fetchHistory,
      {
        baseUrl,
        accessToken,
        refreshToken,
        accNum,
        tradableInstrumentId,
        infoRouteId,
        resolution,
        fromMs,
        toMs,
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

    // Persist refreshed tokens (best effort)
    if (history?.refreshed?.accessToken && history?.refreshed?.refreshToken) {
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

    const bars: any[] = Array.isArray(history?.bars) ? history.bars : [];

    // 4) Chunk + store bars by UTC day
    const buckets = new Map<number, any[]>();
    for (const b of bars) {
      const t = Number(b?.t);
      if (!Number.isFinite(t)) continue;
      const start = utcDayStartMs(t);
      const list = buckets.get(start);
      if (list) list.push(b);
      else buckets.set(start, [b]);
    }

    let stored = 0;
    for (const [chunkStartMs, chunkBars] of buckets) {
      const normalizedBars = chunkBars
        .map((b) => ({
          t: Number(b?.t),
          o: Number(b?.o),
          h: Number(b?.h),
          l: Number(b?.l),
          c: Number(b?.c),
          v: Number(b?.v),
        }))
        .filter(
          (b) =>
            Number.isFinite(b.t) &&
            Number.isFinite(b.o) &&
            Number.isFinite(b.h) &&
            Number.isFinite(b.l) &&
            Number.isFinite(b.c) &&
            Number.isFinite(b.v),
        )
        .sort((a, b) => a.t - b.t);

      await ctx.runMutation(
        componentsUntyped.launchthat_pricedata.bars.mutations.upsertBarChunk,
        {
          sourceKey,
          tradableInstrumentId,
          resolution,
          chunkStartMs,
          chunkEndMs: chunkStartMs + DAY_MS,
          bars: normalizedBars,
        },
      );
      stored += normalizedBars.length;
    }

    return { ok: true, sourceKey, symbol, resolution, barsStored: stored };
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
