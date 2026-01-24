import type { Id } from "./_generated/dataModel";
import { action } from "./server";
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

// NOTE: Avoid typed imports here (can cause TS deep instantiation errors).
const api: any = require("./_generated/api").api;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const developerKeyHeader = (): Record<string, string> => {
  const key = process.env.TRADELOCKER_DEVELOPER_API_KEY;
  if (!key) return {};
  return { "tl-developer-api-key": key };
};

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
      ...developerKeyHeader(),
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
    headers: { Authorization: `Bearer ${args.accessToken}`, ...developerKeyHeader() },
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
  const requestOnce = async (accountId: string) => {
    const res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken: args.accessToken,
      accNum: args.accNum,
      path: `/trade/accounts/${encodeURIComponent(accountId)}/instruments`,
    });
    return { ok: res.ok, status: res.status, json: res.json, text: res.text };
  };

  // TradeLocker can return HTTP 200 with {"s":"error","errmsg":"Account not found!"}
  // if the path param isn't the expected int-like account identifier for this endpoint.
  // When that happens, retry using accNum (often the int expected in the path).
  const first = await requestOnce(args.accountId);
  const apiS = typeof first.json?.s === "string" ? String(first.json.s) : "";
  const apiErrmsg =
    typeof first.json?.errmsg === "string"
      ? String(first.json.errmsg)
      : typeof first.json?.error === "string"
        ? String(first.json.error)
        : "";
  const normalizedErr = apiErrmsg.toLowerCase();

  const shouldRetryWithAccNum =
    first.status === 200 &&
    apiS.toLowerCase() === "error" &&
    (normalizedErr.includes("account not found") ||
      normalizedErr.includes("accountid must be of type int"));

  const accNumAsAccountId = String(args.accNum);
  if (
    shouldRetryWithAccNum &&
    accNumAsAccountId &&
    accNumAsAccountId !== args.accountId
  ) {
    return await requestOnce(accNumAsAccountId);
  }

  return first;
};

const findInstrumentIdBySymbol = (
  payload: any,
  symbol: string,
): { instrumentId?: string; routeId?: number; raw?: any } => {
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

  const target = symbol.trim().toLowerCase();
  const match = rows.find((row) => {
    const s =
      typeof row?.symbol === "string"
        ? row.symbol
        : typeof row?.name === "string"
          ? row.name
          : typeof row?.ticker === "string"
            ? row.ticker
            : "";
    return s.trim().toLowerCase() === target;
  });
  if (!match) return {};

  const id =
    typeof match?.tradableInstrumentId === "string"
      ? match.tradableInstrumentId
      : typeof match?.tradableInstrumentId === "number"
        ? String(match.tradableInstrumentId)
        : typeof match?.instrumentId === "string"
          ? match.instrumentId
          : typeof match?.instrumentId === "number"
            ? String(match.instrumentId)
            : typeof match?.id === "string"
              ? match.id
              : typeof match?.id === "number"
                ? String(match.id)
                : undefined;
  const routeFromRoutes = Array.isArray(match?.routes)
    ? match.routes.find((r: any) => String(r?.type ?? "").toLowerCase() === "info")
    : null;
  const routeIdRaw =
    routeFromRoutes?.id ??
    match?.routeId ??
    match?.route_id ??
    match?.route ??
    match?.infoRouteId;
  const routeId = Number(routeIdRaw);
  return {
    instrumentId: id,
    routeId: Number.isFinite(routeId) ? routeId : undefined,
    raw: match,
  };
};

const findRouteIdByInstrumentId = (
  payload: any,
  instrumentId: string,
): { routeId?: number; raw?: any } => {
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
      row?.tradableInstrumentId,
      row?.instrumentId,
      row?.id,
      row?._id,
    ];
    for (const candidate of candidates) {
      if (String(candidate ?? "") === target) return true;
      if (Number.isFinite(targetNum) && Number(candidate) === targetNum)
        return true;
    }
    return false;
  });
  if (!match) return {};

  const routeFromRoutes = Array.isArray(match?.routes)
    ? match.routes.find((r: any) => String(r?.type ?? "").toLowerCase() === "info")
    : null;
  const routeIdRaw =
    routeFromRoutes?.id ??
    match?.routeId ??
    match?.route_id ??
    match?.route ??
    match?.infoRouteId;
  const routeId = Number(routeIdRaw);
  return {
    routeId: Number.isFinite(routeId) ? routeId : undefined,
    raw: match,
  };
};

const resolveInfoRouteId = (configPayload: any): number => {
  // The docs specify `routeId` is required for /trade/history and is int32.
  // /trade/config can contain route info; if not, we fall back to 1.
  const root =
    configPayload?.d && typeof configPayload.d === "object"
      ? configPayload.d
      : configPayload;
  const direct = Number(root?.routeId ?? root?.infoRouteId ?? root?.infoRoute ?? NaN);
  if (Number.isFinite(direct)) return direct;

  const routes: any[] = Array.isArray(root?.routes) ? root.routes : [];
  for (const r of routes) {
    const name = String(r?.name ?? r?.label ?? r?.type ?? "").toLowerCase();
    const id = Number(r?.id ?? r?.routeId ?? NaN);
    if (!Number.isFinite(id)) continue;
    if (name.includes("info")) return id;
  }

  return 1;
};

