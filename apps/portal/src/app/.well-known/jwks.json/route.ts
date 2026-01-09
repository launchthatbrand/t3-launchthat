import { NextResponse } from "next/server";

import { getLaunchthatJwks } from "~/lib/oidcKeys";

export const runtime = "nodejs";

export async function GET() {
  const jwks = await getLaunchthatJwks();
  return NextResponse.json(jwks, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}


