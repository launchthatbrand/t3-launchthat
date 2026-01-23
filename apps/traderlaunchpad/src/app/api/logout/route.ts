import { api as apiAny } from "@convex-config/_generated/api.js";
import { createLogoutPostHandler } from "launchthat-plugin-core-tenant/next/routes/logout";

import { env } from "~/env";

export const runtime = "nodejs";

export const POST = createLogoutPostHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  revokeTenantSession: apiAny.auth.sessions.revokeTenantSession,
  secureCookie: env.NODE_ENV === "production",
});