export const probeHistoryForSymbol = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    symbol: v.string(),
    resolution: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    symbol: v.string(),
    instrumentId: v.optional(v.string()),
    baseUrl: v.string(),
    accNum: v.number(),
    routeId: v.number(),
    requestPath: v.optional(v.string()),
    status: v.optional(v.number()),
    textPreview: v.optional(v.string()),
    barsPreview: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim();
    if (!symbol) {
      return {
        ok: false,
        symbol: args.symbol,
        baseUrl: "",
        accNum: 0,
        routeId: 0,
        error: "Missing symbol",
      };
    }

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        symbol,
        baseUrl: "",
        accNum: 0,
        routeId: 0,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage =
      args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    // NOTE: For debugging broker connectivity issues, prefer the environment host
    // (demo.tradelocker.com/live.tradelocker.com) over the JWT host (e.g. bsb.tradelocker.com).
    // The settings UI "Instruments (user token)" probe should be able to compare behavior.
    const baseUrl = baseUrlFallback;

    let accNum = Number(secrets.selectedAccNum ?? 0);
    let accountId = String(secrets.selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) {
      return {
        ok: false,
        symbol,
        baseUrl,
        accNum: Number.isFinite(accNum) ? accNum : 0,
        routeId: 0,
        error: "Missing selected account/accNum on TradeLocker connection.",
      };
    }

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const refreshRes = await tradeLockerRefreshTokens({
        baseUrl,
        refreshToken,
      });
      if (!refreshRes.ok || !refreshRes.accessToken || !refreshRes.refreshToken) {
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
        selectedAccountId: accountId,
        selectedAccNum: accNum,
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

    // 1) Load config (to attempt to resolve routeId)
    let configRes = await tradeLockerConfig({ baseUrl, accessToken, accNum });
    if (configRes.status === 401 || configRes.status === 403) {
      const refreshed = await rotateTokens("history_probe_config_401_403");
      if (refreshed) {
        configRes = await tradeLockerConfig({ baseUrl, accessToken, accNum });
      }
    }
    const routeId = resolveInfoRouteId(configRes.json);

    // 2) Find tradableInstrumentId for the symbol (using account instruments list)
    let listRes = await tradeLockerInstrumentsForAccount({
      baseUrl,
      accessToken,
      accNum,
      accountId,
    });
    if (listRes.status === 401 || listRes.status === 403) {
      const refreshed = await rotateTokens("history_probe_instruments_401_403");
      if (refreshed) {
        listRes = await tradeLockerInstrumentsForAccount({
          baseUrl,
          accessToken,
          accNum,
          accountId,
        });
      }
    }
    const normalized = symbol.trim().toLowerCase();
    const hardcodedInstrumentId = normalized === "eurusd" ? "4685" : null;

    const found = listRes.ok ? findInstrumentIdBySymbol(listRes.json, symbol) : {};
    const instrumentId = hardcodedInstrumentId ?? found.instrumentId;

    if (!instrumentId) {
      return {
        ok: false,
        symbol,
        instrumentId: undefined,
        baseUrl,
        accNum,
        routeId,
        status: listRes.status,
        textPreview: listRes.text?.slice(0, 500) ?? "",
        error: listRes.ok
          ? `Instrument ${symbol} not found on this account.`
          : "Failed to list instruments for account.",
      };
    }

    const resolution = (args.resolution ?? "1H").trim() || "1H";
    const lookbackDays = Number.isFinite(args.lookbackDays ?? NaN)
      ? Math.max(1, Math.min(30, Math.floor(args.lookbackDays ?? 7)))
      : 7;
    const to = Date.now();
    const from = to - lookbackDays * 24 * 60 * 60 * 1000;

    const hardcodedRoute =
      hardcodedInstrumentId && listRes.ok
        ? findRouteIdByInstrumentId(listRes.json, instrumentId).routeId
        : undefined;

    const routeIdForInstrument =
      Number.isFinite(hardcodedRoute ?? NaN)
        ? Number(hardcodedRoute)
        : Number.isFinite(found.routeId ?? NaN)
          ? Number(found.routeId)
          : routeId;

    const requestPath =
      `/trade/history?routeId=${encodeURIComponent(String(routeIdForInstrument))}` +
      `&from=${encodeURIComponent(String(from))}` +
      `&to=${encodeURIComponent(String(to))}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&tradableInstrumentId=${encodeURIComponent(String(instrumentId))}`;

    let historyRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum,
      path: requestPath,
    });
    if (historyRes.status === 401 || historyRes.status === 403) {
      const refreshed = await rotateTokens("history_probe_history_401_403");
      if (refreshed) {
        historyRes = await tradeLockerApi({
          baseUrl,
          accessToken,
          accNum,
          path: requestPath,
        });
      }
    }

    const barDetails =
      historyRes.json?.d?.barDetails ??
      historyRes.json?.barDetails ??
      historyRes.json?.d ??
      historyRes.json ??
      null;

    const barsPreview = Array.isArray(barDetails)
      ? barDetails.slice(0, 25)
      : barDetails;

    const apiStatus = String(historyRes.json?.s ?? "");
    const apiOk = apiStatus === "ok";

    return {
      ok: historyRes.ok && apiOk,
      symbol,
      instrumentId,
      baseUrl,
      accNum,
      routeId: routeIdForInstrument,
      requestPath,
      status: historyRes.status,
      textPreview: historyRes.text?.slice(0, 500) ?? "",
      barsPreview,
      error:
        historyRes.ok && !apiOk
          ? String(historyRes.json?.errmsg ?? historyRes.json?.error ?? "TradeLocker returned s!=ok")
          : historyRes.ok
            ? undefined
            : "TradeLocker history request failed.",
    };
  },
});

export const probeHistoryForInstrument = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradableInstrumentId: v.string(),
    routeId: v.optional(v.number()),
    resolution: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    instrumentId: v.string(),
    baseUrl: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    routeId: v.number(),
    requestPath: v.optional(v.string()),
    status: v.optional(v.number()),
    textPreview: v.optional(v.string()),
    barsPreview: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const instrumentId = args.tradableInstrumentId.trim();
    if (!instrumentId) {
      return {
        ok: false,
        instrumentId: "",
        baseUrl: "",
        accountId: "",
        accNum: 0,
        routeId: 0,
        error: "Missing tradableInstrumentId",
      };
    }

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        instrumentId,
        baseUrl: "",
        accountId: "",
        accNum: 0,
        routeId: 0,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    // IMPORTANT: Use the JWT shard host when available (e.g. bsb.tradelocker.com).
    // Many TradeLocker JWTs are only valid on that host; using demo.tradelocker.com
    // can yield 403 "JWT validation failed or server not found".
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    let accNum = Number(secrets.selectedAccNum ?? 0);
    let accountId = String(secrets.selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) {
      return {
        ok: false,
        instrumentId,
        baseUrl,
        accountId,
        accNum: Number.isFinite(accNum) ? accNum : 0,
        routeId: 0,
        error: "Missing selected account/accNum on TradeLocker connection.",
      };
    }

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      console.log("[tradelocker.probeHistoryForInstrument.refresh_ok]", {
        organizationId: args.organizationId,
        userId: args.userId,
        reason,
      });
      return true;
    };

    // Prefer INFO route from the instrument list; fall back to /trade/config heuristics; then last-resort to provided routeId.
    let derivedRouteId: number | undefined =
      Number.isFinite(args.routeId ?? NaN) && Number(args.routeId) > 0
        ? Number(args.routeId)
        : undefined;

    if (!Number.isFinite(derivedRouteId ?? NaN)) {
      let listRes = await tradeLockerInstrumentsForAccount({
        baseUrl,
        accessToken,
        accNum,
        accountId,
      });
      if (listRes.status === 401 || listRes.status === 403) {
        const refreshed = await rotateTokens("history_for_instrument_instruments_401_403");
        if (refreshed) {
          listRes = await tradeLockerInstrumentsForAccount({
            baseUrl,
            accessToken,
            accNum,
            accountId,
          });
        }
      }

      if (listRes.ok) {
        const found = findRouteIdByInstrumentId(listRes.json, instrumentId);
        if (Number.isFinite(found.routeId ?? NaN)) {
          derivedRouteId = Number(found.routeId);
        }
      }
    }

    if (!Number.isFinite(derivedRouteId ?? NaN)) {
      let configRes = await tradeLockerConfig({ baseUrl, accessToken, accNum });
      if (configRes.status === 401 || configRes.status === 403) {
        const refreshed = await rotateTokens("history_for_instrument_config_401_403");
        if (refreshed) {
          configRes = await tradeLockerConfig({ baseUrl, accessToken, accNum });
        }
      }
      derivedRouteId = resolveInfoRouteId(configRes.json);
    }

    const resolution = (args.resolution ?? "1H").trim() || "1H";
    const lookbackDays = Number.isFinite(args.lookbackDays ?? NaN)
      ? Math.max(1, Math.min(30, Math.floor(args.lookbackDays ?? 7)))
      : 7;
    const to = Date.now();
    const from = to - lookbackDays * 24 * 60 * 60 * 1000;

    const requestPath =
      `/trade/history?routeId=${encodeURIComponent(String(derivedRouteId))}` +
      `&from=${encodeURIComponent(String(from))}` +
      `&to=${encodeURIComponent(String(to))}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&tradableInstrumentId=${encodeURIComponent(String(instrumentId))}`;

    let historyRes = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum,
      path: requestPath,
    });
    if (historyRes.status === 401 || historyRes.status === 403) {
      const refreshed = await rotateTokens("history_for_instrument_history_401_403");
      if (refreshed) {
        historyRes = await tradeLockerApi({
          baseUrl,
          accessToken,
          accNum,
          path: requestPath,
        });
      }
    }

    const barDetails =
      historyRes.json?.d?.barDetails ??
      historyRes.json?.barDetails ??
      historyRes.json?.d ??
      historyRes.json ??
      null;
    const barsPreview = Array.isArray(barDetails)
      ? barDetails.slice(0, 25)
      : barDetails;

    const apiStatus = String(historyRes.json?.s ?? "");
    const apiOk = apiStatus === "ok";

    return {
      ok: historyRes.ok && apiOk,
      instrumentId,
      baseUrl,
      accountId,
      accNum,
      routeId: Number(derivedRouteId),
      requestPath,
      status: historyRes.status,
      textPreview: historyRes.text?.slice(0, 500) ?? "",
      barsPreview,
      error:
        historyRes.ok && !apiOk
          ? String(
              historyRes.json?.errmsg ??
                historyRes.json?.error ??
                "TradeLocker returned s!=ok",
            )
          : historyRes.ok
            ? undefined
            : "TradeLocker history request failed.",
    };
  },
});

