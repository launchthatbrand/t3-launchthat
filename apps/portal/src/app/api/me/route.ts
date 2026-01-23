import type { NextRequest } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { createMeGetHandler } from "launchthat-plugin-core-tenant/next/routes/me";

import { env } from "~/env";

export const runtime = "nodejs";

export const GET = createMeGetHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  getTenantSessionByIdHash: (apiAny as any).auth.sessions.getTenantSessionByIdHash as any,
  getUserByClerkId: (apiAny as any).core.users.queries.getUserByClerkId as any,
  touchTenantSession: (apiAny as any).auth.sessions.touchTenantSession as any,
});
