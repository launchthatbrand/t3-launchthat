import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex-config/_generated/api";
import { env } from "~/env";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code?: string }> },
) {
  const params = await ctx.params;
  const code = String(params.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const convexUrl = String(env.NEXT_PUBLIC_CONVEX_URL ?? "").trim();
  if (!convexUrl) {
    return NextResponse.json({ error: "Misconfigured server" }, { status: 500 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  const resolved = await convex
    .query(api.shortlinks.queries.resolveShortlinkByCode, { code })
    .catch(() => null);
  const path = typeof (resolved as any)?.path === "string" ? String((resolved as any).path) : "";
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com").trim();
  const redirectTo = `https://${rootDomain}${path}`;
  return NextResponse.redirect(redirectTo, 302);
}

