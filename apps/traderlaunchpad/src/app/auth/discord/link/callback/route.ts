import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api as apiAny } from "@convex-config/_generated/api.js";

import { env } from "~/env";

export const runtime = "nodejs";

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = (url.searchParams.get("state") ?? "").trim();
  const code = (url.searchParams.get("code") ?? "").trim();
  const error = (url.searchParams.get("error") ?? "").trim();
  const errorDescription = (url.searchParams.get("error_description") ?? "").trim();

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(String(env.NEXT_PUBLIC_CONVEX_URL));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const record = (await convex.query((apiAny as unknown as any).discord.queries.peekOauthState, {
    state,
  })) as { returnTo?: unknown } | null;

  const returnTo = record && typeof record.returnTo === "string" ? record.returnTo : "";
  if (!returnTo || !isHttpUrl(returnTo)) {
    return NextResponse.json(
      { error: "Invalid or expired OAuth state" },
      { status: 400 },
    );
  }

  const redirectTo = new URL(returnTo);
  redirectTo.searchParams.set("state", state);
  if (code) redirectTo.searchParams.set("code", code);
  if (error) redirectTo.searchParams.set("error", error);
  if (errorDescription)
    redirectTo.searchParams.set("error_description", errorDescription);

  return NextResponse.redirect(redirectTo.toString());
}

