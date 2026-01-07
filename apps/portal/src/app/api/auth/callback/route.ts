import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { randomBytes, createHash } from "crypto";

import { api as apiAny } from "@/convex/_generated/api.js";
import { env } from "~/env";

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
    const hostname = (url.hostname ?? "").toLowerCase();
    const root = rootDomain.trim().toLowerCase().replace(/^https?:\/\//, "");
    const rootHost = (root.split("/")[0] ?? "").split(":")[0] ?? "";
    if (!hostname || !rootHost) return null;
    if (!hostname.endsWith(`.${rootHost}`)) return { hostname, slug: "" };
    const slug = hostname.slice(0, -1 * (`.${rootHost}`.length));
    return { hostname, slug };
  } catch {
    return null;
  }
};

export async function GET(req: NextRequest) {
  const authState = await auth();
  const clerkUserId = authState.userId;
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const returnTo = (searchParams.get("return_to") ?? "").trim();
  const tenantSlugParam = (searchParams.get("tenant") ?? "").trim();

  if (!returnTo || !isSameOriginHttpUrl(returnTo)) {
    return NextResponse.json(
      { error: "Missing or invalid return_to" },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

  // Resolve tenant by explicit slug first; otherwise derive from return_to hostname.
  const derived = resolveTenantSlugFromReturnTo(returnTo, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const derivedSlug = derived?.slug ?? "";
  const derivedHostname = derived?.hostname ?? "";
  const slug = tenantSlugParam || derivedSlug;

  const org: unknown =
    slug && slug.length > 0
      ? await convex.query(apiAny.core.organizations.queries.getBySlug, { slug })
      : derivedHostname
        ? await convex.query(apiAny.core.organizations.queries.getByCustomDomain, {
            hostname: derivedHostname,
          })
        : null;

  const orgRecord =
    org && typeof org === "object"
      ? (org as { _id?: unknown; slug?: unknown })
      : null;
  const organizationId =
    typeof orgRecord?._id === "string" ? (orgRecord._id) : "";

  if (!organizationId) {
    return NextResponse.json(
      { error: "Unable to resolve tenant from return_to" },
      { status: 400 },
    );
  }

  const code = randomBytes(32).toString("base64url");
  const codeHash = sha256Base64Url(code);
  const expiresAt = Date.now() + 5 * 60 * 1000;

  await convex.mutation(apiAny.auth.exchange.createExchangeCode, {
    codeHash,
    organizationId,
    clerkUserId,
    expiresAt,
  });

  const convexToken =
    typeof authState.getToken === "function"
      ? await authState.getToken({ template: "convex" })
      : null;

  const returnUrl = new URL(returnTo);
  const exchangeUrl = new URL("/auth/callback", returnUrl.origin);
  exchangeUrl.searchParams.set("code", code);
  exchangeUrl.searchParams.set("return_to", returnTo);
  if (typeof convexToken === "string" && convexToken.length > 0) {
    exchangeUrl.searchParams.set("token", convexToken);
  }

  return NextResponse.redirect(exchangeUrl);
}


