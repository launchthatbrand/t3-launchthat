"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars
*/
import crypto from "node:crypto";
import { v } from "convex/values";

import { action } from "../../_generated/server";

// IMPORTANT: Avoid importing the typed Convex `api`/`components` here — it can trigger TS
// "type instantiation is excessively deep". Pull via require() to keep it `any`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiUntyped: any = require("../../_generated/api").api;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../../_generated/api").components;

const traderlaunchpadConnectionsMutations =
  componentsUntyped.launchthat_traderlaunchpad.connections.mutations;
const traderlaunchpadConnectionsInternalQueries =
  componentsUntyped.launchthat_traderlaunchpad.connections.internalQueries;
const traderlaunchpadDraftMutations =
  componentsUntyped.launchthat_traderlaunchpad.connections.drafts;
const traderlaunchpadJournalMutations =
  componentsUntyped.launchthat_traderlaunchpad.journal.mutations;

const requireOrgMemberRef =
  apiUntyped.plugins.traderlaunchpad.permissions.requireOrgMember;
const getMeRef = apiUntyped.core.users.queries.getMe;

const encryptSecret = (plaintext: string, keyMaterial: string): string => {
  const key = crypto.createHash("sha256").update(keyMaterial).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
    dataB64: ciphertext.toString("base64"),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64",
  );
  return `enc_v1:${encoded}`;
};

const decryptSecret = (ciphertext: string, keyMaterial: string): string => {
  if (!ciphertext.startsWith("enc_v1:")) {
    throw new Error("Expected enc_v1 ciphertext");
  }
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    alg: string;
    ivB64: string;
    tagB64: string;
    dataB64: string;
  };
  if (parsed.alg !== "aes-256-gcm") {
    throw new Error("Unsupported ciphertext alg");
  }
  const key = crypto.createHash("sha256").update(keyMaterial).digest();
  const iv = Buffer.from(parsed.ivB64, "base64");
  const tag = Buffer.from(parsed.tagB64, "base64");
  const data = Buffer.from(parsed.dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
};

const requireTradeLockerSecretsKey = (): string => {
  const keyMaterial = process.env.TRADELOCKER_SECRETS_KEY;
  if (!keyMaterial) {
    throw new Error(
      "Missing TRADELOCKER_SECRETS_KEY env (required to encrypt TradeLocker tokens)",
    );
  }
  return keyMaterial;
};

const baseUrlForEnv = (env: "demo" | "live"): string => {
  // Docs specify base like `demo.tradelocker.com/backend-api/` (no scheme in docs).
  // We'll use https and keep the /backend-api prefix.
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

export const connectTradeLocker = action({
  args: {
    organizationId: v.id("organizations"),
    // NOTE: this id belongs to the *component* table `tradelockerConnectDrafts`,
    // so it must be treated as an opaque string at the portal app boundary.
    draftId: v.string(),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Member-only: each user connects their own broker account.
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

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
        organizationId: String(args.organizationId),
        userId: String(me._id),
      },
    );
    if (!consumed) {
      throw new Error("Connect session expired. Please try again.");
    }

    await ctx.runMutation(
      traderlaunchpadConnectionsMutations.upsertConnection,
      {
        organizationId: String(args.organizationId),
        userId: String(me._id),
        environment: consumed.environment === "live" ? "live" : "demo",
        server: String(consumed.server ?? ""),
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
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

    await ctx.runMutation(
      traderlaunchpadConnectionsMutations.deleteConnection,
      {
        organizationId: String(args.organizationId),
        userId: String(me._id),
      },
    );

    return { ok: true };
  },
});

export const listTradeLockerAccounts = action({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    accounts: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

    const secrets: any = await ctx.runQuery(
      traderlaunchpadConnectionsInternalQueries.getConnectionSecrets,
      { organizationId: String(args.organizationId), userId: String(me._id) },
    );
    if (!secrets || secrets.status !== "connected") {
      return { accounts: [] };
    }

    const keyMaterial = requireTradeLockerSecretsKey();
    const accessToken = decryptSecret(
      String(secrets.accessTokenEncrypted ?? ""),
      keyMaterial,
    );

    const baseUrl = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const res = await fetch(`${baseUrl}/auth/jwt/all-accounts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `TradeLocker all-accounts failed (${res.status}): ${text || "request failed"}`,
      );
    }

    const json: any = await res.json();
    const accounts = Array.isArray(json)
      ? json
      : Array.isArray(json?.accounts)
        ? json.accounts
        : [];
    return { accounts };
  },
});

export const startTradeLockerConnect = action({
  args: {
    organizationId: v.id("organizations"),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    // NOTE: this id belongs to the *component* table `tradelockerConnectDrafts`,
    // so it must be treated as an opaque string at the portal app boundary.
    draftId: v.string(),
    accounts: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

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

    const allAccountsRes = await fetch(`${baseUrl}/auth/jwt/all-accounts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
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

    const keyMaterial = requireTradeLockerSecretsKey();
    const accessTokenEncrypted = encryptSecret(accessToken, keyMaterial);
    const refreshTokenEncrypted = encryptSecret(refreshToken, keyMaterial);

    const draftId = await ctx.runMutation(
      traderlaunchpadDraftMutations.createConnectDraft,
      {
        organizationId: String(args.organizationId),
        userId: String(me._id),
        environment: args.environment,
        server,
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

export const syncMyTradeLockerNow = action({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    ok: v.boolean(),
    result: v.any(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const internalAny: any = require("../../_generated/api").internal;

    const result = await ctx.runAction(
      internalAny.plugins.traderlaunchpad.sync.syncTradeLockerConnection,
      {
        organizationId: String(args.organizationId),
        userId: String(me._id),
        limit: 500,
      },
    );

    return { ok: true, result };
  },
});

export const setMyJournalPublic = action({
  args: {
    organizationId: v.id("organizations"),
    isPublic: v.boolean(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, {
      organizationId: String(args.organizationId),
    });

    const me: any = await ctx.runQuery(getMeRef, {});
    if (!me?._id) throw new Error("User not found");

    await ctx.runMutation(traderlaunchpadJournalMutations.upsertProfile, {
      organizationId: String(args.organizationId),
      userId: String(me._id),
      isPublic: args.isPublic,
    });

    return { ok: true };
  },
});
