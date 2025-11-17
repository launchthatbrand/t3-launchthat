/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextRequest, NextResponse } from "next/server";

import { env } from "~/env";

export async function POST(req: NextRequest) {
  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const clientId: string = env.NEXT_PUBLIC_VIMEO_CLIENT_ID;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const clientSecret: string = env.VIMEO_CLIENT_SECRET;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const redirectUri: string = env.VIMEO_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Vimeo client credentials not configured" },
      { status: 500 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await res.json();
  if (!res.ok) {
    console.error("Vimeo token exchange failed", json);
    return NextResponse.json(
      { error: "Token exchange failed", details: json },
      { status: 500 },
    );
  }

  return NextResponse.json(json);
}
