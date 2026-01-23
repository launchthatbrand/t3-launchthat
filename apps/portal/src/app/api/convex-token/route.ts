import type { NextRequest } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { createConvexTokenGetHandler } from "launchthat-plugin-core-tenant/next/routes/convex-token";

import { env } from "~/env";
import {
  getLaunchthatIssuer,
  getLaunchthatKid,
  getLaunchthatPrivateKey,
} from "~/lib/oidcKeys";

export const runtime = "nodejs";

export const GET = createConvexTokenGetHandler({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  getTenantSessionByIdHash: (apiAny as any).auth.sessions.getTenantSessionByIdHash as any,
  isConfigured: Boolean(
    env.LAUNCHTHAT_JWT_ISSUER_DOMAIN &&
      env.LAUNCHTHAT_JWT_AUDIENCE &&
      env.LAUNCHTHAT_JWT_KID &&
      env.LAUNCHTHAT_JWT_PRIVATE_KEY,
  ),
  getIssuer: getLaunchthatIssuer,
  getKid: getLaunchthatKid,
  getPrivateKey: getLaunchthatPrivateKey,
  audience: String(env.LAUNCHTHAT_JWT_AUDIENCE),
  nodeEnv: env.NODE_ENV,
});
