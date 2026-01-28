"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { env } from "../../src/env";
import { internal } from "../_generated/api";

// Avoid typed api imports here (can cause TS deep instantiation errors in node actions).
const componentsUntyped: any = require("../_generated/api").components;
const platformConnections = componentsUntyped.launchthat_traderlaunchpad.connections.platform;
const pricedataTradeLocker = componentsUntyped.launchthat_pricedata.tradelocker.actions;

const requirePlatformAdmin = async (ctx: any) => {
  // Dev bypass lives in platform/testsAuth.ts; prod still requires identity+isAdmin.
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

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

type ResolvedConnection = {
  connectionId: string;
  label: string;
  sourceKey: string;
  environment: "demo" | "live";
  server: string;
  jwtHost?: string;
  secrets: any;
};

const resolveConnections = async (ctx: any): Promise<ResolvedConnection[]> => {
  const connections: any[] = await ctx.runQuery(platformConnections.listConnections, {
    provider: "tradelocker",
    limit: 200,
  });

  const out: ResolvedConnection[] = [];
  for (const c of Array.isArray(connections) ? connections : []) {
    const secretsRes = await ctx.runQuery(platformConnections.getConnectionSecrets, {
      connectionId: c._id,
    });
    const secrets = secretsRes?.secrets ?? null;
    if (!secrets) continue;

    const environment = secrets.environment === "live" ? ("live" as const) : ("demo" as const);
    const server = String(secrets.server ?? "");
    const jwtHost = typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined;
    const sourceKey = computeTradeLockerSourceKey({ environment, jwtHost, server });

    out.push({
      connectionId: String(c._id ?? ""),
      label: String(c.label ?? ""),
      sourceKey,
      environment,
      server,
      jwtHost,
      secrets,
    });
  }
  return out;
};

export const listConfiguredSources = action({
  args: {},
  returns: v.array(
    v.object({
      connectionId: v.string(),
      label: v.string(),
      sourceKey: v.string(),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const resolved = await resolveConnections(ctx);
    return resolved.map((r) => ({
      connectionId: r.connectionId,
      label: r.label,
      sourceKey: r.sourceKey,
      environment: r.environment,
      server: r.server,
      jwtHost: r.jwtHost,
    }));
  },
});

export const listInstrumentsForSourceKey = action({
  args: {
    sourceKey: v.string(),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradableInstrumentId: v.string(),
      symbol: v.string(),
      infoRouteId: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKey = args.sourceKey.trim().toLowerCase();
    if (!sourceKey) return [];
    const limit = Math.max(1, Math.min(2000, Number(args.limit ?? 400)));
    const q = typeof args.search === "string" ? args.search.trim().toUpperCase() : "";

    const resolved = await resolveConnections(ctx);
    const match = resolved.find((c) => c.sourceKey === sourceKey);
    if (!match) return [];

    const tokenStorage = env.TRADELOCKER_TOKEN_STORAGE;
    const secretsKey = env.TRADELOCKER_SECRETS_KEY;

    const accessTokenEncrypted = String(match.secrets.accessTokenEncrypted ?? "");
    const refreshTokenEncrypted = String(match.secrets.refreshTokenEncrypted ?? "");

    let accessToken = accessTokenEncrypted;
    let refreshToken = refreshTokenEncrypted;
    if (tokenStorage === "enc") {
      if (!secretsKey) throw new Error("Missing TRADELOCKER_SECRETS_KEY for encrypted token storage");
      accessToken = await decryptSecret(accessTokenEncrypted, secretsKey);
      refreshToken = await decryptSecret(refreshTokenEncrypted, secretsKey);
    }

    const baseUrl = match.jwtHost ? `https://${match.jwtHost}/backend-api` : baseUrlForEnv(match.environment);
    const accNum = Number(match.secrets.selectedAccNum ?? NaN);
    if (!Number.isFinite(accNum)) throw new Error("Platform connection missing selectedAccNum");
    const accountId = String(match.secrets.selectedAccountId ?? "").trim();
    if (!accountId) throw new Error("Platform connection missing selectedAccountId");

    const developerKey = env.TRADELOCKER_DEVELOPER_API_KEY;

    const instrumentsRes = await ctx.runAction(pricedataTradeLocker.fetchInstruments, {
      baseUrl,
      accessToken,
      refreshToken,
      accNum,
      accountId,
      developerKey,
    });
    const instruments: any[] = Array.isArray(instrumentsRes?.instruments) ? instrumentsRes.instruments : [];

    const mapped = instruments
      .map((i) => ({
        tradableInstrumentId: String(i?.tradableInstrumentId ?? "").trim(),
        symbol: String(i?.symbol ?? "").trim().toUpperCase(),
        infoRouteId: Number.isFinite(Number(i?.infoRouteId ?? NaN)) ? Number(i.infoRouteId) : undefined,
      }))
      .filter((x) => x.tradableInstrumentId && x.symbol);

    const filtered = q ? mapped.filter((x) => x.symbol.includes(q)) : mapped;
    return filtered.slice(0, limit);
  },
});

