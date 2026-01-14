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

import { internalAction } from "../../_generated/server";

// NOTE: Avoid typed imports here (can cause TS deep instantiation errors).
const internal: any = require("../../_generated/api").internal;
const components: any = require("../../_generated/api").components;

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

const tradeLockerRefreshTokens = async (args: {
  baseUrl: string;
  refreshToken: string;
}): Promise<{
  ok: boolean;
  status: number;
  text: string;
  accessToken?: string;
  refreshToken?: string;
  expireDateMs?: number;
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
    typeof json?.accessToken === "string" ? json.accessToken : undefined;
  const refreshToken =
    typeof json?.refreshToken === "string" ? json.refreshToken : undefined;
  const expireDateMs =
    typeof json?.expireDate === "string"
      ? Date.parse(String(json.expireDate))
      : NaN;
  return {
    ok: true,
    status: res.status,
    text,
    accessToken,
    refreshToken,
    expireDateMs: Number.isFinite(expireDateMs) ? expireDateMs : undefined,
  };
};

const payloadRowCount = (payload: any): number => {
  if (Array.isArray(payload)) return payload.length;
  if (payload?.d && typeof payload.d === "object")
    return payloadRowCount(payload.d);
  if (Array.isArray(payload?.orders))
    return (payload.orders as unknown[]).length;
  if (Array.isArray(payload?.executions))
    return (payload.executions as unknown[]).length;
  if (Array.isArray(payload?.fills)) return (payload.fills as unknown[]).length;
  if (Array.isArray(payload?.filledOrders))
    return (payload.filledOrders as unknown[]).length;
  if (Array.isArray(payload?.positions))
    return (payload.positions as unknown[]).length;
  if (Array.isArray(payload?.data)) return (payload.data as unknown[]).length;
  return 0;
};

const payloadSampleKeys = (payload: any): string[] => {
  if (payload?.d && typeof payload.d === "object")
    return payloadSampleKeys(payload.d);
  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.orders)
        ? payload.orders
        : Array.isArray(payload?.executions)
          ? payload.executions
          : Array.isArray(payload?.filledOrders)
            ? payload.filledOrders
            : Array.isArray(payload?.fills)
              ? payload.fills
              : Array.isArray(payload?.positions)
                ? payload.positions
                : [];
  const first = rows[0];
  if (!first || typeof first !== "object") return [];
  return Object.keys(first as Record<string, unknown>).slice(0, 25);
};

const extractRows = (payload: any, keys: string[]): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const root =
    payload?.d && typeof payload.d === "object" ? payload.d : payload;
  for (const k of keys) {
    const v = (root as any)?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
};

const extractColumnsFromConfig = (
  config: any,
  panelId: string,
): string[] | null => {
  // TradeLocker returns: { s: "ok", d: { ordersConfig, filledOrdersConfig, ... } }
  // Ref: https://public-api.tradelocker.com/reference/getconfigusingget.md
  const root = config?.d && typeof config.d === "object" ? config.d : config;

  const possiblePanels = [
    root?.[`${panelId}Config`],
    root?.[panelId],
    root?.[panelId.toLowerCase()],
  ];

  for (const panel of possiblePanels) {
    const cols = Array.isArray(panel?.columns) ? panel.columns : null;
    if (!cols) continue;
    const ids: string[] = [];
    for (const c of cols as any[]) {
      const id = c?.id;
      if (typeof id === "string" && id) ids.push(id);
    }
    if (ids.length > 0) return ids;
  }

  return null;
};

const tableRowsToObjects = (rows: any[], columns: string[]): any[] => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  // If rows are already objects, return as-is.
  if (rows[0] && typeof rows[0] === "object" && !Array.isArray(rows[0])) {
    return rows;
  }
  // TradeLocker "panels" often return `string[][]` rows.
  return rows
    .filter((r) => Array.isArray(r))
    .map((r) => {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < columns.length && i < r.length; i++) {
        const col = columns[i];
        if (!col) continue;
        obj[col] = r[i];
      }
      return obj;
    });
};

