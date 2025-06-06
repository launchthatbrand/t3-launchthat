import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

// Middleware function
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if this is an embed route
  const url = new URL(req.url);
  const isEmbed = isEmbedRoute(req);

  // For embed routes, we need to allow iframe embedding
  if (isEmbed) {
    // Process the request as normal, but we'll add CORS and frame-ancestor headers
    const response = NextResponse.next();

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
    await auth.protect();

    // If we reach here, the user IS authenticated.
    // Now, check for admin role specifically on admin routes.
    if (isAdminRoute(req)) {
      // Get claims for the authenticated user
      const { sessionClaims } = await auth();

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
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and embed routes
    "/((?!_next|login|embed/|embed$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
