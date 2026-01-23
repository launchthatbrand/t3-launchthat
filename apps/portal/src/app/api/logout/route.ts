import type { NextRequest } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { createLogoutPostHandler } from "launchthat-plugin-core-tenant/next/routes/logout";
import { env } from "~/env";

export const runtime = "nodejs";

export const POST = createLogoutPostHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  revokeTenantSession: (apiAny as any).auth.sessions.revokeTenantSession as any,
  secureCookie: env.NODE_ENV === "production",
});


