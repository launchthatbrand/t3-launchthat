import { NextResponse } from "next/server";

import { env } from "~/env";

interface GeoapifyFeature {
  properties?: {
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
    country_code?: string;
  };
}

export async function GET(req: Request) {
  const apiKey = env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEOAPIFY_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const text = (url.searchParams.get("text") ?? "").trim();
  const countryCode = (url.searchParams.get("countryCode") ?? "").trim();
  const limitRaw = (url.searchParams.get("limit") ?? "").trim();
  const limit = Math.min(10, Math.max(1, Number.parseInt(limitRaw || "8", 10)));

  if (text.length < 3) {
    return NextResponse.json({ features: [] satisfies GeoapifyFeature[] });
  }

  const geoUrl = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  geoUrl.searchParams.set("text", text);
  geoUrl.searchParams.set("format", "geojson");
  geoUrl.searchParams.set("limit", String(limit));
  geoUrl.searchParams.set("apiKey", apiKey);
  if (/^[A-Za-z]{2}$/.test(countryCode)) {
    geoUrl.searchParams.set(
      "filter",
      `countrycode:${countryCode.toLowerCase()}`,
    );
  }

  const res = await fetch(geoUrl.toString(), {
    // avoid caching PII-ish address queries
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Geoapify request failed." },
      { status: 502 },
    );
  }

  const json = (await res.json().catch(() => null)) as {
    features?: GeoapifyFeature[];
  } | null;

  return NextResponse.json({
    features: Array.isArray(json?.features) ? json.features : [],
  });
}
