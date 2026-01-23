import type { NextRequest } from "next/server";
import { api as apiAny } from "@convex-config/_generated/api.js";
import { createMeGetHandler } from "launchthat-plugin-core-tenant/next/routes/me";

import { env } from "~/env";

export const runtime = "nodejs";

export const GET = createMeGetHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  getTenantSessionByIdHash: apiAny.auth.sessions.getTenantSessionByIdHash,
  getUserByClerkId: apiAny.coreTenant.queries.getUserByClerkId,
  touchTenantSession: apiAny.auth.sessions.touchTenantSession,
});