type TradeEndpointKind =
  | "state"
  | "positions"
  | "orders"
  | "ordersHistory"
  | "filledOrders"
  | "executions";

const truncateJson = (
  value: unknown,
  opts?: { maxDepth?: number; maxArray?: number; maxString?: number },
  depth = 0,
): unknown => {
  const maxDepth = opts?.maxDepth ?? 5;
  const maxArray = opts?.maxArray ?? 50;
  const maxString = opts?.maxString ?? 2000;

  if (depth > maxDepth) return "[truncated:maxDepth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > maxString ? `${value.slice(0, maxString)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    const head = value.slice(0, maxArray);
    return head.map((v) => truncateJson(v, opts, depth + 1));
  }

  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(rec).slice(0, 50)) {
      out[k] = truncateJson(rec[k], opts, depth + 1) as unknown;
    }
    const extraKeys = Object.keys(rec).length - Object.keys(out).length;
    if (extraKeys > 0) out._truncatedKeys = extraKeys;
    return out;
  }

  return String(value);
};

export const probeTradeEndpointForAccount = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    // Values from a `tradelockerConnectionAccounts` row.
    accountId: v.string(),
    accNum: v.number(),
    endpoint: v.union(
      v.literal("state"),
      v.literal("positions"),
      v.literal("orders"),
      v.literal("ordersHistory"),
      v.literal("filledOrders"),
      v.literal("executions"),
    ),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    endpoint: v.string(),
    baseUrl: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    tradeAccountId: v.optional(v.string()),
    tradeAccNum: v.optional(v.number()),
    status: v.optional(v.number()),
    pathUsed: v.optional(v.string()),
    attempts: v.optional(v.array(v.any())),
    apiStatus: v.optional(v.string()),
    textPreview: v.optional(v.string()),
    jsonPreview: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accountIdInput = args.accountId.trim();
    const accNumInput = Number(args.accNum);
    const endpoint = args.endpoint as TradeEndpointKind;
    if (!accountIdInput || !Number.isFinite(accNumInput) || accNumInput <= 0) {
      return {
        ok: false,
        endpoint,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: Number.isFinite(accNumInput) ? accNumInput : 0,
        error: "Invalid accountId/accNum.",
      };
    }

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        endpoint,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: accNumInput,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String((secrets as any).selectedAccountId ?? ""),
        selectedAccNum: Number((secrets as any).selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      return true;
    };

    // Derive the correct {accountId, accNum} combination for Trade endpoints.
    let allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (allAccountsRes.status === 401 || allAccountsRes.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) {
        allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
      }
    }
    const matched =
      allAccountsRes.accounts.find(
        (a: any) =>
          String(a?.accountId ?? a?.id ?? a?._id ?? "") === accountIdInput ||
          String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "") ===
            accountIdInput ||
          Number(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? 0) === accNumInput ||
          Number(a?.accountId ?? a?.id ?? 0) === accNumInput,
      ) ?? null;

    const tradeAccountId = String(
      matched?.accountId ?? matched?.id ?? matched?._id ?? accountIdInput,
    );
    const tradeAccNum = Number(
      matched?.accNum ?? matched?.acc_num ?? matched?.accountNumber ?? accNumInput,
    );
    if (!tradeAccountId || !Number.isFinite(tradeAccNum) || tradeAccNum <= 0) {
      return {
        ok: false,
        endpoint,
        baseUrl,
        accountId: accountIdInput,
        accNum: accNumInput,
        tradeAccountId,
        tradeAccNum,
        error: "Unable to derive TradeLocker trade account identifiers",
      };
    }

    const paths =
      endpoint === "ordersHistory"
        ? [
            `/trade/accounts/${encodeURIComponent(tradeAccountId)}/ordersHistory`,
            `/trade/ordersHistory?accountId=${encodeURIComponent(tradeAccountId)}`,
            `/trade/ordersHistory`,
          ]
        : endpoint === "filledOrders"
        ? [
            `/trade/accounts/${encodeURIComponent(tradeAccountId)}/filledOrders`,
            `/trade/filledOrders?accountId=${encodeURIComponent(tradeAccountId)}`,
            `/trade/filledOrders`,
          ]
        : endpoint === "executions"
        ? [
            `/trade/accounts/${encodeURIComponent(tradeAccountId)}/executions`,
            `/trade/executions?accountId=${encodeURIComponent(tradeAccountId)}`,
            `/trade/executions`,
          ]
        : endpoint === "orders"
        ? [
            `/trade/accounts/${encodeURIComponent(tradeAccountId)}/orders`,
            `/trade/orders?accountId=${encodeURIComponent(tradeAccountId)}`,
            `/trade/orders`,
          ]
        : endpoint === "positions"
          ? [
              `/trade/accounts/${encodeURIComponent(tradeAccountId)}/positions`,
              `/trade/positions?accountId=${encodeURIComponent(tradeAccountId)}`,
              `/trade/positions`,
            ]
          : [
              `/trade/accounts/${encodeURIComponent(tradeAccountId)}/state`,
              `/trade/state?accountId=${encodeURIComponent(tradeAccountId)}`,
              `/trade/state`,
            ];

    const attempts: Array<{
      path: string;
      status: number;
      ok: boolean;
      textPreview?: string;
    }> = [];
    let final: { ok: boolean; status: number; text: string; json: any } | null =
      null;
    let pathUsed: string | null = null;

    for (const p of paths) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: p,
      });
      if (res.status === 401 || res.status === 403) {
        const refreshed = await rotateTokens();
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: p,
          });
        }
      }
      attempts.push({
        path: p,
        status: res.status,
        ok: res.ok,
        textPreview: res.text?.slice(0, 200) ?? "",
      });
      if (res.ok) {
        final = res;
        pathUsed = p;
        break;
      }
      if (res.status !== 404) {
        final = res;
        pathUsed = p;
        break;
      }
    }

    if (!final) {
      return {
        ok: false,
        endpoint,
        baseUrl,
        accountId: accountIdInput,
        accNum: accNumInput,
        tradeAccountId,
        tradeAccNum,
        attempts,
        error: "No response.",
      };
    }

    const apiStatus = typeof final.json?.s === "string" ? String(final.json.s) : "";
    const apiOk = apiStatus ? apiStatus === "ok" : true;

    return {
      ok: Boolean(final.ok && apiOk),
      endpoint,
      baseUrl,
      accountId: accountIdInput,
      accNum: accNumInput,
      tradeAccountId,
      tradeAccNum,
      status: final.status,
      pathUsed: pathUsed ?? undefined,
      attempts,
      apiStatus: apiStatus || undefined,
      textPreview: final.text?.slice(0, 800) ?? "",
      jsonPreview: truncateJson(final.json, { maxDepth: 6, maxArray: 50, maxString: 2500 }),
      error:
        final.ok && !apiOk
          ? String(final.json?.errmsg ?? final.json?.error ?? "TradeLocker returned s!=ok")
          : final.ok
            ? undefined
            : "TradeLocker request failed.",
    };
  },
});

