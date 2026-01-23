import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { SignJWT } from "jose";

import { sha256Base64Url, TENANT_SESSION_COOKIE_NAME } from "../tenant-session";

export const createConvexTokenGetHandler = (args: {
  convexUrl: string;
  // Convex query that maps cookie hash -> { organizationId, clerkUserId }
  getTenantSessionByIdHash: unknown;
  // JWT signing inputs
  isConfigured: boolean;
  getIssuer: () => Promise<string>;
  getKid: () => string;
  getPrivateKey: () => Promise<unknown>;
  audience: string;
  // env toggles
  nodeEnv: string;
}) => {
  return async function GET(req: NextRequest) {
    if (!args.isConfigured) {
      return NextResponse.json(
        { error: "Server-minted Convex tokens not configured" },
        { status: 503 },
      );
    }

    const issuer = await args.getIssuer();
    const kid = args.getKid();
    const privateKey = await args.getPrivateKey();

    // Local development guard:
    // If you mint tokens with a localhost issuer, Convex (running in the cloud) cannot fetch
    // the JWKS from that issuer, and will reject the token. In that case we intentionally
    // return 503 so the client can fall back to an auth-host refresh flow.
    if (args.nodeEnv !== "production") {
      const issuerLower = issuer.toLowerCase();
      const isLocalIssuer =
        issuerLower.includes("localhost") || issuerLower.includes("127.0.0.1");
      const isCloudConvex = args.convexUrl.includes(".convex.cloud");
      if (isLocalIssuer && isCloudConvex) {
        return NextResponse.json(
          {
            error:
              "Local issuer cannot be validated by Convex cloud. Use a public issuer (tunnel) or fall back to auth-host refresh.",
          },
          { status: 503 },
        );
      }
    }

    const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant context" }, { status: 400 });
    }

    const sessionId = (req.cookies.get(TENANT_SESSION_COOKIE_NAME)?.value ?? "").trim();
    if (!sessionId) {
      return NextResponse.json({ token: null }, { status: 401 });
    }

    const convex = new ConvexHttpClient(args.convexUrl);
    const sessionIdHash = sha256Base64Url(sessionId);

    const convexAny = convex as unknown as {
      query: (fn: unknown, args: unknown) => Promise<unknown>;
    };

    const session: unknown = await convexAny.query(args.getTenantSessionByIdHash, {
      sessionIdHash,
    });

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

    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + 10 * 60; // 10 minutes

    const token = await new SignJWT({ organizationId })
      .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
      .setIssuer(issuer)
      .setAudience(args.audience)
      .setSubject(clerkUserId)
      .setIssuedAt(nowSec)
      .setExpirationTime(expSec)
      .sign(privateKey as any);

    return NextResponse.json(
      { token },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  };
};

