import { NextResponse } from "next/server";

const pickFirstIp = (value: string) => value.split(",")[0]?.trim() ?? "";

const normalizeIp = (ip: string | null) => {
  if (!ip) return null;
  const v = ip.trim();
  if (!v) return null;
  // Common localhost values in dev
  if (v === "::1" || v === "127.0.0.1") return null;
  // Strip IPv6 mapped IPv4 prefix
  if (v.startsWith("::ffff:")) return v.slice("::ffff:".length);
  return v;
};

export async function GET(req: Request) {
  // Prefer common proxy headers, fallback to null if unavailable.
  // Note: In production you should ensure your reverse proxy / host sets these
  // headers correctly; otherwise you may get null (or a private address).
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  const ipRaw =
    (typeof forwardedFor === "string" && forwardedFor.trim().length > 0
      ? pickFirstIp(forwardedFor)
      : null) ??
    (typeof realIp === "string" && realIp.trim().length > 0 ? realIp.trim() : null);

  const ip = normalizeIp(ipRaw);

  return NextResponse.json({ ip });
}


