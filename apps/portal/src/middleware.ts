import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes (require sign-in)
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/forum(.*)"]);

// Define admin routes (require sign-in AND admin role)
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Middleware function
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Route requires sign-in
  if (isProtectedRoute(req) || isAdminRoute(req)) {
    // Protect the route if the user is not authenticated.
    // Clerk's protect() handles the redirection automatically.
    // It also prevents further execution in the unauthenticated case.
    await auth.protect();

    // If we reach here, the user IS authenticated.
    // Now, check for admin role specifically on admin routes.
    if (isAdminRoute(req)) {
      // Get claims for the authenticated user
      const { sessionClaims } = await auth();
      console.log("sessionClaims", sessionClaims?.metadata.role);

      // Check if the user has the admin role
      if (
        !sessionClaims?.metadata.role ||
        sessionClaims.metadata.role !== "admin"
      ) {
        console.log("User is not an admin");
        // User is authenticated but not an admin, redirect to dashboard
        const dashboardUrl = new URL("/dashboard", req.url);
        // Call auth() again to get userId for logging
        const { userId } = await auth();
        console.log(
          `Redirecting non-admin user ${userId} from admin route ${req.url} to dashboard.`, // Use destructured userId
        );
        return NextResponse.redirect(dashboardUrl);
      }
      // User is admin, allow access (fall through to NextResponse.next())
    }
    // User is authenticated and on a protected (non-admin) route, allow access (fall through to NextResponse.next())
  }
  console.log("User is authenticated");

  // Allow access to public routes or routes the user is authorized for
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except for static assets and Next.js internals.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // Always run for API routes if you have them, otherwise, it can be removed
    // "/(api|trpc)(.*)", // Keep this if you have tRPC or other API routes to protect
  ],
};