const parseNumberLike = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const accountDetailsDataToObject = (
  statePayload: any,
  accountDetailsColumns: string[] | null,
): Record<string, unknown> | null => {
  if (
    !statePayload ||
    !accountDetailsColumns ||
    accountDetailsColumns.length === 0
  )
    return null;
  const root =
    statePayload?.d && typeof statePayload.d === "object"
      ? statePayload.d
      : statePayload;
  const values = (root as any)?.accountDetailsData;
  if (!Array.isArray(values)) return null;

  const out: Record<string, unknown> = {};
  for (let i = 0; i < accountDetailsColumns.length && i < values.length; i++) {
    const key = accountDetailsColumns[i];
    if (!key) continue;
    const raw = values[i];
    out[key] = parseNumberLike(raw) ?? raw;
  }
  return out;
};

const tradeLockerConfig = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum: number;
}): Promise<{ ok: boolean; status: number; text: string; json: any }> => {
  // `/trade/config` requires `accNum` header.
  // Ref: https://public-api.tradelocker.com/reference/getconfigusingget.md
  const candidates = ["/trade/config", "/config"];
  for (const path of candidates) {
    const res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken: args.accessToken,
      accNum: args.accNum,
      path,
    });
    if (res.ok)
      return { ok: true, status: res.status, text: res.text, json: res.json };
    if (res.status !== 404)
      return { ok: false, status: res.status, text: res.text, json: res.json };
  }
  return { ok: false, status: 404, text: "", json: null };
};

const tradeLockerInstrumentDetails = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum: number;
  instrumentId: string;
}): Promise<{ ok: boolean; status: number; json: any }> => {
  const id = encodeURIComponent(args.instrumentId);
  const candidates = [
    `/trade/instruments/${id}`,
    `/trade/instrumentDetails/${id}`,
    `/trade/instrument-details/${id}`,
    `/trade/instruments/details/${id}`,
    `/trade/symbol_info?tradableInstrumentId=${id}`,
    `/trade/symbolInfo?tradableInstrumentId=${id}`,
  ];
  for (const path of candidates) {
    const res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken: args.accessToken,
      accNum: args.accNum,
      path,
    });
    if (res.ok) return { ok: true, status: res.status, json: res.json };
    if (res.status !== 404)
      return { ok: false, status: res.status, json: res.json };
  }
  return { ok: false, status: 404, json: null };
};

const log = async (
  ctx: any,
  entry: {
    organizationId: string;
    level: "info" | "error";
    message: string;
    metadata?: Record<string, unknown>;
  },
) => {
  try {
    await ctx.runMutation(
      components.launchthat_logs.entries.mutations.insertLogEntry as any,
      {
        organizationId: entry.organizationId,
        pluginKey: "traderlaunchpad",
        kind: "traderlaunchpad.sync",
        level: entry.level,
        status: entry.level === "error" ? "failed" : "complete",
        message: entry.message,
        scopeKind: "traderlaunchpad",
        scopeId: `org:${entry.organizationId}`,
        metadata: entry.metadata,
        createdAt: Date.now(),
      },
    );
  } catch {
    // ignore
  }
};

type NormalizedOrder = {
  externalOrderId: string;
  symbol?: string;
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
  symbol?: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  executedAt: number;
  price?: number;
  qty?: number;
  fees?: number;
  raw: any;
};

const normalizeSide = (raw: any): "buy" | "sell" | undefined => {
  const s = typeof raw === "string" ? raw.toLowerCase() : "";
  if (s === "buy" || s === "b") return "buy";
  if (s === "sell" || s === "s") return "sell";
  return undefined;
};

const normalizeOrders = (payload: any): NormalizedOrder[] => {
  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.orders)
      ? payload.orders
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  const out: NormalizedOrder[] = [];
  for (const row of rows) {
    const externalOrderId = String(
      row?.orderId ?? row?.id ?? row?._id ?? row?.externalOrderId ?? "",
    );
    if (!externalOrderId) continue;
    out.push({
      externalOrderId,
      symbol: typeof row?.symbol === "string" ? row.symbol : undefined,
      instrumentId:
        typeof row?.instrumentId === "string"
          ? row.instrumentId
          : typeof row?.instrument_id === "string"
            ? row.instrument_id
            : typeof row?.tradableInstrumentId === "string"
              ? row.tradableInstrumentId
              : typeof row?.tradableInstrumentId === "number"
                ? String(row.tradableInstrumentId)
                : undefined,
      side: normalizeSide(row?.side ?? row?.direction),
      status: typeof row?.status === "string" ? row.status : undefined,
      createdAt:
        typeof row?.createdAt === "number"
          ? row.createdAt
          : typeof row?.openTime === "number"
            ? row.openTime
            : undefined,
      closedAt:
        typeof row?.closedAt === "number"
          ? row.closedAt
          : typeof row?.closeTime === "number"
            ? row.closeTime
            : undefined,
      raw: row,
    });
  }
  return out;
};

