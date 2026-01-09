import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

// This endpoint exists as a server entrypoint for subscription checkout flows.
// It delegates to Convex `placeOrder`, which now supports subscription carts by
// creating an ARB subscription (Authorize.Net) and linking the initial order.
export async function POST(req: NextRequest) {
  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant context" }, { status: 400 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const convexAny = convex as unknown as {
    action: (fn: unknown, args: unknown) => Promise<unknown>;
  };

  // If the caller didn't provide organizationId, default to the current tenant.
  const organizationIdRaw = body.organizationId;
  const organizationId =
    typeof organizationIdRaw === "string" && organizationIdRaw.trim()
      ? organizationIdRaw.trim()
      : tenantId;

  const result = await convexAny.action(
    (apiAny as any).plugins.commerce.checkout.actions.placeOrder,
    {
      ...body,
      organizationId,
    },
  );

  return NextResponse.json(result);
}


