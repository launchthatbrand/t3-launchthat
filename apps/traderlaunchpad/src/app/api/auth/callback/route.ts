import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { api as apiAny } from "@convex-config/_generated/api.js";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  // base64url
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const isSameOriginHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const isLocalHostHeader = (hostname: string): boolean => {
  const lower = (hostname ?? "").toLowerCase();
  return (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".127.0.0.1")
  );
};

const parseHostAndPort = (
  hostHeader: string,
): { hostname: string; port: string | null } => {
  const trimmed = (hostHeader ?? "").trim();
  if (!trimmed) return { hostname: "", port: null };
  const [hostname, port] = trimmed.split(":");
  return { hostname: (hostname ?? "").toLowerCase(), port: port ?? null };
};

const normalizeRootHost = (rootDomain: string): string => {
  return (
    rootDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0] ?? ""
  );
};

const resolveTenantSlugFromReturnTo = (
  returnTo: string,
  rootDomain: string,
): { hostname: string; slug: string } | null => {
  try {
    const url = new URL(returnTo);
    const hostname = url.hostname.toLowerCase();
    const rootHost = normalizeRootHost(rootDomain);
    if (!hostname || !rootHost) return null;
    if (!hostname.endsWith(`.${rootHost}`)) return { hostname, slug: "" };
    const slug = hostname.slice(0, -1 * `.${rootHost}`.length);
    return { hostname, slug };
  } catch {
    return null;
  }
};

const computeTenantOrigin = (args: {
  authRequestHost: string;
  tenantSlug: string;
  rootDomain: string;
  orgCustomDomain: string | null;
  returnTo: string;
  defaultTenantSlug: string;
}): { tenantOrigin: string; returnToRewritten: string } => {
  const returnUrl = new URL(args.returnTo);
  const rootHost = normalizeRootHost(args.rootDomain);

  // Expected tenant hosts we consider "correct" for this tenant.
  const expectedHosts = new Set<string>();
  if (rootHost) {
    // Root tenant slug (platform/global) lives on the apex domain.
    if (args.tenantSlug === args.defaultTenantSlug) {
      expectedHosts.add(rootHost);
      expectedHosts.add(`www.${rootHost}`);
    } else {
      expectedHosts.add(`${args.tenantSlug}.${rootHost}`);
    }
  }
  if (args.orgCustomDomain) expectedHosts.add(args.orgCustomDomain.toLowerCase());

  const { hostname: authHostname, port: authPort } = parseHostAndPort(
    args.authRequestHost,
  );
  if (isLocalHostHeader(authHostname)) {
    const base =
      authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    // Dev convenience: treat the default tenant as bare localhost.
    if (args.tenantSlug === args.defaultTenantSlug) {
      expectedHosts.add(base);
      if (authPort) expectedHosts.add(`${base}:${authPort}`);
    } else {
      expectedHosts.add(`${args.tenantSlug}.${base}`);
      if (authPort) expectedHosts.add(`${args.tenantSlug}.${base}:${authPort}`);
    }
  }

  const shouldRewrite =
    expectedHosts.size > 0 && !expectedHosts.has(returnUrl.host);
  if (!shouldRewrite) {
    return {
      tenantOrigin: returnUrl.origin,
      returnToRewritten: returnUrl.toString(),
    };
  }

  let tenantOrigin: string;
  if (args.orgCustomDomain) {
    const proto = isLocalHostHeader(args.orgCustomDomain) ? "http" : "https";
    tenantOrigin = `${proto}://${args.orgCustomDomain}`;
  } else if (isLocalHostHeader(authHostname)) {
    const base =
      authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    if (args.tenantSlug === args.defaultTenantSlug) {
      tenantOrigin = `http://${base}${authPort ? `:${authPort}` : ""}`;
    } else {
      tenantOrigin = `http://${args.tenantSlug}.${base}${authPort ? `:${authPort}` : ""}`;
    }
  } else {
    tenantOrigin =
      args.tenantSlug === args.defaultTenantSlug
        ? `https://${rootHost}`
        : `https://${args.tenantSlug}.${rootHost}`;
  }

  const rewritten = new URL(
    returnUrl.pathname + returnUrl.search + returnUrl.hash,
    tenantOrigin,
  );
  return { tenantOrigin, returnToRewritten: rewritten.toString() };
};

