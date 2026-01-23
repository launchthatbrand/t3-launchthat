import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import {
  getAuthHostForHost as sharedGetAuthHostForHost,
  getHostFromHeaders as sharedGetHostFromHeaders,
  getProtoForHostFromHeaders as sharedGetProtoForHostFromHeaders,
  isAuthHostForHost as sharedIsAuthHostForHost,
  isLocalHost as sharedIsLocalHost,
} from "launchthat-plugin-core-tenant/next/host";

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
  return sharedGetHostFromHeaders(headers);
};

export const getHostnameFromHeaders = (
  headers: Headers | ReadonlyHeaders,
): string => {
  const host = getHostFromHeaders(headers);
  return (host.split(":")[0] ?? "").toLowerCase();
};

export const isLocalHost = (host: string): boolean => {
  return sharedIsLocalHost(host);
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
  return sharedGetProtoForHostFromHeaders(host, headers);
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
  return sharedGetAuthHostForHost(host, rootDomain);
};

export const isAuthHostForHost = (
  host: string,
  rootDomain: string,
): boolean => {
  return sharedIsAuthHostForHost(host, rootDomain);
};

export const isAuthHost = (hostname: string, rootDomain: string): boolean => {
  if (!hostname) return false;
  return hostname === getAuthHost(rootDomain);
};
