import type { NextRequest } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { createAuthExchangeHandlers } from "launchthat-plugin-core-tenant/next/routes/auth-exchange";
import { env } from "~/env";

export const runtime = "nodejs";

const handlers = createAuthExchangeHandlers({
  convexUrl: String(env.NEXT_PUBLIC_CONVEX_URL),
  consumeExchangeCode: (apiAny as any).auth.exchange.consumeExchangeCode as any,
  createTenantSession: (apiAny as any).auth.sessions.createTenantSession as any,
  getUserByClerkId: (apiAny as any).core.users.queries.getUserByClerkId as any,
  secureCookie: env.NODE_ENV === "production",
  sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
});

export const GET = handlers.GET;
export const POST = handlers.POST;


