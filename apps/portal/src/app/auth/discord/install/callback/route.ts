import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api as apiAny } from "@/convex/_generated/api.js";

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
  const guildId = (url.searchParams.get("guild_id") ?? "").trim();
  const error = (url.searchParams.get("error") ?? "").trim();

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const record = (await convex.query(
    (apiAny as any).plugins.discord.queries.peekOauthState,
    { state },
  )) as { returnTo?: unknown; kind?: unknown } | null;

  const returnTo =
    record && typeof record.returnTo === "string" ? record.returnTo : "";

  if (!returnTo || !isHttpUrl(returnTo)) {
    return NextResponse.json(
      { error: "Invalid or expired OAuth state" },
      { status: 400 },
    );
  }

  const redirectTo = new URL(returnTo);
  if (guildId) redirectTo.searchParams.set("guild_id", guildId);
  redirectTo.searchParams.set("state", state);
  if (error) redirectTo.searchParams.set("error", error);

  return NextResponse.redirect(redirectTo.toString());
}


