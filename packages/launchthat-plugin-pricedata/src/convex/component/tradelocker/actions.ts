import { action } from "../server";
import { v } from "convex/values";

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

const tradeLockerApi = async (args: {
  baseUrl: string;
  accessToken: string;
  accNum?: number;
  path: string;
  method?: "GET" | "POST";
  jsonBody?: unknown;
  developerKey?: string;
}): Promise<{ ok: boolean; status: number; text: string; json: any }> => {
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `Bearer ${args.accessToken}`,
  };
  if (typeof args.accNum === "number" && Number.isFinite(args.accNum)) {
    headers.accNum = String(args.accNum);
  }
  if (args.developerKey) {
    headers["tl-developer-api-key"] = args.developerKey;
  }

  const method = args.method ?? "GET";
  if (method !== "GET") headers["content-type"] = "application/json";

  const res = await fetch(`${args.baseUrl}${args.path}`, {
    method,
    headers,
    body: args.jsonBody ? JSON.stringify(args.jsonBody) : undefined,
  });

  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
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
  const text = await res.text().catch(() => "");
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
    typeof json?.expireDate === "string" ? Date.parse(String(json.expireDate)) : NaN;
  return {
    ok: true,
    status: res.status,
    text,
    accessToken,
    refreshToken,
    expireDateMs: Number.isFinite(expireDateMs) ? expireDateMs : undefined,
  };
};

const tradeLockerAllAccounts = async (args: {
  baseUrl: string;
  accessToken: string;
  developerKey?: string;
}): Promise<{ ok: boolean; status: number; text: string; accounts: any[]; json: any }> => {
  const res = await tradeLockerApi({
    baseUrl: args.baseUrl,
    accessToken: args.accessToken,
    path: "/auth/jwt/all-accounts",
    developerKey: args.developerKey,
  });
  const accounts = Array.isArray(res.json)
    ? res.json
    : Array.isArray(res.json?.accounts)
      ? res.json.accounts
      : [];
  return { ok: res.ok, status: res.status, text: res.text, accounts, json: res.json };
};

export const fetchAllAccounts = action({
  args: {
    baseUrl: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    developerKey: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    status: v.number(),
    accounts: v.array(v.any()),
    accountsPreview: v.array(v.any()),
    refreshed: v.optional(
      v.object({
        accessToken: v.string(),
        refreshToken: v.string(),
        expireDateMs: v.optional(v.number()),
      }),
    ),
    textPreview: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    let accessToken = args.accessToken;
    let refreshed:
      | { accessToken: string; refreshToken: string; expireDateMs?: number }
      | undefined;

    let res = await tradeLockerAllAccounts({
      baseUrl: args.baseUrl,
      accessToken,
      developerKey: args.developerKey,
    });

    if ((res.status === 401 || res.status === 403) && args.refreshToken) {
      const refreshRes = await tradeLockerRefreshTokens({
        baseUrl: args.baseUrl,
        refreshToken: args.refreshToken,
      });
      if (refreshRes.ok && refreshRes.accessToken && refreshRes.refreshToken) {
        refreshed = {
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken,
          expireDateMs: refreshRes.expireDateMs,
        };
        accessToken = refreshRes.accessToken;
        res = await tradeLockerAllAccounts({
          baseUrl: args.baseUrl,
          accessToken,
          developerKey: args.developerKey,
        });
      }
    }

    const preview = (Array.isArray(res.accounts) ? res.accounts : []).slice(0, 25);
    if (!res.ok) {
      console.log("[pricedata.tradelocker.fetchAllAccounts] failed", {
        baseUrl: args.baseUrl,
        status: res.status,
        textPreview: res.text.slice(0, 500),
      });
    }

    return {
      ok: res.ok,
      status: res.status,
      accounts: Array.isArray(res.accounts) ? res.accounts : [],
      accountsPreview: preview,
      refreshed,
      textPreview: res.text.slice(0, 500),
      error: res.ok ? undefined : "Failed to fetch all-accounts from TradeLocker.",
    };
  },
});

