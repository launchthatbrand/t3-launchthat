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
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { action } from "./server";

// NOTE: Avoid typed imports here (can cause TS deep instantiation errors).
const api: any = require("./_generated/api").api;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

const base64Encode = (bytes: Uint8Array): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

const base64Decode = (b64: string): Uint8Array => {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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

const decryptSecret = async (
  ciphertext: string,
  keyMaterial: string,
): Promise<string> => {
  if (!ciphertext.startsWith("enc_v1:")) {
    return ciphertext;
  }
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = textDecoder.decode(base64Decode(raw));
  const parsed = JSON.parse(decoded) as {
    alg: string;
    ivB64: string;
    tagB64: string;
    dataB64: string;
  };
  if (parsed.alg !== "aes-256-gcm") {
    throw new Error("Unsupported ciphertext alg");
  }
  const key = await deriveAesKey(keyMaterial);
  const ivBytes = base64Decode(parsed.ivB64);
  const iv = toArrayBuffer(ivBytes);
  const tag = base64Decode(parsed.tagB64);
  const data = base64Decode(parsed.dataB64);
  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data, 0);
  combined.set(tag, data.length);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    toArrayBuffer(combined),
  );
  return textDecoder.decode(plaintext);
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

const requireTradeLockerSecretsKey = (keyMaterial?: string): string => {
  if (!keyMaterial) {
    throw new Error("Missing TRADELOCKER_SECRETS_KEY env");
  }
  return keyMaterial;
};

const baseUrlForEnv = (env: "demo" | "live"): string =>
  `https://${env}.tradelocker.com/backend-api`;

const base64UrlDecode = (input: string): string => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const b64 = `${padded}${"=".repeat(padLength)}`;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  return atob(b64);
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
}): Promise<{
  ok: boolean;
  status: number;
  json: any;
  attempts: Array<{
    path: string;
    status: number;
    ok: boolean;
    text: string;
  }>;
}> => {
  const id = encodeURIComponent(args.instrumentId);
  const candidates = [
    `/trade/instruments/${id}`,
    `/trade/instrumentDetails/${id}`,
    `/trade/instrument-details/${id}`,
    `/trade/instruments/details/${id}`,
    `/trade/symbol_info?tradableInstrumentId=${id}`,
    `/trade/symbolInfo?tradableInstrumentId=${id}`,
    `/clientapi/v1/instruments/${id}`,
    `/clientapi/v1/instruments/details/${id}`,
    `/clientapi/v1/instruments?ids=${id}`,
    `/clientapi/v1/instruments?instrumentId=${id}`,
  ];
  const attempts: Array<{
    path: string;
    status: number;
    ok: boolean;
    text: string;
  }> = [];
  for (const path of candidates) {
    const res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken: args.accessToken,
      accNum: args.accNum,
      path,
    });
    attempts.push({
      path,
      status: res.status,
      ok: res.ok,
      text: res.text?.slice(0, 200) ?? "",
    });
    if (res.ok)
      return {
        ok: true,
        status: res.status,
        json: res.json,
        attempts,
      };
    if (res.status !== 404)
      return {
        ok: false,
        status: res.status,
        json: res.json,
        attempts,
      };
  }
  return { ok: false, status: 404, json: null, attempts };
};

const extractInstrumentSymbol = (payload: any): string | undefined => {
  const root =
    payload?.d && typeof payload.d === "object" ? payload.d : payload;
  const candidates = [
    root?.symbol,
    root?.name,
    root?.shortName,
    root?.ticker,
    root?.instrumentName,
    root?.instrument,
    root?.tradableInstrument?.symbol,
    root?.tradableInstrument?.name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
};

const tradeLockerInstrumentsForAccount = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum: number;
  accountId: string;
}): Promise<{
  ok: boolean;
  status: number;
  json: any;
  text: string;
}> => {
  const res = await tradeLockerApi({
    baseUrl: args.baseUrl,
    accessToken: args.accessToken,
    accNum: args.accNum,
    path: `/trade/accounts/${encodeURIComponent(args.accountId)}/instruments`,
  });
  return { ok: res.ok, status: res.status, json: res.json, text: res.text };
};

