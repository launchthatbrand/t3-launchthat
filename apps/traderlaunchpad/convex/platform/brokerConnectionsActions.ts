/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import { action } from "../_generated/server";
import { v } from "convex/values";

// Avoid typed api imports here (can cause TS deep instantiation errors in node actions).
const internal: any = require("../_generated/api").internal;
const componentsUntyped: any = require("../_generated/api").components;
const platform = componentsUntyped.launchthat_traderlaunchpad.connections.platform;

const developerKeyHeader = (): Record<string, string> => {
  const key = process.env.TRADELOCKER_DEVELOPER_API_KEY;
  if (!key) return {};
  return { "tl-developer-api-key": key };
};

const baseUrlForEnv = (envName: "demo" | "live"): string =>
  `https://${envName}.tradelocker.com/backend-api`;

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
    const payload = JSON.parse(base64UrlDecode(parts[1] ?? "")) as { host?: string };
    return typeof payload.host === "string" && payload.host.trim() ? payload.host.trim() : null;
  } catch {
    return null;
  }
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const base64Encode = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");
const base64Decode = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, "base64"));

const deriveAesKey = async (keyMaterial: string): Promise<CryptoKey> => {
  const keyBytes = await crypto.subtle.digest("SHA-256", toArrayBuffer(textEncoder.encode(keyMaterial)));
  return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
};

const encryptSecret = async (plaintext: string, keyMaterial: string): Promise<string> => {
  const key = await deriveAesKey(keyMaterial);
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const iv = toArrayBuffer(ivBytes);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(textEncoder.encode(plaintext))),
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

interface JwtTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiration?: number;
  refreshTokenExpiration?: number;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
}

