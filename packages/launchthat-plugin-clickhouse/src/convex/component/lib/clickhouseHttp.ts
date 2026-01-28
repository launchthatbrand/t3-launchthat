/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

export interface ClickhouseParam {
  name: string;
  type: string; // e.g. "String", "Int64"
  value: string | number | boolean;
}

export interface ClickhouseQueryResult<T> {
  ok: boolean;
  rows: T[];
  error?: string;
  status?: number;
  textPreview?: string;
}

/**
 * IMPORTANT:
 * Convex components do NOT have access to deployment env variables in the same
 * way app-level Convex functions do. Always pass ClickHouse config in args from
 * the app layer (actions/internal actions) instead of reading process.env here.
 */
export type ClickhouseHttpConfig = {
  url: string;
  database?: string;
  user: string;
  password: string;
};

const isSafeParamName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

const base64FromBytes = (bytes: Uint8Array): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += alphabet[(n >> 6) & 63];
    out += alphabet[n & 63];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const n = bytes[i]! << 16;
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += "==";
  } else if (remaining === 2) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += alphabet[(n >> 6) & 63];
    out += "=";
  }
  return out;
};

const encodeBasicAuth = (user: string, password: string): string => {
  const raw = `${user}:${password}`;
  if (typeof btoa === "function") {
    return btoa(raw);
  }
  const bytes = new TextEncoder().encode(raw);
  return base64FromBytes(bytes);
};

/**
 * Execute a ClickHouse query over the HTTP interface, returning JSONEachRow rows.
 *
 * Parameterization:
 * - Use ClickHouse `{name:Type}` placeholders in SQL.
 * - Provide params as query string `param_<name>=<value>`.
 */
export const clickhouseSelect = async <T extends Record<string, unknown>>(
  cfg: ClickhouseHttpConfig,
  sql: string,
  params: ClickhouseParam[] = [],
  options?: { database?: string; timeoutMs?: number },
): Promise<ClickhouseQueryResult<T>> => {
  const url = cfg.url;
  const user = cfg.user;
  const password = cfg.password;
  if (!url) throw new Error("Missing ClickHouse config url");
  if (!user) throw new Error("Missing ClickHouse config user");
  if (!password) throw new Error("Missing ClickHouse config password");

  const db = options?.database ?? cfg.database ?? "traderlaunchpad";
  const timeoutMs = Math.max(1_000, Math.min(60_000, options?.timeoutMs ?? 30_000));

  const u = new URL(url);
  if (!u.pathname || u.pathname === "") u.pathname = "/";
  u.searchParams.set("database", db);
  u.searchParams.set("default_format", "JSONEachRow");

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
  cfg: ClickhouseHttpConfig,
  sql: string,
  params: ClickhouseParam[] = [],
  options?: { database?: string; timeoutMs?: number },
): Promise<{ ok: boolean; error?: string; status?: number; textPreview?: string }> => {
  const url = cfg.url;
  const user = cfg.user;
  const password = cfg.password;
  if (!url) throw new Error("Missing ClickHouse config url");
  if (!user) throw new Error("Missing ClickHouse config user");
  if (!password) throw new Error("Missing ClickHouse config password");

  const db = options?.database ?? cfg.database ?? "traderlaunchpad";
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

