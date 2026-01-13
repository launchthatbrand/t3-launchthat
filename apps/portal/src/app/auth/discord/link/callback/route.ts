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
  const code = (url.searchParams.get("code") ?? "").trim();
  const error = (url.searchParams.get("error") ?? "").trim();

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

  // Peek first so we know where to redirect even if the callback is malformed.
  const record = (await convex.query((apiAny as any).plugins.discord.queries.peekOauthState, {
    state,
  })) as { returnTo?: unknown } | null;

  const returnTo =
    record && typeof record.returnTo === "string" ? record.returnTo : "";

  const redirectTo = returnTo && isHttpUrl(returnTo) ? new URL(returnTo) : null;
  if (redirectTo) {
    redirectTo.searchParams.delete("state");
    redirectTo.searchParams.delete("code");
    redirectTo.searchParams.delete("error");
  }

  if (error) {
    if (redirectTo) {
      redirectTo.searchParams.set("discord_link_error", error);
      return NextResponse.redirect(redirectTo.toString());
    }
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    if (redirectTo) {
      redirectTo.searchParams.set("discord_link_error", "missing_code");
      return NextResponse.redirect(redirectTo.toString());
    }
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    await convex.action((apiAny as any).plugins.discord.actions.completeUserLink, {
      state,
      code,
    });

    if (redirectTo) {
      redirectTo.searchParams.set("discord_linked", "1");
      return NextResponse.redirect(redirectTo.toString());
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "link_failed";
    if (redirectTo) {
      redirectTo.searchParams.set("discord_link_error", message);
      return NextResponse.redirect(redirectTo.toString());
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


