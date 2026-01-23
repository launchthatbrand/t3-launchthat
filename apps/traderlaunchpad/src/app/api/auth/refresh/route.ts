import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getAuthHostForHost,
  getProtoForHostFromHeaders,
  isAuthHostForHost,
} from "~/lib/host";
import { env } from "~/env";

export const runtime = "nodejs";

/**
 * Redirect-based token refresh.
 *
 * Tenant/custom hosts don't run Clerk, so the only way to refresh a Clerk-issued
 * Convex token is to bounce the user through the auth host.
 *
 * This endpoint simply redirects to:
 *   https://auth.<root>/sign-in?return_to=<current_url>&tenant=<tenantSlug>
 */
export function GET(req: NextRequest) {
  const host = (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    ""
  )
    .trim()
    .toLowerCase();
  const proto = getProtoForHostFromHeaders(host, req.headers);

  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com";
  const authHost = getAuthHostForHost(host, rootDomain);

  // If already on the auth host, don't loop.
  if (isAuthHostForHost(host, rootDomain)) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl.origin));
  }

  const returnToParam = (req.nextUrl.searchParams.get("return_to") ?? "").trim();
  const returnTo = (() => {
    if (!returnToParam) return null;
    try {
      const u = new URL(returnToParam);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
      return u.toString();
    } catch {
      return null;
    }
  })();

  const tenantSlug = (req.headers.get("x-tenant-slug") ?? "").trim();
  const signInUrl = new URL(`${proto}://${authHost}/sign-in`);
  signInUrl.searchParams.set("return_to", returnTo ?? req.nextUrl.origin);
  if (tenantSlug) signInUrl.searchParams.set("tenant", tenantSlug);

  return NextResponse.redirect(signInUrl);
}