export const probeBackendPathForAccount = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    // Values from a `tradelockerConnectionAccounts` row.
    accountId: v.string(),
    accNum: v.number(),
    // Path under `${baseUrl}`. Example: `/user/me` or `/user/me/accounts?includeBalance=true`.
    path: v.string(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    pathUsed: v.optional(v.string()),
    status: v.optional(v.number()),
    attempts: v.optional(v.array(v.any())),
    apiStatus: v.optional(v.string()),
    textPreview: v.optional(v.string()),
    jsonPreview: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accountIdInput = args.accountId.trim();
    const accNumInput = Number(args.accNum);
    let path = String(args.path ?? "").trim();

    if (!accountIdInput || !Number.isFinite(accNumInput) || accNumInput <= 0) {
      return {
        ok: false,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: Number.isFinite(accNumInput) ? accNumInput : 0,
        error: "Invalid accountId/accNum.",
      };
    }
    if (!path || !path.startsWith("/")) {
      return {
        ok: false,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: accNumInput,
        error: "Invalid path. Must start with '/'.",
      };
    }

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: accNumInput,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    // Some callers may pass a path that already includes `/backend-api/...` even though
    // `baseUrl` itself already ends with `/backend-api`. Normalize to avoid
    // `/backend-api/backend-api/...` 404s.
    if (baseUrl.endsWith("/backend-api") && path.startsWith("/backend-api/")) {
      path = path.slice("/backend-api".length);
      if (!path.startsWith("/")) path = `/${path}`;
    }

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String((secrets as any).selectedAccountId ?? ""),
        selectedAccNum: Number((secrets as any).selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      return true;
    };

    const attempts: Array<{
      path: string;
      status: number;
      ok: boolean;
      textPreview?: string;
    }> = [];

    let res = await tradeLockerApi({
      baseUrl,
      accessToken,
      accNum: accNumInput,
      path,
    });
    if (res.status === 401 || res.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) {
        res = await tradeLockerApi({
          baseUrl,
          accessToken,
          accNum: accNumInput,
          path,
        });
      }
    }

    attempts.push({
      path,
      status: res.status,
      ok: res.ok,
      textPreview: res.text?.slice(0, 200) ?? "",
    });

    const apiStatus = typeof res.json?.s === "string" ? String(res.json.s) : "";
    const apiOk = apiStatus ? apiStatus === "ok" : true;

    return {
      ok: Boolean(res.ok && apiOk),
      baseUrl,
      accountId: accountIdInput,
      accNum: accNumInput,
      pathUsed: path,
      status: res.status,
      attempts,
      apiStatus: apiStatus || undefined,
      textPreview: res.text?.slice(0, 800) ?? "",
      jsonPreview: truncateJson(res.json, { maxDepth: 6, maxArray: 50, maxString: 2500 }),
      error:
        res.ok && !apiOk
          ? String(res.json?.errmsg ?? res.json?.error ?? "TradeLocker returned s!=ok")
          : res.ok
            ? undefined
            : "TradeLocker request failed.",
    };
  },
});

export const probeHistoryForInstrumentForAccount = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    tradableInstrumentId: v.string(),
    routeId: v.optional(v.number()),
    resolution: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    instrumentId: v.string(),
    baseUrl: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    routeId: v.number(),
    requestPath: v.optional(v.string()),
    status: v.optional(v.number()),
    textPreview: v.optional(v.string()),
    barsPreview: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const instrumentId = args.tradableInstrumentId.trim();
    const accountIdInput = args.accountId.trim();
    const accNumInput = Number(args.accNum);
    if (!instrumentId || !accountIdInput || !Number.isFinite(accNumInput) || accNumInput <= 0) {
      return {
        ok: false,
        instrumentId,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: Number.isFinite(accNumInput) ? accNumInput : 0,
        routeId: 0,
        error: "Missing/invalid inputs",
      };
    }

    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        instrumentId,
        baseUrl: "",
        accountId: accountIdInput,
        accNum: accNumInput,
        routeId: 0,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String((secrets as any).selectedAccountId ?? ""),
        selectedAccNum: Number((secrets as any).selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });
      return true;
    };

    // Derive the correct {accountId, accNum} combination for Trade endpoints.
    let allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (allAccountsRes.status === 401 || allAccountsRes.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    }
    const matched =
      allAccountsRes.accounts.find(
        (a: any) =>
          String(a?.accountId ?? a?.id ?? a?._id ?? "") === accountIdInput ||
          String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "") === accountIdInput ||
          Number(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? 0) === accNumInput ||
          Number(a?.accountId ?? a?.id ?? 0) === accNumInput,
      ) ?? null;
    const tradeAccountId = String(
      matched?.accountId ?? matched?.id ?? matched?._id ?? accountIdInput,
    );
    const tradeAccNum = Number(
      matched?.accNum ?? matched?.acc_num ?? matched?.accountNumber ?? accNumInput,
    );
    if (!tradeAccountId || !Number.isFinite(tradeAccNum) || tradeAccNum <= 0) {
      return {
        ok: false,
        instrumentId,
        baseUrl,
        accountId: accountIdInput,
        accNum: accNumInput,
        routeId: 0,
        error: "Unable to derive TradeLocker trade account identifiers",
      };
    }

    const resolution = (args.resolution ?? "1H").trim() || "1H";
    const lookbackDays = Number.isFinite(args.lookbackDays ?? NaN)
      ? Math.max(1, Math.min(30, Math.floor(args.lookbackDays ?? 7)))
      : 7;
    const to = Date.now();
    const from = to - lookbackDays * 24 * 60 * 60 * 1000;

    // TradeLocker history often requires routeId (broker-specific).
    // Prefer explicit routeId from caller; otherwise derive from account instruments list.
    let derivedRouteId = Number(args.routeId ?? 0);

    if (!Number.isFinite(derivedRouteId) || derivedRouteId <= 0) {
      let listRes = await tradeLockerInstrumentsForAccount({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        accountId: tradeAccountId,
      });
      if (listRes.status === 401 || listRes.status === 403) {
        const refreshed = await rotateTokens();
        if (refreshed) {
          listRes = await tradeLockerInstrumentsForAccount({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            accountId: tradeAccountId,
          });
        }
      }
      if (listRes.ok) {
        const match = findRouteIdByInstrumentId(listRes.json, instrumentId);
        if (Number.isFinite(match.routeId ?? NaN) && (match.routeId ?? 0) > 0) {
          derivedRouteId = Number(match.routeId);
        }
      }
    }

    if (!Number.isFinite(derivedRouteId) || derivedRouteId <= 0) {
      // Fallback: derive a generic info route from config (may work on some brokers).
      let cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum: tradeAccNum });
      if (cfg.status === 401 || cfg.status === 403) {
        const refreshed = await rotateTokens();
        if (refreshed) {
          cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum: tradeAccNum });
        }
      }
      const cfgJson = cfg.ok ? cfg.json : null;
      const fallback = resolveInfoRouteId(cfgJson);
      if (Number.isFinite(fallback) && fallback > 0) derivedRouteId = fallback;
    }

    const baseQuery =
      `from=${encodeURIComponent(String(from))}` +
      `&to=${encodeURIComponent(String(to))}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&tradableInstrumentId=${encodeURIComponent(String(instrumentId))}`;

    const candidates: Array<{ path: string; routeIdUsed: number }> = [];
    if (Number(args.routeId ?? 0) > 0) {
      candidates.push({
        path: `/trade/history?routeId=${encodeURIComponent(String(derivedRouteId))}&${baseQuery}`,
        routeIdUsed: derivedRouteId,
      });
    } else {
      if (Number.isFinite(derivedRouteId) && derivedRouteId > 0) {
        candidates.push({
          path: `/trade/history?routeId=${encodeURIComponent(String(derivedRouteId))}&${baseQuery}`,
          routeIdUsed: derivedRouteId,
        });
      }
      // Compatibility fallback: some brokers accept history without routeId.
      candidates.push({ path: `/trade/history?${baseQuery}`, routeIdUsed: 0 });
    }

    let historyRes: { ok: boolean; status: number; text: string; json: any } | null =
      null;
    let requestPathUsed: string | null = null;
    let routeIdUsed = 0;

    for (const c of candidates) {
      let res = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: c.path,
      });
      if (res.status === 401 || res.status === 403) {
        const refreshed = await rotateTokens();
        if (refreshed) {
          res = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: c.path,
          });
        }
      }
      historyRes = res;
      requestPathUsed = c.path;
      routeIdUsed = c.routeIdUsed;
      if (res.ok) break;
      // If 400 and we have another candidate, keep going.
      if (res.status === 400 && candidates.length > 1) continue;
      break;
    }

    // Shouldn't happen, but keep return shape stable.
    if (!historyRes) {
      return {
        ok: false,
        instrumentId,
        baseUrl,
        accountId: tradeAccountId,
        accNum: tradeAccNum,
        routeId: 0,
        requestPath: undefined,
        status: undefined,
        textPreview: "",
        barsPreview: null,
        error: "No response.",
      };
    }

    const barDetails =
      historyRes.json?.d?.barDetails ??
      historyRes.json?.barDetails ??
      historyRes.json?.d ??
      historyRes.json ??
      null;
    const barsPreview = Array.isArray(barDetails) ? barDetails.slice(0, 25) : barDetails;

    const apiStatus = String(historyRes.json?.s ?? "");
    const apiOk = apiStatus ? apiStatus === "ok" : true;

    return {
      ok: historyRes.ok && apiOk,
      instrumentId,
      baseUrl,
      accountId: tradeAccountId,
      accNum: tradeAccNum,
      routeId: Number(routeIdUsed) || 0,
      requestPath: requestPathUsed ?? undefined,
      status: historyRes.status,
      textPreview: historyRes.text?.slice(0, 500) ?? "",
      barsPreview,
      error:
        historyRes.ok && !apiOk
          ? String(historyRes.json?.errmsg ?? historyRes.json?.error ?? "TradeLocker returned s!=ok")
          : historyRes.ok
            ? undefined
            : "TradeLocker history request failed.",
    };
  },
});

