import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { env } from "~/env";
import {
  fetchTenantByCustomDomain,
  fetchTenantBySlug,
} from "~/lib/tenant-fetcher";

const rootDomain =
  (String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com").split(":")[0] ??
    "traderlaunchpad.com");

const isLocalHost = (hostname: string): boolean => {
  const host = (hostname.split(":")[0] ?? "").toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".127.0.0.1")
  );
};

const getAuthHostForMiddleware = (host: string, rootDomainFormatted: string): string => {
  const normalized = host.trim().toLowerCase();
  const hostname = (normalized.split(":")[0] ?? "").toLowerCase();
  const port = normalized.split(":")[1] ?? "";

  if (isLocalHost(hostname)) {
    const base =
      hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1")
        ? "127.0.0.1"
        : "localhost";
    return `auth.${base}${port ? `:${port}` : ""}`;
  }

  return rootDomainFormatted ? `auth.${rootDomainFormatted}` : "auth.traderlaunchpad.com";
};

// Tenant subdomain extraction (localhost, Vercel preview, and real root-domain subdomains).
function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const hostname = host.split(":")[0] ?? "";

  // Localhost handling (e.g., http://tenant.localhost:3000)
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    if (hostname.includes(".localhost") || hostname.includes(".127.0.0.1")) {
      const sub = hostname.split(".")[0] ?? "";
      return sub || null;
    }
    return null;
  }

  // Vercel preview handling: slug---project.vercel.app
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---");
    const sub = parts[0] ?? "";
    return sub || null;
  }

  const rootDomainFormatted = rootDomain.toLowerCase();

  // Real subdomain (tenant.example.com)
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain
    ? hostname.replace(`.${rootDomainFormatted}`, "") || null
    : null;
}

// Routes requiring authentication.
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/platform(.*)",
  "/journal(.*)",
]);

// Clerk UI routes must ONLY run on the auth host.
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/sign-out(.*)",
  "/sign-in-token(.*)",
]);

const shouldBypassClerkMiddleware = (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  if (!pathname) return false;
  if (pathname.startsWith("/api/og/")) return true;
  return false;
};

