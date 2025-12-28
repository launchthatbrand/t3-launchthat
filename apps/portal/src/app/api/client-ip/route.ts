import { NextResponse } from "next/server";

const pickFirstIp = (value: string) => value.split(",")[0]?.trim() ?? "";

export async function GET(req: Request) {
  // Prefer common proxy headers, fallback to null if unavailable.
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  const ip =
    (typeof forwardedFor === "string" && forwardedFor.trim().length > 0
      ? pickFirstIp(forwardedFor)
      : null) ??
    (typeof realIp === "string" && realIp.trim().length > 0 ? realIp.trim() : null);

  return NextResponse.json({ ip });
}


