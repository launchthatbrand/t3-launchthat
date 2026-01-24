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

  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
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

  /**
   * Localhost nuance:
   * In some browsers, `auth.localhost` cookies may not be considered "same-site" when
   * loaded inside an iframe on `tenant.localhost`, so Clerk can't see the existing session.
   * That causes an infinite refresh loop when we try to refresh auth via a hidden iframe.
   *
   * Workaround: if this request came from an iframe in local dev, force a *top-level*
   * navigation to the auth host so cookies are first-party for the auth host.
   */
  const secFetchDest = (req.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  const secFetchMode = (req.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  const accept = (req.headers.get("accept") ?? "").toLowerCase();
  const isNavigationRequest =
    secFetchMode === "navigate" || accept.includes("text/html");
  const isLikelyEmbeddedNavigation =
    secFetchDest === "iframe" || (isNavigationRequest && secFetchDest === "document");
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.includes(".localhost") ||
    host.includes(".127.0.0.1");

  if (isLikelyEmbeddedNavigation && isLocal) {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Refreshing session…</title>
  </head>
  <body>
    <script>
      (function () {
        try {
          if (window.top) {
            window.top.location.href = ${JSON.stringify(signInUrl.toString())};
            return;
          }
        } catch (e) {}
        window.location.href = ${JSON.stringify(signInUrl.toString())};
      })();
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.redirect(signInUrl);
}