const clerk = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const subdomainRaw = extractSubdomain(req);
  const host = req.headers.get("host") ?? "unknown-host";
  const hostname = (host.split(":")[0] ?? "").toLowerCase();

  const rootDomainFormatted = rootDomain.toLowerCase();
  const authHost = getAuthHostForMiddleware(host, rootDomainFormatted);
  const authHostname = (authHost.split(":")[0] ?? "").toLowerCase();
  const isAuthHost = hostname === authHostname;

  const subdomain = isAuthHost || subdomainRaw === "auth" ? null : subdomainRaw;

  // Resolve tenant:
  // - If we have a subdomain under our root domain, resolve by slug.
  // - Otherwise attempt custom-domain lookup (verified only).
  const tenant =
    subdomain !== null
      ? await fetchTenantBySlug(subdomain)
      : isLocalHost(hostname)
        ? await fetchTenantBySlug(null)
        : hostname &&
            rootDomainFormatted &&
            hostname !== rootDomainFormatted &&
            hostname !== `www.${rootDomainFormatted}` &&
            !hostname.endsWith(`.${rootDomainFormatted}`)
          ? await fetchTenantByCustomDomain(hostname)
          : await fetchTenantBySlug(null);

  // Subdomain exists but no tenant → redirect home
  if (subdomain && !tenant) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Inject tenant headers so all routes/server components can read them.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant._id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-name", tenant.name);
    if (tenant.customDomain) requestHeaders.set("x-tenant-custom-domain", tenant.customDomain);
  }

  // If a user hits a Clerk UI route on a tenant/custom host (e.g. localhost:3000/sign-in),
  // redirect them to the auth host so the page is wrapped in <ClerkProvider>.
  if (!isAuthHost && isAuthRoute(req)) {
    const forwardedProto = (req.headers.get("x-forwarded-proto") ?? "")
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    const proto = forwardedProto === "http" || isLocalHost(hostname) ? "http" : "https";

    const signInUrl = new URL(`${proto}://${authHost}${pathname}`);
    // Preserve query params; ensure return_to exists so auth host can bounce back.
    req.nextUrl.searchParams.forEach((value, key) => {
      signInUrl.searchParams.set(key, value);
    });
    if (!signInUrl.searchParams.get("return_to")) {
      // Never default return_to to an auth route on the tenant host (causes loops).
      signInUrl.searchParams.set("return_to", req.nextUrl.origin);
    }
    if (!signInUrl.searchParams.get("tenant")) {
      if (tenant?.slug) {
        signInUrl.searchParams.set("tenant", tenant.slug);
      } else if (isLocalHost(hostname)) {
        // Portal parity: ensure a tenant slug is always present in local dev
        // when the origin is bare localhost.
        const fallbackSlug = String(
          env.TRADERLAUNCHPAD_DEFAULT_TENANT_SLUG ?? "default",
        )
          .trim()
          .toLowerCase();
        if (fallbackSlug) signInUrl.searchParams.set("tenant", fallbackSlug);
      }
    }

    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-pathname", pathname);
  if (tenant) {
    response.headers.set("x-tenant-id", tenant._id);
    response.headers.set("x-tenant-slug", tenant.slug);
  }

  // Protected route logic
  if (isProtectedRoute(req)) {
    // On tenant subdomains/custom domains, rely on the tenant session cookie.
    if (!isAuthHost) {
      const hasSessionCookie = Boolean(req.cookies.get("tenant_session")?.value);
      if (!hasSessionCookie) {
        const redirectTo = req.nextUrl.clone();
        const forwardedProto = (req.headers.get("x-forwarded-proto") ?? "")
          .split(",")[0]
          ?.trim()
          .toLowerCase();
        const proto = forwardedProto === "http" || isLocalHost(hostname) ? "http" : "https";
        const signInUrl = new URL(`${proto}://${authHost}/sign-in`);
        signInUrl.searchParams.set("return_to", redirectTo.toString());
        if (tenant?.slug) signInUrl.searchParams.set("tenant", tenant.slug);
        return NextResponse.redirect(signInUrl);
      }

      return response;
    }

    // On auth host, enforce Clerk auth normally.
    await auth.protect();
  }

  return response;
});

interface TenantContext {
  response: NextResponse;
}

async function buildTenantResponse(req: NextRequest): Promise<TenantContext> {
  const { pathname } = req.nextUrl;
  const subdomainRaw = extractSubdomain(req);
  const host = req.headers.get("host") ?? "unknown-host";
  const hostname = (host.split(":")[0] ?? "").toLowerCase();

  const rootDomainFormatted = rootDomain.toLowerCase();
  const authHost = getAuthHostForMiddleware(host, rootDomainFormatted);
  const authHostname = (authHost.split(":")[0] ?? "").toLowerCase();
  const isAuthHost = hostname === authHostname;
  const subdomain = isAuthHost || subdomainRaw === "auth" ? null : subdomainRaw;

  const tenant =
    subdomain !== null
      ? await fetchTenantBySlug(subdomain)
      : isLocalHost(hostname)
        ? await fetchTenantBySlug(null)
        : hostname &&
            rootDomainFormatted &&
            hostname !== rootDomainFormatted &&
            hostname !== `www.${rootDomainFormatted}` &&
            !hostname.endsWith(`.${rootDomainFormatted}`)
          ? await fetchTenantByCustomDomain(hostname)
          : await fetchTenantBySlug(null);

  if (subdomain && !tenant) {
    return { response: NextResponse.redirect(new URL("/", req.url)) };
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant._id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-name", tenant.name);
    if (tenant.customDomain) requestHeaders.set("x-tenant-custom-domain", tenant.customDomain);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-pathname", pathname);
  if (tenant) {
    response.headers.set("x-tenant-id", tenant._id);
    response.headers.set("x-tenant-slug", tenant.slug);
  }

  return { response };
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (shouldBypassClerkMiddleware(req)) {
    const { response } = await buildTenantResponse(req);
    return response;
  }
  return clerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