type NormalizedPosition = {
  externalPositionId: string;
  symbol?: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  openedAt?: number;
  qty?: number;
  avgPrice?: number;
  raw: any;
};

const normalizePositions = (payload: any): NormalizedPosition[] => {
  const parseNumberLike = (v: unknown): number | undefined => {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.positions)
      ? payload.positions
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  const out: NormalizedPosition[] = [];
  for (const row of rows) {
    const externalPositionId = String(
      row?.positionId ?? row?.posId ?? row?.id ?? row?._id ?? "",
    );
    if (!externalPositionId) continue;
    out.push({
      externalPositionId,
      symbol: typeof row?.symbol === "string" ? row.symbol : undefined,
      instrumentId:
        typeof row?.instrumentId === "string"
          ? row.instrumentId
          : typeof row?.instrument_id === "string"
            ? row.instrument_id
            : typeof row?.tradableInstrumentId === "string"
              ? row.tradableInstrumentId
              : typeof row?.tradableInstrumentId === "number"
                ? String(row.tradableInstrumentId)
                : undefined,
      side: normalizeSide(row?.side ?? row?.direction),
      openedAt:
        typeof row?.openedAt === "number"
          ? row.openedAt
          : typeof row?.createdAt === "number"
            ? row.createdAt
            : undefined,
      qty: parseNumberLike(row?.qty ?? row?.quantity),
      avgPrice: parseNumberLike(
        row?.avgPrice ?? row?.averagePrice ?? row?.price,
      ),
      raw: row,
    });
  }
  return out;
};

const normalizeExecutions = (payload: any): NormalizedExecution[] => {
  const parseNumberLike = (v: unknown): number | undefined => {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const parseTimeLikeMs = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return Date.now();
      const asNum = Number(trimmed);
      if (Number.isFinite(asNum) && asNum > 0) return asNum;
      const asDate = Date.parse(trimmed);
      if (Number.isFinite(asDate)) return asDate;
    }
    return Date.now();
  };

  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.executions)
      ? payload.executions
      : Array.isArray(payload?.fills)
        ? payload.fills
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
  const out: NormalizedExecution[] = [];
  for (const row of rows) {
    const externalExecutionId = String(
      row?.executionId ?? row?.fillId ?? row?.id ?? row?._id ?? "",
    );
    if (!externalExecutionId) continue;

    const executedAtRaw =
      row?.executedAt ??
      row?.time ??
      row?.timestamp ??
      row?.createdAt ??
      row?.createdDate;
    const executedAt = parseTimeLikeMs(executedAtRaw);

    out.push({
      externalExecutionId,
      externalOrderId:
        typeof row?.orderId === "string"
          ? row.orderId
          : typeof row?.externalOrderId === "string"
            ? row.externalOrderId
            : row?.orderId
              ? String(row.orderId)
              : undefined,
      symbol: typeof row?.symbol === "string" ? row.symbol : undefined,
      instrumentId:
        typeof row?.instrumentId === "string"
          ? row.instrumentId
          : typeof row?.instrument_id === "string"
            ? row.instrument_id
            : typeof row?.tradableInstrumentId === "string"
              ? row.tradableInstrumentId
              : typeof row?.tradableInstrumentId === "number"
                ? String(row.tradableInstrumentId)
                : undefined,
      side: normalizeSide(row?.side ?? row?.direction),
      executedAt,
      price: parseNumberLike(row?.price),
      qty: parseNumberLike(row?.qty ?? row?.quantity),
      fees: parseNumberLike(row?.fees),
      raw: row,
    });
  }
  return out;
};

const sideToSignedQty = (
  side: "buy" | "sell" | undefined,
  qty: number,
): number => {
  if (side === "sell") return -Math.abs(qty);
  return Math.abs(qty);
};

