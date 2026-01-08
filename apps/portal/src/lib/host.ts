import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

/**
 * Central auth host (the only host where Clerk UI should run).
 *
 * We derive it from NEXT_PUBLIC_ROOT_DOMAIN to keep environments consistent
 * (preview/dev/prod) without hard-coding "launchthat.app".
 */
export const getAuthHost = (rootDomain: string): string => {
  const normalized = rootDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "");
  const hostnameWithPort = normalized.split("/")[0] ?? "";
  const hostname = hostnameWithPort.split(":")[0] ?? "";
  return hostname ? `auth.${hostname}` : "auth.launchthat.app";
};

export const getHostFromHeaders = (
  headers: Headers | ReadonlyHeaders,
): string => {
  return (headers.get("x-forwarded-host") ?? headers.get("host") ?? "")
    .trim()
    .toLowerCase();
};

export const getHostnameFromHeaders = (
  headers: Headers | ReadonlyHeaders,
): string => {
  const host = getHostFromHeaders(headers);
  return (host.split(":")[0] ?? "").toLowerCase();
};

const parseHost = (host: string): { hostname: string; port: string } => {
  const trimmed = host.trim().toLowerCase();
  const [hostnameRaw, portRaw] = trimmed.split(":");
  return { hostname: (hostnameRaw ?? "").toLowerCase(), port: portRaw ?? "" };
};

export const isLocalHost = (host: string): boolean => {
  const { hostname } = parseHost(host);
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1")
  );
};

/**
 * Determine the protocol to use for absolute redirects.
 *
 * - In prod/staging, prefer x-forwarded-proto and fall back to https.
 * - In local dev (localhost / *.localhost), force http to avoid SSL errors.
 */
export const getProtoForHostFromHeaders = (
  host: string,
  headers: Headers | ReadonlyHeaders,
): "http" | "https" => {
  if (isLocalHost(host)) return "http";
  const forwarded = headers.get("x-forwarded-proto");
  const proto = (forwarded?.split(",")[0] ?? "").trim().toLowerCase();
  return proto === "http" ? "http" : "https";
};

/**
 * Compute the auth host for a specific request host.
 *
 * - In prod/staging, we want auth.<rootDomain>
 * - In local dev, we want auth.localhost:<port> (so sign-in works on the same dev port)
 */
export const getAuthHostForHost = (
  host: string,
  rootDomain: string,
): string => {
  const { hostname, port } = parseHost(host);
  const root = rootDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "");
  const rootHost = (root.split("/")[0] ?? "").split(":")[0] ?? "";

  if (isLocalHost(host)) {
    const base =
      hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    return `auth.${base}${port ? `:${port}` : ""}`;
  }

  return getAuthHost(rootHost || rootDomain);
};

export const isAuthHostForHost = (
  host: string,
  rootDomain: string,
): boolean => {
  const normalized = host.trim().toLowerCase();
  const expected = getAuthHostForHost(normalized, rootDomain);
  return normalized === expected;
};

export const isAuthHost = (hostname: string, rootDomain: string): boolean => {
  if (!hostname) return false;
  return hostname === getAuthHost(rootDomain);
};
