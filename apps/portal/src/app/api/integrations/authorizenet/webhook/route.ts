import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

// Authorize.Net webhook/Silent Post handler.
//
// This endpoint delegates signature verification + processing to Convex so we can:
// - Load the per-organization signature key from options
// - Create renewal orders inside the commerce component
//
// NOTE: The request must include `?organizationId=<convexOrgId>` so we can look up
// the correct signature key for verification.
export async function POST(req: NextRequest) {
  const organizationId = (req.nextUrl.searchParams.get("organizationId") ?? "").trim();
  if (!organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 },
    );
  }

  const signature = (req.headers.get("x-anet-signature") ?? "").trim();
  const rawBody = await req.text();

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const convexAny = convex as unknown as {
    action: (fn: unknown, args: unknown) => Promise<unknown>;
  };

  const result = await convexAny.action(
    (apiAny as any).plugins.commerce.subscriptions.actions.processAuthnetWebhook,
    { organizationId, rawBody, signature },
  );

  return NextResponse.json(result);
}