export const probeTradeConfig = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    accNum: v.number(),
    status: v.optional(v.number()),
    textPreview: v.optional(v.string()),
    json: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        accNum: 0,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    // IMPORTANT: Use the JWT shard host when available (e.g. bsb.tradelocker.com).
    // Many TradeLocker JWTs are only valid on that host; using demo.tradelocker.com
    // can yield 403 "JWT validation failed or server not found".
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    let accNum = Number(secrets.selectedAccNum ?? 0);
    let accountId = String(secrets.selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) {
      return {
        ok: false,
        baseUrl,
        accNum: Number.isFinite(accNum) ? accNum : 0,
        error: "Missing selected account/accNum on TradeLocker connection.",
      };
    }

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      return true;
    };

    let cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum });
    if (cfg.status === 401 || cfg.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum });
    }

    // TradeLocker returns HTTP 200 for app-level errors; normalize.
    const apiStatus = String(cfg.json?.s ?? "");
    const apiOk = apiStatus === "ok";

    return {
      ok: cfg.ok && apiOk,
      baseUrl,
      accNum,
      status: cfg.status,
      textPreview: cfg.text?.slice(0, 500) ?? "",
      json: cfg.json ?? undefined,
      error:
        cfg.ok && !apiOk
          ? String(cfg.json?.errmsg ?? cfg.json?.error ?? "TradeLocker returned s!=ok")
          : cfg.ok
            ? undefined
            : "TradeLocker /trade/config request failed.",
    };
  },
});

export const probeTradeConfigForAccNum = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accNum: v.number(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    accNum: v.number(),
    status: v.optional(v.number()),
    textPreview: v.optional(v.string()),
    json: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        accNum: args.accNum,
        error: "TradeLocker not connected for this user.",
      };
    }

    const accNum = Number(args.accNum);
    if (!Number.isFinite(accNum) || accNum <= 0) {
      return {
        ok: false,
        baseUrl: "",
        accNum: Number.isFinite(accNum) ? accNum : 0,
        error: "Invalid accNum.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String((secrets as any).selectedAccountId ?? ""),
        selectedAccNum: Number((secrets as any).selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      return true;
    };

    let cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum });
    if (cfg.status === 401 || cfg.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) cfg = await tradeLockerConfig({ baseUrl, accessToken, accNum });
    }

    const apiStatus = String(cfg.json?.s ?? "");
    const apiOk = apiStatus === "ok";

    return {
      ok: cfg.ok && apiOk,
      baseUrl,
      accNum,
      status: cfg.status,
      textPreview: cfg.text?.slice(0, 500) ?? "",
      json: cfg.json ?? undefined,
      error:
        cfg.ok && !apiOk
          ? String(cfg.json?.errmsg ?? cfg.json?.error ?? "TradeLocker returned s!=ok")
          : cfg.ok
            ? undefined
            : "TradeLocker /trade/config request failed.",
    };
  },
});

