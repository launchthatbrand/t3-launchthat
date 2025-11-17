import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchTenantBySlug } from "@/lib/tenant-fetcher";
import { rootDomain } from "@/lib/utils";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes (require sign-in)
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/forum(.*)"]);

// Define admin routes (require sign-in AND admin role)
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Define embed routes that should be publicly accessible
const isEmbedRoute = createRouteMatcher([
  "/embed(.*)",
  "/api/embed(.*)",
  "/api/auth/monday(.*)",
]);

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Local development environment
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const fullUrlMatch = /http:\/\/([^.]+)\.localhost/.exec(url);
    if (fullUrlMatch?.[1]) {
      return fullUrlMatch[1];
    }

    if (hostname?.includes(".localhost")) {
      return hostname.split(".")[0] ?? null;
    }

    return null;
  }

  const rootDomainFormatted = rootDomain.split(":")[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname?.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---");
    return parts.length > 0 ? (parts[0] ?? null) : null;
  }

  const isSubdomain =
    (hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname?.endsWith(`.${rootDomainFormatted}`)) ??
    false;

  return isSubdomain
    ? (hostname?.replace(`.${rootDomainFormatted}`, "") ?? null)
    : null;
}

// Middleware function
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const subdomain = extractSubdomain(req);
  const tenant = await fetchTenantBySlug(subdomain);
  const host = req.headers.get("host") ?? "unknown-host";
  console.log("[middleware] incoming request", {
    host,
    pathname,
    subdomain,
    tenantId: tenant?._id,
  });

  if (subdomain && !tenant) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check if this is an embed route
  const url = new URL(req.url);
  const isEmbed = isEmbedRoute(req);

  const requestHeaders = new Headers(req.headers);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant._id);
    requestHeaders.set("x-tenant-slug", tenant.slug);
    requestHeaders.set("x-tenant-name", encodeURIComponent(tenant.name));
    if (tenant.planId) {
      requestHeaders.set("x-tenant-plan-id", tenant.planId);
    }
    if (tenant.customDomain) {
      requestHeaders.set("x-tenant-custom-domain", tenant.customDomain);
    }
  }

  // Create a single response object and set pathname header
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set pathname header for use in components
  response.headers.set("x-pathname", req.nextUrl.pathname);
  if (tenant) {
    response.headers.set("x-tenant-id", tenant._id);
    response.headers.set("x-tenant-slug", tenant.slug);
  }

  // For embed routes, we need to allow iframe embedding
  if (isEmbed) {
    // Set headers to allow embedding in iframes
    response.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://*.monday.com https://monday.com https://*.monday.app *",
    );
    response.headers.set("X-Frame-Options", "ALLOW-FROM https://monday.com");

    // Add CORS headers for API routes
    if (url.pathname.startsWith("/api/")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
    }

    return response;
  }

  // Handle protected and admin routes
  if (isProtectedRoute(req) || isAdminRoute(req)) {
    // Protect the route if the user is not authenticated.
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

    // If we reach here, the user IS authenticated.
    // Now, check for admin role specifically on admin routes.
    const authState = await auth();
    console.log("[middleware] authenticated user", {
      userId: authState.userId,
      role: authState.sessionClaims?.metadata.role,
      host,
      subdomain,
      tenantId: tenant?._id,
    });
    if (isAdminRoute(req)) {
      // Get claims for the authenticated user
      const { sessionClaims } = authState;

      // Check if the user has the admin role
      if (
        !sessionClaims?.metadata.role ||
        sessionClaims.metadata.role !== "admin"
      ) {
        // User is authenticated but not an admin, redirect to dashboard
        const dashboardUrl = new URL("/dashboard", req.url);
        // Call auth() again to get userId for logging
        const { userId } = await auth();
        console.log(
          `Redirecting non-admin user ${userId} from admin route ${req.url} to dashboard.`,
        );
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // Allow access to public routes or routes the user is authorized for
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and embed routes
    "/((?!_next|login|embed/|embed$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