const findInstrumentInList = (
  payload: any,
  instrumentId: string,
): { symbol?: string; raw?: any } => {
  const root =
    payload?.d && typeof payload.d === "object" ? payload.d : payload;
  const rows: any[] = Array.isArray(root)
    ? root
    : Array.isArray(root?.instruments)
      ? root.instruments
      : Array.isArray(root?.data)
        ? root.data
        : [];
  if (!rows.length) return {};
  const target = instrumentId.trim();
  const targetNum = Number(target);
  const match = rows.find((row) => {
    const candidates = [
      row?.instrumentId,
      row?.id,
      row?._id,
      row?.tradableInstrumentId,
    ];
    for (const candidate of candidates) {
      if (String(candidate ?? "") === target) return true;
      if (Number.isFinite(targetNum) && Number(candidate) === targetNum)
        return true;
    }
    return false;
  });
  if (!match) return {};
  return {
    symbol:
      typeof match?.symbol === "string"
        ? match.symbol
        : typeof match?.name === "string"
          ? match.name
          : undefined,
    raw: match,
  };
};

export const getInstrumentDetails = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    instrumentId: v.string(),
    secretsKey: v.string(),
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
    const instrumentId = args.instrumentId.trim();
    if (!instrumentId) return null;

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") return null;

    const keyMaterial = requireTradeLockerSecretsKey(args.secretsKey);
    let accessToken = await decryptSecret(
      String((secrets as any).accessTokenEncrypted ?? ""),
      keyMaterial,
    );
    let refreshToken = await decryptSecret(
      String((secrets as any).refreshTokenEncrypted ?? ""),
      keyMaterial,
    );
    const shouldEncrypt =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith(
        "enc_v1:",
      ) ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith(
        "enc_v1:",
      );
    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost
      ? `https://${jwtHost}/backend-api`
      : baseUrlFallback;

    const accNum = Number(secrets.selectedAccNum ?? 0);
    const accountId = String(secrets.selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) return null;

    const allAccountsRes = await tradeLockerAllAccounts({
      baseUrl,
      accessToken,
    });
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

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const refreshRes = await tradeLockerRefreshTokens({
        baseUrl,
        refreshToken,
      });
      if (
        !refreshRes.ok ||
        !refreshRes.accessToken ||
        !refreshRes.refreshToken
      ) {
        console.warn("[tradelocker.instrument.refresh_failed]", {
          organizationId: args.organizationId,
          userId: args.userId,
          reason,
          status: refreshRes.status,
          refreshText: refreshRes.text?.slice(0, 200) ?? "",
        });
        return false;
      }
      accessToken = refreshRes.accessToken;
      refreshToken = refreshRes.refreshToken;
      const accessTokenToStore = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenToStore = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;
      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        selectedAccountId: tradeAccountId,
        selectedAccNum: tradeAccNum,
        accessTokenEncrypted: accessTokenToStore,
        refreshTokenEncrypted: refreshTokenToStore,
        accessTokenExpiresAt: refreshRes.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
        jwtHost: extractJwtHost(accessToken),
      });
      return true;
    };

    let listRes = await tradeLockerInstrumentsForAccount({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      accountId: tradeAccountId,
    });
    if (listRes.status === 401 || listRes.status === 403) {
      const refreshed = await rotateTokens("instruments_list_401_403");
      if (refreshed) {
        listRes = await tradeLockerInstrumentsForAccount({
          baseUrl,
          accessToken,
          accNum: tradeAccNum,
          accountId: tradeAccountId,
        });
      }
    }
    const fromList = listRes.ok
      ? findInstrumentInList(listRes.json, instrumentId)
      : {};
    console.log("[tradelocker.instrument.lookup_list]", {
      organizationId: args.organizationId,
      userId: args.userId,
      instrumentId,
      environment: secrets.environment,
      server: secrets.server,
      jwtHost,
      baseUrl,
      accNum: tradeAccNum,
      accountId: tradeAccountId,
      allAccountsStatus: allAccountsRes.status,
      allAccountsOk: allAccountsRes.ok,
      status: listRes.status,
      ok: listRes.ok,
      text: listRes.text?.slice(0, 200) ?? "",
      listKeys:
        listRes.json && typeof listRes.json === "object"
          ? Object.keys(listRes.json as Record<string, unknown>).slice(0, 25)
          : [],
    });
    if (fromList.symbol) {
      console.log("[tradelocker.instrument.lookup_result]", {
        instrumentId,
        symbol: fromList.symbol,
        source: "account_instruments",
      });
      return {
        instrumentId,
        symbol: fromList.symbol,
        raw: fromList.raw ?? listRes.json,
      };
    }

    let res = await tradeLockerInstrumentDetails({
      baseUrl,
      accessToken,
      accNum: tradeAccNum,
      instrumentId,
    });
    if (res.status === 401 || res.status === 403) {
      const refreshed = await rotateTokens("instrument_detail_401_403");
      if (refreshed) {
        res = await tradeLockerInstrumentDetails({
          baseUrl,
          accessToken,
          accNum: tradeAccNum,
          instrumentId,
        });
      }
    }
    console.log("[tradelocker.instrument.lookup_detail]", {
      organizationId: args.organizationId,
      userId: args.userId,
      instrumentId,
      environment: secrets.environment,
      server: secrets.server,
      jwtHost,
      baseUrl,
      accNum: tradeAccNum,
      accountId: tradeAccountId,
      status: res.status,
      ok: res.ok,
      attempts: res.attempts,
    });
    if (!res.ok) return null;
    const symbol = extractInstrumentSymbol(res.json);
    console.log("[tradelocker.instrument.lookup_result]", {
      instrumentId,
      symbol,
      source: "instrument_details",
      hasRaw: Boolean(res.json),
      rawKeys:
        res.json && typeof res.json === "object"
          ? Object.keys(res.json as Record<string, unknown>).slice(0, 25)
          : [],
    });
    return { instrumentId, symbol, raw: res.json };
  },
});

