"use client";

export const stripProtocol = (domain: string): string =>
  domain.replace(/^https?:\/\//i, "");

export const isLocalHostHost = (host: string): boolean => {
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1")
  );
};

export const getLocalSuffix = (hostname: string): string => {
  const lower = hostname.toLowerCase();
  if (lower.includes(".localhost")) return lower.substring(lower.indexOf(".localhost"));
  if (lower.includes(".127.0.0.1")) return lower.substring(lower.indexOf(".127.0.0.1"));
  if (lower === "127.0.0.1") return ".127.0.0.1";
  return ".localhost";
};

export type BuildOrgSwitchUrlArgs = {
  currentUrl: string;
  currentHost: string;
  currentHostname: string;
  currentPort: string;
  currentProtocol: string; // e.g. "http:" | "https:"

  slug: string | null;
  customDomain: string | null;

  rootDomain: string;
  preferLocalhostSubdomains: boolean;
  preservePath: boolean;
  redirectBasePath?: string;

  /**
   * For apps where a specific tenant slug represents the "root" tenant that lives
   * on the apex domain (no subdomain). Portal uses this.
   */
  rootTenantSlug?: string;
};

export const buildOrganizationSwitchUrl = (args: BuildOrgSwitchUrlArgs): string | null => {
  const slug = (args.slug ?? "").trim();
  const customDomainRaw = (args.customDomain ?? "").trim();
  const customDomain = customDomainRaw ? stripProtocol(customDomainRaw) : "";
  if (!slug && !customDomain) return null;

  const normalizedProtocol = args.currentProtocol.replace(":", "") || "http";
  const portSegment = args.currentPort ? `:${args.currentPort}` : "";

  const computeHost = (): string => {
    if (customDomain) return customDomain;

    const isLocal = isLocalHostHost(args.currentHost);
    const isRootTenant = Boolean(args.rootTenantSlug) && slug === args.rootTenantSlug;

    if (isRootTenant) {
      if (isLocal) {
        const baseLocal =
          args.currentHostname === "localhost" || args.currentHostname.endsWith(".localhost")
            ? "localhost"
            : "127.0.0.1";
        return `${baseLocal}${portSegment}`;
      }
      return stripProtocol(args.rootDomain);
    }

    if (args.preferLocalhostSubdomains && isLocal && slug) {
      return `${slug}${getLocalSuffix(args.currentHostname)}${portSegment}`;
    }

    return `${slug}.${stripProtocol(args.rootDomain)}`;
  };

  const nextHost = computeHost();
  const targetProtocol = customDomain && normalizedProtocol === "http" ? "https" : normalizedProtocol;

  const nextUrl = new URL(args.currentUrl);
  nextUrl.protocol = `${targetProtocol}:`;

  const [nextHostname, nextPort] = nextHost.split(":");
  nextUrl.hostname = nextHostname ?? nextHost;
  nextUrl.port = nextPort ?? "";

  if (!args.preservePath) {
    const base = (args.redirectBasePath?.trim() ?? "/") || "/";
    nextUrl.pathname = base.startsWith("/") ? base : `/${base}`;
    nextUrl.search = "";
    nextUrl.hash = "";
  }

  return nextUrl.toString();
};