const extractInstruments = (payload: any): any[] => {
  const root =
    payload?.d && typeof payload.d === "object" ? payload.d : payload;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.instruments)) return root.instruments;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const toInstrumentMapping = (row: any): {
  symbol?: string;
  tradableInstrumentId?: string;
  infoRouteId?: number;
  raw?: any;
} => {
  const symbolRaw =
    typeof row?.symbol === "string"
      ? row.symbol
      : typeof row?.name === "string"
        ? row.name
        : typeof row?.ticker === "string"
          ? row.ticker
          : undefined;
  const symbol = symbolRaw ? normalizeSymbol(symbolRaw) : undefined;

  const tid =
    typeof row?.tradableInstrumentId === "string"
      ? row.tradableInstrumentId
      : typeof row?.tradableInstrumentId === "number"
        ? String(row.tradableInstrumentId)
        : typeof row?.instrumentId === "string"
          ? row.instrumentId
          : typeof row?.instrumentId === "number"
            ? String(row.instrumentId)
            : typeof row?.id === "string"
              ? row.id
              : typeof row?.id === "number"
                ? String(row.id)
                : undefined;

  const routes: any[] = Array.isArray(row?.routes) ? row.routes : [];
  const info = routes.find(
    (r) => String(r?.type ?? "").toLowerCase() === "info",
  );
  const infoRouteId = Number(info?.id);

  return {
    symbol,
    tradableInstrumentId: tid,
    infoRouteId: Number.isFinite(infoRouteId) ? infoRouteId : undefined,
    raw: row,
  };
};

export const fetchInstruments = action({
  args: {
    baseUrl: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accNum: v.number(),
    accountId: v.string(),
    developerKey: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    status: v.number(),
    count: v.number(),
    instruments: v.array(
      v.object({
        symbol: v.string(),
        tradableInstrumentId: v.string(),
        infoRouteId: v.optional(v.number()),
        raw: v.any(),
      }),
    ),
    refreshed: v.optional(
      v.object({
        accessToken: v.string(),
        refreshToken: v.string(),
        expireDateMs: v.optional(v.number()),
      }),
    ),
    textPreview: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    let accessToken = args.accessToken;
    let res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken,
      accNum: args.accNum,
      path: `/trade/accounts/${encodeURIComponent(args.accountId)}/instruments`,
      developerKey: args.developerKey,
    });

    let refreshed:
      | { accessToken: string; refreshToken: string; expireDateMs?: number }
      | undefined;

    if ((res.status === 401 || res.status === 403) && args.refreshToken) {
      const refreshRes = await tradeLockerRefreshTokens({
        baseUrl: args.baseUrl,
        refreshToken: args.refreshToken,
      });
      if (refreshRes.ok && refreshRes.accessToken && refreshRes.refreshToken) {
        refreshed = {
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken,
          expireDateMs: refreshRes.expireDateMs,
        };
        accessToken = refreshRes.accessToken;
        res = await tradeLockerApi({
          baseUrl: args.baseUrl,
          accessToken,
          accNum: args.accNum,
          path: `/trade/accounts/${encodeURIComponent(args.accountId)}/instruments`,
          developerKey: args.developerKey,
        });
      }
    }

    // TradeLocker sometimes returns HTTP 200 with an error JSON payload like:
    // {"s":"error","errmsg":"Account not found!"}
    const apiErrMsg =
      typeof res.json?.errmsg === "string"
        ? String(res.json.errmsg)
        : typeof res.json?.error === "string"
          ? String(res.json.error)
          : null;
    const apiErrTag =
      typeof res.json?.s === "string" ? String(res.json.s) : null;
    const hasErrorPayload =
      (apiErrTag && apiErrTag.toLowerCase() === "error") || Boolean(apiErrMsg);

    if (hasErrorPayload) {
      console.log("[pricedata.tradelocker.fetchInstruments] API error payload", {
        baseUrl: args.baseUrl,
        accNum: args.accNum,
        accountId: args.accountId,
        status: res.status,
        s: apiErrTag,
        errmsg: apiErrMsg,
        textPreview: res.text.slice(0, 500),
      });
    }

    const rows = extractInstruments(res.json);
    const mapped = rows
      .map(toInstrumentMapping)
      .filter(
        (x): x is Required<Pick<typeof x, "symbol" | "tradableInstrumentId">> & {
          infoRouteId?: number;
          raw?: any;
        } => Boolean(x.symbol && x.tradableInstrumentId),
      )
      .map((x) => ({
        symbol: x.symbol!,
        tradableInstrumentId: x.tradableInstrumentId!,
        infoRouteId: x.infoRouteId,
        raw: x.raw,
      }));

    return {
      ok: res.ok && !hasErrorPayload,
      status: res.status,
      count: mapped.length,
      instruments: mapped,
      refreshed,
      textPreview: res.text.slice(0, 500),
      error:
        res.ok && hasErrorPayload
          ? apiErrMsg ?? "TradeLocker returned an error payload."
          : res.ok
            ? undefined
            : "Failed to fetch instruments from TradeLocker.",
    };
  },
});

