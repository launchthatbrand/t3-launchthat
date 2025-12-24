import type { Id } from "@/convex/_generated/dataModel";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return new Response("Missing media id", { status: 400 });
  }

  const media = await fetchQuery(api.core.media.queries.getMediaItem, {
    id: id as unknown as Id<"mediaItems">,
  });

  const url = media?.url;
  if (!url) {
    return new Response("Media not found", { status: 404 });
  }

  const response = NextResponse.redirect(url, { status: 302 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
