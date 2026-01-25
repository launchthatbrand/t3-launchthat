import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@convex-config/_generated/api.js";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { createMeGetHandler } from "launchthat-plugin-core-tenant/next/routes/me";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";

import { env } from "~/env";

export const runtime = "nodejs";

const tenantSessionMeHandler = createMeGetHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  getTenantSessionByIdHash: apiAny.auth.sessions.getTenantSessionByIdHash,
  getUserByClerkId: apiAny.coreTenant.queries.getUserByClerkId,
  touchTenantSession: apiAny.auth.sessions.touchTenantSession,
});

export const GET = async (req: NextRequest) => {
  // If we have a tenant session cookie (local/tenant-session auth flow), preserve the existing behavior.
  const hasTenantSession = Boolean(req.cookies.get(TENANT_SESSION_COOKIE_NAME)?.value);
  if (hasTenantSession) {
    return await tenantSessionMeHandler(req);
  }

  // Otherwise, fall back to Clerk session (production www domain).
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const convex = new ConvexHttpClient(String(env.NEXT_PUBLIC_CONVEX_URL));
  const convexAny = convex as unknown as {
    query: (fn: unknown, args: unknown) => Promise<unknown>;
  };

  const user: unknown = await convexAny.query(apiAny.coreTenant.queries.getUserByClerkId, {
    clerkId: userId,
  });

  return NextResponse.json(
    { user },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};

