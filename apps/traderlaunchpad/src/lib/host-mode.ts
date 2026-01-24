export type HostMode = "platform" | "whitelabel";

const stripProtocolAndPath = (value: string): string => {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.trim() ?? "";
};

const parseHostname = (hostOrHostname: string): string => {
  const raw = stripProtocolAndPath(hostOrHostname);
  return (raw.split(":")[0] ?? "").trim().toLowerCase();
};

const normalizeRootDomainHostname = (rootDomain: string): string => {
  const raw = stripProtocolAndPath(rootDomain);
  const hostname = (raw.split(":")[0] ?? "").trim().toLowerCase();
  return hostname.replace(/^www\./, "");
};

/**
 * Platform mode:
 * - traderlaunchpad.com (apex)
 * - *.traderlaunchpad.com (first-party subdomains)
 *
 * NOTE: Local dev often sets NEXT_PUBLIC_ROOT_DOMAIN to "localhost:3000".
 * In that environment, we intentionally DO NOT enable platform mode because
 * Clerk sessions on `auth.localhost` are not reliably shared to `localhost`/`*.localhost`
 * across browsers. Local dev should use tenant-session auth (Portal-style).
 */
export const isPlatformHost = (args: {
  hostOrHostname: string;
  rootDomain: string;
}): boolean => {
  const hostname = parseHostname(args.hostOrHostname);
  const root = normalizeRootDomainHostname(args.rootDomain);

  if (!hostname) return false;
  if (!root) return false;

  // Local dev
  if (root === "localhost" || root === "127.0.0.1") {
    return false;
  }

  return hostname === root || hostname.endsWith(`.${root}`);
};

/**
 * Whitelabel mode is only possible on non-first-party hostnames.
 * Whether it's *actually* a valid whitelabel host is determined by tenant resolution
 * (verified organizationDomains mapping) in middleware / tenant-fetcher.
 */
export const isPotentialWhitelabelHost = (args: {
  hostOrHostname: string;
  rootDomain: string;
}): boolean => {
  const hostname = parseHostname(args.hostOrHostname);
  if (!hostname) return false;
  return !isPlatformHost(args);
};

