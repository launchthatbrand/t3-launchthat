import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex-config/_generated/api";
import { env } from "~/env";

export const runtime = "nodejs";

export async function GET(
  req: Request,
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

  const resolvedObj: unknown = resolved;
  const path =
    resolvedObj && typeof resolvedObj === "object" && "path" in resolvedObj
      ? (resolvedObj as { path?: unknown }).path
      : undefined;
  const pathStr = typeof path === "string" ? path : "";

  if (!pathStr.startsWith("/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reqUrl = new URL(req.url);
  const forwardedProto = (req.headers.get("x-forwarded-proto") ?? "").trim();
  const forwardedHost = (req.headers.get("x-forwarded-host") ?? "").trim();
  const proto = (forwardedProto || reqUrl.protocol.replace(":", "") || "https").toLowerCase();
  const host = (forwardedHost || req.headers.get("host") || reqUrl.host).trim().toLowerCase();

  // Local dev: preserve scheme/host exactly (avoid redirecting http -> https).
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return NextResponse.redirect(`${proto}://${host}${pathStr}`, 302);
  }

  // Deployed: always redirect to primary domain over https.
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN || "traderlaunchpad.com").trim();
  const redirectTo = `https://${rootDomain}${pathStr}`;
  return NextResponse.redirect(redirectTo, 302);
}

