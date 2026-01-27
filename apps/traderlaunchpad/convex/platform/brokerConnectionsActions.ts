"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { env } from "../../src/env";

// Avoid typed api imports here (can cause TS deep instantiation errors in node actions).
const internal: any = require("../_generated/api").internal;
const componentsUntyped: any = require("../_generated/api").components;
const platform = componentsUntyped.launchthat_traderlaunchpad.connections.platform;

const developerKeyHeader = (): Record<string, string> => {
  const key = env.TRADELOCKER_DEVELOPER_API_KEY;
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

    const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = env.TRADELOCKER_SECRETS_KEY;
    const accessTokenEncrypted =
      tokenStorage === "enc" ? await encryptSecret(accessToken, secretsKey) : accessToken;
    const refreshTokenEncrypted =
      tokenStorage === "enc" ? await encryptSecret(refreshToken, secretsKey) : refreshToken;

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

    const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = env.TRADELOCKER_SECRETS_KEY;
    const accessTokenCipher = String(secrets.accessTokenEncrypted ?? "");
    const accessToken =
      tokenStorage === "enc" ? await decryptSecret(accessTokenCipher, secretsKey) : accessTokenCipher;

    const envName = secrets.environment === "live" ? "live" : "demo";
    const baseUrl = secrets.jwtHost ? `https://${secrets.jwtHost}/backend-api` : baseUrlForEnv(envName);

    const res = await fetch(`${baseUrl}/trade/config`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accNum: String(args.accNum),
        ...developerKeyHeader(),
      },
    });
    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const customerAccessRaw =
      json?.d && typeof json.d === "object" ? (json.d as any).customerAccess : undefined;
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

