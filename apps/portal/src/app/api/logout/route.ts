import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ConvexHttpClient } from "convex/browser";
import { createHash } from "crypto";

import { api as apiAny } from "@/convex/_generated/api.js";
import { env } from "~/env";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "tenant_session";

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function POST(req: NextRequest) {
  const sessionId = (req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "").trim();

  if (sessionId) {
    const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
    const sessionIdHash = sha256Base64Url(sessionId);
    try {
      await convex.mutation(apiAny.auth.sessions.revokeTenantSession, {
        sessionIdHash,
      });
    } catch {
      // ignore
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}