export const fetchHistory = action({
  args: {
    baseUrl: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accNum: v.number(),
    tradableInstrumentId: v.string(),
    infoRouteId: v.number(),
    resolution: v.string(),
    fromMs: v.number(),
    toMs: v.number(),
    developerKey: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    status: v.number(),
    routeId: v.number(),
    tradableInstrumentId: v.string(),
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
    refreshed: v.optional(
      v.object({
        accessToken: v.string(),
        refreshToken: v.string(),
        expireDateMs: v.optional(v.number()),
      }),
    ),
    textPreview: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const routeId = Number(args.infoRouteId);
    const requestPath =
      `/trade/history?routeId=${encodeURIComponent(String(routeId))}` +
      `&from=${encodeURIComponent(String(args.fromMs))}` +
      `&to=${encodeURIComponent(String(args.toMs))}` +
      `&resolution=${encodeURIComponent(args.resolution)}` +
      `&tradableInstrumentId=${encodeURIComponent(args.tradableInstrumentId)}`;

    let accessToken = args.accessToken;
    let res = await tradeLockerApi({
      baseUrl: args.baseUrl,
      accessToken,
      accNum: args.accNum,
      path: requestPath,
      developerKey: args.developerKey,
    });

    let refreshed:
      | { accessToken: string; refreshToken: string; expireDateMs?: number }
      | undefined;

    if ((res.status === 401 || res.status === 403) && args.refreshToken) {
      const refreshRes = await tradeLockerRefreshTokens({
        baseUrl: args.baseUrl,
        refreshToken: args.refreshToken,
      });
      if (refreshRes.ok && refreshRes.accessToken && refreshRes.refreshToken) {
        accessToken = refreshRes.accessToken;
        refreshed = {
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken,
          expireDateMs: refreshRes.expireDateMs,
        };
        res = await tradeLockerApi({
          baseUrl: args.baseUrl,
          accessToken,
          accNum: args.accNum,
          path: requestPath,
          developerKey: args.developerKey,
        });
      }
    }

    const apiStatus = String(res.json?.s ?? "");
    const apiOk = apiStatus === "ok" || Boolean(res.json?.d?.barDetails);

    const barDetails =
      res.json?.d?.barDetails ?? res.json?.barDetails ?? res.json?.d ?? [];
    const barsRaw: any[] = Array.isArray(barDetails) ? barDetails : [];

    const bars = barsRaw
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
      );

    return {
      ok: res.ok && apiOk,
      status: res.status,
      routeId,
      tradableInstrumentId: args.tradableInstrumentId,
      bars,
      refreshed,
      textPreview: res.text.slice(0, 500),
      error:
        res.ok && !apiOk
          ? String(res.json?.errmsg ?? res.json?.error ?? "TradeLocker returned s!=ok")
          : res.ok
            ? undefined
            : "TradeLocker history request failed.",
    };
  },
});

