import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "tenant_session";

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function GET(req: NextRequest) {
  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenant context" },
      { status: 400 },
    );
  }

  const sessionId = (req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "").trim();
  if (!sessionId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const sessionIdHash = sha256Base64Url(sessionId);

  const convexAny = convex as unknown as {
    query: (fn: any, args: any) => Promise<any>;
    mutation: (fn: any, args: any) => Promise<any>;
  };

  const session: unknown = await convexAny.query(
    (apiAny as any).auth.sessions.getTenantSessionByIdHash as any,
    { sessionIdHash },
  );
  const record =
    session && typeof session === "object"
      ? (session as { organizationId?: unknown; clerkUserId?: unknown })
      : null;

  const organizationId =
    typeof record?.organizationId === "string" ? record.organizationId : "";
  const clerkUserId =
    typeof record?.clerkUserId === "string" ? record.clerkUserId : "";

  if (!organizationId || !clerkUserId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (organizationId !== tenantId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user: unknown = await convexAny.query(
    (apiAny as any).core.users.queries.getUserByClerkId as any,
    {
      clerkId: clerkUserId,
    },
  );

  // Best-effort session activity update (non-blocking).
  void convexAny.mutation(
    (apiAny as any).auth.sessions.touchTenantSession as any,
    { sessionIdHash },
  );

  return NextResponse.json({ user });
}