export const syncTradeLockerConnection = internalAction({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    ordersUpserted: v.number(),
    executionsUpserted: v.number(),
    executionsNew: v.number(),
    groupsTouched: v.number(),
  }),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    await log(ctx, {
      organizationId: args.organizationId,
      level: "info",
      message: "TradeLocker sync started",
      metadata: {
        userId: args.userId,
        limit: args.limit ?? null,
      },
    });
    const secrets = await ctx.runQuery(
      components.launchthat_traderlaunchpad.connections.internalQueries
        .getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ordersUpserted: 0,
        executionsUpserted: 0,
        executionsNew: 0,
        groupsTouched: 0,
      };
    }

    // IMPORTANT: `getConnectionSecrets` intentionally does not return the component doc `_id`,
    // but downstream mutations require `connectionId` (a component `Id<"tradelockerConnections">`).
    const connection = await ctx.runQuery(
      components.launchthat_traderlaunchpad.connections.queries
        .getMyConnection as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    const connectionId = connection?._id;
    if (!connectionId) {
      throw new Error("TradeLocker connection not found");
    }

    const keyMaterial = requireTradeLockerSecretsKey();
    let accessToken = decryptSecret(
      String((secrets as any).accessTokenEncrypted ?? ""),
      keyMaterial,
    );
    let refreshToken = decryptSecret(
      String((secrets as any).refreshTokenEncrypted ?? ""),
      keyMaterial,
    );

    const baseUrl = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const accNum = Number(secrets.selectedAccNum ?? 0);
    const accountId = String(secrets.selectedAccountId ?? "");
    if (!accountId || !Number.isFinite(accNum) || accNum <= 0) {
      throw new Error("Invalid connection account selection");
    }

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) {
        await ctx.runMutation(
          components.launchthat_traderlaunchpad.connections.mutations
            .updateConnectionSyncState as any,
          {
            connectionId,
            status: "error",
            lastError: `TradeLocker refresh failed (${res.status}): ${res.text || "request failed"}`,
          },
        );
        console.warn("[tradelocker.sync.refresh_failed]", {
          organizationId: args.organizationId,
          userId: args.userId,
          reason,
          status: res.status,
        });
        return false;
      }

      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = encryptSecret(accessToken, keyMaterial);
      const refreshTokenEncrypted = encryptSecret(refreshToken, keyMaterial);

      await ctx.runMutation(
        components.launchthat_traderlaunchpad.connections.mutations
          .upsertConnection as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          environment: secrets.environment === "live" ? "live" : "demo",
          server: String(secrets.server ?? ""),
          selectedAccountId: accountId,
          selectedAccNum: accNum,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt: res.expireDateMs,
          refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
          status: "connected",
          lastError: undefined,
        },
      );

      console.log("[tradelocker.sync.refresh_ok]", {
        organizationId: args.organizationId,
        userId: args.userId,
        reason,
      });
      return true;
    };

    // Source of truth: for Trade endpoints we need BOTH:
    // - an account id in the URL path
    // - an `accNum` header
    // The `all-accounts` response tells us which is which for the broker/server.
    let allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (allAccountsRes.status === 401) {
      const refreshed = await rotateTokens("all-accounts_401");
      if (refreshed) {
        allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
      }
    }
    const accounts = allAccountsRes.accounts;
    const matched =
      accounts.find(
        (a) =>
          String(a?.accountId ?? a?.id ?? a?._id ?? "") === accountId ||
          String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "") ===
            accountId ||
          Number(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? 0) === accNum ||
          Number(a?.accountId ?? a?.id ?? 0) === accNum,
      ) ?? null;

    const tradeAccountId = String(
      matched?.accountId ?? matched?.id ?? matched?._id ?? accountId,
    );
    const tradeAccNum = Number(
      matched?.accNum ?? matched?.acc_num ?? matched?.accountNumber ?? accNum,
    );
    if (!tradeAccountId || !Number.isFinite(tradeAccNum) || tradeAccNum <= 0) {
      throw new Error("Unable to derive TradeLocker trade account identifiers");
    }

    // Try a few candidate paths (TradeLocker docs are path-based; this keeps MVP resilient).
    const orderPaths = [
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/orders`,
      `/trade/orders?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/orders`,
    ];
    const execPaths = [
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/filledOrders`,
      `/trade/filledOrders?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/filledOrders`,
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/executions`,
      `/trade/executions?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/executions`,
    ];

    // Fetch config so we can map TradeLocker "panels" (string[][]) into objects.
    let cfg = await tradeLockerConfig({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
    });
    if (cfg.status === 401) {
      const refreshed = await rotateTokens("config_401");
      if (refreshed)
        cfg = await tradeLockerConfig({
          baseUrl,
          accessToken,
          accNum: tradeAccNum,
        });
    }
    const cfgJson = cfg.ok ? cfg.json : null;
    const ordersColumns =
      extractColumnsFromConfig(cfgJson, "orders") ??
      extractColumnsFromConfig(cfgJson, "Orders") ??
      null;
    const filledOrdersColumns =
      extractColumnsFromConfig(cfgJson, "filledOrders") ??
      extractColumnsFromConfig(cfgJson, "FilledOrders") ??
      extractColumnsFromConfig(cfgJson, "executions") ??
      null;
    const ordersHistoryColumns =
      extractColumnsFromConfig(cfgJson, "ordersHistory") ??
      extractColumnsFromConfig(cfgJson, "OrdersHistory") ??
      null;
    const positionsColumns =
      extractColumnsFromConfig(cfgJson, "positions") ??
      extractColumnsFromConfig(cfgJson, "Positions") ??
      null;
    const accountDetailsColumns =
      extractColumnsFromConfig(cfgJson, "accountDetails") ??
      extractColumnsFromConfig(cfgJson, "AccountDetails") ??
      null;

    let ordersPayload: any = null;
    const orderAttempts: { path: string; status: number; ok: boolean }[] = [];
    for (const p of orderPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401) {
        const refreshed = await rotateTokens("orders_401");
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      orderAttempts.push({ path: p, status: res.status, ok: res.ok });
      if (res.ok) {
        ordersPayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    let executionsPayload: any = null;
    const execAttempts: { path: string; status: number; ok: boolean }[] = [];
    for (const p of execPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401) {
        const refreshed = await rotateTokens("executions_401");
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      execAttempts.push({ path: p, status: res.status, ok: res.ok });
      if (res.ok) {
        executionsPayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    // Some brokers only populate historical fills in ordersHistory.
    const historyPaths = [
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/ordersHistory`,
      `/trade/ordersHistory?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/ordersHistory`,
    ];
    let ordersHistoryPayload: any = null;
    const historyAttempts: { path: string; status: number; ok: boolean }[] = [];
    for (const p of historyPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401) {
        const refreshed = await rotateTokens("ordersHistory_401");
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      historyAttempts.push({ path: p, status: res.status, ok: res.ok });
      if (res.ok) {
        ordersHistoryPayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    const positionsPaths = [
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/positions`,
      `/trade/positions?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/positions`,
    ];
    let positionsPayload: any = null;
    const positionsAttempts: { path: string; status: number; ok: boolean }[] =
      [];
    for (const p of positionsPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401) {
        const refreshed = await rotateTokens("positions_401");
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      positionsAttempts.push({ path: p, status: res.status, ok: res.ok });
      if (res.ok) {
        positionsPayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    const statePaths = [
      `/trade/accounts/${encodeURIComponent(tradeAccountId)}/state`,
      `/trade/state?accountId=${encodeURIComponent(tradeAccountId)}`,
      `/trade/state`,
    ];
    let accountStatePayload: any = null;
    const stateAttempts: { path: string; status: number; ok: boolean }[] = [];
    for (const p of statePaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401) {
        const refreshed = await rotateTokens("state_401");
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      stateAttempts.push({ path: p, status: res.status, ok: res.ok });
      if (res.ok) {
        accountStatePayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    const now = Date.now();
    const ordersRows = extractRows(ordersPayload, ["orders", "data"]);
    const execRows = extractRows(executionsPayload, [
      "executions",
      "filledOrders",
      "fills",
      "data",
    ]);
    const historyRows = extractRows(ordersHistoryPayload, [
      "ordersHistory",
      "data",
    ]);
    const positionsRows = extractRows(positionsPayload, ["positions", "data"]);

    const ordersObj = ordersColumns
      ? tableRowsToObjects(ordersRows, ordersColumns)
      : ordersRows;
    const execObj = filledOrdersColumns
      ? tableRowsToObjects(execRows, filledOrdersColumns)
      : execRows;
    const historyObj = ordersHistoryColumns
      ? tableRowsToObjects(historyRows, ordersHistoryColumns)
      : historyRows;
    const positionsObj = positionsColumns
      ? tableRowsToObjects(positionsRows, positionsColumns)
      : positionsRows;

    const orders = normalizeOrders({ data: ordersObj });
    const ordersHistory = normalizeOrders({ data: historyObj });
    const positions = normalizePositions({ data: positionsObj });
    const combinedExecutionsRaw = [...execObj, ...historyObj];
    const executions = normalizeExecutions({ data: combinedExecutionsRaw })
      .sort((a, b) => a.executedAt - b.executedAt)
      .slice(0, Math.max(1, Math.min(2000, args.limit ?? 500)));

    await log(ctx, {
      organizationId: args.organizationId,
      level: "info",
      message: "TradeLocker payload summary",
      metadata: {
        userId: args.userId,
        environment: secrets.environment,
        server: secrets.server,
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        tradeAccountId,
        tradeAccNum,
        allAccountsStatus: allAccountsRes.status,
        allAccountsOk: allAccountsRes.ok,
        matchedAccountSampleKeys: matched
          ? Object.keys(matched as Record<string, unknown>).slice(0, 25)
          : [],
        configStatus: cfg.status,
        configOk: cfg.ok,
        ordersColumnsCount: ordersColumns?.length ?? 0,
        filledOrdersColumnsCount: filledOrdersColumns?.length ?? 0,
        ordersHistoryColumnsCount: ordersHistoryColumns?.length ?? 0,
        positionsColumnsCount: positionsColumns?.length ?? 0,
        accountDetailsColumnsCount: accountDetailsColumns?.length ?? 0,
        orderAttempts,
        execAttempts,
        historyAttempts,
        positionsAttempts,
        stateAttempts,
        ordersPayloadRowCount: payloadRowCount(ordersPayload),
        executionsPayloadRowCount: payloadRowCount(executionsPayload),
        ordersHistoryPayloadRowCount: payloadRowCount(ordersHistoryPayload),
        positionsPayloadRowCount: payloadRowCount(positionsPayload),
        ordersPayloadSampleKeys: payloadSampleKeys(ordersPayload),
        executionsPayloadSampleKeys: payloadSampleKeys(executionsPayload),
        ordersHistoryPayloadSampleKeys: payloadSampleKeys(ordersHistoryPayload),
        positionsPayloadSampleKeys: payloadSampleKeys(positionsPayload),
        accountStateSampleKeys: payloadSampleKeys(accountStatePayload),
        ordersRowsCount: ordersRows.length,
        execRowsCount: execRows.length,
        historyRowsCount: historyRows.length,
        positionsRowsCount: positionsRows.length,
        ordersFirstRowType: ordersRows[0] ? typeof ordersRows[0] : null,
        execFirstRowType: execRows[0] ? typeof execRows[0] : null,
        historyFirstRowType: historyRows[0] ? typeof historyRows[0] : null,
        positionsFirstRowType: positionsRows[0]
          ? typeof positionsRows[0]
          : null,
        ordersRowIsArray: Array.isArray(ordersRows[0]),
        execRowIsArray: Array.isArray(execRows[0]),
        historyRowIsArray: Array.isArray(historyRows[0]),
        positionsRowIsArray: Array.isArray(positionsRows[0]),
        normalizedOrders: orders.length,
        normalizedOrdersHistory: ordersHistory.length,
        normalizedPositions: positions.length,
        normalizedExecutions: executions.length,
      },
    });
    // Also print to Convex logs for rapid debugging (avoid secrets).
    console.log("[tradelocker.sync.payload]", {
      organizationId: args.organizationId,
      userId: args.userId,
      environment: secrets.environment,
      server: secrets.server,
      selectedAccountId: accountId,
      selectedAccNum: accNum,
      tradeAccountId,
      tradeAccNum,
      allAccountsStatus: allAccountsRes.status,
      allAccountsOk: allAccountsRes.ok,
      configStatus: cfg.status,
      configOk: cfg.ok,
      ordersColumnsCount: ordersColumns?.length ?? 0,
      filledOrdersColumnsCount: filledOrdersColumns?.length ?? 0,
      ordersHistoryColumnsCount: ordersHistoryColumns?.length ?? 0,
      positionsColumnsCount: positionsColumns?.length ?? 0,
      accountDetailsColumnsCount: accountDetailsColumns?.length ?? 0,
      orderAttempts,
      execAttempts,
      historyAttempts,
      positionsAttempts,
      stateAttempts,
      ordersPayloadRowCount: payloadRowCount(ordersPayload),
      executionsPayloadRowCount: payloadRowCount(executionsPayload),
      ordersHistoryPayloadRowCount: payloadRowCount(ordersHistoryPayload),
      positionsPayloadRowCount: payloadRowCount(positionsPayload),
      ordersPayloadSampleKeys: payloadSampleKeys(ordersPayload),
      executionsPayloadSampleKeys: payloadSampleKeys(executionsPayload),
      ordersHistoryPayloadSampleKeys: payloadSampleKeys(ordersHistoryPayload),
      positionsPayloadSampleKeys: payloadSampleKeys(positionsPayload),
      accountStateSampleKeys: payloadSampleKeys(accountStatePayload),
      ordersRowsCount: ordersRows.length,
      execRowsCount: execRows.length,
      historyRowsCount: historyRows.length,
      positionsRowsCount: positionsRows.length,
      ordersRowIsArray: Array.isArray(ordersRows[0]),
      execRowIsArray: Array.isArray(execRows[0]),
      historyRowIsArray: Array.isArray(historyRows[0]),
      positionsRowIsArray: Array.isArray(positionsRows[0]),
      normalizedOrders: orders.length,
      normalizedOrdersHistory: ordersHistory.length,
      normalizedPositions: positions.length,
      normalizedExecutions: executions.length,
    });

    let ordersUpserted = 0;
    for (const o of orders) {
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeOrder as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalOrderId: o.externalOrderId,
          symbol: o.symbol,
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

    let ordersHistoryUpserted = 0;
    for (const o of ordersHistory) {
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeOrderHistory as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalOrderId: o.externalOrderId,
          symbol: o.symbol,
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

    let positionsUpserted = 0;
    for (const p of positions) {
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradePosition as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalPositionId: p.externalPositionId,
          symbol: p.symbol,
          instrumentId: p.instrumentId,
          side: p.side,
          openedAt: p.openedAt,
          qty: p.qty,
          avgPrice: p.avgPrice,
          raw: p.raw,
        },
      );
      positionsUpserted++;
    }

    const accountState = accountStatePayload ?? null;
    if (accountState) {
      const parsedAccountDetails = accountDetailsDataToObject(
        accountState,
        accountDetailsColumns,
      );
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeAccountState as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          accountId: tradeAccountId,
          raw: {
            raw: accountState,
            parsedAccountDetails,
            accountDetailsColumns,
          },
        },
      );
    }

    let executionsUpserted = 0;
    let executionsNew = 0;
    const groupsTouched = 0; // MVP: Trade Ideas derivation is disabled (ingest-only sync).

    for (const e of executions) {
      const upsertRes = await ctx.runMutation(
        components.launchthat_traderlaunchpad.raw.mutations
          .upsertTradeExecution as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalExecutionId: e.externalExecutionId,
          externalOrderId: e.externalOrderId,
          symbol: e.symbol,
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
      if (upsertRes?.wasNew) executionsNew++;
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
        hasAccountState: Boolean(accountState),
        executionsUpserted,
        executionsNew,
        groupsTouched,
        durationMs: Date.now() - startedAt,
      },
    });
    console.log("[tradelocker.sync.completed]", {
      organizationId: args.organizationId,
      userId: args.userId,
      ordersUpserted,
      ordersHistoryUpserted,
      positionsUpserted,
      hasAccountState: Boolean(accountState),
      executionsUpserted,
      executionsNew,
      groupsTouched,
      durationMs: Date.now() - startedAt,
    });

    return { ordersUpserted, executionsUpserted, executionsNew, groupsTouched };
  },
});
