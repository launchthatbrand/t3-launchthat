import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const TENANT_SESSION_COOKIE_NAME = "tenant_session";

export const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
export const CONVEX_TOKEN_UPDATED_EVENT = "convex-token-updated";
export const TENANT_SESSION_UPDATED_EVENT = "tenant-session-updated";

export const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const randomSessionId = (): string => randomBytes(32).toString("base64url");

export const safeReturnToPath = (req: NextRequest, value: string | null): string => {
  if (!value) return "/";
  try {
    const url = new URL(value);
    if (url.origin !== req.nextUrl.origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
};

export const setTenantSessionCookie = (
  res: NextResponse,
  sessionId: string,
  args?: { secure?: boolean; maxAgeSeconds?: number },
) => {
  res.cookies.set({
    name: TENANT_SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: args?.secure ?? false,
    path: "/",
    ...(typeof args?.maxAgeSeconds === "number" ? { maxAge: args.maxAgeSeconds } : {}),
  });
};

export const clearTenantSessionCookie = (
  res: NextResponse,
  args?: { secure?: boolean },
) => {
  res.cookies.set({
    name: TENANT_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: args?.secure ?? false,
    path: "/",
    maxAge: 0,
  });
};

