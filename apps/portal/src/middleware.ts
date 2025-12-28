import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  fetchTenantByCustomDomain,
  fetchTenantBySlug,
} from "@/lib/tenant-fetcher";
import { rootDomain } from "@/lib/utils";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes requiring authentication
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/forum(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Skip Clerk middleware for internal routes and known crawlers.
const shouldBypassClerkMiddleware = (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  if (!pathname) return false;

  if (pathname.startsWith("/_microfrontends")) return true;
  if (pathname.startsWith("/puck")) return true;
  if (pathname.startsWith("/api/support-chat")) return true;
  if (pathname.startsWith("/api/og/")) return true;
  if (pathname.startsWith("/api/media/")) return true;

  // Allow SEO/social scrapers to fetch public HTML without Clerk dev handshake redirects.
  // IMPORTANT: Never bypass auth for protected/admin routes.
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    if (isProtectedRoute(req) || isAdminRoute(req)) return false;
    const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
    const isKnownBot =
      ua.includes("facebookexternalhit") ||
      ua.includes("twitterbot") ||
      ua.includes("linkedinbot") ||
      ua.includes("slackbot") ||
      ua.includes("discordbot") ||
      ua.includes("whatsapp") ||
      ua.includes("telegrambot");
    if (isKnownBot) return true;
    if (req.headers.get("x-seo-inspector") === "1") return true;
  }

  return false;
};

// Extract subdomain from localhost, Vercel, and custom domains
function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const hostname = host.split(":")[0] ?? "";

  // Localhost handling (e.g., http://tenant.localhost:3000)
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    if (hostname.includes(".localhost")) {
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

  const rootDomainFormatted = rootDomain.split(":")[0];

  // Real subdomain (tenant.example.com)
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain
    ? hostname.replace(`.${rootDomainFormatted}`, "") || null
    : null;
}

const clerk = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req);
  const host = req.headers.get("host") ?? "unknown-host";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const rootDomainFormatted = rootDomain.split(":")[0]?.toLowerCase() ?? "";

  // Resolve tenant:
  // - If we have a subdomain under our root domain, resolve by slug.
  // - Otherwise attempt custom-domain lookup (verified only).
  const tenant =
    subdomain !== null
      ? await fetchTenantBySlug(subdomain)
      : hostname &&
          rootDomainFormatted &&
          hostname !== rootDomainFormatted &&
          hostname !== `www.${rootDomainFormatted}` &&
          !hostname.endsWith(`.${rootDomainFormatted}`)
        ? await fetchTenantByCustomDomain(hostname)
        : await fetchTenantBySlug(null);

  console.log("[middleware] incoming request", {
    host,
    pathname,
    subdomain,
    tenantId: tenant?._id,
  });

  // Subdomain exists but no tenant → redirect home
  if (subdomain && !tenant) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Inject tenant headers so all routes/server components can read them
  const requestHeaders = new Headers(req.headers);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant._id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-name", tenant.name); // safe UTF-8
    if (tenant.logo) requestHeaders.set("x-tenant-logo", tenant.logo);
    if (tenant.planId) requestHeaders.set("x-tenant-plan-id", tenant.planId);
    if (tenant.customDomain)
      requestHeaders.set("x-tenant-custom-domain", tenant.customDomain);
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

  // Protected + Admin route logic
  if (isProtectedRoute(req) || isAdminRoute(req)) {
    try {
      await auth.protect();
    } catch (error) {
      console.warn("[middleware] auth.protect redirecting", {
        host,
        pathname,
        subdomain,
        tenantId: tenant?._id,
        error,
      });
      throw error;
    }

    const authState = await auth();

    console.log("[middleware] authenticated user", {
      userId: authState.userId,
      role: authState.sessionClaims?.metadata.role,
      host,
      subdomain,
      tenantId: tenant?._id,
    });

    if (isAdminRoute(req)) {
      const role = authState.sessionClaims?.metadata.role;

      if (role !== "admin") {
        const dashboardUrl = new URL("/dashboard", req.url);
        console.log(
          `Redirecting non-admin user ${authState.userId} from admin route ${req.url} to dashboard.`,
        );
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return response;
});

interface TenantContext {
  response: NextResponse;
}

async function buildTenantResponse(req: NextRequest): Promise<TenantContext> {
  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req);
  const host = req.headers.get("host") ?? "unknown-host";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const rootDomainFormatted = rootDomain.split(":")[0]?.toLowerCase() ?? "";

  const tenant =
    subdomain !== null
      ? await fetchTenantBySlug(subdomain)
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
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant._id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-name", tenant.name);
    if (tenant.planId) requestHeaders.set("x-tenant-plan-id", tenant.planId);
    if (tenant.customDomain)
      requestHeaders.set("x-tenant-custom-domain", tenant.customDomain);
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

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  if (shouldBypassClerkMiddleware(req)) {
    const { response } = await buildTenantResponse(req);
    return response;
  }
  return clerk(req, event);
}

export const config = {
  matcher: [
    // NOTE: Do NOT exclude `/login` here. We still need tenant resolution headers
    // (x-tenant-*) on the login page for custom domains/subdomains so SSR metadata
    // and other tenant-aware server code doesn't fall back to the "Portal" tenant.
    "/((?!_next|embed/|embed$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
