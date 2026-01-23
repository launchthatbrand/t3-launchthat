import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import {
  randomSessionId,
  safeReturnToPath,
  setTenantSessionCookie,
  sha256Base64Url,
} from "../tenant-session";

export const createAuthExchangeHandlers = (args: {
  convexUrl: string;
  consumeExchangeCode: unknown;
  createTenantSession: unknown;
  getUserByClerkId?: unknown;
  secureCookie: boolean;
  sessionTtlMs: number;
}) => {
  const consumeAndCreateSession = async (req: NextRequest, code: string) => {
    const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
    if (!tenantId) {
      return { error: NextResponse.json({ error: "Missing tenant context" }, { status: 400 }) };
    }

    const convex = new ConvexHttpClient(args.convexUrl);
    const codeHash = sha256Base64Url(code);

    const consumed: unknown = await convex.mutation(args.consumeExchangeCode as any, {
      codeHash,
    });
    const record =
      consumed && typeof consumed === "object"
        ? (consumed as { organizationId?: unknown; clerkUserId?: unknown })
        : null;

    const organizationId =
      typeof record?.organizationId === "string" ? record.organizationId : "";
    const clerkUserId = typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

    if (!organizationId || !clerkUserId) {
      return {
        error: NextResponse.json({ error: "Invalid or expired exchange code" }, { status: 401 }),
      };
    }
    if (organizationId !== tenantId) {
      return {
        error: NextResponse.json(
          { error: "Exchange code does not match tenant" },
          { status: 403 },
        ),
      };
    }

    const sessionId = randomSessionId();
    const sessionIdHash = sha256Base64Url(sessionId);
    const expiresAt = Date.now() + args.sessionTtlMs;

    await convex.mutation(args.createTenantSession as any, {
      sessionIdHash,
      organizationId,
      clerkUserId,
      expiresAt,
    });

    return { sessionId, sessionIdHash, organizationId, clerkUserId };
  };

  const GET = async (req: NextRequest) => {
    const code = (req.nextUrl.searchParams.get("code") ?? "").trim();
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const result = await consumeAndCreateSession(req, code);
    if ("error" in result) return result.error;

    const returnTo = req.nextUrl.searchParams.get("return_to");
    const redirectPath = safeReturnToPath(req, returnTo);
    const res = NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));
    setTenantSessionCookie(res, result.sessionId, { secure: args.secureCookie });
    return res;
  };

  const POST = async (req: NextRequest) => {
    const body: unknown = await req.json().catch(() => null);
    const code =
      body && typeof body === "object" && typeof (body as any).code === "string"
        ? ((body as any).code as string).trim()
        : "";

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const result = await consumeAndCreateSession(req, code);
    if ("error" in result) return result.error;

    let user: unknown = null;
    if (args.getUserByClerkId) {
      try {
        user = await new ConvexHttpClient(args.convexUrl).query(args.getUserByClerkId as any, {
          clerkId: result.clerkUserId,
        });
      } catch {
        user = null;
      }
    }

    const res = NextResponse.json({ user });
    setTenantSessionCookie(res, result.sessionId, { secure: args.secureCookie });
    return res;
  };

  return { GET, POST };
};

