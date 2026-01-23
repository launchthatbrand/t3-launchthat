import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ConvexHttpClient } from "convex/browser";
import { createHash, randomBytes } from "crypto";

import { api as apiAny } from "@convex-config/_generated/api.js";
import { env } from "~/env";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "tenant_session";

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const safeReturnToPath = (req: NextRequest, value: string | null): string => {
  if (!value) return "/";
  try {
    const url = new URL(value);
    if (url.origin !== req.nextUrl.origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
};

const setTenantSessionCookie = (res: NextResponse, sessionId: string) => {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
};

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();
  const returnTo = req.nextUrl.searchParams.get("return_to");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant context" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(String(env.NEXT_PUBLIC_CONVEX_URL));
  const codeHash = sha256Base64Url(code);

  const consumed: unknown = await convex.mutation(
    (apiAny as any).auth.exchange.consumeExchangeCode as any,
    { codeHash },
  );
  const record =
    consumed && typeof consumed === "object"
      ? (consumed as { organizationId?: unknown; clerkUserId?: unknown })
      : null;

  const organizationId =
    typeof record?.organizationId === "string" ? record.organizationId : "";
  const clerkUserId = typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

  if (!organizationId || !clerkUserId) {
    return NextResponse.json({ error: "Invalid or expired exchange code" }, { status: 401 });
  }
  if (organizationId !== tenantId) {
    return NextResponse.json({ error: "Exchange code does not match tenant" }, { status: 403 });
  }

  const sessionId = randomBytes(32).toString("base64url");
  const sessionIdHash = sha256Base64Url(sessionId);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  await convex.mutation((apiAny as any).auth.sessions.createTenantSession as any, {
    sessionIdHash,
    organizationId,
    clerkUserId,
    expiresAt,
  });

  const redirectPath = safeReturnToPath(req, returnTo);
  const res = NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));
  setTenantSessionCookie(res, sessionId);
  return res;
}

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const code =
    body && typeof body === "object" && typeof (body as any).code === "string"
      ? ((body as any).code as string).trim()
      : "";

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant context" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(String(env.NEXT_PUBLIC_CONVEX_URL));
  const codeHash = sha256Base64Url(code);

  const consumed: unknown = await convex.mutation(
    (apiAny as any).auth.exchange.consumeExchangeCode as any,
    { codeHash },
  );
  const record =
    consumed && typeof consumed === "object"
      ? (consumed as { organizationId?: unknown; clerkUserId?: unknown })
      : null;

  const organizationId =
    typeof record?.organizationId === "string" ? record.organizationId : "";
  const clerkUserId = typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

  if (!organizationId || !clerkUserId) {
    return NextResponse.json({ error: "Invalid or expired exchange code" }, { status: 401 });
  }
  if (organizationId !== tenantId) {
    return NextResponse.json({ error: "Exchange code does not match tenant" }, { status: 403 });
  }

  const sessionId = randomBytes(32).toString("base64url");
  const sessionIdHash = sha256Base64Url(sessionId);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  await convex.mutation((apiAny as any).auth.sessions.createTenantSession as any, {
    sessionIdHash,
    organizationId,
    clerkUserId,
    expiresAt,
  });

  const res = NextResponse.json({ ok: true });
  setTenantSessionCookie(res, sessionId);
  return res;
}

