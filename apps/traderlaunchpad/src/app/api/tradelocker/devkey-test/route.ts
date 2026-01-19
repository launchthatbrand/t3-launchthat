import { NextResponse } from "next/server";
import { env } from "~/env";

export const runtime = "nodejs";

const baseUrlForEnv = (environment: "demo" | "live") =>
  `https://${environment}.tradelocker.com/backend-api`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const environment =
    url.searchParams.get("env") === "live" ? ("live" as const) : ("demo" as const);

  const developerKey = String(env.TRADELOCKER_DEVELOPER_API_KEY ?? "");
  if (!developerKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing TRADELOCKER_DEVELOPER_API_KEY (server env var).",
      },
      { status: 400 },
    );
  }

  // Goal: attempt a market-data-ish endpoint with ONLY developer key (no user JWT).
  // NOTE: Most TradeLocker endpoints require Authorization and accNum; this route is intentionally
  // a “capability probe” to see what the developer key enables by itself.
  const baseUrl = baseUrlForEnv(environment);

  const candidates = [
    // Some installs expose /config; most docs mention /trade/config (often requires accNum).
    "/trade/config",
    "/config",
    // Quote/history endpoints (likely require auth, but we probe anyway)
    "/trade/quotes",
    "/trade/history",
  ];

  const results: {
    path: string;
    status: number;
    ok: boolean;
    textPreview: string;
  }[] = [];

  for (const path of candidates) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
          "tl-developer-api-key": developerKey,
        },
      });
      const text = await res.text().catch(() => "");
      results.push({
        path,
        status: res.status,
        ok: res.ok,
        textPreview: text.slice(0, 500),
      });
    } catch (e) {
      results.push({
        path,
        status: 0,
        ok: false,
        textPreview: `fetch_failed: ${String(e)}`.slice(0, 500),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    environment,
    baseUrl,
    // never return the key
    results,
  });
}

