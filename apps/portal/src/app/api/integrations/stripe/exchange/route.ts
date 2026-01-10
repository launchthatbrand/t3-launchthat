import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const redirectUri = `${String(env.NEXT_PUBLIC_CONVEX_HTTP_URL).replace(/\/$/, "")}/api/integrations/stripe`;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe secret key not configured" },
      { status: 500 },
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
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
    console.error("Stripe token exchange failed", {
      status: res.status,
      redirectUri,
      body: json,
    });
    return NextResponse.json(
      { error: "Token exchange failed", details: json },
      { status: 500 },
    );
  }

  return NextResponse.json(json);
}















