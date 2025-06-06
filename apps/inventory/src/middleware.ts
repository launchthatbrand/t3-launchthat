// import type { NextRequest } from "next/server";
// import { NextResponse } from "next/server";

// /**
//  * Middleware for managing authentication flows, particularly for Monday.com iframe embedding
//  *
//  * This middleware allows initial page loads within Monday.com's iframe by:
//  * 1. Detecting Monday.com context based on user agent or query parameters
//  * 2. Bypassing Clerk's authentication redirects when in Monday context
//  * 3. Allowing normal authentication flow for direct site access
//  */
// export function middleware(request: NextRequest) {
//   // Check for Monday.com context indicators
//   const userAgent = request.headers.get("user-agent") ?? "";
//   const url = new URL(request.url);
//   const hasInMondayParam =
//     url.searchParams.has("inMonday") ||
//     url.searchParams.has("mondayIntegration");

//   // Determine if we're in a Monday.com iframe
//   const isInMonday =
//     hasInMondayParam ||
//     userAgent.includes("monday") ||
//     userAgent.includes("Monday");

//   // Store the detection result in headers for client-side access
//   const response = NextResponse.next();
//   response.headers.set("x-monday-context", isInMonday ? "true" : "false");

//   // For Monday context, bypass Clerk's authentication to avoid redirect loops
//   // Client-side authentication is still enforced via the AuthProtector and ConvexUserEnsurer

//   return response;
// }

// // Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

export { auth as middleware } from "@acme/auth";

// Or like this if you need to do something here.
// export default auth((req) => {
//   console.log(req.auth) //  { session: { user: { ... } } }
// })

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
