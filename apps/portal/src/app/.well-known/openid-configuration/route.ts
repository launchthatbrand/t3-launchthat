import { NextResponse } from "next/server";

import { getLaunchthatIssuer } from "~/lib/oidcKeys";

export const runtime = "nodejs";

export async function GET() {
  const issuer = await getLaunchthatIssuer();
  return NextResponse.json(
    {
      issuer,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      id_token_signing_alg_values_supported: ["RS256"],
      subject_types_supported: ["public"],
      response_types_supported: ["id_token"],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
