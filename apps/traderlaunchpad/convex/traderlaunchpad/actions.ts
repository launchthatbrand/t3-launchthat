"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/
import { v } from "convex/values";

import { action } from "../_generated/server";
import { env } from "../../src/env";
import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

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

const baseUrlForEnv = (env: "demo" | "live"): string => {
  return `https://${env}.tradelocker.com/backend-api`;
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
      headers: { "content-type": "application/json" },
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
      headers: { Authorization: `Bearer ${accessToken}` },
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
