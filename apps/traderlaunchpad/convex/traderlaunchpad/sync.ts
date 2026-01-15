"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/consistent-type-definitions,
  turbo/no-undeclared-env-vars
*/
import crypto from "node:crypto";
import { v } from "convex/values";

import { internalAction } from "../_generated/server";

// NOTE: Avoid typed imports here (can cause TS deep instantiation errors).
const components: any = require("../_generated/api").components;

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

const requireTradeLockerSecretsKey = (): string => {
  const keyMaterial = process.env.TRADELOCKER_SECRETS_KEY;
  if (!keyMaterial) {
    throw new Error("Missing TRADELOCKER_SECRETS_KEY env");
  }
  return keyMaterial;
};

const baseUrlForEnv = (env: "demo" | "live"): string =>
  `https://${env}.tradelocker.com/backend-api`;

const tradeLockerApi = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum: number;
  path: string;
}): Promise<{ ok: boolean; status: number; text: string; json: any }> => {
  const res = await fetch(`${args.baseUrl}${args.path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      accNum: String(args.accNum),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
};

const tradeLockerAllAccounts = async (args: {
  baseUrl: string;
  accessToken: string;
}): Promise<{ ok: boolean; status: number; text: string; accounts: any[] }> => {
  const res = await fetch(`${args.baseUrl}/auth/jwt/all-accounts`, {
    method: "GET",
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, text, accounts: [] };
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  const accounts = Array.isArray(json)
    ? json
    : Array.isArray(json?.accounts)
      ? json.accounts
      : [];
  return { ok: true, status: res.status, text, accounts };
};

const refreshAccessToken = async (args: {
  baseUrl: string;
  refreshToken: string;
}): Promise<{
  ok: boolean;
  status: number;
  text: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
}> => {
  const res = await fetch(`${args.baseUrl}/auth/jwt/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: args.refreshToken }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, text };

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  const accessToken =
    typeof json?.accessToken === "string" ? (json.accessToken as string) : "";
  const refreshToken =
    typeof json?.refreshToken === "string" ? (json.refreshToken as string) : "";

  const accessTokenExpiresAt =
    typeof json?.accessTokenExpiresAt === "number"
      ? (json.accessTokenExpiresAt as number)
      : typeof json?.accessTokenExpiration === "number"
        ? (json.accessTokenExpiration as number)
        : undefined;
  const refreshTokenExpiresAt =
    typeof json?.refreshTokenExpiresAt === "number"
      ? (json.refreshTokenExpiresAt as number)
      : typeof json?.refreshTokenExpiration === "number"
        ? (json.refreshTokenExpiration as number)
        : undefined;

  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      status: 500,
      text: "refresh response missing tokens",
    };
  }

  return {
    ok: true,
    status: res.status,
    text,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};

const normalizeNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

type NormalizedOrder = {
  externalOrderId: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  status?: string;
  createdAt?: number;
  closedAt?: number;
  raw: any;
};

type NormalizedExecution = {
  externalExecutionId: string;
  externalOrderId?: string;
  externalPositionId?: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  executedAt: number;
  price?: number;
  qty?: number;
  fees?: number;
  raw: any;
};

type InstrumentInfo = {
  symbol?: string;
};

