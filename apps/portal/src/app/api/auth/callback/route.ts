import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { PORTAL_TENANT_SLUG } from "@/convex/constants";
import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";
import { isLocalHost } from "~/lib/host";

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

const resolveTenantSlugFromReturnTo = (
  returnTo: string,
  rootDomain: string,
): { hostname: string; slug: string } | null => {
  try {
    const url = new URL(returnTo);
    const hostname = url.hostname.toLowerCase();
    const root = rootDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "");
    const rootHost = (root.split("/")[0] ?? "").split(":")[0] ?? "";
    if (!hostname || !rootHost) return null;
    if (!hostname.endsWith(`.${rootHost}`)) return { hostname, slug: "" };
    const slug = hostname.slice(0, -1 * `.${rootHost}`.length);
    return { hostname, slug };
  } catch {
    return null;
  }
};

const parseHostAndPort = (
  hostHeader: string,
): { hostname: string; port: string | null } => {
  const trimmed = (hostHeader ?? "").trim();
  if (!trimmed) return { hostname: "", port: null };
  const [hostname, port] = trimmed.split(":");
  return { hostname: (hostname ?? "").toLowerCase(), port: port ?? null };
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

const computeTenantOrigin = (args: {
  authRequestHost: string;
  tenantSlug: string;
  rootDomain: string;
  orgCustomDomain: string | null;
  returnTo: string;
}): { tenantOrigin: string; returnToRewritten: string } => {
  const returnUrl = new URL(args.returnTo);

  // If return_to is already pointing at either the tenant subdomain or the org's custom domain,
  // keep it as-is. We only rewrite when we detect a mismatch (common in local dev when some
  // parts of the app still assume localhost:3000).
  const rootHost = normalizeRootHost(args.rootDomain);
  const expectedHosts = new Set<string>();

  // Production-style tenant subdomain (slug.rootHost)
  if (rootHost) expectedHosts.add(`${args.tenantSlug}.${rootHost}`);
  // Custom domain (if present)
  if (args.orgCustomDomain)
    expectedHosts.add(args.orgCustomDomain.toLowerCase());

  // Localhost tenant subdomain (slug.localhost[:port]) - derive port from auth host
  const { hostname: authHostname, port: authPort } = parseHostAndPort(
    args.authRequestHost,
  );
  if (isLocalHostHeader(authHostname)) {
    const base =
      authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    // Portal root should be reachable on bare localhost, not a subdomain.
    if (args.tenantSlug === PORTAL_TENANT_SLUG) {
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

  // Prefer the org custom domain if we have one, otherwise use the tenant subdomain.
  // Note: for localhost dev, always use http.
  let tenantOrigin: string;
  if (args.orgCustomDomain) {
    const proto = isLocalHost(args.orgCustomDomain) ? "http" : "https";
    tenantOrigin = `${proto}://${args.orgCustomDomain}`;
  } else if (isLocalHostHeader(authHostname)) {
    const base =
      authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    // Portal root should be served from bare localhost (no tenant subdomain).
    if (args.tenantSlug === PORTAL_TENANT_SLUG) {
      tenantOrigin = `http://${base}${authPort ? `:${authPort}` : ""}`;
    } else {
      tenantOrigin = `http://${args.tenantSlug}.${base}${authPort ? `:${authPort}` : ""}`;
    }
  } else {
    tenantOrigin = `https://${args.tenantSlug}.${rootHost}`;
  }

  // Rewrite return_to to the same origin we're redirecting to, preserving path/query/hash.
  const rewritten = new URL(
    returnUrl.pathname + returnUrl.search + returnUrl.hash,
    tenantOrigin,
  );
  return { tenantOrigin, returnToRewritten: rewritten.toString() };
};

const computeDefaultReturnToForRole = (args: {
  tenantOrigin: string;
  isGlobalAdmin: boolean;
}): string => {
  return new URL(
    args.isGlobalAdmin ? "/admin" : "/",
    args.tenantOrigin,
  ).toString();
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
  const tenantSlugParam = (searchParams.get("tenant") ?? "").trim();

  // If return_to is provided, it must be a valid absolute http(s) URL.
  if (returnTo && !isSameOriginHttpUrl(returnTo)) {
    return NextResponse.json(
      { error: "Missing or invalid return_to" },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

  // Resolve tenant by explicit slug first; otherwise derive from return_to hostname.
  // If return_to is missing, tenant must be provided.
  const derived = returnTo
    ? resolveTenantSlugFromReturnTo(returnTo, env.NEXT_PUBLIC_ROOT_DOMAIN)
    : null;
  const derivedSlug = derived?.slug ?? "";
  const derivedHostname = derived?.hostname ?? "";
  const slug =
    tenantSlugParam ||
    derivedSlug ||
    // Local dev convenience: if return_to is localhost and no tenant was provided,
    // treat it as the portal tenant (so /admin redirects don't get stuck).
    (derivedHostname && isLocalHost(derivedHostname) ? PORTAL_TENANT_SLUG : "");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing tenant context (provide tenant or return_to)" },
      { status: 400 },
    );
  }

  const org: unknown =
    slug && slug.length > 0
      ? await convex.query(apiAny.core.organizations.queries.getBySlug, {
          slug,
        })
      : derivedHostname
        ? await convex.query(
            apiAny.core.organizations.queries.getByCustomDomain,
            {
              hostname: derivedHostname,
            },
          )
        : null;

  const orgRecord =
    org && typeof org === "object"
      ? (org as { _id?: unknown; slug?: unknown; customDomain?: unknown })
      : null;
  const organizationId =
    typeof orgRecord?._id === "string" ? orgRecord._id : "";
  const orgCustomDomain =
    typeof orgRecord?.customDomain === "string" &&
    orgRecord.customDomain.trim().length > 0
      ? orgRecord.customDomain.trim()
      : null;

  if (!organizationId) {
    return NextResponse.json(
      { error: "Unable to resolve tenant from return_to" },
      { status: 400 },
    );
  }

  // Determine whether this user is a global admin (Clerk publicMetadata.role === "admin").
  // If you later want org-specific redirects, we can also check org membership role.
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const isGlobalAdmin =
    (clerkUser.publicMetadata as { role?: unknown } | null)?.role === "admin";

  const code = randomBytes(32).toString("base64url");
  const codeHash = sha256Base64Url(code);
  const expiresAt = Date.now() + 5 * 60 * 1000;

  await convex.mutation(apiAny.auth.exchange.createExchangeCode, {
    codeHash,
    organizationId,
    clerkUserId,
    expiresAt,
  });

  // Transitional: keep emitting a Clerk-minted Convex token until server-minted
  // tokens are fully rolled out everywhere.
  const convexToken =
    typeof authState.getToken === "function"
      ? await authState.getToken({ template: "convex" })
      : null;

  const authRequestHost = req.headers.get("host") ?? "";
  const tenantOrigin = (() => {
    // If we have a return_to, computeTenantOrigin will derive the correct tenant origin
    // (and rewrite the return_to to match that origin in local dev edge cases).
    if (returnTo) {
      return computeTenantOrigin({
        authRequestHost,
        tenantSlug: slug,
        rootDomain: env.NEXT_PUBLIC_ROOT_DOMAIN,
        orgCustomDomain,
        returnTo,
      }).tenantOrigin;
    }

    // No return_to: compute tenant origin from org + env.
    const rootHost = normalizeRootHost(env.NEXT_PUBLIC_ROOT_DOMAIN);
    if (orgCustomDomain) {
      const proto = isLocalHost(orgCustomDomain) ? "http" : "https";
      return `${proto}://${orgCustomDomain}`;
    }
    const { hostname: authHostname, port: authPort } =
      parseHostAndPort(authRequestHost);
    if (isLocalHostHeader(authHostname)) {
      const base =
        authHostname === "127.0.0.1" || authHostname.endsWith(".127.0.0.1")
          ? "127.0.0.1"
          : "localhost";
      return `http://${slug}.${base}${authPort ? `:${authPort}` : ""}`;
    }
    return `https://${slug}.${rootHost}`;
  })();

  const finalReturnTo = (() => {
    // Respect any provided return_to.
    if (returnTo) {
      const { returnToRewritten } = computeTenantOrigin({
        authRequestHost,
        tenantSlug: slug,
        rootDomain: env.NEXT_PUBLIC_ROOT_DOMAIN,
        orgCustomDomain,
        returnTo,
      });
      return returnToRewritten;
    }

    // Only when return_to is missing do we choose a role-based default.
    return computeDefaultReturnToForRole({ tenantOrigin, isGlobalAdmin });
  })();

  const exchangeUrl = new URL("/auth/callback", tenantOrigin);
  exchangeUrl.searchParams.set("code", code);
  exchangeUrl.searchParams.set("return_to", finalReturnTo);
  if (typeof convexToken === "string" && convexToken.length > 0) {
    exchangeUrl.searchParams.set("token", convexToken);
  }

  return NextResponse.redirect(exchangeUrl);
}