export const startPlatformTradeLockerConnect = action({
  args: {
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    email: v.string(),
    password: v.string(),
    label: v.optional(v.string()),
    debugReturnTokens: v.optional(v.boolean()),
  },
  returns: v.object({
    draftId: v.string(),
    accounts: v.array(v.any()),
    debugTokens: v.optional(v.object({ accessToken: v.string(), refreshToken: v.string() })),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});

    const server = args.server.trim();
    const email = args.email.trim();
    const password = args.password;
    if (!server || !email || !password) throw new Error("Missing email/password/server");

    const baseUrl = baseUrlForEnv(args.environment);
    const res = await fetch(`${baseUrl}/auth/jwt/token`, {
      method: "POST",
      headers: { "content-type": "application/json", ...developerKeyHeader() },
      body: JSON.stringify({ email, password, server }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`TradeLocker auth failed (${res.status}): ${text || "request failed"}`);
    }

    const json = (await res.json()) as JwtTokenResponse;
    const accessToken = typeof json.accessToken === "string" ? json.accessToken : "";
    const refreshToken = typeof json.refreshToken === "string" ? json.refreshToken : "";
    if (!accessToken || !refreshToken) throw new Error("TradeLocker auth response missing tokens");

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
    const baseUrlResolved = jwtHost ? `https://${jwtHost}/backend-api` : baseUrl;

    const allAccountsRes = await fetch(`${baseUrlResolved}/auth/jwt/all-accounts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, ...developerKeyHeader() },
    });
    if (!allAccountsRes.ok) {
      const text = await allAccountsRes.text().catch(() => "");
      throw new Error(`TradeLocker all-accounts failed (${allAccountsRes.status}): ${text || "request failed"}`);
    }
    const accountsJson: any = await allAccountsRes.json();
    const accounts = Array.isArray(accountsJson)
      ? accountsJson
      : Array.isArray(accountsJson?.accounts)
        ? accountsJson.accounts
        : [];

    const tokenStorage = process.env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = process.env.TRADELOCKER_SECRETS_KEY;
    let accessTokenEncrypted = accessToken;
    let refreshTokenEncrypted = refreshToken;
    if (tokenStorage === "enc") {
      if (!secretsKey) throw new Error("Missing TRADELOCKER_SECRETS_KEY for encrypted token storage");
      accessTokenEncrypted = await encryptSecret(accessToken, secretsKey);
      refreshTokenEncrypted = await encryptSecret(refreshToken, secretsKey);
    }

    const draftId: any = await ctx.runMutation(platform.createTradeLockerConnectDraft, {
      environment: args.environment,
      server,
      jwtHost,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const debugTokens = undefined;

    return { draftId, accounts, debugTokens };
  },
});

export const connectPlatformTradeLocker = action({
  args: {
    draftId: v.string(),
    label: v.optional(v.string()),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
    // Optional: pass full list from step 1 so we can persist all accounts without re-fetching.
    accounts: v.optional(v.array(v.any())),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});

    const consumed: any = await ctx.runMutation(platform.consumeTradeLockerConnectDraft, {
      draftId: (args.draftId as unknown) as any,
    });
    if (!consumed) throw new Error("Connect session expired. Please try again.");

    const selectedAccountId = args.selectedAccountId.trim();
    const selectedAccNum = Number(args.selectedAccNum);
    if (!selectedAccountId) throw new Error("Missing selectedAccountId");
    if (!Number.isFinite(selectedAccNum) || selectedAccNum <= 0) throw new Error("Invalid selectedAccNum");

    // Choose existing default connection to overwrite, if any.
    const existing: any[] = await ctx.runQuery(platform.listConnections, {
      provider: "tradelocker",
      limit: 50,
    });
    const list = Array.isArray(existing) ? existing : [];
    const currentDefault = list.find((c) => Boolean(c?.isDefault)) ?? null;

    const rawAccounts = Array.isArray(args.accounts) ? args.accounts : [];
    const accountRows = rawAccounts
      .filter((r) => r && typeof r === "object")
      .map((r: any) => ({
        accountId: typeof r.accountId === "string" ? r.accountId : typeof r.id === "string" ? r.id : "",
        accNum: typeof r.accNum === "number" ? r.accNum : Number(r.accNum),
        name: typeof r.name === "string" ? r.name : undefined,
        currency: typeof r.currency === "string" ? r.currency : undefined,
        status: typeof r.status === "string" ? r.status : undefined,
      }))
      .filter((r) => r.accountId && Number.isFinite(r.accNum) && r.accNum > 0);

    const accountsToPersist =
      accountRows.length > 0
        ? accountRows
        : [
          {
            accountId: selectedAccountId,
            accNum: selectedAccNum,
            name: undefined,
            currency: undefined,
            status: undefined,
          },
        ];

    await ctx.runMutation(platform.upsertTradeLockerConnectionWithSecrets, {
      connectionId: currentDefault ? currentDefault._id : undefined,
      label: args.label?.trim() ? args.label.trim() : "TradeLocker",
      status: "active",
      makeDefault: true,
      environment: consumed.environment === "live" ? "live" : "demo",
      server: String(consumed.server ?? ""),
      jwtHost: typeof consumed.jwtHost === "string" ? consumed.jwtHost : undefined,
      selectedAccountId,
      selectedAccNum: selectedAccNum,
      accessTokenEncrypted: String(consumed.accessTokenEncrypted ?? ""),
      refreshTokenEncrypted: String(consumed.refreshTokenEncrypted ?? ""),
      accessTokenExpiresAt: consumed.accessTokenExpiresAt,
      refreshTokenExpiresAt: consumed.refreshTokenExpiresAt,
      accounts: accountsToPersist,
    });

    return { ok: true };
  },
});

export const refreshPlatformTradeLockerAccountConfig = action({
  args: {
    accountRowId: v.string(),
    accNum: v.number(),
    includeDeveloperKey: v.optional(v.boolean()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});

    // Find default platform TradeLocker connection.
    const existing: any[] = await ctx.runQuery(platform.listConnections, {
      provider: "tradelocker",
      limit: 50,
    });
    const list = Array.isArray(existing) ? existing : [];
    const currentDefault = list.find((c) => Boolean(c?.isDefault)) ?? list[0] ?? null;
    if (!currentDefault) throw new Error("No platform TradeLocker connection configured");

    const secretsRes: any = await ctx.runQuery(platform.getConnectionSecrets, {
      connectionId: currentDefault._id,
    });
    if (!secretsRes?.secrets) throw new Error("Missing connection secrets");
    const secrets = secretsRes.secrets;

    const tokenStorage = process.env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = process.env.TRADELOCKER_SECRETS_KEY;
    const accessTokenCipher = String(secrets.accessTokenEncrypted ?? "");
    const refreshTokenCipher = String(secrets.refreshTokenEncrypted ?? "");
    let accessToken = accessTokenCipher;
    let refreshToken = refreshTokenCipher;
    if (tokenStorage === "enc") {
      if (!secretsKey) throw new Error("Missing TRADELOCKER_SECRETS_KEY for encrypted token storage");
      accessToken = await decryptSecret(accessTokenCipher, secretsKey);
      refreshToken = await decryptSecret(refreshTokenCipher, secretsKey);
    }

    const envName = secrets.environment === "live" ? "live" : "demo";
    const baseUrl = secrets.jwtHost ? `https://${secrets.jwtHost}/backend-api` : baseUrlForEnv(envName);

    const includeDeveloperKeyParam = args.includeDeveloperKey !== false;
    const envDeveloperKey =
      typeof process.env.TRADELOCKER_DEVELOPER_API_KEY === "string"
        ? process.env.TRADELOCKER_DEVELOPER_API_KEY
        : "";
    const envHasDeveloperKey = Boolean(envDeveloperKey.trim());
    const sentDeveloperKeyHeader = includeDeveloperKeyParam && envHasDeveloperKey;

    const fetchTradeConfig = async (token: string) => {
      const res = await fetch(`${baseUrl}/trade/config`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          accNum: String(args.accNum),
          ...(includeDeveloperKeyParam ? developerKeyHeader() : {}),
        },
      });
      const text = await res.text().catch(() => "");
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      return { res, text, json };
    };

    let didRefreshTokens = false;
    let cfg = await fetchTradeConfig(accessToken);

    // If the token is expired, attempt to refresh and retry.
    const shouldAttemptRefresh =
      (cfg.res.status === 401 || cfg.res.status === 403) &&
      typeof refreshToken === "string" &&
      refreshToken.trim().length > 0;

    if (shouldAttemptRefresh) {
      const refreshRes = await fetch(`${baseUrl}/auth/jwt/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshText = await refreshRes.text().catch(() => "");
      let refreshJson: any = null;
      try {
        refreshJson = refreshText ? JSON.parse(refreshText) : null;
      } catch {
        refreshJson = null;
      }

      const refreshedAccessToken: string =
        typeof refreshJson?.accessToken === "string" ? refreshJson.accessToken : "";
      const refreshedRefreshToken: string =
        typeof refreshJson?.refreshToken === "string" ? refreshJson.refreshToken : "";
      const expireDateMsRaw =
        typeof refreshJson?.expireDate === "string" ? Date.parse(String(refreshJson.expireDate)) : NaN;
      const accessTokenExpiresAt = Number.isFinite(expireDateMsRaw) ? expireDateMsRaw : undefined;

      if (refreshRes.ok && refreshedAccessToken && refreshedRefreshToken) {
        didRefreshTokens = true;
        accessToken = refreshedAccessToken;
        refreshToken = refreshedRefreshToken;

        // Persist refreshed tokens back onto the platform connection secrets.
        const jwtHost =
          extractJwtHost(refreshedAccessToken) ??
          (typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined);
        let accessTokenEncrypted = refreshedAccessToken;
        let refreshTokenEncrypted = refreshedRefreshToken;
        if (tokenStorage === "enc") {
          const secretsKeyStr = typeof secretsKey === "string" ? secretsKey : "";
          if (!secretsKeyStr) {
            throw new Error("Missing TRADELOCKER_SECRETS_KEY for encrypted token storage");
          }
          accessTokenEncrypted = await encryptSecret(refreshedAccessToken, secretsKeyStr);
          refreshTokenEncrypted = await encryptSecret(refreshedRefreshToken, secretsKeyStr);
        }

        // Preserve current account rows; also ensure selected account fields are set.
        const accountsRaw: any[] = await ctx.runQuery(platform.listConnectionAccounts, {
          connectionId: currentDefault._id,
        });
        const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];

        const selectedAccNum =
          typeof secrets.selectedAccNum === "number" && Number.isFinite(secrets.selectedAccNum)
            ? secrets.selectedAccNum
            : Number(args.accNum);
        const selectedAccountIdFromSecrets: string =
          typeof secrets.selectedAccountId === "string" ? secrets.selectedAccountId : "";
        const selectedAccountId =
          selectedAccountIdFromSecrets.trim()
            ? selectedAccountIdFromSecrets.trim()
            : (accounts.find((a: any) => Number(a?.accNum) === Number(args.accNum))?.accountId as string | undefined) ??
              "";

        await ctx.runMutation(platform.upsertTradeLockerConnectionWithSecrets, {
          connectionId: currentDefault._id,
          label: String(currentDefault.label ?? "TradeLocker"),
          status: currentDefault.status === "disabled" ? "disabled" : "active",
          makeDefault: Boolean(currentDefault.isDefault),
          environment: envName,
          server: String(secrets.server ?? ""),
          jwtHost: typeof jwtHost === "string" ? jwtHost : undefined,
          selectedAccountId,
          selectedAccNum,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt,
          refreshTokenExpiresAt:
            typeof secrets.refreshTokenExpiresAt === "number" ? secrets.refreshTokenExpiresAt : undefined,
          accounts: accounts.map((a: any) => ({
            accountId: String(a?.accountId ?? ""),
            accNum: Number(a?.accNum ?? NaN),
            name: typeof a?.name === "string" ? a.name : undefined,
            currency: typeof a?.currency === "string" ? a.currency : undefined,
            status: typeof a?.status === "string" ? a.status : undefined,
          })),
        });

        // Retry config with fresh access token.
        cfg = await fetchTradeConfig(accessToken);
      } else {
        // If refresh fails, keep original cfg and expose refresh error in debug payload.
        cfg = {
          ...cfg,
          json: cfg.json ?? refreshJson ?? { refreshError: refreshText.slice(0, 500) },
        };
      }
    }

    const res = cfg.res;
    const json: Record<string, unknown> = (() => {
      const payload = cfg.json;
      const debug = {
        includeDeveloperKeyParam,
        envHasDeveloperKey,
        sentDeveloperKeyHeader,
        didRefreshTokens,
      };
      if (payload && typeof payload === "object") {
        return { ...(payload as Record<string, unknown>), _debug: debug };
      }
      return { payload, _debug: debug };
    })();

    const customerAccessRaw: unknown = (json as any).d?.customerAccess;
    const customerAccess =
      customerAccessRaw && typeof customerAccessRaw === "object"
        ? (() => {
          const ca = customerAccessRaw as Record<string, unknown>;
          return {
            orders: Boolean(ca.orders),
            ordersHistory: Boolean(ca.ordersHistory),
            filledOrders: Boolean(ca.filledOrders),
            positions: Boolean(ca.positions),
            symbolInfo: Boolean(ca.symbolInfo),
            marketDepth: Boolean(ca.marketDepth),
          };
        })()
        : undefined;

    await ctx.runMutation(platform.updateConnectionAccountDebug, {
      accountRowId: (args.accountRowId as unknown) as any,
      lastConfigOk: Boolean(res.ok),
      customerAccess,
      lastConfigError: res.ok ? undefined : `TradeLocker /trade/config failed (${res.status})`,
      lastConfigRaw: json,
    });

    return { ok: true };
  },
});

export const disconnectPlatformTradeLocker = action({
  args: {},
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx) => {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});

    const existing: any[] = await ctx.runQuery(platform.listConnections, {
      provider: "tradelocker",
      limit: 50,
    });
    const list = Array.isArray(existing) ? existing : [];
    const currentDefault = list.find((c) => Boolean(c?.isDefault)) ?? list[0] ?? null;
    if (!currentDefault) return { ok: true };

    await ctx.runMutation(platform.deleteConnection, { connectionId: currentDefault._id });
    return { ok: true };
  },
});

