/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { env } from "../../src/env";

export interface ClickhouseParam {
  name: string;
  type: string; // e.g. "String", "Int64"
  value: string | number | boolean;
};

interface ClickhouseQueryResult<T> {
  ok: boolean;
  rows: T[];
  error?: string;
  status?: number;
  textPreview?: string;
};

const requireClickhouseHttpConfig = (): {
  url: string;
  database: string;
  user: string;
  password: string;
} => {
  const url = process.env.CLICKHOUSE_HTTP_URL;
  const database = process.env.CLICKHOUSE_DB ?? "traderlaunchpad";
  const user = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;
  if (!url) throw new Error("Missing CLICKHOUSE_HTTP_URL");
  if (!user) throw new Error("Missing CLICKHOUSE_USER");
  if (!password) throw new Error("Missing CLICKHOUSE_PASSWORD");
  return { url, database, user, password };
};

const isSafeParamName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

const encodeBasicAuth = (user: string, password: string): string => {
  // Convex Node runtime supports Buffer; V8 runtime might not. Keep it defensive.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(`${user}:${password}`, "utf8").toString("base64");
  }
  // Fallback (should be rare).
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return btoa(`${user}:${password}`);
};

/**
 * Execute a ClickHouse query over the HTTP interface, returning JSONEachRow rows.
 *
 * Parameterization:
 * - Use ClickHouse `{name:Type}` placeholders in SQL.
 * - Provide params as query string `param_<name>=<value>`.
 *
 * Example:
 *  sql: "SELECT * FROM candles_1m WHERE sourceKey = {sourceKey:String} LIMIT 10"
 *  params: [{ name:"sourceKey", type:"String", value:"tradelocker:..." }]
 */
export const clickhouseSelect = async <T extends Record<string, unknown>>(
  sql: string,
  params: ClickhouseParam[] = [],
  options?: { database?: string; timeoutMs?: number },
): Promise<ClickhouseQueryResult<T>> => {
  const { url, database, user, password } = requireClickhouseHttpConfig();
  const db = options?.database ?? database;
  const timeoutMs = Math.max(1_000, Math.min(60_000, options?.timeoutMs ?? 30_000));

  const u = new URL(url);
  // Ensure trailing slash works.
  if (!u.pathname || u.pathname === "") u.pathname = "/";
  u.searchParams.set("database", db);
  u.searchParams.set("default_format", "JSONEachRow");

  for (const p of params) {
    const name = p.name.trim();
    if (!isSafeParamName(name)) {
      throw new Error(`Unsafe ClickHouse param name: ${name}`);
    }
    // `type` exists for caller clarity; ClickHouse only needs param_name values here.
    u.searchParams.set(`param_${name}`, String(p.value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(String(u), {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(user, password)}`,
        "content-type": "text/plain; charset=utf-8",
      },
      body: sql,
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        rows: [],
        status: res.status,
        textPreview: text.slice(0, 1200),
        error: `ClickHouse HTTP ${res.status}`,
      };
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const rows: T[] = [];
    for (const line of lines) {
      try {
        rows.push(JSON.parse(line) as T);
      } catch {
        // ignore malformed line
      }
    }

    return { ok: true, rows };
  } catch (e) {
    return {
      ok: false,
      rows: [],
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
};

export const clickhouseExec = async (
  sql: string,
  params: ClickhouseParam[] = [],
  options?: { database?: string; timeoutMs?: number },
): Promise<{ ok: boolean; error?: string; status?: number; textPreview?: string }> => {
  const { url, database, user, password } = requireClickhouseHttpConfig();
  const db = options?.database ?? database;
  const timeoutMs = Math.max(1_000, Math.min(120_000, options?.timeoutMs ?? 60_000));

  const u = new URL(url);
  if (!u.pathname || u.pathname === "") u.pathname = "/";
  u.searchParams.set("database", db);

  for (const p of params) {
    const name = p.name.trim();
    if (!isSafeParamName(name)) {
      throw new Error(`Unsafe ClickHouse param name: ${name}`);
    }
    u.searchParams.set(`param_${name}`, String(p.value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(String(u), {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(user, password)}`,
        "content-type": "text/plain; charset=utf-8",
      },
      body: sql,
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        textPreview: text.slice(0, 1200),
        error: `ClickHouse HTTP ${res.status}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
};

