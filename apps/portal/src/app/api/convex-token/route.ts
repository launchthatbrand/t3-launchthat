import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { ConvexHttpClient } from "convex/browser";
import { SignJWT } from "jose";

import { env } from "~/env";
import {
  getLaunchthatIssuer,
  getLaunchthatKid,
  getLaunchthatPrivateKey,
} from "~/lib/oidcKeys";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "tenant_session";

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function GET(req: NextRequest) {
  if (
    !env.LAUNCHTHAT_JWT_ISSUER_DOMAIN ||
    !env.LAUNCHTHAT_JWT_AUDIENCE ||
    !env.LAUNCHTHAT_JWT_KID ||
    !env.LAUNCHTHAT_JWT_PRIVATE_KEY
  ) {
    return NextResponse.json(
      { error: "Server-minted Convex tokens not configured" },
      { status: 503 },
    );
  }

  // Local development guard:
  // If you mint tokens with a localhost issuer, Convex (running in the cloud) cannot fetch
  // the JWKS from that issuer, and will reject the token. In that case we intentionally
  // return 503 so the client falls back to a Clerk-minted Convex token (stored in localStorage)
  // from the auth host redirect flow.
  if (env.NODE_ENV !== "production") {
    const issuer = env.LAUNCHTHAT_JWT_ISSUER_DOMAIN.toLowerCase();
    const isLocalIssuer =
      issuer.includes("localhost") || issuer.includes("127.0.0.1");
    const isCloudConvex = env.NEXT_PUBLIC_CONVEX_URL.includes(".convex.cloud");
    if (isLocalIssuer && isCloudConvex) {
      return NextResponse.json(
        {
          error:
            "Local issuer cannot be validated by Convex cloud. Use a public issuer (tunnel) or fall back to Clerk tokens.",
        },
        { status: 503 },
      );
    }
  }

  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenant context" },
      { status: 400 },
    );
  }

  const sessionId = (req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "").trim();
  if (!sessionId) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const sessionIdHash = sha256Base64Url(sessionId);

  const convexAny = convex as unknown as {
    query: (fn: any, args: any) => Promise<any>;
  };

  const session: unknown = await convexAny.query(
    (apiAny as any).auth.sessions.getTenantSessionByIdHash as any,
    { sessionIdHash },
  );
  const record =
    session && typeof session === "object"
      ? (session as { organizationId?: unknown; clerkUserId?: unknown })
      : null;

  const organizationId =
    typeof record?.organizationId === "string" ? record.organizationId : "";
  const clerkUserId =
    typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

  if (!organizationId || !clerkUserId) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  if (organizationId !== tenantId) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  const issuer = await getLaunchthatIssuer();
  const kid = getLaunchthatKid();
  const privateKey = await getLaunchthatPrivateKey();

  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + 10 * 60; // 10 minutes

  const token = await new SignJWT({
    // Helpful for debugging / future-proofing; Convex may ignore custom claims.
    organizationId,
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(env.LAUNCHTHAT_JWT_AUDIENCE)
    .setSubject(clerkUserId)
    .setIssuedAt(nowSec)
    .setExpirationTime(expSec)
    .sign(privateKey);

  return NextResponse.json(
    { token },
    {
      headers: {
        // Never cache tokens.
        "Cache-Control": "no-store",
      },
    },
  );
}