export async function GET(req: NextRequest) {
  const authState = await auth();
  const clerkUserId = authState.userId;
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const returnToRaw = (searchParams.get("return_to") ?? "").trim();
  const returnTo = returnToRaw.length > 0 ? returnToRaw : null;
  const tenantSlugParam = (searchParams.get("tenant") ?? "").trim().toLowerCase();

  if (returnTo && !isSameOriginHttpUrl(returnTo)) {
    return NextResponse.json({ error: "Missing or invalid return_to" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(String(env.NEXT_PUBLIC_CONVEX_URL));

  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com";
  const derived = returnTo ? resolveTenantSlugFromReturnTo(returnTo, rootDomain) : null;
  const derivedSlug = derived?.slug ?? "";
  const derivedHostname = derived?.hostname ?? "";
  const defaultTenantSlug = String(env.TRADERLAUNCHPAD_DEFAULT_TENANT_SLUG ?? "platform")
    .trim()
    .toLowerCase();

  // If tenant isn't provided, derive from return_to:
  // - subdomain under rootDomain => slug
  // - custom domain => resolve by hostname
  // - bare localhost => defaultTenantSlug
  const resolvedSlug = tenantSlugParam
    ? tenantSlugParam
    : derivedSlug
      ? derivedSlug
      : derivedHostname && isLocalHostHeader(derivedHostname)
        ? defaultTenantSlug
        : "";

  if (!resolvedSlug) {
    return NextResponse.json(
      { error: "Missing tenant context (provide tenant or return_to)" },
      { status: 400 },
    );
  }

  const org: unknown = await convex.query(
    derivedHostname && !derivedSlug && !tenantSlugParam && !isLocalHostHeader(derivedHostname)
      ? ((apiAny as any).coreTenant.organizations.getOrganizationByHostname as any)
      : ((apiAny as any).coreTenant.organizations.getOrganizationBySlug as any),
    derivedHostname && !derivedSlug && !tenantSlugParam && !isLocalHostHeader(derivedHostname)
      ? { hostname: derivedHostname, appKey: "traderlaunchpad", requireVerified: true }
      : { slug: resolvedSlug },
  );

  const orgRecord =
    org && typeof org === "object"
      ? (org as { _id?: unknown; slug?: unknown; name?: unknown })
      : null;
  const organizationId = typeof orgRecord?._id === "string" ? orgRecord._id : "";
  const slug = typeof orgRecord?.slug === "string" ? orgRecord.slug : resolvedSlug;

  if (!organizationId) {
    return NextResponse.json({ error: "Unable to resolve tenant" }, { status: 400 });
  }

  const code = randomBytes(32).toString("base64url");
  const codeHash = sha256Base64Url(code);
  const expiresAt = Date.now() + 5 * 60 * 1000;

  await convex.mutation((apiAny as any).auth.exchange.createExchangeCode as any, {
    codeHash,
    organizationId,
    clerkUserId,
    expiresAt,
  });

  // Transitional: emit a Clerk-minted Convex token (stored in localStorage on the tenant host).
  const convexToken =
    typeof authState.getToken === "function"
      ? await authState.getToken({ template: "convex" })
      : null;

  const authRequestHost = req.headers.get("host") ?? "";
  const tenantOrigin = (() => {
    if (returnTo) {
      return computeTenantOrigin({
        authRequestHost,
        tenantSlug: slug,
        rootDomain,
        orgCustomDomain: derivedSlug ? null : derivedHostname && !isLocalHostHeader(derivedHostname) ? derivedHostname : null,
        returnTo,
        defaultTenantSlug,
      }).tenantOrigin;
    }

    const rootHost = normalizeRootHost(rootDomain);
    const { hostname: authHostname, port: authPort } = parseHostAndPort(authRequestHost);
    if (isLocalHostHeader(authHostname)) {
      const base =
        authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
          ? "127.0.0.1"
          : "localhost";
      if (slug === defaultTenantSlug) {
        return `http://${base}${authPort ? `:${authPort}` : ""}`;
      }
      return `http://${slug}.${base}${authPort ? `:${authPort}` : ""}`;
    }
    return slug === defaultTenantSlug ? `https://${rootHost}` : `https://${slug}.${rootHost}`;
  })();

  const finalReturnTo = (() => {
    if (!returnTo) return new URL("/", tenantOrigin).toString();
    const { returnToRewritten } = computeTenantOrigin({
      authRequestHost,
      tenantSlug: slug,
      rootDomain,
      orgCustomDomain: derivedSlug ? null : derivedHostname && !isLocalHostHeader(derivedHostname) ? derivedHostname : null,
      returnTo,
      defaultTenantSlug,
    });
    return returnToRewritten;
  })();

  const exchangeUrl = new URL("/auth/callback", tenantOrigin);
  exchangeUrl.searchParams.set("code", code);
  exchangeUrl.searchParams.set("return_to", finalReturnTo);
  if (typeof convexToken === "string" && convexToken.length > 0) {
    exchangeUrl.searchParams.set("token", convexToken);
  }

  return NextResponse.redirect(exchangeUrl);
}