const log = async (
  ctx: any,
  args: {
    organizationId: string;
    level: "info" | "warn" | "error";
    message: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> => {
  const payload = {
    orgId: args.organizationId,
    level: args.level,
    message: args.message,
    ...((args.metadata ?? {}) as any),
  };
  if (args.level === "error") console.error("[tradelocker]", payload);
  else if (args.level === "warn") console.warn("[tradelocker]", payload);
  else console.log("[tradelocker]", payload);
};

const parseConfigColumns = (configJson: any) => {
  const ordersCols: Array<{ id: string }> =
    Array.isArray(configJson?.d?.ordersConfig?.columns) &&
    configJson.d.ordersConfig.columns.length > 0
      ? configJson.d.ordersConfig.columns
      : [];
  const historyCols: Array<{ id: string }> =
    Array.isArray(configJson?.d?.ordersHistoryConfig?.columns) &&
    configJson.d.ordersHistoryConfig.columns.length > 0
      ? configJson.d.ordersHistoryConfig.columns
      : [];
  const positionsCols: Array<{ id: string }> =
    Array.isArray(configJson?.d?.positionsConfig?.columns) &&
    configJson.d.positionsConfig.columns.length > 0
      ? configJson.d.positionsConfig.columns
      : [];
  const accountDetailsCols: Array<{ id: string }> =
    Array.isArray(configJson?.d?.accountDetailsConfig?.columns) &&
    configJson.d.accountDetailsConfig.columns.length > 0
      ? configJson.d.accountDetailsConfig.columns
      : [];
  return { ordersCols, historyCols, positionsCols, accountDetailsCols };
};

const mapRows = (cols: Array<{ id: string }>, rows: any): any[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    if (!Array.isArray(r)) return r;
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < cols.length; i++) {
      obj[cols[i]!.id] = r[i];
    }
    return obj;
  });
};

const instrumentCache = new Map<string, InstrumentInfo>();

