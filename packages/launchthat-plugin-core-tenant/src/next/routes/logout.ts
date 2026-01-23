import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { clearTenantSessionCookie, sha256Base64Url, TENANT_SESSION_COOKIE_NAME } from "../tenant-session";

export const createLogoutPostHandler = (args: {
  convexUrl: string;
  revokeTenantSession: unknown;
  secureCookie: boolean;
}) => {
  return async function POST(req: NextRequest) {
    const sessionId = (req.cookies.get(TENANT_SESSION_COOKIE_NAME)?.value ?? "").trim();

    if (sessionId) {
      const convex = new ConvexHttpClient(args.convexUrl);
      const sessionIdHash = sha256Base64Url(sessionId);
      try {
        await convex.mutation(args.revokeTenantSession as any, { sessionIdHash });
      } catch {
        // ignore
      }
    }

    const res = NextResponse.json({ ok: true });
    clearTenantSessionCookie(res, { secure: args.secureCookie });
    return res;
  };
};

