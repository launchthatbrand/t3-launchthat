import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes (require sign-in)
const isProtectedRoute = createRouteMatcher([
  "/((?!api|_next/static|_next/image|favicon.ico|.+\\..+).*)",
]);

// Middleware function
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // All routes require sign-in in this application
  if (isProtectedRoute(req)) {
    // Protect the route if the user is not authenticated
    // Clerk's protect() handles the redirection automatically
    await auth.protect();

    // If we reach here, the user IS authenticated
    console.log("User is authenticated");
  }

  // Allow access to public routes or routes the user is authorized for
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except for static assets and Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
