import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { sha256Base64Url, TENANT_SESSION_COOKIE_NAME } from "../tenant-session";

export const createMeGetHandler = (args: {
  convexUrl: string;
  getTenantSessionByIdHash: unknown;
  getUserByClerkId: unknown;
  touchTenantSession?: unknown;
}) => {
  return async function GET(req: NextRequest) {
    const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant context" }, { status: 400 });
    }

    const sessionId = (req.cookies.get(TENANT_SESSION_COOKIE_NAME)?.value ?? "").trim();
    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const convex = new ConvexHttpClient(args.convexUrl);
    const sessionIdHash = sha256Base64Url(sessionId);

    const convexAny = convex as unknown as {
      query: (fn: unknown, args: unknown) => Promise<unknown>;
      mutation: (fn: unknown, args: unknown) => Promise<unknown>;
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
    const clerkUserId = typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

    if (!organizationId || !clerkUserId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (organizationId !== tenantId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user: unknown = await convexAny.query(args.getUserByClerkId, {
      clerkId: clerkUserId,
    });

    if (args.touchTenantSession) {
      void convexAny.mutation(args.touchTenantSession, { sessionIdHash });
    }

    return NextResponse.json(
      { user },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  };
};

