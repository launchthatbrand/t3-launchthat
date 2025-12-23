import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const clientId: string = env.NEXT_PUBLIC_VIMEO_CLIENT_ID;
  const clientSecret: string = env.VIMEO_CLIENT_SECRET;
  const redirectUri = `${String(env.NEXT_PUBLIC_CONVEX_HTTP_URL).replace(/\/$/, "")}/api/integrations/vimeo`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Vimeo client credentials not configured" },
      { status: 500 },
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch("https://api.vimeo.com/oauth/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: body.toString(),
  });

  const raw = await res.text();
  let json: unknown = null;
  try {
    json = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    json = { raw };
  }
  if (!res.ok) {
    console.error("Vimeo token exchange failed", {
      status: res.status,
      redirectUri,
      configuredRedirectUri: env.VIMEO_REDIRECT_URI,
      body: json,
    });
    return NextResponse.json(
      { error: "Token exchange failed", details: json },
      { status: 500 },
    );
  }

  return NextResponse.json(json);
}