export const probeInstrumentsForSelectedAccount = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    accountId: v.string(),
    accNum: v.number(),
    status: v.optional(v.number()),
    count: v.optional(v.number()),
    instruments: v.optional(v.any()),
    instrumentsPreview: v.optional(v.any()),
    textPreview: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        accountId: "",
        accNum: 0,
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    // IMPORTANT: Use the JWT shard host when available (e.g. bsb.tradelocker.com).
    // Many TradeLocker JWTs are only valid on that host; using demo.tradelocker.com
    // can yield 403 "JWT validation failed or server not found".
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    let accNum = Number(secrets.selectedAccNum ?? 0);
    let accountId = String(secrets.selectedAccountId ?? "").trim();
    if (!Number.isFinite(accNum) || accNum <= 0 || !accountId) {
      return {
        ok: false,
        baseUrl,
        accountId,
        accNum: Number.isFinite(accNum) ? accNum : 0,
        error: "Missing selected account/accNum on TradeLocker connection.",
      };
    }

    const rotateTokens = async (): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: accountId,
        selectedAccNum: accNum,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      return true;
    };

    let listRes = await tradeLockerInstrumentsForAccount({
      baseUrl,
      accessToken,
      accNum,
      accountId,
    });
    if (listRes.status === 401 || listRes.status === 403) {
      const refreshed = await rotateTokens();
      if (refreshed) {
        listRes = await tradeLockerInstrumentsForAccount({
          baseUrl,
          accessToken,
          accNum,
          accountId,
        });
      }
    }

    // TradeLocker returns HTTP 200 for app-level errors; normalize.
    const apiStatus = String(listRes.json?.s ?? "");
    const apiOk = apiStatus === "ok";
    const apiErr = String(listRes.json?.errmsg ?? listRes.json?.error ?? "");

    // If the stored accountId/accNum got stale, resolve via all-accounts and retry once.
    if (listRes.ok && !apiOk && apiErr.toLowerCase().includes("account not found")) {
      const allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
      const accounts = allAccountsRes.accounts;
      const matched =
        accounts.find(
          (a) =>
            String(a?.accountId ?? a?.id ?? a?._id ?? "") === accountId ||
            String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "") === accountId ||
            Number(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? 0) === accNum ||
            Number(a?.accountId ?? a?.id ?? 0) === accNum,
        ) ?? null;

      if (matched) {
        const resolvedAccountId = String(
          matched?.accountId ?? matched?.id ?? matched?._id ?? accountId,
        ).trim();
        const resolvedAccNum = Number(
          matched?.accNum ?? matched?.acc_num ?? matched?.accountNumber ?? accNum,
        );

        if (
          resolvedAccountId &&
          Number.isFinite(resolvedAccNum) &&
          resolvedAccNum > 0 &&
          (resolvedAccountId !== accountId || resolvedAccNum !== accNum)
        ) {
          accountId = resolvedAccountId;
          accNum = resolvedAccNum;

          await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
            organizationId: args.organizationId,
            userId: args.userId,
            environment: secrets.environment === "live" ? "live" : "demo",
            server: String(secrets.server ?? ""),
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

        listRes = await tradeLockerInstrumentsForAccount({
          baseUrl,
          accessToken,
          accNum,
          accountId,
        });
      }
    }

    const root =
      listRes.json?.d && typeof listRes.json.d === "object"
        ? listRes.json.d
        : listRes.json;
    const instruments: any[] = Array.isArray(root)
      ? root
      : Array.isArray(root?.instruments)
        ? root.instruments
        : Array.isArray(root?.data)
          ? root.data
          : [];

    return {
      ok: listRes.ok && String(listRes.json?.s ?? "") === "ok",
      baseUrl,
      accountId,
      accNum,
      status: listRes.status,
      count: instruments.length,
      instruments,
      instrumentsPreview: instruments.slice(0, 50),
      textPreview: listRes.text?.slice(0, 500) ?? "",
      error:
        listRes.ok && String(listRes.json?.s ?? "") !== "ok"
          ? String(listRes.json?.errmsg ?? listRes.json?.error ?? "TradeLocker returned s!=ok")
          : listRes.ok
            ? undefined
            : "TradeLocker instruments request failed.",
    };
  },
});

export const probeAllAccountsForUser = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    jwtHost: v.optional(v.string()),
    status: v.number(),
    count: v.number(),
    accounts: v.array(v.any()),
    accountsPreview: v.array(v.any()),
    textPreview: v.string(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        jwtHost: undefined,
        status: 0,
        count: 0,
        accounts: [],
        accountsPreview: [],
        textPreview: "",
        error: "TradeLocker not connected for this user.",
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String(secrets.selectedAccountId ?? ""),
        selectedAccNum: Number(secrets.selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      console.log("[tradelocker.probeAllAccounts.refresh_ok]", {
        organizationId: args.organizationId,
        userId: args.userId,
        reason,
      });
      return true;
    };

    let allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (allAccountsRes.status === 401 || allAccountsRes.status === 403) {
      const refreshed = await rotateTokens("all-accounts_401_403");
      if (refreshed) {
        allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
      }
    }

    const preview = (Array.isArray(allAccountsRes.accounts) ? allAccountsRes.accounts : []).slice(0, 50);

    return {
      ok: allAccountsRes.ok,
      baseUrl,
      jwtHost: jwtHost ?? undefined,
      status: allAccountsRes.status,
      count: Array.isArray(allAccountsRes.accounts) ? allAccountsRes.accounts.length : 0,
      accounts: Array.isArray(allAccountsRes.accounts) ? allAccountsRes.accounts : [],
      accountsPreview: preview,
      textPreview: allAccountsRes.text?.slice(0, 500) ?? "",
      error: allAccountsRes.ok ? undefined : "TradeLocker all-accounts request failed.",
    };
  },
});

