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

  // Best-effort: track click count for analytics. Do not block redirect.
  void convex
    .mutation(api.shortlinks.mutations.trackShortlinkClick, { code })
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
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto = (forwardedProto ?? reqUrl.protocol.replace(":", "")).trim().toLowerCase();
  const host = (forwardedHost ?? req.headers.get("host") ?? reqUrl.host).trim().toLowerCase();

  const maxAgeDays = 30;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;

  // Local dev: preserve scheme/host exactly (avoid redirecting http -> https).
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    const res = NextResponse.redirect(`${proto}://${host}${pathStr}`, 302);
    // Persist shortlink code so we can attribute downstream events to a specific share link.
    res.cookies.set("lt_aff_sl", code, { path: "/", maxAge: maxAgeSeconds, sameSite: "lax" });
    return res;
  }

  // Deployed: always redirect to primary domain over https.
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN || "traderlaunchpad.com").trim();
  const redirectTo = `https://${rootDomain}${pathStr}`;
  const res = NextResponse.redirect(redirectTo, 302);
  res.cookies.set("lt_aff_sl", code, { path: "/", maxAge: maxAgeSeconds, sameSite: "lax" });
  return res;
}