const getInstrumentInfo = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum: number;
  instrumentId: string;
}): Promise<InstrumentInfo> => {
  const key = `${args.baseUrl}:${args.instrumentId}`;
  const cached = instrumentCache.get(key);
  if (cached) return cached;

  // Best-effort lookup: TradeLocker has a few instrument endpoints depending on server/env.
  const attempts = [
    `/instruments/${encodeURIComponent(args.instrumentId)}`,
    `/trade/instruments/${encodeURIComponent(args.instrumentId)}`,
    `/trade/instruments/info/${encodeURIComponent(args.instrumentId)}`,
  ];

  for (const path of attempts) {
    const res = await fetch(`${args.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        accNum: String(args.accNum),
      },
    });
    if (!res.ok) continue;
    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const symbol =
      typeof json?.d?.symbol === "string"
        ? json.d.symbol
        : typeof json?.symbol === "string"
          ? json.symbol
          : typeof json?.d?.name === "string"
            ? json.d.name
            : undefined;

    const info: InstrumentInfo = { symbol };
    instrumentCache.set(key, info);
    return info;
  }

  const fallback: InstrumentInfo = {};
  instrumentCache.set(key, fallback);
  return fallback;
};

const normalizeOrders = (args: { rows: any[] }): NormalizedOrder[] => {
  const result: NormalizedOrder[] = [];
  for (const r of args.rows) {
    const externalOrderIdRaw = (r?.orderId ??
      r?.id ??
      r?.externalOrderId) as unknown;
    const externalOrderId =
      typeof externalOrderIdRaw === "string"
        ? externalOrderIdRaw.trim()
        : externalOrderIdRaw != null
          ? String(externalOrderIdRaw)
          : "";
    if (!externalOrderId) continue;

    const instrumentId =
      typeof r?.tradableInstrumentId === "string"
        ? r.tradableInstrumentId
        : typeof r?.instrumentId === "string"
          ? r.instrumentId
          : undefined;

    const side =
      r?.side === "buy" || r?.side === "sell"
        ? (r.side as "buy" | "sell")
        : r?.direction === "buy" || r?.direction === "sell"
          ? (r.direction as "buy" | "sell")
          : undefined;

    const status = typeof r?.status === "string" ? r.status : undefined;
    const createdAt = normalizeNumber(r?.createdAt ?? r?.createdTime);
    const closedAt = normalizeNumber(r?.closedAt ?? r?.closedTime);

    result.push({
      externalOrderId,
      instrumentId,
      side,
      status,
      createdAt,
      closedAt,
      raw: r,
    });
  }
  return result;
};

const normalizeExecutions = (args: { rows: any[] }): NormalizedExecution[] => {
  const result: NormalizedExecution[] = [];
  for (const r of args.rows) {
    const externalExecutionIdRaw = (r?.executionId ??
      r?.id ??
      r?.externalExecutionId) as unknown;
    const externalExecutionId =
      typeof externalExecutionIdRaw === "string"
        ? externalExecutionIdRaw.trim()
        : externalExecutionIdRaw != null
          ? String(externalExecutionIdRaw)
          : "";
    if (!externalExecutionId) continue;

    const executedAt = normalizeNumber(
      r?.executedAt ?? r?.time ?? r?.timestamp,
    );
    if (typeof executedAt !== "number") continue;

    const instrumentId =
      typeof r?.tradableInstrumentId === "string"
        ? r.tradableInstrumentId
        : typeof r?.instrumentId === "string"
          ? r.instrumentId
          : undefined;

    const side =
      r?.side === "buy" || r?.side === "sell"
        ? (r.side as "buy" | "sell")
        : r?.direction === "buy" || r?.direction === "sell"
          ? (r.direction as "buy" | "sell")
          : undefined;

    const qty = normalizeNumber(r?.qty ?? r?.quantity ?? r?.volume);
    const price = normalizeNumber(r?.price ?? r?.fillPrice);
    const fees = normalizeNumber(r?.fees ?? r?.commission);

    const externalOrderIdRaw = (r?.orderId ?? r?.externalOrderId) as unknown;
    const externalOrderId =
      typeof externalOrderIdRaw === "string"
        ? externalOrderIdRaw.trim()
        : externalOrderIdRaw != null
          ? String(externalOrderIdRaw)
          : undefined;

    const positionIdRaw = (r?.positionId ?? r?.posId ?? r?.tradeId) as unknown;
    const externalPositionId =
      typeof positionIdRaw === "string"
        ? positionIdRaw.trim()
        : positionIdRaw != null
          ? String(positionIdRaw)
          : undefined;

    result.push({
      externalExecutionId,
      executedAt,
      instrumentId,
      side,
      qty,
      price,
      fees,
      externalOrderId,
      externalPositionId,
      raw: r,
    });
  }
  return result;
};

export const syncTradeLockerConnection = internalAction({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    const now = Date.now();
    const limit = Math.max(1, Math.min(2000, args.limit ?? 500));

    const secrets: any = await ctx.runQuery(
      components.launchthat_traderlaunchpad.connections.internalQueries
        .getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return { ok: false, reason: "not_connected" };
    }

    const keyMaterial = requireTradeLockerSecretsKey();
    const baseUrl = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const tradeAccountId = String(secrets.selectedAccountId ?? "");
    const tradeAccNum = Number(secrets.selectedAccNum ?? 0);
    if (!tradeAccountId || !Number.isFinite(tradeAccNum) || tradeAccNum <= 0) {
      throw new Error("Invalid TradeLocker account selection");
    }

    let accessToken = decryptSecret(
      String(secrets.accessTokenEncrypted),
      keyMaterial,
    );
    let refreshToken = decryptSecret(
      String(secrets.refreshTokenEncrypted),
      keyMaterial,
    );

    // Ensure access token valid by calling all-accounts; refresh on 401.
    const allAccounts1 = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (!allAccounts1.ok && allAccounts1.status === 401) {
      const refreshed = await refreshAccessToken({ baseUrl, refreshToken });
      if (!refreshed.ok) {
        await log(ctx, {
          organizationId: args.organizationId,
          level: "warn",
          message: "TradeLocker token refresh failed",
          metadata: { status: refreshed.status, text: refreshed.text },
        });
        throw new Error(
          `TradeLocker token refresh failed (${refreshed.status})`,
        );
      }

      accessToken = refreshed.accessToken!;
      refreshToken = refreshed.refreshToken!;

      await ctx.runMutation(
        components.launchthat_traderlaunchpad.connections.mutations
          .updateConnectionTokens as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          accessTokenEncrypted: encryptSecret(accessToken, keyMaterial),
          refreshTokenEncrypted: encryptSecret(refreshToken, keyMaterial),
          accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
          refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
        },
      );
    } else if (!allAccounts1.ok) {
      await log(ctx, {
        organizationId: args.organizationId,
        level: "warn",
        message: "TradeLocker all-accounts failed",
        metadata: { status: allAccounts1.status, text: allAccounts1.text },
      });
    }

    const configRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: "/trade/config",
    });
    if (!configRes.ok) {
      await log(ctx, {
        organizationId: args.organizationId,
        level: "warn",
        message: "TradeLocker config failed",
        metadata: { status: configRes.status, text: configRes.text },
      });
    }

    const { ordersCols, historyCols, positionsCols, accountDetailsCols } =
      parseConfigColumns(configRes.json);

    const ordersRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: `/trade/accounts/${encodeURIComponent(tradeAccountId)}/orders`,
    });
    const ordersRows = mapRows(ordersCols, ordersRes.json?.d?.orders);

    const historyRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: `/trade/accounts/${encodeURIComponent(tradeAccountId)}/ordersHistory`,
    });
    const historyRows = mapRows(historyCols, historyRes.json?.d?.ordersHistory);

    const positionsRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: `/trade/accounts/${encodeURIComponent(tradeAccountId)}/positions`,
    });
    const positionsRows = mapRows(
      positionsCols,
      positionsRes.json?.d?.positions,
    );

    const stateRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: `/trade/accounts/${encodeURIComponent(tradeAccountId)}/state`,
    });

    // Executions: current implementation expects `/executions` to be available.
    const executionsRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      path: `/trade/accounts/${encodeURIComponent(tradeAccountId)}/executions`,
    });
    const executionRowsRaw = Array.isArray(executionsRes.json?.d?.executions)
      ? executionsRes.json.d.executions
      : [];
    const executionRows = mapRows(
      Array.isArray(configRes.json?.d?.filledOrdersConfig?.columns)
        ? configRes.json.d.filledOrdersConfig.columns
        : [],
      executionRowsRaw,
    );

    const normalizedOrders = normalizeOrders({ rows: ordersRows });
    const normalizedHistory = normalizeOrders({ rows: historyRows });
    const normalizedExecutions = normalizeExecutions({ rows: executionRows });

    // Symbol resolution (best effort).
    const instrumentIdToSymbol = new Map<string, string>();
    const resolveSymbol = async (
      instrumentId?: string,
    ): Promise<string | undefined> => {
      if (!instrumentId) return undefined;
      const cached = instrumentIdToSymbol.get(instrumentId);
      if (cached) return cached;
      const info = await getInstrumentInfo({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        instrumentId,
      });
      const symbol =
        typeof info.symbol === "string" && info.symbol.trim()
          ? info.symbol.trim()
          : `TL:${instrumentId}`;
      instrumentIdToSymbol.set(instrumentId, symbol);
      return symbol;
    };

    let ordersUpserted = 0;
    let ordersHistoryUpserted = 0;
    let positionsUpserted = 0;
    let executionsUpserted = 0;
    let executionsNew = 0;
    let groupsTouched = 0;

    const connectionId = String(secrets.connectionId ?? "");
    if (!connectionId) {
      throw new Error("Missing TradeLocker connection id");
    }

    for (const o of normalizedOrders.slice(0, limit)) {
      const symbol = await resolveSymbol(o.instrumentId);
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeOrder as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalOrderId: o.externalOrderId,
          symbol,
          instrumentId: o.instrumentId,
          side: o.side,
          status: o.status,
          createdAt: o.createdAt,
          closedAt: o.closedAt,
          raw: o.raw,
        },
      );
      ordersUpserted++;
    }

    for (const o of normalizedHistory.slice(0, limit)) {
      const symbol = await resolveSymbol(o.instrumentId);
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeOrdersHistory as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalOrderId: o.externalOrderId,
          symbol,
          instrumentId: o.instrumentId,
          side: o.side,
          status: o.status,
          createdAt: o.createdAt,
          closedAt: o.closedAt,
          raw: o.raw,
        },
      );
      ordersHistoryUpserted++;
    }

    const openPositionIds = new Set<string>();
    for (const p of positionsRows.slice(0, limit)) {
      const positionIdRaw = (p?.positionId ??
        p?.posId ??
        p?.tradeId) as unknown;
      const externalPositionId =
        typeof positionIdRaw === "string"
          ? positionIdRaw.trim()
          : positionIdRaw != null
            ? String(positionIdRaw)
            : "";
      if (!externalPositionId) continue;
      openPositionIds.add(externalPositionId);

      const instrumentId =
        typeof p?.tradableInstrumentId === "string"
          ? p.tradableInstrumentId
          : typeof p?.instrumentId === "string"
            ? p.instrumentId
            : undefined;
      const symbol = await resolveSymbol(instrumentId);
      const side =
        p?.side === "buy" || p?.side === "sell"
          ? (p.side as "buy" | "sell")
          : p?.direction === "buy" || p?.direction === "sell"
            ? (p.direction as "buy" | "sell")
            : undefined;

      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradePosition as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalPositionId,
          symbol,
          instrumentId,
          side,
          openedAt: normalizeNumber(p?.openedAt ?? p?.openTime),
          qty: normalizeNumber(p?.qty ?? p?.quantity ?? p?.volume),
          avgPrice: normalizeNumber(p?.avgPrice ?? p?.averagePrice),
          raw: p,
        },
      );
      positionsUpserted++;
    }

    if (stateRes.ok) {
      const parsedAccountDetails: Record<string, unknown> = {};
      const details = stateRes.json?.d?.accountDetailsData;
      if (Array.isArray(details)) {
        for (let i = 0; i < accountDetailsCols.length; i++) {
          parsedAccountDetails[accountDetailsCols[i]!.id] = details[i];
        }
      }
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeAccountState as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          accountId: tradeAccountId,
          raw: {
            raw: stateRes.json,
            parsedAccountDetails,
            accountDetailsColumns: accountDetailsCols,
          },
        },
      );
    }

    for (const e of normalizedExecutions.slice(0, limit)) {
      const symbol = await resolveSymbol(e.instrumentId);
      const res: any = await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeExecution as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalExecutionId: e.externalExecutionId,
          externalOrderId: e.externalOrderId,
          externalPositionId: e.externalPositionId,
          symbol,
          instrumentId: e.instrumentId,
          side: e.side,
          executedAt: e.executedAt,
          price: e.price,
          qty: e.qty,
          fees: e.fees,
          raw: e.raw,
        },
      );
      executionsUpserted++;
      if (res?.isNew) executionsNew++;
    }

    const touchedPositionIds = new Set<string>();
    for (const p of openPositionIds) touchedPositionIds.add(p);
    for (const e of normalizedExecutions) {
      if (
        typeof e.externalPositionId === "string" &&
        e.externalPositionId.trim()
      ) {
        touchedPositionIds.add(e.externalPositionId.trim());
      }
    }

    for (const positionId of touchedPositionIds) {
      try {
        await ctx.runMutation(
          components.launchthat_traderlaunchpad.tradeIdeas.mutations
            .rebuildTradeIdeaForPosition as any,
          {
            organizationId: args.organizationId,
            userId: args.userId,
            connectionId,
            accountId: tradeAccountId,
            positionId,
            isOpen: openPositionIds.has(positionId),
          },
        );
        groupsTouched++;
      } catch (err) {
        await log(ctx, {
          organizationId: args.organizationId,
          level: "warn",
          message: "TradeIdea rebuild failed for position",
          metadata: {
            userId: args.userId,
            positionId,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    await ctx.runMutation(
      components.launchthat_traderlaunchpad.connections.mutations
        .updateConnectionSyncState as any,
      {
        connectionId,
        lastSyncAt: now,
        hasOpenTrade: positionsUpserted > 0,
        lastBrokerActivityAt:
          executionsNew > 0 || positionsUpserted > 0 ? now : undefined,
        status: "connected",
      },
    );

    await log(ctx, {
      organizationId: args.organizationId,
      level: "info",
      message: "TradeLocker sync completed",
      metadata: {
        userId: args.userId,
        ordersUpserted,
        ordersHistoryUpserted,
        positionsUpserted,
        executionsUpserted,
        executionsNew,
        groupsTouched,
        durationMs: Date.now() - startedAt,
      },
    });

    return {
      ok: true,
      ordersUpserted,
      ordersHistoryUpserted,
      positionsUpserted,
      executionsUpserted,
      executionsNew,
      groupsTouched,
      durationMs: Date.now() - startedAt,
    };
  },
});