export const probeInstrumentsForAllAccounts = action({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    secretsKey: v.string(),
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
  },
  returns: v.object({
    ok: v.boolean(),
    baseUrl: v.string(),
    jwtHost: v.optional(v.string()),
    accNum: v.number(),
    storedSelectedAccountId: v.string(),
    accountsPreview: v.array(v.any()),
    attempts: v.array(
      v.object({
        candidateType: v.string(),
        candidateValue: v.string(),
        status: v.number(),
        httpOk: v.boolean(),
        apiS: v.optional(v.string()),
        apiErrmsg: v.optional(v.string()),
        instrumentsCount: v.number(),
        textPreview: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const secrets = await ctx.runQuery(
      api.connections.internalQueries.getConnectionSecrets as any,
      { organizationId: args.organizationId, userId: args.userId },
    );
    if (!secrets || secrets.status !== "connected") {
      return {
        ok: false,
        baseUrl: "",
        jwtHost: undefined,
        accNum: 0,
        storedSelectedAccountId: "",
        accountsPreview: [],
        attempts: [],
      };
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage = args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    const jwtHost =
      typeof (secrets as any).jwtHost === "string"
        ? String((secrets as any).jwtHost)
        : extractJwtHost(accessToken);
    const baseUrlFallback = baseUrlForEnv(
      secrets.environment === "live" ? "live" : "demo",
    );
    const baseUrl = jwtHost ? `https://${jwtHost}/backend-api` : baseUrlFallback;

    const rotateTokens = async (reason: string): Promise<boolean> => {
      const res = await tradeLockerRefreshTokens({ baseUrl, refreshToken });
      if (!res.ok || !res.accessToken || !res.refreshToken) return false;
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        jwtHost: extractJwtHost(accessToken),
        selectedAccountId: String(secrets.selectedAccountId ?? ""),
        selectedAccNum: Number(secrets.selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: res.expireDateMs,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
      });

      console.log("[tradelocker.probeInstrumentsForAllAccounts.refresh_ok]", {
        organizationId: args.organizationId,
        userId: args.userId,
        reason,
      });
      return true;
    };

    let allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
    if (allAccountsRes.status === 401 || allAccountsRes.status === 403) {
      const refreshed = await rotateTokens("all-accounts_401_403");
      if (refreshed) {
        allAccountsRes = await tradeLockerAllAccounts({ baseUrl, accessToken });
      }
    }

    const storedAccNum = Number(secrets.selectedAccNum ?? 0);
    const storedSelectedAccountId = String(secrets.selectedAccountId ?? "").trim();
    const accNum =
      Number.isFinite(storedAccNum) && storedAccNum > 0 ? storedAccNum : 1;

    const accounts = Array.isArray(allAccountsRes.accounts) ? allAccountsRes.accounts : [];
    const accountsPreview = accounts.slice(0, 25);

    // Candidates to try for /trade/accounts/{accountId}/instruments.
    const candidates: Array<{ type: string; value: string }> = [];
    const pushCandidate = (type: string, value: unknown) => {
      const v = String(value ?? "").trim();
      if (!v) return;
      if (candidates.some((c) => c.value === v)) return;
      candidates.push({ type, value: v });
    };
    pushCandidate("stored.selectedAccountId", storedSelectedAccountId);
    // Also try accNum as the path param (TradeLocker sometimes uses this for {accountId}).
    pushCandidate("stored.accNum_as_accountId", String(accNum));
    const first = accounts[0];
    if (first) {
      pushCandidate("all-accounts.id", (first as any).id);
      pushCandidate("all-accounts.accountId", (first as any).accountId);
      pushCandidate("all-accounts._id", (first as any)._id);
      pushCandidate("all-accounts.name", (first as any).name);
      pushCandidate("all-accounts.accNum_as_accountId", (first as any).accNum);
    }
    for (const a of accounts.slice(0, 5)) {
      pushCandidate("all-accounts.id", (a as any).id);
      pushCandidate("all-accounts.accountId", (a as any).accountId);
      pushCandidate("all-accounts._id", (a as any)._id);
      pushCandidate("all-accounts.name", (a as any).name);
      pushCandidate("all-accounts.accNum_as_accountId", (a as any).accNum);
    }

    const attempts: Array<{
      candidateType: string;
      candidateValue: string;
      status: number;
      httpOk: boolean;
      apiS?: string;
      apiErrmsg?: string;
      instrumentsCount: number;
      textPreview: string;
    }> = [];

    for (const c of candidates.slice(0, 12)) {
      // Avoid spamming obvious invalid candidates (e.g. name strings) into a path param
      // that TradeLocker expects to be int-like.
      if (!/^\d+$/.test(c.value)) {
        attempts.push({
          candidateType: c.type,
          candidateValue: c.value,
          status: 0,
          httpOk: false,
          apiS: "skipped",
          apiErrmsg: "Skipped non-numeric candidate",
          instrumentsCount: 0,
          textPreview: "",
        });
        continue;
      }

      let listRes = await tradeLockerInstrumentsForAccount({
        baseUrl,
        accessToken,
        accNum,
        accountId: c.value,
      });
      if (listRes.status === 401 || listRes.status === 403) {
        const refreshed = await rotateTokens("instruments_401_403");
        if (refreshed) {
          listRes = await tradeLockerInstrumentsForAccount({
            baseUrl,
            accessToken,
            accNum,
            accountId: c.value,
          });
        }
      }

      const apiS =
        typeof listRes.json?.s === "string" ? String(listRes.json.s) : undefined;
      const apiErrmsg =
        typeof listRes.json?.errmsg === "string"
          ? String(listRes.json.errmsg)
          : typeof listRes.json?.error === "string"
            ? String(listRes.json.error)
            : undefined;

      const root =
        listRes.json?.d && typeof listRes.json.d === "object"
          ? listRes.json.d
          : listRes.json;
      const instruments: any[] = Array.isArray(root)
        ? root
        : Array.isArray(root?.instruments)
          ? root.instruments
          : Array.isArray(root?.data)
            ? root.data
            : [];

      attempts.push({
        candidateType: c.type,
        candidateValue: c.value,
        status: listRes.status,
        httpOk: Boolean(listRes.ok),
        apiS,
        apiErrmsg,
        instrumentsCount: instruments.length,
        textPreview: listRes.text?.slice(0, 200) ?? "",
      });

      // If we're rate-limited, bail early to avoid making it worse.
      if (listRes.status === 429) break;
    }

    return {
      ok: allAccountsRes.ok,
      baseUrl,
      jwtHost: jwtHost ?? undefined,
      accNum,
      storedSelectedAccountId,
      accountsPreview,
      attempts,
    };
  },
});

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
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
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
    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage =
      args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;
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

    // Migration-safe path: if caller requests encryption but tokens are stored as plaintext,
    // re-encrypt and persist without requiring a refresh to occur first.
    if (requestedTokenStorage === "enc" && !storedEncrypted) {
      const accessTokenEncrypted = await encryptSecret(accessToken, keyMaterial);
      const refreshTokenEncrypted = await encryptSecret(refreshToken, keyMaterial);
      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        selectedAccountId: tradeAccountId,
        selectedAccNum: tradeAccNum,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: (secrets as any).accessTokenExpiresAt,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
        jwtHost: extractJwtHost(accessToken),
      });
    }

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
  unrealizedPnl?: number;
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
      unrealizedPnl: parseNumberLike(
        row?.unrealizedPnl ??
          row?.unrealizedPnL ??
          row?.unrealizedProfit ??
          row?.unrealizedPL ??
          row?.profitUnrealized ??
          row?.pnlUnrealized,
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
    tokenStorage: v.optional(v.union(v.literal("raw"), v.literal("enc"))),
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

    const storedEncrypted =
      String((secrets as any).accessTokenEncrypted ?? "").startsWith("enc_v1:") ||
      String((secrets as any).refreshTokenEncrypted ?? "").startsWith("enc_v1:");
    const requestedTokenStorage =
      args.tokenStorage === "enc" ? "enc" : "raw";
    const shouldEncrypt = requestedTokenStorage === "enc" || storedEncrypted;

    // Migration-safe path: if caller requests encryption but tokens are stored as plaintext,
    // re-encrypt and persist without requiring a refresh to occur first.
    if (requestedTokenStorage === "enc" && !storedEncrypted) {
      const accessTokenEncrypted = await encryptSecret(accessToken, keyMaterial);
      const refreshTokenEncrypted = await encryptSecret(refreshToken, keyMaterial);
      await ctx.runMutation(api.connections.mutations.upsertConnection as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        environment: secrets.environment === "live" ? "live" : "demo",
        server: String(secrets.server ?? ""),
        selectedAccountId: String(secrets.selectedAccountId ?? ""),
        selectedAccNum: Number(secrets.selectedAccNum ?? 0),
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: (secrets as any).accessTokenExpiresAt,
        refreshTokenExpiresAt: (secrets as any).refreshTokenExpiresAt,
        status: "connected",
        lastError: undefined,
        jwtHost: extractJwtHost(accessToken),
      });
    }

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

      const accessTokenEncrypted = shouldEncrypt
        ? await encryptSecret(accessToken, keyMaterial)
        : accessToken;
      const refreshTokenEncrypted = shouldEncrypt
        ? await encryptSecret(refreshToken, keyMaterial)
        : refreshToken;

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
          unrealizedPnl: p.unrealizedPnl,
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

    // TradeIdeas (preferred): rebuild per broker positionId when available.
    const openPositionIds = new Set<string>();
    for (const p of positions) {
      const id = String(p.externalPositionId ?? "").trim();
      if (id) openPositionIds.add(id);
    }

    const positionIdsFromExecutions = new Set<string>();
    for (const e of executions) {
      const id = typeof e.externalPositionId === "string" ? e.externalPositionId.trim() : "";
      if (id) positionIdsFromExecutions.add(id);
    }

    const allPositionIds = new Set<string>();
    for (const id of openPositionIds) allPositionIds.add(id);
    for (const id of positionIdsFromExecutions) allPositionIds.add(id);

    for (const positionId of allPositionIds) {
      try {
        const res = await ctx.runMutation(
          api.tradeIdeas.mutations.rebuildTradeIdeaForPosition as any,
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
        tradeIdeaGroupIds.push(res.tradeIdeaGroupId as Id<"tradeIdeaGroups">);
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

    // Fallback: rebuild synthetic “episodes” for executions without broker positionId.
    // (keeps legacy behavior for brokers that omit position identifiers).
    const touchedInstrumentIds = new Set<string>();
    for (const e of executions) {
      const hasPos =
        typeof e.externalPositionId === "string" && e.externalPositionId.trim();
      if (hasPos) continue;
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

    // Realization events: prefer TradeLocker report endpoint which actually includes realized PnL
    // and close timestamps (ordersHistory often lacks these fields).
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

    const normalizeMaybeMs = (ts: number): number => {
      // Heuristic: if seconds (10 digits-ish), convert to ms.
      if (ts > 0 && ts < 10_000_000_000) return ts * 1000;
      return ts;
    };

    const extractPositionIdFromRaw = (raw: any): string => {
      const pos =
        (typeof raw?.positionId === "string" && raw.positionId.trim()) ||
        (typeof raw?.posId === "string" && raw.posId.trim()) ||
        (typeof raw?.tradeId === "string" && raw.tradeId.trim()) ||
        (raw?.positionId || raw?.posId || raw?.tradeId
          ? String(raw.positionId ?? raw.posId ?? raw.tradeId).trim()
          : "");
      return pos;
    };

    const extractRealizedPnlFromRaw = (raw: any): number | undefined => {
      return (
        parseNumberLike(raw?.realizedPnl) ??
        parseNumberLike(raw?.realizedPnL) ??
        parseNumberLike(raw?.pnl) ??
        parseNumberLike(raw?.profit) ??
        parseNumberLike(raw?.realizedProfit) ??
        parseNumberLike(raw?.netProfit) ??
        parseNumberLike(raw?.realizedPL) ??
        parseNumberLike(raw?.closedPnl)
      );
    };

    // 1) Report-driven events: `/trade/reports/close-trades-history`
    let reportEventsInserted = 0;
    try {
      // Pull one page; most accounts are fine under this cap for now.
      // If pagination is needed later, the debug panel output includes `links.next`.
      let reportRes = await tradeLockerApi({
        baseUrl,
        accessToken,
        accNum: tradeAccNum,
        path: "/trade/reports/close-trades-history",
      });
      if (reportRes.status === 401 || reportRes.status === 403) {
        const refreshed = await rotateTokens("close_trades_history_401_403");
        if (refreshed) {
          reportRes = await tradeLockerApi({
            baseUrl,
            accessToken,
            accNum: tradeAccNum,
            path: "/trade/reports/close-trades-history",
          });
        }
      }

      const rows = Array.isArray((reportRes.json as any)?.data)
        ? ((reportRes.json as any).data as any[])
        : [];
      console.log("[tradelocker.sync.close_trades_history]", {
        organizationId: args.organizationId,
        userId: args.userId,
        status: reportRes.status,
        ok: reportRes.ok,
        rows: rows.length,
        sampleKeys:
          rows[0] && typeof rows[0] === "object"
            ? Object.keys(rows[0] as Record<string, unknown>).slice(0, 30)
            : [],
      });

      for (const r of rows) {
        const positionId = extractPositionIdFromRaw(r);
        if (!positionId) continue;

        const closedAtRaw =
          parseNumberLike(r?.closeMilliseconds) ??
          parseNumberLike(r?.closeMs) ??
          parseNumberLike(r?.closeTime) ??
          parseNumberLike(r?.closedAt);
        const closedAt =
          typeof closedAtRaw === "number" ? normalizeMaybeMs(closedAtRaw) : undefined;
        if (!closedAt || !Number.isFinite(closedAt) || closedAt <= 0) continue;

        const realizedPnl = extractRealizedPnlFromRaw(r);
        if (typeof realizedPnl !== "number") continue;

        const qtyClosed =
          parseNumberLike(r?.closeAmount) ??
          parseNumberLike(r?.qty) ??
          parseNumberLike(r?.quantity) ??
          parseNumberLike(r?.volume);
        const commission = parseNumberLike(r?.commission);
        const swap = parseNumberLike(r?.swap);
        // Store "fees" as a single number (most brokers expose commission/swap as negatives).
        const fees =
          typeof commission === "number" || typeof swap === "number"
            ? (typeof commission === "number" ? commission : 0) +
              (typeof swap === "number" ? swap : 0)
            : undefined;

        const externalOrderId =
          typeof r?.closeOrderId === "string" && r.closeOrderId.trim()
            ? r.closeOrderId.trim()
            : typeof r?.orderId === "string" && r.orderId.trim()
              ? r.orderId.trim()
              : undefined;

        const externalEventId = [
          positionId,
          externalOrderId ?? "no_order",
          String(Math.round(closedAt)),
          String(Math.round(realizedPnl * 100) / 100),
        ].join(":");

        const groupId = await ctx.runQuery(
          api.tradeIdeas.internalQueries.getGroupIdByPositionId as any,
          {
            organizationId: args.organizationId,
            userId: args.userId,
            accountId: tradeAccountId,
            positionId,
          },
        );

        await ctx.runMutation(api.raw.mutations.upsertTradeRealizationEvent as any, {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId,
          accountId: tradeAccountId,
          externalEventId,
          externalOrderId,
          externalPositionId: positionId,
          tradeIdeaGroupId: groupId ?? undefined,
          closedAt,
          realizedPnl,
          fees,
          qtyClosed,
          raw: r,
        });
        reportEventsInserted++;
      }
      console.log("[tradelocker.sync.close_trades_history_inserted]", {
        organizationId: args.organizationId,
        userId: args.userId,
        inserted: reportEventsInserted,
      });
    } catch (err) {
      console.log("[tradelocker.sync.close_trades_history_error]", {
        organizationId: args.organizationId,
        userId: args.userId,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fallback below can still populate events for other brokers.
    }

    // 2) Fallback: per partial close from ordersHistory when it contains PnL + closedAt.
    for (const o of ordersHistory) {
      const raw = o.raw;
      const positionId = extractPositionIdFromRaw(raw);
      if (!positionId) continue;

      const realizedPnl = extractRealizedPnlFromRaw(raw);
      if (typeof realizedPnl !== "number") continue;

      const closedAt =
        typeof o.closedAt === "number"
          ? o.closedAt
          : typeof raw?.closedAt === "number"
            ? raw.closedAt
            : typeof raw?.closeTime === "number"
              ? raw.closeTime
              : undefined;
      if (typeof closedAt !== "number" || !Number.isFinite(closedAt) || closedAt <= 0) {
        continue;
      }

      const qtyClosed = parseNumberLike(raw?.qty ?? raw?.quantity ?? raw?.volume);
      const fees = parseNumberLike(raw?.fees);
      const externalOrderId =
        typeof o.externalOrderId === "string" && o.externalOrderId.trim()
          ? o.externalOrderId.trim()
          : undefined;

      // Deterministic, stable id for idempotent upsert.
      const externalEventId = [
        positionId,
        externalOrderId ?? "no_order",
        String(Math.round(closedAt)),
        String(Math.round(realizedPnl * 100) / 100),
      ].join(":");

      const groupId = await ctx.runQuery(
        api.tradeIdeas.internalQueries.getGroupIdByPositionId as any,
        {
          organizationId: args.organizationId,
          userId: args.userId,
          accountId: tradeAccountId,
          positionId,
        },
      );

      await ctx.runMutation(api.raw.mutations.upsertTradeRealizationEvent as any, {
        organizationId: args.organizationId,
        userId: args.userId,
        connectionId,
        accountId: tradeAccountId,
        externalEventId,
        externalOrderId,
        externalPositionId: positionId,
        tradeIdeaGroupId: groupId ?? undefined,
        closedAt,
        realizedPnl,
        fees,
        qtyClosed,
        raw,
      });
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
