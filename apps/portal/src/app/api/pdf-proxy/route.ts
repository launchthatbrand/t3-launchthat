import { NextResponse } from "next/server";

const isAllowedPdfUrl = (url: URL) => {
  if (url.protocol !== "https:") return false;
  if (!url.pathname.startsWith("/api/storage/")) return false;
  // Allow Convex storage hosts (e.g. determined-crocodile-286.convex.cloud)
  if (!/\.convex\.(cloud|site)$/i.test(url.hostname)) return false;
  return true;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url") ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedPdfUrl(target)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    // Disable caching so template updates reflect immediately in dev.
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream fetch failed (${upstream.status})` },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/pdf";
  const bytes = await upstream.arrayBuffer();

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}