const log = async (
  _ctx: unknown,
  _entry: {
    organizationId: string;
    level: "info" | "warn" | "error";
    message: string;
    metadata?: Record<string, unknown>;
  },
) => {
  // no-op in component
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
  externalPositionId?: string;
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
      externalPositionId:
        typeof row?.positionId === "string"
          ? row.positionId
          : typeof row?.posId === "string"
            ? row.posId
            : typeof row?.tradeId === "string"
              ? row.tradeId
              : row?.positionId || row?.posId || row?.tradeId
                ? String(row.positionId ?? row.posId ?? row.tradeId)
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

export const syncTradeLockerConnection = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
    secretsKey: v.string(),
  },
  returns: v.object({
    ordersUpserted: v.number(),
    executionsUpserted: v.number(),
    executionsNew: v.number(),
    groupsTouched: v.number(),
    tradeIdeaGroupIds: v.array(v.id("tradeIdeaGroups")),
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
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ordersUpserted: 0,
        executionsUpserted: 0,
        executionsNew: 0,
        groupsTouched: 0,
        tradeIdeaGroupIds: [],
      };
    }

    // IMPORTANT: `getConnectionSecrets` intentionally does not return the component doc `_id`,
    // but downstream mutations require `connectionId` (a component `Id<"tradelockerConnections">`).
    const connection = await ctx.runQuery(
      api.connections.queries.getMyConnection as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    const connectionId = connection?._id;
    if (!connectionId) {
      throw new Error("TradeLocker connection not found");
    }

    const keyMaterial = requireTradeLockerSecretsKey(args.secretsKey);
    let accessToken = await decryptSecret(
      String((secrets as any).accessTokenEncrypted ?? ""),
      keyMaterial,
    );
    let refreshToken = await decryptSecret(
      String((secrets as any).refreshTokenEncrypted ?? ""),
      keyMaterial,
    );

    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    let jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    let baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;
    const accNum = Number(secrets.selectedAccNum ?? 0);
    const accountId = String(secrets.selectedAccountId ?? "");
    if (!accountId || !Number.isFinite(accNum) || accNum <= 0) {
      throw new Error("Invalid connection account selection");
    }

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) {
        await ctx.runMutation(
          api.connections.mutations.updateConnectionSyncState as any,
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
          text: res.text?.slice(0, 200) ?? "",
        });
        return false;
      }

      accessToken = res.accessToken;
      refreshToken = res.refreshToken;
      const refreshedJwtHost = extractJwtHost(accessToken);
      if (refreshedJwtHost) {
        jwtHost = refreshedJwtHost;
        baseUrl = `https://${jwtHost}/backend-api`;
      }

      const accessTokenEncrypted = await encryptSecret(
        accessToken,
        keyMaterial,
      );
      const refreshTokenEncrypted = await encryptSecret(
        refreshToken,
        keyMaterial,
      );

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: jwtHost ?? undefined,
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

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
    if (allAccountsRes.status === 401 || allAccountsRes.status === 403) {
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
    if (cfg.status === 401 || cfg.status === 403) {
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
      extractColumnsFromConfig(cfgJson, "openPositions") ??
      extractColumnsFromConfig(cfgJson, "OpenPositions") ??
      extractColumnsFromConfig(cfgJson, "open_positions") ??
      extractColumnsFromConfig(cfgJson, "openPositionsConfig") ??
      extractColumnsFromConfig(cfgJson, "positionsConfig") ??
      null;
    const accountDetailsColumns =
      extractColumnsFromConfig(cfgJson, "accountDetails") ??
      extractColumnsFromConfig(cfgJson, "AccountDetails") ??
      null;

    let ordersPayload: any = null;
    const orderAttempts: {
      path: string;
      status: number;
      ok: boolean;
      text?: string;
    }[] = [];
    for (const p of orderPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
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
      orderAttempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        text: res.text?.slice(0, 200) ?? "",
      });
      if (res.ok) {
        ordersPayload = res.json;
        break;
      }
      if (res.status !== 404) break;
    }

    let executionsPayload: any = null;
    const execAttempts: {
      path: string;
      status: number;
      ok: boolean;
      text?: string;
    }[] = [];
    for (const p of execPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
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
      execAttempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        text: res.text?.slice(0, 200) ?? "",
      });
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
    const historyAttempts: {
      path: string;
      status: number;
      ok: boolean;
      text?: string;
    }[] = [];
    for (const p of historyPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
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
      historyAttempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        text: res.text?.slice(0, 200) ?? "",
      });
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
    const positionsAttempts: {
      path: string;
      status: number;
      ok: boolean;
      text?: string;
    }[] = [];
    for (const p of positionsPaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
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
      positionsAttempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        text: res.text?.slice(0, 200) ?? "",
      });
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
    const stateAttempts: {
      path: string;
      status: number;
      ok: boolean;
      text?: string;
    }[] = [];
    for (const p of statePaths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
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
      stateAttempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        text: res.text?.slice(0, 200) ?? "",
      });
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
    const positionsRows = extractRows(positionsPayload, [
      "positions",
      "Positions",
      "openPositions",
      "OpenPositions",
      "open_positions",
      "positionsData",
      "openPositionsData",
      "data",
      "rows",
      "items",
    ]);

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

    const instrumentCache = new Map<string, string>();
    const resolveInstrumentSymbol = async (
      instrumentId?: string,
    ): Promise<string | undefined> => {
      const id = typeof instrumentId === "string" ? instrumentId.trim() : "";
      if (!id) return undefined;
      if (instrumentCache.has(id)) return instrumentCache.get(id);
      const res = await tradeLockerInstrumentDetails({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        instrumentId: id,
      });
      if (!res.ok) return undefined;
      const symbol = extractInstrumentSymbol(res.json);
      if (symbol) instrumentCache.set(id, symbol);
      return symbol;
    };

    for (const o of orders) {
      if (!o.symbol && o.instrumentId) {
        o.symbol = await resolveInstrumentSymbol(o.instrumentId);
      }
    }
    for (const o of ordersHistory) {
      if (!o.symbol && o.instrumentId) {
        o.symbol = await resolveInstrumentSymbol(o.instrumentId);
      }
    }
    for (const p of positions) {
      if (!p.symbol && p.instrumentId) {
        p.symbol = await resolveInstrumentSymbol(p.instrumentId);
      }
    }
    for (const e of executions) {
      if (!e.symbol && e.instrumentId) {
        e.symbol = await resolveInstrumentSymbol(e.instrumentId);
      }
    }

    await log(ctx, {
      organizationId: args.organizationId,
      level: "info",
      message: "TradeLocker payload summary",
      metadata: {
        userId: args.userId,
        environment: secrets.environment,
        server: secrets.server,
        jwtHost,
        baseUrl,
        baseUrlFallback,
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        tradeAccountId,
        tradeAccNum,
        allAccountsStatus: allAccountsRes.status,
        allAccountsOk: allAccountsRes.ok,
        allAccountsText: allAccountsRes.text?.slice(0, 200) ?? "",
        matchedAccountSampleKeys: matched
          ? Object.keys(matched as Record<string, unknown>).slice(0, 25)
          : [],
        configStatus: cfg.status,
        configOk: cfg.ok,
        configText: cfg.text?.slice(0, 200) ?? "",
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
      jwtHost,
      baseUrl,
      baseUrlFallback,
      selectedAccountId: accountId,
      selectedAccNum: accNum,
      tradeAccountId,
      tradeAccNum,
      allAccountsStatus: allAccountsRes.status,
      allAccountsOk: allAccountsRes.ok,
      allAccountsText: allAccountsRes.text?.slice(0, 200) ?? "",
      configStatus: cfg.status,
      configOk: cfg.ok,
      configText: cfg.text?.slice(0, 200) ?? "",
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
      await ctx.runMutation(api.raw.mutations.upsertTradeOrder as any, {
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
      });
      ordersUpserted++;
    }

    let ordersHistoryUpserted = 0;
    for (const o of ordersHistory) {
      await ctx.runMutation(api.raw.mutations.upsertTradeOrderHistory as any, {
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
      });
      ordersHistoryUpserted++;
    }

    let positionsUpserted = 0;
    for (const p of positions) {
      await ctx.runMutation(api.raw.mutations.upsertTradePosition as any, {
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
      });
      positionsUpserted++;
    }

    const accountState = accountStatePayload ?? null;
    if (accountState) {
      const parsedAccountDetails = accountDetailsDataToObject(
        accountState,
        accountDetailsColumns,
      );
      await ctx.runMutation(api.raw.mutations.upsertTradeAccountState as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        connectionId,
        accountId: tradeAccountId,
        raw: {
          raw: accountState,
          parsedAccountDetails,
          accountDetailsColumns,
        },
      });
    }

    let executionsUpserted = 0;
    let executionsNew = 0;
    let groupsTouched = 0;
    const tradeIdeaGroupIds: Array<Id<"tradeIdeaGroups">> = [];

    for (const e of executions) {
      const upsertRes = await ctx.runMutation(
        api.raw.mutations.upsertTradeExecution as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          externalExecutionId: e.externalExecutionId,
          externalOrderId: e.externalOrderId,
          externalPositionId: e.externalPositionId,
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

    // Phase 1 TradeIdeas: rebuild “episodes” per instrumentId (open iff netQty != 0).
    const touchedInstrumentIds = new Set<string>();
    for (const p of positions) {
      if (typeof p.instrumentId === "string" && p.instrumentId.trim()) {
        touchedInstrumentIds.add(p.instrumentId.trim());
      }
    }
    for (const e of executions) {
      if (typeof e.instrumentId === "string" && e.instrumentId.trim()) {
        touchedInstrumentIds.add(e.instrumentId.trim());
      }
    }

    for (const instrumentId of touchedInstrumentIds) {
      try {
        const res = await ctx.runMutation(
          api.tradeIdeas.mutations.rebuildTradeIdeasForInstrument as any,
          {
            organizationId: args.organizationId,
            userId: args.userId,
            connectionId,
            accountId: tradeAccountId,
            instrumentId,
          },
        );
        groupsTouched++;
        for (const id of res.tradeIdeaGroupIds ?? []) {
          tradeIdeaGroupIds.push(id as Id<"tradeIdeaGroups">);
        }
      } catch (err) {
        await log(ctx, {
          organizationId: args.organizationId,
          level: "warn",
          message: "TradeIdea rebuild failed for instrument",
          metadata: {
            userId: args.userId,
            instrumentId,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    await ctx.runMutation(
      api.connections.mutations.updateConnectionSyncState as any,
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

    return {
      ordersUpserted,
      executionsUpserted,
      executionsNew,
      groupsTouched,
      tradeIdeaGroupIds,
    };
  },
});
